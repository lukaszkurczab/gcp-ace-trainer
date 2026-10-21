import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = parseBackendRoot(process.argv.slice(2), appRoot);
const backendContracts = await import(pathToFileURL(join(backendRoot, "src/modules/progress/contracts.ts")).href);
const backendMerge = await import(pathToFileURL(join(backendRoot, "src/modules/users/merge.ts")).href);
const backendAdoption = await import(pathToFileURL(join(backendRoot, "src/modules/users/adoptionTransfer.ts")).href);
const appWire = await import(pathToFileURL(join(appRoot, "src/domain/account/terminalSessionWire.ts")).href);
const appAccount = await import(pathToFileURL(join(appRoot, "src/storage/repositories/accountDataRepository.ts")).href);
const appClient = await import(pathToFileURL(join(appRoot, "src/infrastructure/clients/PatternlyApiClientAdapter.ts")).href);
const appStorage = await import(pathToFileURL(join(appRoot, "src/testing/journalTestSupport.ts")).href);
const appGuest = await import(pathToFileURL(join(appRoot, "src/storage/repositories/guestInstallationRepository.ts")).href);
const appRepositories = await import(pathToFileURL(join(appRoot, "src/storage/repositories/index.ts")).href);
const appPlanIdentity = await import(pathToFileURL(join(appRoot, "src/content/application/contentSessionIdentity.ts")).href);
const backendPaths = await import(pathToFileURL(join(backendRoot, "src/infrastructure/firestore/paths.ts")).href);
const appDomain = await import(pathToFileURL(join(appRoot, "src/domain/index.ts")).href);
const appGuards = await import(pathToFileURL(join(appRoot, "src/storage/repositories/trainingModelGuards.ts")).href);
const appAdmission = await import(pathToFileURL(join(appRoot, "src/application/tracks/trackAdmissionContext.ts")).href);
const runtimeCatalogModule = await import(pathToFileURL(join(appRoot, "src/content/canonical/runtimeCatalog.ts")).href);
const runtimeComposition = await import(pathToFileURL(join(appRoot, "src/application/canonicalTrainingFamilyComposition.ts")).href);
const { createResolvedContentRef } = appDomain;
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
  taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, sourceRef],
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
assert.ok(isReviewQueueEntry(activeReview, appAdmission.productionTrackAdmissionContext));
assert.ok(isReviewQueueEntry(completedReview, appAdmission.productionTrackAdmissionContext));
assert.ok(isReviewQueueEntry(legacyActiveReview, appAdmission.productionTrackAdmissionContext));

const runtime = runtimeComposition.createCanonicalTrainingFamilyRuntime(track);
const prepared = await runtime.prepare({
  trackId,
  modeId: mode.modeId,
  request: { sessionId: "session-due-compat-001", requestedLength: mode.requestedLengths[0], reviewSource: "due_queue" },
  attempts: [],
  reviews: [activeReview],
  now,
});
assert.equal(prepared.session.itemOrder[0]?.reviewSourceSnapshot?.reviewEntryId, activeReview.id);
const selectedQuestion = track.getQuestion(prepared.session.itemOrder[0].item.questionId);
const submission = await runtime.submitPractice({ session: prepared.session, response: selectedQuestion.answer, attempts: [], reviews: [activeReview], now });
const finalized = await runtime.finalizePractice({ session: submission.session, attempts: [submission.attempt], now });
const completedSession = appWire.projectTerminalSession(finalized.session);
const sessionResult = finalized.result;
assert.ok(isTrainingSession(finalized.session, appAdmission.productionTrackAdmissionContext));
assert.ok(isTrainingSessionResult(sessionResult, appAdmission.productionTrackAdmissionContext));

// Real legacy A -> current B, finalized by the family owner rather than fabricated terminal state.
const sourceA = track.questions.find(q => q.questionId !== question.questionId && q.nodeId === question.nodeId && q.mentalUnitId === question.mentalUnitId);
assert.ok(sourceA);
const original = { ...legacyActiveReview, id: "review-legacy-unit-compat", sourceItem: createResolvedContentRef({ ...item, questionId: sourceA.questionId }), taxonomyOrSkillRefs: [] };
const legacyPrepared = await runtime.prepare({ trackId, modeId: mode.modeId, request: { sessionId: "session-legacy-unit-compat", requestedLength: mode.requestedLengths[0], reviewSource: "due_queue" }, attempts: [], reviews: [original], now });
const occurrence = legacyPrepared.session.itemOrder[0];
assert.notEqual(occurrence.item.questionId, original.sourceItem.questionId);
assert.deepEqual(occurrence.reviewSourceSnapshot.legacyUnitProof, { sourceItem: original.sourceItem, nodeId: sourceA.nodeId, mentalUnitId: sourceA.mentalUnitId });
const legacyAnswer = await runtime.submitPractice({ session: legacyPrepared.session, response: track.getQuestion(occurrence.item.questionId).answer, attempts: [], reviews: [original], now });
const legacyFinalized = await runtime.finalizePractice({ session: legacyAnswer.session, attempts: [legacyAnswer.attempt], now });
const legacyWire = appWire.projectTerminalSession(legacyFinalized.session);
const legacyReview = legacyAnswer.reviewMutations.find(m => m.kind === "upsert").entry;
assert.deepEqual(legacyReview.sourceItem, original.sourceItem);
assert.deepEqual(legacyReview.taxonomyOrSkillRefs, original.taxonomyOrSkillRefs);

const cases = [
  ["active_review", "review_queue_entry", activeReview.id, "item", activeReview],
  ["completed_review", "review_queue_entry", completedReview.id, "item", completedReview],
  ["known_legacy_active_review", "review_queue_entry", legacyActiveReview.id, "item", legacyActiveReview],
  ["completed_session_with_due_queue_snapshot", "training_session_summary", completedSession.id, "node", completedSession],
  ["completed_session_result_with_content_identity", "training_session_result", sessionResult.id, "node", sessionResult],
  ["legacy_unit_session", "training_session_summary", legacyWire.id, "node", legacyWire],
  ["legacy_unit_attempt", "training_attempt", legacyAnswer.attempt.id, "item", legacyAnswer.attempt],
  ["legacy_unit_result", "training_session_result", legacyFinalized.result.id, "node", legacyFinalized.result],
  ["legacy_unit_review", "review_queue_entry", legacyReview.id, "item", legacyReview],
];

for (const [name, recordType, targetId, kind, rawState] of cases) {
  const state = JSON.parse(JSON.stringify(rawState));
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

const wireRecord = (recordType, recordId, rawState) => {
  // Match the account snapshot producer's JSON copy before fingerprinting runtime facts.
  const state = JSON.parse(JSON.stringify(rawState));
  return { recordType, recordId, trackId, state, fingerprint: createMergeRecordFingerprint({ recordType, recordId, trackId, state }), version: 1 };
};
const legacyRecords = [
  wireRecord("training_session_summary", legacyWire.id, legacyWire),
  wireRecord("training_attempt", legacyAnswer.attempt.id, legacyAnswer.attempt),
  wireRecord("training_session_result", legacyFinalized.result.id, legacyFinalized.result),
  wireRecord("review_queue_entry", legacyReview.id, legacyReview),
];
function assertBackendRecord(record, expected = true) {
  const { recordId, ...rest } = record;
  const mutation = { ...rest, targetId: recordId, mutationId: "legacy-proof-boundary-0001", kind: ["training_attempt", "review_queue_entry"].includes(record.recordType) ? "item" : "node", expectedVersion: null };
  delete mutation.version;
  assert.equal(progressMutationSchema.safeParse(mutation).success, expected, "progress wire boundary");
  assert.equal(backendMerge.guestMergeRecordSchema.safeParse(record).success, expected, "merge wire boundary");
  assert.equal(backendAdoption.adoptionTransferRecordSchema.safeParse(record).success, expected, "adoption wire boundary");
}
for (const record of legacyRecords) {
  appAccount.assertValidAccountDataRecords([record], appAdmission.productionLearningDataAdmissionContext);
  assertBackendRecord(record);
}
const summary = legacyRecords[0];
const proof = legacyWire.itemOrder[0].reviewSourceSnapshot.legacyUnitProof;
const malformedProofs = [null, undefined, { ...proof, extra: true }, { ...proof, nodeId: "" }, { sourceItem: proof.sourceItem, nodeId: proof.nodeId },
  ...["trackId", "contentVersion", "artifactSha256"].map(key => ({ ...proof, sourceItem: { ...proof.sourceItem, [key]: key === "artifactSha256" ? "f".repeat(64) : "foreign" } }))];
for (const invalid of malformedProofs) {
  const state = { ...legacyWire, itemOrder: legacyWire.itemOrder.map(entry => ({ ...entry, reviewSourceSnapshot: { ...entry.reviewSourceSnapshot, legacyUnitProof: invalid } })) };
  const record = { ...summary, state };
  assert.throws(() => appAccount.assertValidAccountDataRecords([record], appAdmission.productionLearningDataAdmissionContext));
  assertBackendRecord(record, false);
}
// A branch-local foreign item/proof pair must still match the outer session pin.
const foreignItem = { ...legacyWire.itemOrder[0].item, trackId: "foreign-track", contentVersion: "foreign-version", artifactSha256: "f".repeat(64) };
const foreignBranchOccurrence = { ...legacyWire.itemOrder[0], occurrenceId: "foreign-branch", item: foreignItem,
  reviewSourceSnapshot: { ...legacyWire.itemOrder[0].reviewSourceSnapshot, legacyUnitProof: { ...proof, sourceItem: { ...foreignItem, questionId: proof.sourceItem.questionId } } } };
const branchState = { ...legacyWire, conditionalReinsertSlots: [{ slotId: "foreign-proof-slot", sourceOccurrenceId: legacyWire.itemOrder[0].occurrenceId,
  ordinaryBranch: { occurrence: legacyWire.itemOrder[0], optionOrder: [] }, reviewedVariantBranch: { occurrence: foreignBranchOccurrence, optionOrder: [] },
  resolutionRule: "incorrect_or_partial_after_three_materialized_submissions" }] };
assertBackendRecord(wireRecord("training_session_summary", legacyWire.id, branchState), false);
assert.throws(() => appAccount.assertValidAccountDataRecords([wireRecord("training_session_summary", legacyWire.id, branchState)], appAdmission.productionLearningDataAdmissionContext));
// Existing branches without the new proof keep their prior wire admission rules.
const { legacyUnitProof: _foreignProof, ...foreignSnapshotWithoutProof } = foreignBranchOccurrence.reviewSourceSnapshot;
const oldBranchState = { ...branchState, conditionalReinsertSlots: [{ ...branchState.conditionalReinsertSlots[0], reviewedVariantBranch: { occurrence: { ...foreignBranchOccurrence, reviewSourceSnapshot: foreignSnapshotWithoutProof }, optionOrder: [] } }] };
assertBackendRecord(wireRecord("training_session_summary", legacyWire.id, oldBranchState));
const oldState = { ...legacyWire, itemOrder: legacyWire.itemOrder.map(entry => {
  const { legacyUnitProof: _proof, ...snapshot } = entry.reviewSourceSnapshot;
  return { ...entry, reviewSourceSnapshot: snapshot };
}) };
oldState.planFingerprint = await appPlanIdentity.createContentSessionPlanFingerprint(oldState);
const oldRecord = wireRecord("training_session_summary", legacyWire.id, oldState);
assert.equal(Object.hasOwn(oldState.itemOrder[0].reviewSourceSnapshot, "legacyUnitProof"), false);
assertBackendRecord(oldRecord);
appAccount.assertValidAccountDataRecords([oldRecord], appAdmission.productionLearningDataAdmissionContext);
// Existing plan hashing binds proof bytes. Recompute the record fingerprint, but not the original plan.
const changedProofState = { ...legacyWire, itemOrder: legacyWire.itemOrder.map(entry => ({ ...entry, reviewSourceSnapshot: { ...entry.reviewSourceSnapshot, legacyUnitProof: { ...proof, mentalUnitId: "tampered" } } })) };
assert.notEqual(await appPlanIdentity.createContentSessionPlanFingerprint(changedProofState), legacyFinalized.session.planFingerprint);
const responseRecords = legacyRecords.map(({ recordId, ...record }) => ({ ...record, targetId: recordId, kind: ["training_attempt", "review_queue_entry"].includes(record.recordType) ? "item" : "node", updatedAt: now, lastMutationId: "legacy-proof-boundary-0001" }));
const client = appClient.createPatternlyApiClient({ apiOrigin: "https://legacy-proof.invalid", getIdToken: async () => "fixture", getAppCheckToken: async () => "fixture",
  fetchImplementation: async () => new Response(JSON.stringify({ accountRevision: 1, generation: 0, snapshotToken: "a".repeat(64), snapshotScope: "b".repeat(64), records: responseRecords, nextPageToken: null }), { status: 200 }) });
const decoded = await client.getProgress();
appStorage.installMemoryStorage();
await appGuest.provisionGuestInstallation({ async create() { return { installationId: "66666666-6666-4666-8666-666666666666", localDatasetId: "77777777-7777-4777-8777-777777777777" }; } });
const remote = decoded.records.map(({ targetId, kind: _kind, lastMutationId: _last, updatedAt: _updated, ...record }) => ({ ...record, recordId: targetId }));
await appAccount.applyRemoteAccountData(remote, appAdmission.productionLearningDataAdmissionContext);
const [restoredSession] = (await appRepositories.getTrainingSessions(appAdmission.productionTrackAdmissionContext)).value;
assert.deepEqual(appWire.projectTerminalSession(restoredSession), legacyWire);
assert.equal(await appRepositories.getActiveTrainingSession(appAdmission.productionTrackAdmissionContext), null);
assert.equal(await appPlanIdentity.createContentSessionPlanFingerprint(restoredSession), restoredSession.planFingerprint);
assert.deepEqual((await appRepositories.getTrainingAttempts(appAdmission.productionTrackAdmissionContext)).value, [legacyRecords.find(record => record.recordType === "training_attempt").state]);
assert.deepEqual((await appRepositories.getReviewQueueItems(appAdmission.productionTrackAdmissionContext)).value, [legacyRecords.find(record => record.recordType === "review_queue_entry").state]);
const rebuilt = await appAccount.buildAccountDataSnapshot(appAdmission.productionLearningDataAdmissionContext);
for (const record of legacyRecords) assert.equal(rebuilt.records.find(saved => saved.recordId === record.recordId).fingerprint, record.fingerprint);

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
  legacyUnitBoundary: "prepare A -> answer B -> finalize -> APP wire -> backend progress/merge/adoption -> JSON -> APP decoder -> fresh storage",
  malformedProofsRejected: malformedProofs.length,
  foreignConditionalProofRejected: true,
  restoredPlanFingerprint: restoredSession.planFingerprint,
}));

function parseBackendRoot(args, currentAppRoot) {
  if (args.length === 0) return resolve(currentAppRoot, "../patternly-backend");
  if (args.length !== 2 || args[0] !== "--backend-root" || !args[1].trim()) {
    throw new Error("Usage: node --import tsx scripts/checkReviewSyncBackendCompatibility.mjs [--backend-root PATH]");
  }
  return resolve(args[1]);
}
