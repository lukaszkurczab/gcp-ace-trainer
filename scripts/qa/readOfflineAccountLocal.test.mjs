import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import vm from "node:vm";
import { buildOfflineAccountReadExpression } from "./readOfflineAccountIos.mjs";
import { selectTarget } from "./readNativeStartupTrace.mjs";

const fingerprint = "a".repeat(64);
const appId = "com.lkurczab.patternly.local";
const accountId = "12345678-1234-4234-8234-123456789012";

function fixture({ androidPackage = appId, apiOrigin = "http://127.0.0.1:8080", authOrigin = "http://127.0.0.1:19099", firebaseProjectId = "patternly-app-sandbox",
  actorKind = "authenticated", actorFenceCurrent = true, profileKind = actorKind === "guest" ? "guest" : "account", profileId = actorKind === "guest" ? "guest-profile" : "local-profile",
  selectedProfileId = profileId, duplicateGuest = false, guestMarker, journalPending = false, changeActorDuringInventory = false, changeProfileDuringSessions = false } = {}) {
  let activeProfile = { kind: profileKind, id: profileId, accountId: profileKind === "account" ? accountId : null };
  let inventoryCalls = 0;
  let accountSyncReads = 0;
  const guestInstallation = guestMarker ?? { installationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", localDatasetId: "guest-profile", bindingState: "guest", accountId: null };
  const profiles = () => [
    { kind: activeProfile.kind, id: activeProfile.id, accountId: activeProfile.accountId },
    ...(selectedProfileId !== profileId ? [{ kind: "guest", id: selectedProfileId, accountId: null }] : []),
    ...(duplicateGuest ? [{ kind: "guest", id: "another-guest", accountId: null }] : []),
  ];
  const currentPreparedState = () => {
    const currentProfiles = profiles();
    const selected = currentProfiles.find(profile => profile.id === selectedProfileId) ?? currentProfiles[0];
    return { profiles: currentProfiles, selectedProfile: selected, isFreshInstallation: false };
  };
  const actor = {
    state: actorKind === "guest" ? { kind: "guest", generation: { generation: 1 } }
      : { kind: actorKind, user: { uid: "local-user" }, backendUser: { id: accountId }, generation: { generation: 1 } },
    captureHomeResumeActorFence: () => actorKind === "guest" || !actorFenceCurrent ? null : ({ isCurrent: () => true }),
    retryPendingAccountSync: () => {},
  };
  const modules = new Map();
  const add = (path, exports) => modules.set(modules.size, { isInitialized: true, verboseName: path, exports });
  add("src/infrastructure/runtime/environmentIdentity.ts", { readEnvironmentIdentity: () => ({ mode: "smoke", fingerprint, apiOrigin, firebaseProjectId }) });
  add("node_modules/expo-constants/build/Constants.js", { default: { expoConfig: { extra: { patternlyEnvironmentFingerprint: fingerprint }, android: { package: androidPackage } } } });
  add("src/infrastructure/firebase/publicConfig.ts", { readDevelopmentFirebaseAuthEmulatorOrigin: () => authOrigin });
  add("src/infrastructure/identity/sha256.ts", { sha256Utf8: value => createHash("sha256").update(value).digest("hex") });
  add("src/infrastructure/storage/mmkvClient.ts", {
    captureActiveProfileStorageLease: () => ({ profile: { ...activeProfile }, generation: 7 }),
    isActiveProfileStorageLeaseCurrent: lease => lease.generation === 7 && lease.profile.id === activeProfile.id && lease.profile.kind === activeProfile.kind && lease.profile.accountId === activeProfile.accountId,
    getActiveStorageProfileOrNull: () => ({ ...activeProfile }),
    isProfileTransitionActive: () => false,
    inspectPreparedProfileState: async () => currentPreparedState(),
    inspectPreparedQ13StorageInventory: async () => {
      inventoryCalls++;
      if (changeActorDuringInventory && inventoryCalls === 1) actor.state = { kind: "localOffline", generation: { generation: 1 } };
      return { kind: "observed", complete: true, physicalInventorySha256: "b".repeat(64), packagePointerSources: [] };
    },
  });
  add("src/application/tracks/trackAdmissionContext.ts", { productionLearningDataAdmissionContext: {}, productionTrackAdmissionContext: {} });
  add("src/storage/repositories/accountDataRepository.ts", { getAccountSyncState: async () => { accountSyncReads++; return { accountId, status: "offlinePending", lastFailureCode: null, pendingMutationCount: 0,
    remoteAccountRevision: 4, outbox: [], acknowledged: {} }; } });
  add("src/storage/repositories/guestInstallationRepository.ts", { readGuestInstallation: () => guestInstallation });
  add("src/storage/repositories/mutationJournalRepository.ts", { getActiveMutationJournal: () => journalPending ? { status: "pending" } : null });
  add("src/storage/repositories/trainingSessionRepository.ts", { getTrainingSessions: async () => {
    if (changeProfileDuringSessions) activeProfile = { kind: "guest", id: "foreign-guest", accountId: null };
    return { ok: true, issues: [], value: [] };
  } });
  add("src/storage/repositories/trainingAttemptRepository.ts", { getTrainingAttempts: async () => ({ ok: true, issues: [], value: [] }) });
  const require = id => modules.get(id).exports;
  require.getModules = () => modules;
  const root = { current: { child: { memoizedProps: { value: actor }, child: null, sibling: null } } };
  const context = { HermesInternal: {}, __DEV__: true, __REACT_DEVTOOLS_GLOBAL_HOOK__: { renderers: new Map([[1, {}]]), getFiberRoots: () => new Set([root]) }, __r: require };
  context.globalThis = context;
  return { context, get accountSyncReads() { return accountSyncReads; } };
}

test("Android local passive reader accepts exact local manifest identity and loopback smoke authorities", async () => {
  const f = fixture();
  const result = await vm.runInNewContext(buildOfflineAccountReadExpression(fingerprint, appId), f.context);
  assert.equal(result.schema, "patternly.offline-account-ios-read.v1");
  assert.equal(result.appId, appId);
  assert.equal(result.state, "authenticated");
  assert.equal(result.accountIdSha256, createHash("sha256").update(accountId).digest("hex"));
  assert.equal(result.sync.pendingMutationCount, 0);
  assert.equal(result.sync.remoteAccountRevision, 4);
  assert.equal(f.accountSyncReads, 2);
});

test("Android guest reader accepts a null actor fence with a proven unbound guest lease and never reads account sync", async () => {
  const f = fixture({ actorKind: "guest" });
  const result = await vm.runInNewContext(buildOfflineAccountReadExpression(fingerprint, appId), f.context);
  assert.equal(result.state, "guest");
  assert.equal(result.accountIdSha256, null);
  assert.equal(result.profile.kind, "guest");
  assert.deepEqual(JSON.parse(JSON.stringify(result.sync)), { kind: "not_applicable", reason: "active_profile_is_guest" });
  assert.deepEqual(JSON.parse(JSON.stringify(result.learning)), { sessions: [], attempts: [] });
  assert.equal(f.accountSyncReads, 0);
  assert.doesNotMatch(JSON.stringify(result), /guest-profile|installationId|localDatasetId/u);
});

test("Android guest reader rejects account lease, foreign selection, duplicate guest and invalid guest binding", async () => {
  for (const options of [
    { actorKind: "guest", profileKind: "account" },
    { actorKind: "guest", selectedProfileId: "other-guest" },
    { actorKind: "guest", duplicateGuest: true },
    { actorKind: "guest", guestMarker: { installationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", localDatasetId: "foreign-guest", bindingState: "guest", accountId: null } },
    { actorKind: "guest", guestMarker: { installationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", localDatasetId: "guest-profile", bindingState: "account_bound", accountId } },
  ]) {
    const f = fixture(options);
    await assert.rejects(vm.runInNewContext(buildOfflineAccountReadExpression(fingerprint, appId), f.context));
    assert.equal(f.accountSyncReads, 0);
  }
});

test("Android guest reader refuses an active mutation journal without account reads", async () => {
  const f = fixture({ actorKind: "guest", journalPending: true });
  await assert.rejects(vm.runInNewContext(buildOfflineAccountReadExpression(fingerprint, appId), f.context), /source_pending/u);
  assert.equal(f.accountSyncReads, 0);
});

test("Android local reader rejects authenticated or localOffline actors with a null fence", async () => {
  for (const actorKind of ["authenticated", "localOffline"]) {
    const f = fixture({ actorKind, actorFenceCurrent: false });
    await assert.rejects(vm.runInNewContext(buildOfflineAccountReadExpression(fingerprint, appId), f.context), /actor_unavailable/u);
    assert.equal(f.accountSyncReads, 0);
  }
});

test("Android guest reader rejects actor or lease changes across asynchronous reads", async () => {
  const actorChange = fixture({ actorKind: "guest", changeActorDuringInventory: true });
  await assert.rejects(vm.runInNewContext(buildOfflineAccountReadExpression(fingerprint, appId), actorChange.context), /source_changed/u);
  assert.equal(actorChange.accountSyncReads, 0);
  const leaseChange = fixture({ actorKind: "guest", changeProfileDuringSessions: true });
  await assert.rejects(vm.runInNewContext(buildOfflineAccountReadExpression(fingerprint, appId), leaseChange.context), /source_changed/u);
  assert.equal(leaseChange.accountSyncReads, 0);
});

test("Android local passive reader rejects wrong package, API, Auth emulator or project before reading account state", async () => {
  for (const options of [
    { androidPackage: "com.lkurczab.patternly" },
    { apiOrigin: "https://api.example.invalid" },
    { authOrigin: "http://127.0.0.1:9099" },
    { firebaseProjectId: "patternly-production" },
  ]) {
    await assert.rejects(vm.runInNewContext(buildOfflineAccountReadExpression(fingerprint, appId), fixture(options)), /runtime_rejected/);
  }
});

test("Android local debugger target selection rejects foreign app identity and multiple targets", () => {
  const target = {
    type: "node", appId, deviceName: "2201117TY - 13 - API 33", id: "device-1-1",
    webSocketDebuggerUrl: "ws://127.0.0.1:8081/inspector/debug?device=device-1&page=1",
    reactNative: { logicalDeviceId: "device-1" },
  };
  const metro = new URL("http://127.0.0.1:8081");
  assert.match(selectTarget([target], metro, appId), /\/inspector\/debug/u);
  assert.throws(() => selectTarget([{ ...target, appId: "com.lkurczab.patternly" }], metro, appId), /target_rejected/u);
  assert.throws(() => selectTarget([target, { ...target, id: "device-2-page-2" }], metro, appId), /target_rejected/u);
});

test("existing iOS reader package remains supported and unknown app IDs remain closed", () => {
  assert.doesNotThrow(() => buildOfflineAccountReadExpression(fingerprint, "com.lkurczab.patternly.sec03"));
  assert.throws(() => buildOfflineAccountReadExpression(fingerprint, "com.lkurczab.patternly.other"), /arguments_rejected/u);
});
