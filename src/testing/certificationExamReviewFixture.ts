import { createContentSessionPlanFingerprint } from "../content/application/contentSessionIdentity";
import { loadCanonicalRuntimeCatalog, scoreCanonicalQuestion, type CanonicalQuestionResponse, type CanonicalSimulationProfile, type Question } from "../content/canonical";
import { createFamilyEnvelope, createTrainingAttempt, createTrainingSession, createTrainingSessionResult, type CompletedTrainingSession, type TrainingAttempt, type TrainingSessionResult } from "../domain";
import { projectCertificationExamReview, type CertificationExamReviewProjection } from "../application/certification/certificationExamReviewProjection";
import { CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID } from "../features/exam/certificationExamReviewFixtureCommand";

export const CERTIFICATION_EXAM_REVIEW_FIXTURE_PROFILE_ID = "google-cloud-associate-cloud-engineer-certification-exam-v1";
export const CERTIFICATION_EXAM_REVIEW_FIXTURE_TRACK_ID = "google-cloud-associate-cloud-engineer";
export const CERTIFICATION_EXAM_REVIEW_FIXTURE_NOW = "2026-09-30T12:00:00.000Z";
const TAXONOMY_VERSION = "canonical-content-v1";

export type CertificationExamReviewFixture = Readonly<{
  attempts: readonly TrainingAttempt<unknown>[];
  itemOrder: CompletedTrainingSession["itemOrder"];
  profile: CanonicalSimulationProfile;
  questionsById: ReadonlyMap<string, Question>;
  result: TrainingSessionResult;
  session: CompletedTrainingSession;
  projection: CertificationExamReviewProjection;
  project: (result?: TrainingSessionResult, attempts?: readonly TrainingAttempt<unknown>[], session?: CompletedTrainingSession) => Promise<CertificationExamReviewProjection>;
  sourceQuestionId: string;
  sourceUrl: string;
}>;

/** Creates valid completed-exam evidence in memory and projects it through the production validator. */
export async function createCertificationExamReviewFixture(input: Readonly<{
  correctIndices?: readonly number[];
  incorrectIndices?: readonly number[];
}> = {}): Promise<CertificationExamReviewFixture> {
  const correctIndices = input.correctIndices ?? [0];
  const incorrectIndices = input.incorrectIndices ?? [1];
  const answeredIndices = [...correctIndices, ...incorrectIndices];
  if (new Set(answeredIndices).size !== answeredIndices.length || answeredIndices.some((index) => !Number.isInteger(index) || index < 0 || index >= 50)) {
    throw new Error("Certification Exam fixture answer indices must be unique positions within the fixed 50-question plan.");
  }

  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(CERTIFICATION_EXAM_REVIEW_FIXTURE_TRACK_ID);
  const profile = track.simulationProfiles?.find((entry): entry is CanonicalSimulationProfile => entry.profileId === CERTIFICATION_EXAM_REVIEW_FIXTURE_PROFILE_ID && entry.familyId === "certification" && entry.modeId === "certification-exam-simulation");
  if (!profile) throw new Error("The canonical Certification Exam profile is unavailable.");
  const selected = profile.familyConfig.blueprint.sections.flatMap((section) => {
    const count = 50 * section.weightPercent / 100;
    return track.questions
      .filter((question) => question.contentDomainId === section.contentDomainId && profile.familyConfig.nodeDomainMap[question.nodeId] === section.contentDomainId && (question.sourceRefs?.length ?? 0) > 0)
      .slice().sort((left, right) => left.questionId.localeCompare(right.questionId)).slice(0, count);
  });
  if (selected.length !== 50) throw new Error("Canonical source-bearing Certification Exam content cannot satisfy the fixed blueprint.");

  const sessionId = CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID;
  const itemOrder = selected.map((question, index) => ({
    occurrenceId: `${sessionId}:occurrence:${index}`,
    item: { trackId: CERTIFICATION_EXAM_REVIEW_FIXTURE_TRACK_ID, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
  }));
  const config = profile.familyConfig;
  const startedAt = "2026-09-30T10:00:00.000Z";
  const base = {
    id: sessionId,
    trackId: CERTIFICATION_EXAM_REVIEW_FIXTURE_TRACK_ID,
    modeId: profile.modeId,
    configurationSnapshot: {
      kind: "certificationSimulation" as const,
      feedbackMode: "atSessionEnd" as const,
      answerChanges: "untilFinalSubmission" as const,
      navigation: "free" as const,
      submission: "manualOrForegroundTimeout" as const,
      timer: "absoluteDeadline" as const,
      timerDurationMs: config.durationMinutes * 60_000,
      timerDeadlineAt: new Date(Date.parse(startedAt) + config.durationMinutes * 60_000).toISOString(),
      simulationProfileId: profile.profileId,
      simulationProfileVersion: profile.profileVersion,
      simulationPolicyId: config.interactionPolicy.policyId,
      simulationPolicyVersion: config.interactionPolicy.policyVersion,
      flagging: "available" as const,
      navigator: "available" as const,
      sectionIds: config.blueprint.sections.map((section) => section.id),
    },
    requestedLength: 50,
    actualLength: 50,
    currentItemIndex: 49,
    itemOrder,
    optionOrderByOccurrence: Object.fromEntries(selected.map((question, index) => {
      if (question.interaction.type !== "choice_single") throw new Error("The fixed Certification Exam fixture expects the current all-single-choice canonical profile.");
      return [itemOrder[index]!.occurrenceId, question.interaction.options.map((option) => option.optionId)];
    })),
    conditionalReinsertSlots: [],
    activeForegroundMs: 123_000,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
    status: "completed" as const,
    startedAt,
    completedAt: CERTIFICATION_EXAM_REVIEW_FIXTURE_NOW,
  };
  const fingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: TAXONOMY_VERSION });
  const session = createTrainingSession({ ...base, taxonomyVersion: TAXONOMY_VERSION, planFingerprint: fingerprint }) as CompletedTrainingSession;
  const attempts: TrainingAttempt<unknown>[] = answeredIndices.map((index) => {
    const question = selected[index]!;
    const occurrence = itemOrder[index]!;
    const response = correctIndices.includes(index)
      ? question.answer
      : wrongSingleChoiceResponse(question);
    return createTrainingAttempt({
      id: `${sessionId}:attempt:${index}`,
      sessionId,
      trackId: CERTIFICATION_EXAM_REVIEW_FIXTURE_TRACK_ID,
      modeId: profile.modeId,
      occurrenceId: occurrence.occurrenceId,
      item: occurrence.item,
      response,
      result: scoreCanonicalQuestion(question, response),
      reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" }] },
      answeredAt: CERTIFICATION_EXAM_REVIEW_FIXTURE_NOW,
      committedAt: CERTIFICATION_EXAM_REVIEW_FIXTURE_NOW,
    });
  });
  const correctAttempts = attempts.filter((attempt) => attempt.result.kind === "correct");
  const incorrectAttempts = attempts.filter((attempt) => attempt.result.kind === "incorrect");
  const partialAttempts = attempts.filter((attempt) => attempt.result.kind === "partial");
  const answeredOccurrenceIds = itemOrder.filter((_, index) => answeredIndices.includes(index)).map((occurrence) => occurrence.occurrenceId);
  const unansweredOccurrenceIds = itemOrder.filter((_, index) => !answeredIndices.includes(index)).map((occurrence) => occurrence.occurrenceId);
  const result = createTrainingSessionResult({
    id: `${sessionId}:result`,
    sessionId,
    trackId: CERTIFICATION_EXAM_REVIEW_FIXTURE_TRACK_ID,
    totalOccurrences: 50,
    answeredOccurrenceIds,
    unansweredOccurrenceIds,
    completedAt: CERTIFICATION_EXAM_REVIEW_FIXTURE_NOW,
    evidence: createFamilyEnvelope({ familyId: "certification", details: {
      activeForegroundMs: session.activeForegroundMs,
      correctCount: correctAttempts.length,
      incorrectCount: incorrectAttempts.length,
      partialCount: partialAttempts.length,
      maxPoints: attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0),
      pointsEarned: attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0),
      profileId: profile.profileId,
      profileVersion: profile.profileVersion,
    } }),
  });
  const questionsById = new Map(track.questions.map((question) => [question.questionId, question]));
  const project = (nextResult: TrainingSessionResult = result, nextAttempts: readonly TrainingAttempt<unknown>[] = attempts, nextSession: CompletedTrainingSession = session) => projectCertificationExamReview({ attempts: nextAttempts, profile, questionsById, result: nextResult, session: nextSession });
  const projection = await project();
  const sourceItem = projection.items.find((item) => item.answerState === "unanswered" && item.sources.length > 0);
  if (!sourceItem?.sources[0]) throw new Error("The canonical Certification Exam fixture has no unanswered source link.");

  return Object.freeze({ attempts, itemOrder: session.itemOrder, profile, questionsById, result, session, projection, project, sourceQuestionId: sourceItem.questionId, sourceUrl: sourceItem.sources[0].url });
}

function wrongSingleChoiceResponse(question: Question): CanonicalQuestionResponse {
  if (question.interaction.type !== "choice_single") throw new Error("The fixed Certification Exam fixture expects single-choice canonical content.");
  const correctId = question.answer.type === "choice_single" ? question.answer.optionId : null;
  const alternative = question.interaction.options.find((option) => option.optionId !== correctId);
  if (!alternative) throw new Error("A wrong single-choice response could not be constructed for canonical content.");
  return { type: "choice_single", optionId: alternative.optionId };
}
