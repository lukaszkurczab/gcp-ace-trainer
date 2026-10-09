import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { chmodSync, closeSync, existsSync, lstatSync, openSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
function rejectPreflight(code) {
  process.stderr.write(`${JSON.stringify({ stage: "argument_preflight", result: "failed", code })}\n`);
  process.exit(1);
}
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const producerArguments = new Map();
const producerArgs = process.argv.slice(2);
for (let index = 0; index < producerArgs.length; index += 1) {
  const name = producerArgs[index];
  if (!["--private-root", "--input", "--output-root"].includes(name) || producerArguments.has(name) || !producerArgs[index + 1] || producerArgs[index + 1].startsWith("--")) rejectPreflight("private_input_rejected");
  producerArguments.set(name, producerArgs[index + 1]);
  index += 1;
}
for (const name of ["--private-root", "--input", "--output-root"]) if (!producerArguments.has(name)) rejectPreflight("private_input_rejected");
const privateRoot = resolve(producerArguments.get("--private-root"));
const outputRoot = resolve(producerArguments.get("--output-root"));
const inputName = producerArguments.get("--input");
if (isAbsolute(inputName) || inputName !== basename(inputName) || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/u.test(inputName)) rejectPreflight("private_input_rejected");
const inputPath = resolve(privateRoot, inputName);
if (dirname(inputPath) !== privateRoot) rejectPreflight("private_input_rejected");
const privateDirectory = (path, code) => {
  const metadata = lstatSync(path);
  if (!metadata.isDirectory() || metadata.isSymbolicLink() || metadata.uid !== process.getuid() || (metadata.mode & 0o777) !== 0o700 || realpathSync(path) !== path) rejectPreflight(code);
};
privateDirectory(privateRoot, "private_root_invalid");
privateDirectory(outputRoot, "private_output_root_invalid");
const artifactId = randomUUID();
const outputPath = `${outputRoot}/sync-request-${artifactId}.json`;
const receiptPath = `${outputRoot}/producer-receipt-${artifactId}.json`;
const producerVersion = "patternly-second-client-memory-producer-v2";
const producerScriptSha256 = createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex");
const trackId = "coding-interview-dsa-problem-solving";
let stage = "input_preflight";
let router = null;
let active = false;
let preparationFactorySet = false;
let resetTestStorageHooks = null;
let requestWritten = false;

function emitFailure(code, ownerErrorType = undefined) {
  process.stderr.write(JSON.stringify({ stage, result: "failed", code, ...(ownerErrorType ? { ownerErrorType } : {}) }) + "\n");
}

try {
  const inputStat = lstatSync(inputPath);
  assert.ok(inputStat.isFile() && !inputStat.isSymbolicLink() && inputStat.uid === process.getuid() && realpathSync(inputPath) === inputPath, "input_file_invalid");
  assert.equal(inputStat.mode & 0o777, 0o600, "input_permissions_invalid");
  const inputBytes = readFileSync(inputPath);
  const sourceInputSha256 = createHash("sha256").update(inputBytes).digest("hex");
  const input = JSON.parse(inputBytes.toString("utf8"));
  const inputKeys = input && typeof input === "object" && !Array.isArray(input) ? Object.keys(input).sort() : [];
  if (JSON.stringify(inputKeys) !== JSON.stringify(["accountId", "accountRevision", "generation", "nextPageToken", "records"].sort())
    || typeof input.accountId !== "string" || input.accountId.trim().length === 0
    || !Number.isSafeInteger(input.accountRevision) || input.accountRevision < 0
    || !Number.isSafeInteger(input.generation) || input.generation < 0
    || !Array.isArray(input.records)) throw new Error("input_schema_invalid");
  if (input.nextPageToken !== null) throw new Error("input_snapshot_incomplete");

  stage = "canonical_imports";
  const require = createRequire(resolve(appRoot, "package.json"));
  const { acceptedTargetFromGoal, createLearningPlanSlotId } = require(resolve(appRoot, "src/domain/index.ts"));
  const { isGoalRecordForTrack, isLearningPlanV1ForTrack } = require(resolve(appRoot, "src/domain/index.ts"));
  const { contentPackageRuntimeOwner } = require(resolve(appRoot, "src/application/contentPackageRuntimeOwner.ts"));
  const { recommendLearningPlanMode } = require(resolve(appRoot, "src/application/learningPlan/learningPlanModeRecommendation.ts"));
  const { commitGoalPlanAcceptance } = require(resolve(appRoot, "src/application/learningMutations/commitGoalPlanAcceptance.ts"));
  const { readGoalSnapshot } = require(resolve(appRoot, "src/storage/repositories/goalRepository.ts"));
  const { getLearningPlanSnapshot } = require(resolve(appRoot, "src/storage/repositories/learningPlanRepository.ts"));
  const accountData = require(resolve(appRoot, "src/storage/repositories/accountDataRepository.ts"));
  const { readCanonicalEnvelope } = require(resolve(appRoot, "src/storage/repositories/canonicalRecordCodec.ts"));
  const { STORAGE_KEYS } = require(resolve(appRoot, "src/storage/keys.ts"));
  const { canonicalJsonV1 } = require(resolve(appRoot, "src/infrastructure/identity/canonicalSerialization.ts"));
  const {
    applyRemoteAccountData,
    buildAccountDataSnapshot,
    ensureAccountOutboxFromLocalDataset,
    finishAccountMaterialization,
    getAccountSyncState,
    partitionRemoteAccountDataForRecovery,
    splitAccountSyncBatches,
  } = accountData;
  const { getGuestInstallation } = require(resolve(appRoot, "src/storage/repositories/guestInstallationRepository.ts"));
  const {
    MemoryKeyValueStorage,
    activatePreparedProfile,
    closeActiveProfileStorage,
    installKeyValueStorageForTests,
    prepareProfileStorage,
    setProfileStoragePreparationFactoryForTests,
  } = require(resolve(appRoot, "src/infrastructure/storage/mmkvClient.ts"));
  resetTestStorageHooks = () => {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  };
  const { openProfileStorageRouter } = require(resolve(appRoot, "src/infrastructure/storage/profileStorageRouter.ts"));

  stage = "memory_account_profile_open";
  closeActiveProfileStorage();
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const base = new MemoryKeyValueStorage();
  const controlValues = new Map();
  const control = {
    async get(key) { return controlValues.get(key) ?? null; },
    async set(key, value) { controlValues.set(key, value); },
    async remove(key) { controlValues.delete(key); },
  };
  const identity = { async create() { return { installationId: randomUUID(), localDatasetId: randomUUID() }; } };
  router = await openProfileStorageRouter(base, control, { identity });
  stage = "account_profile_selection";
  await router.selectAccount(input.accountId);
  stage = "account_profile_reopen";
  router = await openProfileStorageRouter(base, control, { identity });
  stage = "account_profile_prepare";
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  preparationFactorySet = true;
  const profile = await prepareProfileStorage();
  activatePreparedProfile(profile.id, profile.kind);
  active = true;
  stage = "account_installation_check";
  const installation = await getGuestInstallation();
  if (!installation) throw new Error("account_installation_missing");
  if (installation.bindingState !== "account_bound") throw new Error("account_installation_not_bound");
  if (installation.accountId !== input.accountId) throw new Error("account_installation_account_mismatch");

  stage = "remote_materialization";
  const partition = await partitionRemoteAccountDataForRecovery({ accountId: input.accountId, generation: input.generation, records: input.records });
  assert.equal(partition.incident, null, "remote_recovery_incident_unexpected");
  await applyRemoteAccountData(partition.records);
  await finishAccountMaterialization(partition.records, input.accountId, input.accountRevision, new Date().toISOString());
  const beforeGoal = readGoalSnapshot(trackId);
  const beforePlan = getLearningPlanSnapshot(trackId);
  assert.ok(beforeGoal && beforePlan, "coding_pair_missing");
  assert.equal(beforePlan.plan.schemaVersion, 2, "coding_pair_not_v2");
  assert.equal(beforePlan.plan.goalRevision, beforeGoal.revision, "coding_pair_revision_mismatch");

  stage = "canonical_pair_acceptance";
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "coding_interview");
  assert.ok(resolved.track.trainingIdentity && resolved.planningPolicyIdentity);
  stage = "mode_recommendation";
  const recommendation = recommendLearningPlanMode({ familyId: "coding_interview", trackId, modes: resolved.track.modes, sessions: [], dueReviewCount: 0 });
  assert.ok(recommendation.mode.requestedLengths.includes(recommendation.mode.defaultRequestedLength));
  const beforeTargetDate = beforeGoal.record.targetDate ?? null;
  const afterTargetDate = beforeTargetDate === null
    ? "2027-01-01"
    : (() => {
      const nextDate = new Date(`${beforeTargetDate}T00:00:00.000Z`);
      assert.ok(Number.isFinite(nextDate.getTime()), "current_goal_target_date_invalid");
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      return nextDate.toISOString().slice(0, 10);
    })();
  const targetChangeKind = beforeTargetDate === null ? "introduce_target_date" : "advance_target_date";
  const proposedGoal = Object.freeze({ ...beforeGoal.record, targetDate: afterTargetDate });
  const now = new Date().toISOString();
  const proposalId = `second-client-${randomUUID()}`;
  const currentSlot = beforePlan.plan.slots[0];
  assert.ok(currentSlot, "current_plan_has_no_slot");
  const proposedPlan = Object.freeze({
    ...beforePlan.plan,
    schemaVersion: 2,
    planId: `${proposalId}-plan`,
    trackId,
    status: "accepted",
    timezone: beforePlan.plan.timezone,
    contentVersion: resolved.track.trainingIdentity.contentVersion,
    artifactSha256: resolved.track.trainingIdentity.artifactSha256,
    acceptedTarget: acceptedTargetFromGoal(proposedGoal),
    createdAt: now,
    updatedAt: now,
    commandId: `${proposalId}-command`,
    slots: Object.freeze([Object.freeze({
      ...currentSlot,
      slotId: createLearningPlanSlotId(`${proposalId}-slot`),
      day: proposedGoal.preferredDays[0],
      sessionLength: recommendation.mode.defaultRequestedLength,
    })]),
    executionPolicy: recommendation.executionPolicy,
    planningPolicyIdentity: resolved.planningPolicyIdentity,
  });
  stage = "canonical_commit_call";
  const committed = await commitGoalPlanAcceptance({
    proposalId,
    trackId,
    proposedGoal,
    plan: proposedPlan,
    expectedGoalRevision: beforeGoal.revision,
    expectedPlanStorageRevision: beforePlan.revision,
    identity: "second-client-memory-producer",
    createdAt: now,
    revalidate() {},
  });
  stage = "committed_schema_validation";
  assert.equal(committed.plan.plan.schemaVersion, 2);
  stage = "committed_revision_validation";
  assert.equal(committed.plan.plan.goalRevision, committed.goal.revision);
  stage = "committed_target_validation";
  assert.deepEqual(committed.plan.plan.acceptedTarget, acceptedTargetFromGoal(committed.goal.record));
  const committedGoalEnvelope = readCanonicalEnvelope(STORAGE_KEYS.goal(trackId), (value) => isGoalRecordForTrack(value, trackId));
  const committedPlanEnvelope = readCanonicalEnvelope(STORAGE_KEYS.learningPlan(trackId), (value) => isLearningPlanV1ForTrack(value, trackId));
  assert.ok(committedGoalEnvelope && committedPlanEnvelope, "committed_pair_envelopes_missing");
  assert.equal(committedGoalEnvelope.revision, committed.goal.revision, "committed_goal_envelope_revision_mismatch");
  assert.equal(committedPlanEnvelope.revision, committed.plan.revision, "committed_plan_envelope_revision_mismatch");
  stage = "local_snapshot_build";
  const snapshot = await buildAccountDataSnapshot();
  stage = "local_snapshot_invariants";
  assert.equal(snapshot.activeSession, false, "active_session_unexpected");
  assert.equal(snapshot.pendingJournal, false, "pending_journal_unexpected");

  stage = "canonical_outbox_batch";
  const outboxState = await ensureAccountOutboxFromLocalDataset();
  const pairEntries = outboxState.outbox.filter((entry) => entry.trackId === trackId && (entry.recordType === "goal" || entry.recordType === "learning_plan"));
  assert.equal(outboxState.accountId, input.accountId, "outbox_account_mismatch");
  assert.equal(outboxState.remoteAccountRevision, input.accountRevision, "outbox_revision_mismatch");
  assert.equal(outboxState.syncPlan?.expectedAccountRevision, input.accountRevision, "sync_plan_revision_mismatch");
  assert.equal(outboxState.outbox.length, 2, "unexpected_outbox_scope");
  assert.equal(pairEntries.length, 2, "coding_pair_not_atomic_outbox");
  assert.deepEqual(pairEntries.map((entry) => entry.recordType).sort(), ["goal", "learning_plan"]);
  for (const entry of pairEntries) {
    const remote = input.records.find((record) => record.recordType === entry.recordType && record.trackId === trackId && (record.recordId ?? record.targetId) === entry.recordId);
    assert.ok(remote, "baseline_remote_record_missing");
    assert.equal(entry.expectedVersion, remote.version, "expected_remote_version_mismatch");
  }
  const syncPlan = outboxState.syncPlan;
  assert.ok(syncPlan, "sync_plan_missing");
  const batches = splitAccountSyncBatches({ entries: outboxState.outbox, expectedAccountRevision: input.accountRevision, sessionId: syncPlan.planId, highWatermark: syncPlan.highWatermark });
  assert.equal(batches.length, 1, "goal_plan_split_across_batches");
  assert.equal(batches[0].length, 2, "unexpected_batch_size");
  const request = Object.freeze({
    canonicalVersion: "canonical-json-v1",
    expectedAccountRevision: input.accountRevision,
    deviceId: installation.installationId,
    sessionId: syncPlan.planId,
    batchId: `${syncPlan.planId}:batch:0`,
    highWatermark: syncPlan.highWatermark,
    mutations: Object.freeze(batches[0].map((entry) => Object.freeze({
      mutationId: entry.mutationId,
      kind: entry.recordType === "training_attempt" || entry.recordType === "review_queue_entry" ? "item" : "node",
      recordType: entry.recordType,
      trackId: entry.trackId,
      targetId: entry.recordId,
      expectedVersion: entry.expectedVersion,
      fingerprint: entry.fingerprint,
      state: entry.state,
    }))),
  });
  assert.equal(request.mutations.length, 2);
  assert.ok(request.mutations.every((mutation) => mutation.trackId === trackId));
  assert.ok(request.mutations.every((mutation) => mutation.targetId === trackId));
  assert.equal((await getAccountSyncState()).pendingMutationCount, 2);

  stage = "private_output";
  assert.equal(existsSync(outputPath), false, "output_already_exists");
  assert.equal(existsSync(receiptPath), false, "receipt_already_exists");
  const requestBytes = Buffer.from(JSON.stringify(request));
  const receipt = Object.freeze({
    schemaVersion: "patternly-second-client-producer-receipt-v1",
    producerRunId: artifactId,
    producerVersion,
    producerScriptSha256,
    createdAt: new Date().toISOString(),
    sourceInputSha256,
    accountId: input.accountId,
    remoteAccountRevision: input.accountRevision,
    baselineRecordCount: input.records.length,
    baselineRecords: Object.freeze(input.records.map((record) => Object.freeze({
      recordId: record.recordId ?? record.targetId,
      recordType: record.recordType,
      trackId: record.trackId,
      version: record.version,
      fingerprint: record.fingerprint,
    }))),
    memoryProfile: Object.freeze({ id: profile.id, kind: profile.kind, accountId: profile.accountId }),
    installation: Object.freeze({ accountId: installation.accountId, bindingState: installation.bindingState, installationId: installation.installationId, localDatasetId: installation.localDatasetId }),
    committedGoalPlanEnvelopes: Object.freeze({ goal: committedGoalEnvelope, learningPlan: committedPlanEnvelope }),
    targetChange: Object.freeze({ kind: targetChangeKind, beforeTargetDate, afterTargetDate }),
    exactOutbox: Object.freeze([...outboxState.outbox]),
    canonicalBatch: Object.freeze([...batches[0]]),
    request,
    requestSha256: createHash("sha256").update(canonicalJsonV1({ schema: "canonical-json-v1", payload: request })).digest("hex"),
    serializedRequestSha256: createHash("sha256").update(requestBytes).digest("hex"),
    requestFile: basename(outputPath),
  });
  const receiptBytes = Buffer.from(JSON.stringify(receipt));
  const requestFd = openSync(outputPath, "wx", 0o600);
  try { writeFileSync(requestFd, requestBytes); } finally { closeSync(requestFd); }
  requestWritten = true;
  const receiptFd = openSync(receiptPath, "wx", 0o600);
  try { writeFileSync(receiptFd, receiptBytes); } finally { closeSync(receiptFd); }
  chmodSync(outputPath, 0o600);
  chmodSync(receiptPath, 0o600);
  process.stdout.write(JSON.stringify({ result: "ready", stage: "private_output", requestFile: basename(outputPath), receiptFile: basename(receiptPath), baselineRecordCount: input.records.length, materializedRecordCount: snapshot.records.length, changedMutationCount: request.mutations.length, batches: batches.length, requestMode: lstatSync(outputPath).mode & 0o777, receiptMode: lstatSync(receiptPath).mode & 0o777 }) + "\n");
} catch (error) {
  const allowedCodes = new Set([
    "input_file_invalid", "input_permissions_invalid", "input_schema_invalid", "input_snapshot_incomplete", "remote_recovery_incident_unexpected", "coding_pair_missing", "coding_pair_not_v2", "coding_pair_revision_mismatch", "current_plan_has_no_slot", "active_session_unexpected", "pending_journal_unexpected", "account_installation_missing", "account_installation_not_bound", "account_installation_account_mismatch", "committed_pair_envelopes_missing", "committed_goal_envelope_revision_mismatch", "committed_plan_envelope_revision_mismatch", "outbox_account_mismatch", "outbox_revision_mismatch", "sync_plan_revision_mismatch", "unexpected_outbox_scope", "coding_pair_not_atomic_outbox", "baseline_remote_record_missing", "expected_remote_version_mismatch", "sync_plan_missing", "goal_plan_split_across_batches", "unexpected_batch_size", "output_already_exists", "receipt_already_exists",
  ]);
  const message = error instanceof Error ? error.message : "unknown_failure";
  const code = allowedCodes.has(message) ? message : "canonical_operation_failed";
  const allowedErrorTypes = new Set(["AssertionError", "Error", "InvalidLearningPlanError", "AccountDataFailure", "MutationCommitFailure", "ProfileStorageError"]);
  const ownerErrorType = error instanceof Error && allowedErrorTypes.has(error.name) ? error.name : undefined;
  emitFailure(code, ownerErrorType);
  process.exitCode = 1;
} finally {
  if (requestWritten && !existsSync(receiptPath)) {
    try { unlinkSync(outputPath); } catch { /* cleanup only this run's unpaired request */ }
  }
  if ((active || preparationFactorySet) && resetTestStorageHooks) {
    try { resetTestStorageHooks(); } catch { /* safe cleanup best effort */ }
  }
}
