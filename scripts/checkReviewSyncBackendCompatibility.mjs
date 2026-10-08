import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = parseBackendRoot(process.argv.slice(2), appRoot);
const backendContracts = await import(pathToFileURL(join(backendRoot, "src/modules/progress/contracts.ts")).href);
const backendMerge = await import(pathToFileURL(join(backendRoot, "src/modules/users/merge.ts")).href);
const backendPaths = await import(pathToFileURL(join(backendRoot, "src/infrastructure/firestore/paths.ts")).href);
const appDomain = await import(pathToFileURL(join(appRoot, "src/domain/index.ts")).href);
const appGuards = await import(pathToFileURL(join(appRoot, "src/storage/repositories/trainingModelGuards.ts")).href);
const runtimeCatalogModule = await import(pathToFileURL(join(appRoot, "src/content/canonical/runtimeCatalog.ts")).href);
const runtimeModule = await import(pathToFileURL(join(appRoot, "src/application/canonical/CanonicalTrainingRuntime.ts")).href);
const { createTrainingSession, createTrainingSessionResult, createResolvedContentRef } = appDomain;
const { isReviewQueueEntry, isTrainingSession, isTrainingSessionResult } = appGuards;
const { progressMutationSchema } = backendContracts;
const { createMergeRecordFingerprint } = backendMerge;
const { progressDocumentId } = backendPaths;
const now = "2026-10-08T10:00:00.000Z";

const catalog = await runtimeCatalogModule.loadCanonicalRuntimeCatalog();
const trackId = "coding-interview-dsa-problem-solving";
const track = catalog.getTrack(trackId);
const mode = track.getMode("coding-interview-weak-area-review");
const question = track.getPool(mode.modeId)[0];
assert.ok(question, "canonical due-review mode must provide a compatible question");
const item = createResolvedContentRef({
  trackId,
  questionId: question.questionId,
  contentVersion: track.contentVersion,
  artifactSha256: track.artifactSha256,
});
const sourceRef = Object.freeze({ axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" });
const baseReview = {
  trackId,
  sourceAttemptId: "attempt-compat-base",
  sourceSessionId: "session-compat-base",
  sourceItem: item,
  taxonomyOrSkillRefs: [sourceRef],
  reasons: ["incorrect"],
  createdAt: now,
  consecutiveAfterDueSuccesses: 0,
  persistent: true,
};
const activeReview = {
  ...baseReview,
  id: "review-active-compat-001",
  dueAt: now,
  policyVersion: "bizq04-v1",
  stage: "repair24",
  status: "active",
};
const completedReview = {
  ...baseReview,
  id: "review-completed-compat-001",
  reasons: ["scheduled_retrieval"],
  persistent: false,
  policyVersion: "bizq04-v1",
  stage: "retention28",
  status: "completed",
  completedAt: now,
  completedByAttemptId: "attempt-compat-complete-001",
};
const legacyActiveReview = {
  ...baseReview,
  id: "review-legacy-compat-001",
  dueAt: now,
  consecutiveAfterDueSuccesses: 1,
};
assert.ok(isReviewQueueEntry(activeReview));
assert.ok(isReviewQueueEntry(completedReview));
assert.ok(isReviewQueueEntry(legacyActiveReview));

const runtime = new runtimeModule.CanonicalTrainingRuntime(track);
const prepared = await runtime.prepare({
  trackId,
  modeId: mode.modeId,
  request: { sessionId: "session-due-compat-001", requestedLength: mode.requestedLengths[0], reviewSource: "due_queue" },
  attempts: [],
  reviews: [activeReview],
  now,
});
assert.equal(prepared.session.itemOrder[0]?.reviewSourceSnapshot?.reviewEntryId, activeReview.id);
const completedSession = createTrainingSession({ ...prepared.session, status: "completed", completedAt: now });
assert.ok(isTrainingSession(completedSession));
const sessionResult = createTrainingSessionResult({
  id: "session-result-compat-001",
  sessionId: completedSession.id,
  trackId,
  totalOccurrences: completedSession.actualLength,
  answeredOccurrenceIds: completedSession.itemOrder.map(({ occurrenceId }) => occurrenceId),
  unansweredOccurrenceIds: [],
  completedAt: now,
  evidence: { familyId: "coding_interview", details: { sourceIdentity: { kind: "resolved", ref: item } } },
});
assert.ok(isTrainingSessionResult(sessionResult));

const cases = [
  ["active_review", "review_queue_entry", activeReview.id, "item", activeReview],
  ["completed_review", "review_queue_entry", completedReview.id, "item", completedReview],
  ["known_legacy_active_review", "review_queue_entry", legacyActiveReview.id, "item", legacyActiveReview],
  ["completed_session_with_due_queue_snapshot", "training_session_summary", completedSession.id, "node", completedSession],
  ["completed_session_result_with_content_identity", "training_session_result", sessionResult.id, "node", sessionResult],
];

for (const [name, recordType, targetId, kind, state] of cases) {
  const fingerprint = createMergeRecordFingerprint({ recordId: targetId, recordType, state, trackId });
  const mutation = {
    mutationId: `compat-${name.replaceAll("_", "-")}-001`,
    kind,
    recordType,
    trackId,
    targetId,
    expectedVersion: null,
    fingerprint,
    state,
  };
  const parsed = progressMutationSchema.safeParse(mutation);
  assert.ok(parsed.success, `${name}: ${parsed.success ? "" : parsed.error.issues.map((issue) => issue.message).join(", ")}`);
}

const terminalRecordIds = ["review-completed-compat-001", "review-completed-compat-002"].map((targetId) =>
  progressDocumentId({ kind: "item", recordType: "review_queue_entry", targetId, trackId }),
);
assert.notEqual(terminalRecordIds[0], terminalRecordIds[1], "distinct completed cycles must remain distinct backend records");
const digest = (value) => createHash("sha256").update(value).digest("hex");
console.log(JSON.stringify({
  status: "pass",
  validator: "backend progressMutationSchema.safeParse",
  trackId,
  currentArtifactDigest: digest(`${track.contentVersion}:${track.artifactSha256}`),
  cases: cases.length,
  terminalRecordIdsDistinct: true,
}));

function parseBackendRoot(args, currentAppRoot) {
  if (args.length === 0) return resolve(currentAppRoot, "../patternly-backend");
  if (args.length !== 2 || args[0] !== "--backend-root" || !args[1].trim()) {
    throw new Error("Usage: node --import tsx scripts/checkReviewSyncBackendCompatibility.mjs [--backend-root PATH]");
  }
  return resolve(args[1]);
}
