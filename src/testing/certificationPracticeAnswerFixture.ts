import { CanonicalTrainingRuntime } from "../application/canonical/CanonicalTrainingRuntime";
import { projectCertificationPracticeFeedback, projectCertificationPracticeQuestion } from "../application/certification/certificationSessionFacade";
import { projectCertificationPracticeReview, type CertificationPracticeReviewProjection } from "../application/certification/certificationPracticeReviewProjection";
import { createContentSessionPlanFingerprint } from "../content/application/contentSessionIdentity";
import { loadCanonicalRuntimeCatalog, type CanonicalQuestionResponse, type Question } from "../content/canonical";
import { createTrainingSession, type CompletedTrainingSession, type TrainingAttempt, type TrainingSessionResult } from "../domain";
import type { CertificationPracticeQuestion } from "../application/certification/certificationSessionFacade";
import type { PracticeFeedback } from "../features/practice/practiceSessionPresentation";
import { CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID } from "../features/exam/certificationExamReviewFixtureCommand";

const TRACK_ID = "claude-certified-architect-professional-certification";
const MODE_ID = "certification-focus-practice";
const NOW = "2026-09-30T12:00:00.000Z";
const TAXONOMY_VERSION = "canonical-content-v1";

export type CertificationPracticeAnswerPreview = Readonly<{
  feedback: PracticeFeedback;
  feedbackControls: NonNullable<ReturnType<typeof projectCertificationPracticeFeedback>>["controls"];
  feedbackItem: CompletedTrainingSession["itemOrder"][number]["item"];
  ordinal: number;
  question: CertificationPracticeQuestion;
  result: TrainingAttempt<unknown>["result"];
  runtimeIdentity: Readonly<{ actualLength: number; feedbackTiming: "afterEachAnswer"; itemId: string; modeId: string; ordinal: number; roadmapNodeId: string; sessionId: string; trackId: string }>;
}>;
export type CertificationPracticeAnswerFixture = Readonly<{
  attempts: readonly TrainingAttempt<unknown>[];
  previews: readonly CertificationPracticeAnswerPreview[];
  projection: CertificationPracticeReviewProjection;
  result: TrainingSessionResult;
  session: CompletedTrainingSession;
}>;

/** Runs real canonical practice submissions and completion entirely in memory. */
export async function createCertificationPracticeAnswerFixture(): Promise<CertificationPracticeAnswerFixture> {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(TRACK_ID);
  const runtime = new CanonicalTrainingRuntime(track);
  const prepared = await runtime.prepare({ trackId: TRACK_ID, modeId: MODE_ID, request: { sessionId: CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID, requestedLength: 10, feedbackTiming: "after_each_durable_submit" }, attempts: [], reviews: [], now: NOW });
  const replacements = ["CCARP-D01-O01-boundary", "CCARP-D01-O01-diagnosis", "CCARP-D01-O01-transfer", "CCARP-D01-O02-transfer", "CCARP-D01-O03-transfer"];
  const replacementSet = new Set(replacements);
  const remainingQuestions = [...new Set(prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId).filter((questionId) => !replacementSet.has(questionId)))].slice(0, prepared.session.actualLength - replacements.length);
  if (remainingQuestions.length !== prepared.session.actualLength - replacements.length) throw new Error("Canonical practice fixture pool cannot provide five distinct remaining questions.");
  const fixtureQuestionIds = [...replacements, ...remainingQuestions];
  const itemOrder = fixtureQuestionIds.map((questionId, index) => {
    const question = track.getQuestion(questionId);
    if (!question) throw new Error(`Canonical practice fixture question ${questionId} is unavailable.`);
    const occurrence = prepared.session.itemOrder[index]!;
    return Object.freeze({ ...occurrence, item: Object.freeze({ trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 }) });
  });
  if (new Set(itemOrder.map((occurrence) => occurrence.item.questionId)).size !== itemOrder.length) throw new Error("Canonical practice fixture must keep ten distinct prepared content questions.");
  const optionOrderByOccurrence = Object.fromEntries(itemOrder.map((occurrence) => {
    const interaction = track.getQuestion(occurrence.item.questionId)!.interaction;
    if (interaction.type !== "choice_single" && interaction.type !== "choice_multiple") throw new Error("Canonical practice fixture contains a non-choice occurrence.");
    return [occurrence.occurrenceId, interaction.options.map((option) => option.optionId)];
  }));
  let planned = await fingerprintSession(createTrainingSession({ ...prepared.session, itemOrder, optionOrderByOccurrence, planFingerprint: undefined, taxonomyVersion: undefined }));
  await runtime.validateResume({ session: planned, draft: null });
  const attempts: TrainingAttempt<unknown>[] = [];
  const previews: CertificationPracticeAnswerPreview[] = [];
  for (let index = 0; index < planned.actualLength; index += 1) {
    const positioned = await fingerprintSession(createTrainingSession({ ...planned, currentItemIndex: index, planFingerprint: undefined, taxonomyVersion: undefined }));
    await runtime.validateResume({ session: positioned, draft: null });
    const occurrence = positioned.itemOrder[index]!;
    const question = track.getQuestion(occurrence.item.questionId)!;
    const response = responseForIndex(question, index);
    const submission = await runtime.submitPractice({ session: positioned, response, attempts, reviews: [], now: NOW });
    attempts.push(submission.attempt);
    if (index < replacements.length) {
      const projected = projectCertificationPracticeQuestion(question);
      const feedback = projectCertificationPracticeFeedback("afterEachAnswer", submission.attempt, question);
      if (!feedback) throw new Error("Canonical practice fixture did not produce immediate answer feedback.");
      previews.push(Object.freeze({
        feedback: Object.freeze({ details: feedback.details, reason: feedback.reason, result: feedback.result, sources: feedback.sources }),
        feedbackControls: feedback.controls,
        feedbackItem: occurrence.item,
        ordinal: index + 1,
        question: projected,
        result: submission.attempt.result,
        runtimeIdentity: Object.freeze({ actualLength: positioned.actualLength, feedbackTiming: "afterEachAnswer", itemId: projected.questionId, modeId: MODE_ID, ordinal: index + 1, roadmapNodeId: projected.nodeId, sessionId: positioned.id, trackId: TRACK_ID }),
      }));
    }
    planned = submission.session;
  }
  const finalPosition = await fingerprintSession(createTrainingSession({ ...planned, currentItemIndex: planned.actualLength - 1, planFingerprint: undefined, taxonomyVersion: undefined }));
  await runtime.validateResume({ session: finalPosition, draft: null });
  const finalized = await runtime.finalizePractice({ session: finalPosition, attempts, now: NOW });
  if (finalized.session.status !== "completed") throw new Error("Canonical practice fixture did not complete.");
  const projection = await projectCertificationPracticeReview({
    attempts,
    resolveQuestion: async (item) => {
      if (item.trackId !== TRACK_ID || item.contentVersion !== track.contentVersion || item.artifactSha256 !== track.artifactSha256) throw new Error("Canonical practice fixture received a foreign immutable content reference.");
      const question = track.getQuestion(item.questionId);
      if (!question || question.questionId !== item.questionId) throw new Error("Canonical practice fixture could not resolve the exact question reference.");
      return question;
    },
    result: finalized.result,
    session: finalized.session as CompletedTrainingSession,
  });
  return Object.freeze({ attempts: Object.freeze(attempts), previews: Object.freeze(previews), projection, result: finalized.result, session: finalized.session as CompletedTrainingSession });
}

async function fingerprintSession(session: ReturnType<typeof createTrainingSession>) {
  const base = { ...session, taxonomyVersion: TAXONOMY_VERSION, planFingerprint: undefined };
  const planFingerprint = await createContentSessionPlanFingerprint(base as typeof session & { taxonomyVersion: string });
  return createTrainingSession({ ...base, planFingerprint });
}

function responseForIndex(question: Question, index: number): CanonicalQuestionResponse {
  if (index === 0) return question.answer as CanonicalQuestionResponse;
  if (index === 1) {
    if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Canonical fixture diagnosis item is not single choice.");
    const answer = question.answer as Extract<CanonicalQuestionResponse, { type: "choice_single" }>;
    const wrong = question.interaction.options.find((option) => option.optionId !== answer.optionId);
    if (!wrong) throw new Error("Canonical fixture diagnosis has no incorrect option.");
    return { type: "choice_single", optionId: wrong.optionId };
  }
  if (question.interaction.type !== "choice_multiple" || question.answer.type !== "choice_multiple") {
    if (index < 5) throw new Error("Canonical fixture transfer item is not multiple choice.");
    return question.answer as CanonicalQuestionResponse;
  }
  if (index === 2) return { type: "choice_multiple", optionIds: ["b", "d"] };
  if (index === 3) return { type: "choice_multiple", optionIds: [question.answer.optionIds[0]!] };
  if (index === 4) return { type: "choice_multiple", optionIds: ["a", "c", "d"] };
  return question.answer as CanonicalQuestionResponse;
}
