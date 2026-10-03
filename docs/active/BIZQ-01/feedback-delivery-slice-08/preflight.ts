import assert from "node:assert/strict";

import { CanonicalTrainingRuntime } from "../../../../src/application/canonical/CanonicalTrainingRuntime";
import { composeCanonicalFeedback } from "../../../../src/application/canonical/canonicalInteractionPresentation";
import { projectCertificationPracticeFeedback } from "../../../../src/application/certification/certificationSessionFacade";
import { commitTrainingOutcome, commitTrainingSessionStart } from "../../../../src/application/learningMutations";
import { createContentSessionPlanFingerprint } from "../../../../src/content/application/contentSessionIdentity";
import { loadCanonicalRuntimeCatalog, type CanonicalTrackRuntime } from "../../../../src/content/canonical/runtimeCatalog";
import type { Question } from "../../../../src/content/canonical/questionTypes";
import { createTrainingSession } from "../../../../src/domain";
import { getTrainingAttempts } from "../../../../src/storage";
import { installKeyValueStorageForTests } from "../../../../src/infrastructure/storage/mmkvClient";
import { installMemoryStorage } from "../../../../src/testing/journalTestSupport";

const NOW = "2026-10-03T12:00:00.000Z";
const GCP_TRACK_ID = "google-cloud-associate-cloud-engineer";
const GCP_QUESTION_ID = "gcp-ace-gcpace-n01-b02-001";
const CODING_TRACK_ID = "coding-interview-dsa-problem-solving";
const CODING_QUESTION_ID = "alg-contrast-binary-scan-correctness-006";

function selectedMessage(question: Question, optionId: string) {
  return question.feedback.messages?.find((message) => message.kind === "wrong_option" && message.targetId === optionId);
}

async function persistGcpWrongAnswer(track: CanonicalTrackRuntime, question: Question, storage: ReturnType<typeof installMemoryStorage>) {
  if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("The current GCP probe question must be choice_single.");
  const mode = track.getMode("certification-focus-practice");
  const prepared = await new CanonicalTrainingRuntime(track).prepare({
    trackId: track.trackId,
    modeId: mode.modeId,
    request: { sessionId: "bizq01-feedback-delivery-08", requestedLength: Math.max(...mode.requestedLengths) },
    attempts: [],
    reviews: [],
    now: NOW,
  });
  const occurrence = prepared.session.itemOrder[0];
  assert.ok(occurrence, "the actual GCP practice plan should contain an occurrence");
  const itemOrder = prepared.session.itemOrder.map((entry, index) => index === 0
    ? { ...entry, item: { ...entry.item, questionId: question.questionId } }
    : entry);
  const optionOrderByOccurrence = {
    ...prepared.session.optionOrderByOccurrence,
    [occurrence.occurrenceId]: question.interaction.options.map((option) => option.optionId),
  };
  const unpinned = createTrainingSession({ ...prepared.session, itemOrder, optionOrderByOccurrence, planFingerprint: undefined, taxonomyVersion: undefined });
  const session = createTrainingSession({
    ...unpinned,
    taxonomyVersion: "canonical-content-v1",
    planFingerprint: await createContentSessionPlanFingerprint({ ...unpinned, taxonomyVersion: "canonical-content-v1" }),
  });
  const runtime = new CanonicalTrainingRuntime(track);
  await runtime.validateResume({ session, draft: null });
  await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });

  const correctOptionId = question.answer.optionId;
  const wrong = question.interaction.options.find((option) => option.optionId !== correctOptionId);
  assert.ok(wrong, "the actual GCP question should have a wrong option");
  const response = { type: "choice_single" as const, optionId: wrong.optionId };
  const outcome = await runtime.submitPractice({ session, response, attempts: [], reviews: [], now: NOW });
  const reviews = outcome.reviewMutations.filter((mutation) => mutation.kind === "upsert").map((mutation) => mutation.entry);
  await commitTrainingOutcome({ attempt: outcome.attempt, session: outcome.session, reviews, createdAt: NOW });
  await commitTrainingOutcome({ attempt: outcome.attempt, session: outcome.session, reviews, createdAt: NOW });
  installKeyValueStorageForTests(storage);
  const attempts = (await getTrainingAttempts()).value;
  assert.equal(attempts.length, 1, "the durable rebind should observe one idempotently committed attempt");
  return { attempt: attempts[0]!, optionId: wrong.optionId, response };
}

async function main() {
  const expectDelivered = process.argv.includes("--expect-delivered");
  const unsupportedArguments = process.argv.slice(2).filter((argument) => argument !== "--expect-delivered");
  assert.deepEqual(unsupportedArguments, [], "Only --expect-delivered is supported.");
  const storage = installMemoryStorage();
  const catalog = await loadCanonicalRuntimeCatalog();
  const gcpTrack = catalog.getTrack(GCP_TRACK_ID);
  const gcpQuestion = gcpTrack.getQuestion(GCP_QUESTION_ID);
  const codingTrack = catalog.getTrack(CODING_TRACK_ID);
  const codingQuestion = codingTrack.getQuestion(CODING_QUESTION_ID);
  assert.ok(gcpQuestion, `Missing loaded GCP question ${GCP_QUESTION_ID}`);
  assert.ok(codingQuestion, `Missing loaded Coding question ${CODING_QUESTION_ID}`);
  if (gcpQuestion.answer.type !== "choice_single" || codingQuestion.answer.type !== "choice_single") throw new Error("Expected current single-choice probe questions.");
  const gcpCorrectOptionId = gcpQuestion.answer.optionId;
  const codingCorrectOptionId = codingQuestion.answer.optionId;
  assert.equal(gcpTrack.getPool("certification-focus-practice").some((question) => question.questionId === GCP_QUESTION_ID), true);
  if (codingQuestion.interaction.type !== "choice_single" || codingQuestion.answer.type !== "choice_single") throw new Error("The current Coding probe question must be choice_single.");

  const persisted = await persistGcpWrongAnswer(gcpTrack, gcpQuestion, storage);
  const gcpMessage = selectedMessage(gcpQuestion, persisted.optionId);
  assert.ok(gcpMessage, "the authored GCP question should explain the selected wrong option");
  const gcpComposed = composeCanonicalFeedback(gcpQuestion, persisted.response);
  const gcpCertification = projectCertificationPracticeFeedback("afterEachAnswer", persisted.attempt, gcpQuestion);
  const correctResponse = { type: "choice_single" as const, optionId: gcpCorrectOptionId };
  const correctComposed = composeCanonicalFeedback(gcpQuestion, correctResponse);
  const correctCertification = projectCertificationPracticeFeedback("afterEachAnswer", { response: correctResponse, result: { kind: "correct" } }, gcpQuestion);
  const deferredCertification = projectCertificationPracticeFeedback("atSessionEnd", persisted.attempt, gcpQuestion);
  assert.equal((correctComposed.messages ?? []).some((message) => message.kind === "wrong_option"), false, "a correct answer must not receive wrong-option explanations");
  assert.equal((correctCertification?.messages ?? []).some((message) => message.kind === "wrong_option"), false, "a correct Certification answer must not receive wrong-option explanations");
  assert.equal(deferredCertification, null, "deferred Certification feedback must remain absent before session completion");

  const codingWrong = codingQuestion.interaction.options.find((option) => option.optionId !== codingCorrectOptionId);
  assert.ok(codingWrong, "the actual Coding question should have a wrong option");
  const codingMessage = selectedMessage(codingQuestion, codingWrong.optionId);
  assert.ok(codingMessage, "the authored Coding question should explain the selected wrong option");
  const codingComposed = composeCanonicalFeedback(codingQuestion, { type: "choice_single", optionId: codingWrong.optionId });

  const report = {
  fixture: "current locked canonical artifact; GCP wrong response was submitted through actual CanonicalTrainingRuntime and journaled to memory repositories twice, then read after repository rebind",
  mode: expectDelivered ? "acceptance: authored messages must reach projections" : "observation only: baseline absence is historical evidence, not acceptance",
  artifacts: {
    gcp: { contentVersion: gcpTrack.contentVersion, artifactSha256: gcpTrack.artifactSha256 },
    coding: { contentVersion: codingTrack.contentVersion, artifactSha256: codingTrack.artifactSha256 },
  },
  gcp: {
    questionId: GCP_QUESTION_ID,
    persistedAttemptsAfterRebind: 1,
    selectedWrongOptionId: persisted.optionId,
    authoredMessageText: gcpMessage.text,
    canonicalComposerMessage: gcpComposed.messages?.find((message) => message.targetId === persisted.optionId)?.text ?? null,
    certificationImmediateMessage: gcpCertification?.messages?.find((message) => message.targetId === persisted.optionId)?.text ?? null,
    correctResponseWrongOptionMessages: (correctComposed.messages ?? []).filter((message) => message.kind === "wrong_option").length,
    correctCertificationWrongOptionMessages: (correctCertification?.messages ?? []).filter((message) => message.kind === "wrong_option").length,
    deferredFeedback: deferredCertification,
  },
  coding: {
    questionId: CODING_QUESTION_ID,
    selectedWrongOptionId: codingWrong.optionId,
    authoredMessageText: codingMessage.text,
    canonicalComposerMessage: codingComposed.messages?.find((message) => message.targetId === codingWrong.optionId)?.text ?? null,
  },
  expectedRed: [
    ...(gcpComposed.messages?.some((message) => message.kind === "wrong_option" && message.targetId === persisted.optionId && message.text === gcpMessage.text) ? [] : ["GCP canonical composer drops the selected authored wrong-option message"]),
    ...(gcpCertification?.messages?.some((message) => message.kind === "wrong_option" && message.targetId === persisted.optionId && message.text === gcpMessage.text) ? [] : ["GCP immediate Certification projection drops the selected authored wrong-option message after durable submit"]),
    ...(codingComposed.messages?.some((message) => message.kind === "wrong_option" && message.targetId === codingWrong.optionId && message.text === codingMessage.text) ? [] : ["Coding canonical composer drops the selected authored wrong-option message"]),
  ],
  };

  console.log(JSON.stringify(report, null, 2));
  if (expectDelivered && report.expectedRed.length > 0) process.exitCode = 1;
}

void main();
