import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import vm from "node:vm";
import { buildRetryLocalAccountSyncExpression } from "./retryLocalAccountSyncIos.mjs";

const fingerprint = "a".repeat(64);
const appId = "com.lkurczab.patternly";
const accountId = "12345678-1234-4234-8234-123456789012";
const uid = "private-user";
const expectedIdentity = {
  uidSha256: createHash("sha256").update(uid).digest("hex"),
  accountIdSha256: createHash("sha256").update(accountId).digest("hex"),
  profileIdSha256: createHash("sha256").update("profile-1").digest("hex"),
};

function fixture({ activeSession = null, profileId = "profile-1", backendAccountId = accountId, changeProfileAfterRetry = false, changeProfileDuringSessionRead = false, pendingMutationCount = 0, outbox = [], materialization = null, pendingConfirmation = null, resetGuard = null, journalPending = false, result = { kind: "success", next: "authenticated" } } = {}) {
  const calls = [];
  let profile = { kind: "account", id: profileId, accountId: backendAccountId };
  const actor = {
    state: { kind: "authenticated", user: { uid }, backendUser: { id: backendAccountId, identity: { subject: uid } }, accountData: {
      status: "offlinePending", preview: null, lastSuccessfulSyncAt: null, pendingMutationCount: 0,
      blockingConflictCode: null, lastFailureCode: null, activeSessionBlocked: false, guestAdoptionChoice: "discard",
    } },
    captureHomeResumeActorFence: () => ({ isCurrent: () => true }),
    retryAccountSync: async () => {
      calls.push("retryAccountSync");
      if (changeProfileAfterRetry) profile = { kind: "guest", id: "guest-profile", accountId: null };
      return result;
    },
  };
  const modules = new Map();
  const add = (path, exports) => modules.set(modules.size, { isInitialized: true, verboseName: path, exports });
  add("src/infrastructure/runtime/environmentIdentity.ts", { readEnvironmentIdentity: () => ({ mode: "smoke", fingerprint, apiOrigin: "http://127.0.0.1:8080", firebaseProjectId: "patternly-app-sandbox" }) });
  add("node_modules/expo-constants/build/Constants.js", { default: { expoConfig: { extra: { patternlyEnvironmentFingerprint: fingerprint }, ios: { bundleIdentifier: appId } } } });
  add("src/infrastructure/firebase/publicConfig.ts", { readDevelopmentFirebaseAuthEmulatorOrigin: () => "http://127.0.0.1:19099" });
  add("src/infrastructure/storage/mmkvClient.ts", {
    captureActiveProfileStorageLease: () => ({ profile: { ...profile }, generation: 7 }),
    isActiveProfileStorageLeaseCurrent: lease => lease.generation === 7 && lease.profile.id === profile.id && lease.profile.kind === profile.kind && lease.profile.accountId === profile.accountId,
    isProfileTransitionActive: () => false,
  });
  add("src/infrastructure/identity/sha256.ts", { sha256Utf8: value => createHash("sha256").update(value).digest("hex") });
  add("src/application/tracks/trackAdmissionContext.ts", { productionTrackAdmissionContext: {}, productionLearningDataAdmissionContext: {} });
  add("src/storage/repositories/trainingSessionRepository.ts", { getActiveTrainingSession: async () => {
    if (changeProfileDuringSessionRead) profile = { kind: "guest", id: "guest-profile", accountId: null };
    return activeSession;
  } });
  add("src/storage/repositories/mutationJournalRepository.ts", { hasPendingMutationJournal: () => journalPending });
  add("src/storage/repositories/accountDataRepository.ts", { getAccountSyncState: async () => ({
    accountId: backendAccountId, pendingMutationCount, outbox, materialization, pendingConfirmation, resetGuard, status: "offlinePending",
  }) });
  const require = id => modules.get(id).exports;
  require.getModules = () => modules;
  const root = { current: { child: { memoizedProps: { value: actor }, child: null, sibling: null } } };
  const context = {
    HermesInternal: {}, __DEV__: true, __REACT_DEVTOOLS_GLOBAL_HOOK__: { renderers: new Map([[1, {}]]), getFiberRoots: () => new Set([root]) },
    __r: require,
  };
  context.globalThis = context;
  return { context, calls };
}

const key = "__localAccountSync_" + "b".repeat(32);

test("runs exactly the authenticated actor retry after local smoke and empty-write preflight", async () => {
  const f = fixture();
  const expression = buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, expectedIdentity });
  const result = await vm.runInNewContext(expression, f.context);
  assert.deepEqual(f.calls, ["retryAccountSync"]);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { kind: "resolved", result: { kind: "success", next: "authenticated" } });
  assert.doesNotMatch(JSON.stringify(result), /private-user|12345678/);
});

test("an active session blocks before the account command", async () => {
  const f = fixture({ activeSession: { status: "active" } });
  await assert.rejects(vm.runInNewContext(buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, expectedIdentity }), f.context), /active_session_present/);
  assert.deepEqual(f.calls, []);
});

test("pending journal, outbox, materialization, and confirmation each block before retry", async () => {
  for (const options of [
    { journalPending: true },
    { pendingMutationCount: 1 },
    { outbox: [{ mutationId: "opaque" }] },
    { materialization: { kind: "pending" } },
    { pendingConfirmation: { operationId: "opaque" } },
  ]) {
    const f = fixture(options);
    await assert.rejects(vm.runInNewContext(buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, expectedIdentity }), f.context));
    assert.deepEqual(f.calls, []);
  }
});

test("a post-command profile transition leaves an unresolved marker", async () => {
  const f = fixture({ changeProfileAfterRetry: true });
  const result = await vm.runInNewContext(buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, expectedIdentity }), f.context);
  assert.deepEqual(f.calls, ["retryAccountSync"]);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { kind: "unresolved", category: "postcondition_unverified" });
  assert.doesNotMatch(JSON.stringify(result), /private-user|12345678/);
});

test("status observes the existing one-shot marker without invoking account actions", async () => {
  const f = fixture();
  f.context[key] = { kind: "resolved", result: { kind: "failure", failure: "offline" } };
  const result = await vm.runInNewContext(buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, operation: "status" }), f.context);
  assert.deepEqual(f.calls, []);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { kind: "resolved", result: { kind: "failure", failure: "offline" } });
});

test("the exact status expression sent to Runtime.evaluate is synchronous Hermes-compatible JavaScript", () => {
  const f = fixture();
  f.context[key] = { kind: "resolved", result: { kind: "success", next: "authenticated" } };
  const status = buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, operation: "status" });
  const transportExpression = `JSON.stringify(${status})`;
  assert.doesNotMatch(transportExpression, /\bawait\b/u);
  const raw = new vm.Script(transportExpression).runInNewContext(f.context);
  assert.deepEqual(JSON.parse(raw), { kind: "resolved", result: { kind: "success", next: "authenticated" } });
  assert.deepEqual(f.calls, []);
});

test("only the exact retry command is present in the generated action and input guards are closed", () => {
  const expression = buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, expectedIdentity });
  assert.equal(expression.match(/actor\.retryAccountSync\(\)/gu)?.length, 1);
  assert.doesNotMatch(expression, /\.signOut\(|\.continueAsGuest\(|\.discardGuestData\(|\.resolveAccountSyncConflict\(|fetch\s*\(/u);
  assert.throws(() => buildRetryLocalAccountSyncExpression({ fingerprint: "wrong", appId, key }), /arguments_rejected/);
  assert.throws(() => buildRetryLocalAccountSyncExpression({ fingerprint, appId: "com.lkurczab.patternly.local", key }), /arguments_rejected/);
  assert.throws(() => buildRetryLocalAccountSyncExpression({ fingerprint, appId, key: "__localAccountSync_bad" }), /arguments_rejected/);
});

test("a different pre-retry receipt identity blocks before the account command", async () => {
  const f = fixture();
  const wrongIdentity = { ...expectedIdentity, accountIdSha256: "0".repeat(64) };
  await assert.rejects(vm.runInNewContext(buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, expectedIdentity: wrongIdentity }), f.context), /before_receipt_mismatch/);
  assert.deepEqual(f.calls, []);
});

test("a foreign authenticated backend account is blocked using identity hashes and lease ownership", async () => {
  const f = fixture({ backendAccountId: "87654321-4321-4321-8321-210987654321" });
  await assert.rejects(vm.runInNewContext(buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, expectedIdentity }), f.context), /before_receipt_mismatch/);
  assert.deepEqual(f.calls, []);
});

test("a persisted account reset guard blocks retry and remains passively observable as a failure", async () => {
  const f = fixture({ resetGuard: { accountId, operationId: "opaque", createdAt: "2026-10-24T00:00:00.000Z", phase: "remoteRestorePending" } });
  await assert.rejects(vm.runInNewContext(buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, expectedIdentity }), f.context), /account_reset_pending/);
  assert.deepEqual(f.calls, []);
  f.context[key] = { kind: "blocked", category: "account_reset_pending" };
  const status = buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, operation: "status" });
  const observed = JSON.parse(new vm.Script(`JSON.stringify(${status})`).runInNewContext(f.context));
  assert.deepEqual(observed, { kind: "blocked", category: "account_reset_pending" });
  assert.deepEqual(f.calls, []);
});

test("profile ownership changing during an awaited preflight blocks before retry", async () => {
  const f = fixture({ changeProfileDuringSessionRead: true });
  await assert.rejects(vm.runInNewContext(buildRetryLocalAccountSyncExpression({ fingerprint, appId, key, expectedIdentity }), f.context), /ownership_changed_during_preflight/);
  assert.deepEqual(f.calls, []);
});
