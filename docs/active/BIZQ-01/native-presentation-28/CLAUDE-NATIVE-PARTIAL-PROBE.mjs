import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadCanonicalRuntimeCatalog } = require("../../../../src/content/canonical/runtimeCatalog.ts");
const { scoreCanonicalQuestion, isCanonicalResponseComplete } = require("../../../../src/content/canonical/questionScoring.ts");
const { CanonicalTrainingRuntime } = require("../../../../src/application/canonical/CanonicalTrainingRuntime.ts");
const { loadTrainingAttempts, loadReviewQueueItems } = require("../../../../src/application/learningReadModels.ts");
const { MemoryKeyValueStorage, installKeyValueStorageForTests } = require("../../../../src/infrastructure/storage/mmkvClient.ts");
const { advanceTrainingSession } = require("../../../../src/domain/learning/trainingSession.ts");

const trackId = "claude-certified-architect-professional-certification";
const modeId = "certification-focus-practice";
const now = "2026-10-05T12:00:00.000Z";

installKeyValueStorageForTests(new MemoryKeyValueStorage());
const [attemptSnapshot, reviewSnapshot, catalog] = await Promise.all([
  loadTrainingAttempts(),
  loadReviewQueueItems(),
  loadCanonicalRuntimeCatalog(),
]);
if (attemptSnapshot.value.length || reviewSnapshot.value.length) {
  throw new Error("The isolated memory repository was not empty.");
}

const track = catalog.getTrack(trackId);
const runtime = new CanonicalTrainingRuntime(track);
const pool = track.getPool(modeId);
const summarize = (session) => {
  const questions = session.itemOrder.map(({ item }) => track.getQuestion(item.questionId));
  return {
    requestedLength: session.requestedLength,
    actualLength: session.actualLength,
    interactionCounts: questions.reduce((counts, question) => {
      counts[question.interaction.type] = (counts[question.interaction.type] ?? 0) + 1;
      return counts;
    }, {}),
    partialCapableQuestionIds: questions.filter((question) => question.interaction.type === "choice_multiple").map((question) => question.questionId),
    questionIds: questions.map((question) => question.questionId),
  };
};

const freshSessions = [];
for (const requestedLength of [10, 20, 40]) {
  const prepared = await runtime.prepare({
    trackId,
    modeId,
    request: { sessionId: `native-feasibility-fresh-${requestedLength}`, requestedLength },
    attempts: attemptSnapshot.value,
    reviews: reviewSnapshot.value,
    now,
  });
  freshSessions.push(summarize(prepared.session));
}

const first = await runtime.prepare({
  trackId,
  modeId,
  request: { sessionId: "native-feasibility-complete40", requestedLength: 40 },
  attempts: attemptSnapshot.value,
  reviews: reviewSnapshot.value,
  now,
});
let session = first.session;
const attempts = [];
const resultKinds = {};
for (let index = 0; index < first.session.actualLength; index += 1) {
  const occurrence = session.itemOrder[session.currentItemIndex];
  const question = track.getQuestion(occurrence.item.questionId);
  const submission = await runtime.submitPractice({
    session,
    response: question.answer,
    attempts,
    reviews: reviewSnapshot.value,
    now,
  });
  attempts.push(submission.attempt);
  resultKinds[submission.attempt.result.kind] = (resultKinds[submission.attempt.result.kind] ?? 0) + 1;
  session = index < first.session.actualLength - 1
    ? advanceTrainingSession(submission.session)
    : submission.session;
}
const finalized = await runtime.finalizePractice({ session: first.session, attempts, now });
if (finalized.session.status !== "completed" || attempts.length !== 40) {
  throw new Error("The ordinary runtime session did not finalize with 40 attempts.");
}

const followOnSessions = [];
for (const requestedLength of [10, 20, 40]) {
  const prepared = await runtime.prepare({
    trackId,
    modeId,
    request: { sessionId: `native-feasibility-after40-${requestedLength}`, requestedLength },
    attempts,
    reviews: reviewSnapshot.value,
    now,
  });
  followOnSessions.push(summarize(prepared.session));
}

const scorerControls = pool
  .filter((question) => question.interaction.type === "choice_multiple")
  .map((question) => {
    const response = { type: "choice_multiple", optionIds: question.answer.optionIds.slice(0, -1) };
    const complete = isCanonicalResponseComplete(question, response);
    const score = scoreCanonicalQuestion(question, response);
    return { questionId: question.questionId, complete, kind: score.kind, earnedPoints: score.earnedPoints, maxPoints: score.maxPoints };
  });

console.log(JSON.stringify({
  trackId,
  contentVersion: track.contentVersion,
  artifactSha256: track.artifactSha256,
  modeId,
  nodeId: track.getMode(modeId).selection.nodeId,
  memoryRepository: { initialAttempts: attemptSnapshot.value.length, initialReviews: reviewSnapshot.value.length, generatedAttemptsPersisted: false },
  pool: {
    count: pool.length,
    interactionCounts: pool.reduce((counts, question) => {
      counts[question.interaction.type] = (counts[question.interaction.type] ?? 0) + 1;
      return counts;
    }, {}),
  },
  freshSessions,
  completedOrdinarySession: {
    requestedLength: first.session.requestedLength,
    actualLength: first.session.actualLength,
    attemptCount: attempts.length,
    resultKinds,
    finalStatus: finalized.session.status,
  },
  followOnSessions,
  scorerControls,
  boundaries: { deviceUsed: false, persistentUserStorageRead: false, persistentUserStorageWritten: false, questionsReplaced: false, seededAttempts: false },
}, null, 2));
