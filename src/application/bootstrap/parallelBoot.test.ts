import assert from "node:assert/strict";
import test from "node:test";

import { accountSessionFailureState, classifyAccountFailure, createAccountSessionCoordinator, isAuthoritativeIdentityProofDenial, isTransientStartupSyncFailure, runAccountIdentityProof, type AccountState } from "../account/AccountSessionProvider";
import { MemoryKeyValueStorage, activatePreparedProfile, captureActiveProfileStorageLease, closeActiveProfileStorage, getActiveStorageProfileOrNull, installKeyValueStorageForTests, prepareProfileStorage, setProfileStoragePreparationFactoryForTests, writeActiveAccountIdentityBinding } from "../../infrastructure/storage/mmkvClient";
import { openProfileStorageRouter, type StorageProfile } from "../../infrastructure/storage/profileStorageRouter";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import type { FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { createProfilePreparationHandoffOwner } from "../account/profilePreparationHandoff";
import { bindGuestInstallationToAccount, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { loadAccountDataSession, type AccountDataSession } from "../account/accountDataService";
import { getAccountSyncState, markAccountRemoteApplyPending, saveAccountSyncState } from "../../storage/repositories/accountDataRepository";
import { beginAccountSignOut } from "../../storage/repositories/accountLifecycleRepository";
import { productionLearningDataAdmissionContext } from "../tracks/trackAdmissionContext";
import { completeAccountBootstrap, prepareAuthenticatedAccountBootstrap, type AccountBootstrapCompletionPorts, type AccountBootstrapPreparationPorts, type ProfilePreparationAttempt } from "./accountBootstrap";
import {
  armStartupFirstFrameFallback,
  createStartupRevalidation,
  hasStartupFirstUsableFrame,
  markStartupRevalidationPending,
  notifyStartupFirstUsableFrame,
  readStartupRevalidationPending,
  resetParallelBootForTests,
  settleStartupRevalidation,
  startBundledContentPrefetch,
  whenStartupBackgroundWorkAllowed,
  whenStartupFirstUsableFrame,
  type StartupBackgroundTimers,
  type StartupRevalidationOwner,
} from "./parallelBoot";

test.afterEach(() => {
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  resetParallelBootForTests();
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const tick = () => new Promise<void>((resolve) => { setTimeout(resolve, 0); });

// ---------------------------------------------------------------------------
// Process-wide startup signals
// ---------------------------------------------------------------------------

test("deferred work waits for the first usable frame, then one macrotask; no timer runs before the gate settles", async () => {
  const wait = whenStartupFirstUsableFrame();
  let resolved = false;
  void wait.promise.then(() => { resolved = true; });
  await new Promise<void>((resolve) => { setTimeout(resolve, 20); });
  assert.equal(resolved, false, "nothing but a reported frame (or the post-gate fallback) releases deferred start work");
  notifyStartupFirstUsableFrame();
  assert.equal(resolved, false, "the frame commit is not shared with the deferred work");
  await tick();
  await tick();
  assert.equal(resolved, true);
  assert.equal(hasStartupFirstUsableFrame(), true);
  const late = whenStartupFirstUsableFrame();
  await late.promise;
});

test("the post-gate fallback reports the first frame when no screen does", async () => {
  armStartupFirstFrameFallback(5);
  const wait = whenStartupFirstUsableFrame();
  await wait.promise;
  assert.equal(hasStartupFirstUsableFrame(), true);
});

function backgroundTimers(): StartupBackgroundTimers & { idleCalls: number } {
  const timers = {
    idleCalls: 0,
    set: (task: () => void, ms: number): unknown => setTimeout(task, ms),
    clear: (handle: unknown): void => { clearTimeout(handle as ReturnType<typeof setTimeout>); },
    idle: (task: () => void): unknown => { timers.idleCalls += 1; return setTimeout(task, 0); },
    cancelIdle: (handle: unknown): void => { clearTimeout(handle as ReturnType<typeof setTimeout>); },
  };
  return timers;
}

test("Home-after-FUF: background start work waits for the first frame and the startup revalidation, then idle", async () => {
  const owner = { uid: "u1", accountId: "a1" };
  markStartupRevalidationPending(owner);
  const timers = backgroundTimers();
  const wait = whenStartupBackgroundWorkAllowed(timers);
  let resolved = false;
  void wait.promise.then(() => { resolved = true; });
  notifyStartupFirstUsableFrame();
  for (let index = 0; index < 5; index += 1) await tick();
  assert.equal(resolved, false, "the stale Today recompute must not overlap the startup sync handling");
  settleStartupRevalidation(owner);
  assert.equal(resolved, false, "the sync result commits first (one macrotask)");
  for (let index = 0; index < 4; index += 1) await tick();
  assert.equal(resolved, true);
  assert.equal(timers.idleCalls, 1, "the work runs when the JS thread is idle");
});

test("Home-after-FUF: without a pending revalidation, the work runs after the first frame; a hanging one is capped", async () => {
  const timers = backgroundTimers();
  notifyStartupFirstUsableFrame();
  await whenStartupBackgroundWorkAllowed(timers).promise;
  markStartupRevalidationPending({ uid: "u1", accountId: "a1" });
  await whenStartupBackgroundWorkAllowed(timers, 10).promise;
  assert.equal(readStartupRevalidationPending() !== null, true, "the cap releases the work, not the revalidation");
});

test("Home-after-FUF: a cancelled wait never runs the work", async () => {
  const owner = { uid: "u1", accountId: "a1" };
  markStartupRevalidationPending(owner);
  const wait = whenStartupBackgroundWorkAllowed(backgroundTimers());
  let resolved = false;
  void wait.promise.then(() => { resolved = true; });
  notifyStartupFirstUsableFrame();
  await tick();
  wait.cancel();
  settleStartupRevalidation(owner);
  for (let index = 0; index < 4; index += 1) await tick();
  assert.equal(resolved, false);
});

test("content prefetch runs once; a failed verification is not cached as success", async () => {
  let calls = 0;
  const first = startBundledContentPrefetch(async () => { calls += 1; throw new Error("catalog failed"); });
  const second = startBundledContentPrefetch(async () => { calls += 1; });
  assert.equal(first, second, "callers join one prefetch");
  await first;
  assert.equal(calls, 1, "the prefetch swallows the failure; the gate repeats the verification and reports it");
});

test("content verification starts with the content gate, not at root mount (K)", async () => {
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const root = readFileSync(join(__dirname, "..", "..", "RegularApplicationRoot.tsx"), "utf8");
  const appContent = root.slice(root.indexOf("function AppContent()"), root.indexOf("function AppNavigation()"));
  assert.match(appContent, /if \(needsContent\) void startBundledContentPrefetch\(\(\) => contentPackageRuntimeOwner\.verifyBundledPackages\(\)\);/u);
  assert.equal(root.match(/startBundledContentPrefetch\(/gu)?.length, 1, "no earlier root-mount prefetch");
});

// ---------------------------------------------------------------------------
// Deferred startup revalidation (provider orchestration)
// ---------------------------------------------------------------------------

function revalidationHarness(initialActor: StartupRevalidationOwner | null) {
  let actor = initialActor;
  const frame = deferred<void>();
  const calls: string[] = [];
  const active: (StartupRevalidationOwner | null)[] = [];
  let refreshResult = deferred<string>();
  const run = createStartupRevalidation<string>({
    readOwner: readStartupRevalidationPending,
    readLocalActor: () => actor,
    waitForFirstFrame: () => frame.promise,
    refreshNow: () => { calls.push(`refresh:${actor?.accountId ?? "none"}`); return refreshResult.promise; },
    superseded: () => "superseded",
    onActive: (owner) => { active.push(owner); },
    settle: settleStartupRevalidation,
  });
  return {
    run, calls, active, frame,
    setActor: (next: StartupRevalidationOwner | null) => { actor = next; },
    nextRefresh: () => { refreshResult = deferred<string>(); return refreshResult; },
    get refresh() { return refreshResult; },
  };
}

test("startup revalidation: one deferred refresh after the frame; concurrent callers join it", async () => {
  const owner = { uid: "uid-a", accountId: "acc-a" };
  markStartupRevalidationPending(owner);
  const harness = revalidationHarness(owner);
  const first = harness.run();
  const joined = harness.run();
  assert.equal(first, joined, "the sidecar's initial refresh joins the provider's deferred attempt");
  await tick();
  assert.deepEqual(harness.calls, [], "no /me or sync before the first usable frame");
  harness.frame.resolve();
  await tick();
  assert.deepEqual(harness.calls, ["refresh:acc-a"]);
  assert.deepEqual(harness.active, [owner], "the freshness indicator is armed for the running revalidation");
  harness.refresh.resolve("authenticated");
  assert.equal(await first, "authenticated");
  assert.deepEqual(harness.active, [owner, null], "the indicator is cleared when the revalidation ends");
  assert.equal(readStartupRevalidationPending(), null, "the pending owner is settled");
  harness.nextRefresh().resolve("direct");
  assert.equal(await harness.run(), "direct", "later refreshes (reconnect) are not deferred");
});

test("account change while the refresh waits: the old actor's revalidation never runs", async () => {
  const owner = { uid: "uid-a", accountId: "acc-a" };
  markStartupRevalidationPending(owner);
  const harness = revalidationHarness(owner);
  const pending = harness.run();
  harness.setActor({ uid: "uid-b", accountId: "acc-b" });
  harness.frame.resolve();
  assert.equal(await pending, "superseded");
  assert.deepEqual(harness.calls, [], "no identity proof or sync is started for the replaced account");
  assert.equal(readStartupRevalidationPending(), null);
});

test("sign-out in the background before the frame: no revalidation, no sync, owner settled", async () => {
  const owner = { uid: "uid-a", accountId: "acc-a" };
  markStartupRevalidationPending(owner);
  const harness = revalidationHarness(owner);
  const pending = harness.run();
  harness.setActor(null); // signingOut / signedOut is no longer the local actor
  harness.frame.resolve();
  assert.equal(await pending, "superseded");
  assert.deepEqual(harness.calls, []);
  assert.deepEqual(harness.active, [], "the indicator never appears for a signed-out actor");
});

test("no network: a failed revalidation still settles and clears the indicator", async () => {
  const owner = { uid: "uid-a", accountId: "acc-a" };
  markStartupRevalidationPending(owner);
  let actor: StartupRevalidationOwner | null = owner;
  const active: (StartupRevalidationOwner | null)[] = [];
  const run = createStartupRevalidation<string>({
    readOwner: readStartupRevalidationPending,
    readLocalActor: () => actor,
    waitForFirstFrame: async () => undefined,
    refreshNow: async () => { throw new Error("transport_failed"); },
    superseded: () => "superseded",
    onActive: (next) => { active.push(next); },
    settle: settleStartupRevalidation,
  });
  await assert.rejects(run(), /transport_failed/);
  assert.deepEqual(active, [owner, null]);
  assert.equal(readStartupRevalidationPending(), null);
  actor = null;
});

test("transient startup sync failures keep the local session; conflicts, guards and denials surface", () => {
  const base: AccountDataSession = { status: "offlinePending", preview: null, lastSuccessfulSyncAt: null, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: "offline", activeSessionBlocked: false, guestAdoptionChoice: "transfer" };
  assert.equal(isTransientStartupSyncFailure(base), true, "offline");
  assert.equal(isTransientStartupSyncFailure({ ...base, status: "failed", lastFailureCode: "remoteFailure" }), true, "server failure");
  assert.equal(isTransientStartupSyncFailure({ ...base, lastFailureCode: "local_dataset_changed_during_sync" }), true, "a local commit during the background sync");
  assert.equal(isTransientStartupSyncFailure({ ...base, status: "conflict", lastFailureCode: "account_revision_conflict", blockingConflictCode: "account_revision_conflict" }), false, "conflict");
  assert.equal(isTransientStartupSyncFailure({ ...base, status: "failed", lastFailureCode: "account_revision_conflict" }), false, "confirmed conflict code");
  assert.equal(isTransientStartupSyncFailure({ ...base, status: "failed", lastFailureCode: "identity_denial:401:account_deleted" }), false, "identity denial");
  assert.equal(isTransientStartupSyncFailure({ ...base, status: "failed", lastFailureCode: null, blockingConflictCode: "journal_recovery_required" }), false, "guard");
  assert.equal(isTransientStartupSyncFailure({ ...base, status: "resumeRequired", lastFailureCode: null }), false, "resume required");
  assert.equal(isTransientStartupSyncFailure({ ...base, status: "synced", lastFailureCode: null }), false, "synced");
});

// ---------------------------------------------------------------------------
// Local-first account start (accountBootstrap, real profile storage)
// ---------------------------------------------------------------------------

const USER = { uid: "local-first-uid", email: "local-first@example.test", emailVerified: true, providers: ["password"] } as const satisfies FirebaseAuthUserSnapshot;
const ACCOUNT_ID = "66666666-6666-4666-8666-666666666666";

async function createBoundAccountFixture(input: Readonly<{ accountId?: string; uid?: string; sync?: boolean }> = {}) {
  const accountId = input.accountId ?? ACCOUNT_ID;
  const base = new MemoryKeyValueStorage();
  const controlValues = new Map<string, string>();
  const control: StorageManifestStore = {
    async get(key) { return controlValues.get(key) ?? null; },
    async set(key, value) { controlValues.set(key, value); },
    async remove(key) { controlValues.delete(key); },
  };
  let nextIdentity = 10;
  const uuid = () => `00000000-0000-4000-8000-${String(nextIdentity++).padStart(12, "0")}`;
  let router = await openProfileStorageRouter(base, control, { identity: { async create() { return { installationId: uuid(), localDatasetId: uuid() }; } } });
  const selected = await router.selectAccount(accountId);
  router = await openProfileStorageRouter(base, control);
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  await prepareProfileStorage();
  activatePreparedProfile(selected.id, selected.kind);
  const lease = captureActiveProfileStorageLease();
  assert.ok(lease);
  await writeActiveAccountIdentityBinding({ lease, accountId, firebaseUid: input.uid ?? USER.uid, canContinue: () => true });
  await provisionGuestInstallation();
  await bindGuestInstallationToAccount(accountId);
  if (input.sync !== false) await loadAccountDataSession(steadyApi(), accountId);
  closeActiveProfileStorage();
  return { selected, accountId };
}

function steadyApi(counters: { getMe: number; getProgress: number } = { getMe: 0, getProgress: 0 }): PatternlyApiClient {
  return {
    getMe: async () => { counters.getMe += 1; return { user: { id: ACCOUNT_ID, email: USER.email, emailVerified: true, providers: ["password"], identity: { subject: USER.uid } } }; },
    exchangeAccountSession: async () => { throw new Error("no exchange for an existing auth generation"); },
    getProgress: async () => { counters.getProgress += 1; return { accountRevision: 0, records: [] }; },
    syncProgress: async () => ({ accountRevision: 0, applied: [], duplicates: [], conflicts: [] }),
  } as unknown as PatternlyApiClient;
}

function preparationPorts(selectedProfile: StorageProfile, user: FirebaseAuthUserSnapshot = USER) {
  const profilePreparationRef: { current: ProfilePreparationAttempt | null } = { current: null };
  const profilePreparationHandoffRef = { current: createProfilePreparationHandoffOwner<void>() };
  const coordinator = createAccountSessionCoordinator<void>(() => undefined);
  const generation = coordinator.begin(user.uid);
  const states: AccountState[] = [{ kind: "loading" }];
  const stateRef = { get current() { return states.at(-1)!; }, set current(value: AccountState) { states.push(value); } };
  let snapshotUid: string | null = user.uid;
  const auth = {
    getSnapshot: () => (snapshotUid === null ? null : { ...user, uid: snapshotUid }),
    getAuthorizationGeneration: async () => 7,
    signInWithSessionToken: async () => user,
  };
  const ports = {
    profilePreparationRef, profilePreparationHandoffRef, sessionCoordinator: coordinator, stateRef,
    setState: (next: AccountState) => { states.push(next); },
    logoutControlSnapshotRef: { current: { blocked: null, completed: [], pending: [], version: 2 } },
    sessionExchangeUidRef: { current: null },
    classifyAccountFailure, accountSessionFailureState,
    preparedProfileState: { selectedProfile },
    observerBlockedUidRef: { current: null },
    setAccountEntryMode: () => undefined,
    beginIdentityProofBarrier: async () => null,
    resolveIdentityProofBarrier: async () => { throw new Error("unexpected identity barrier"); },
    logoutControl: { blockAndQueueRevoke: async () => ({ blocked: null, completed: [], pending: [], version: 2 }) },
    setLogoutControlSnapshot: () => undefined,
    legalAcceptancePendingRef: { current: false },
    runAccountIdentityProof, isAuthoritativeIdentityProofDenial,
    isLocalAccountStartupUnavailable: () => false,
    revokeBindingForAuthoritativeIdentityDenial: async () => false,
  } as unknown as AccountBootstrapPreparationPorts;
  return { ports, auth, states, generation, coordinator, setSnapshotUid: (uid: string | null) => { snapshotUid = uid; } };
}

function completionPorts(prep: ReturnType<typeof preparationPorts>, api: PatternlyApiClient, finalizeCalls: unknown[] = []): AccountBootstrapCompletionPorts {
  return {
    ...prep.ports,
    authClient: prep.auth,
    apiClient: api,
    runtimeMode: undefined,
    planPasswordVerificationCommand: () => ({ kind: "finalize" }),
    disableAccountRemindersForDeletion: async () => true,
    finalizeCurrent: async (...args: unknown[]) => { finalizeCalls.push(args); return { kind: "failure", failure: "providerUnavailable" } as const; },
  } as unknown as AccountBootstrapCompletionPorts;
}

test("a steady bound account starts from its local copy: no /me, no sync before Today, revalidation is pending", async () => {
  const fixture = await createBoundAccountFixture();
  const counters = { getMe: 0, getProgress: 0 };
  const api = steadyApi(counters);
  const prep = preparationPorts(fixture.selected);
  const attempt = await prepareAuthenticatedAccountBootstrap(prep.ports, prep.auth as never, api, USER, prep.generation);
  assert.ok(attempt);
  assert.equal(attempt.kind, "localOffline");
  assert.equal(attempt.handoffReady, true);
  assert.equal(prep.states.at(-1)?.kind, "profilePreparing");
  assert.equal(getActiveStorageProfileOrNull()?.accountId, fixture.accountId);
  const pending = readStartupRevalidationPending();
  assert.equal(pending?.uid, USER.uid);
  assert.equal(pending?.accountId, fixture.accountId);
  assert.equal(pending?.handoff, attempt.handoffToken, "bound to this preparation only, so a later online preparation never inherits it");

  const finalizeCalls: unknown[] = [];
  await completeAccountBootstrap(completionPorts(prep, api, finalizeCalls), attempt.handoffToken);
  assert.equal(prep.states.at(-1)?.kind, "localOffline", "Today renders from the local session");
  assert.deepEqual(await attempt.completion, { kind: "success", next: "localOffline" });
  assert.deepEqual(counters, { getMe: 0, getProgress: 0 }, "the identity proof and the sync are deferred past the first frame");
  assert.equal(finalizeCalls.length, 0);
});

test("conflict, interrupted apply and pending sign-out keep the online start", async () => {
  // Confirmed sync conflict: the conflict screen comes first, as before.
  {
    const fixture = await createBoundAccountFixture();
    await prepareProfileStorage();
    activatePreparedProfile(fixture.selected.id, fixture.selected.kind);
    const state = await getAccountSyncState(productionLearningDataAdmissionContext);
    saveAccountSyncState({ ...state, status: "conflict", blockingConflictCode: "account_revision_conflict", lastFailureCode: "account_revision_conflict" }, productionLearningDataAdmissionContext);
    closeActiveProfileStorage();
    const counters = { getMe: 0, getProgress: 0 };
    const prep = preparationPorts(fixture.selected);
    const attempt = await prepareAuthenticatedAccountBootstrap(prep.ports, prep.auth as never, steadyApi(counters), USER, prep.generation);
    assert.equal(attempt?.kind, "authenticated", "conflict: online start");
    assert.equal(counters.getMe, 1);
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
  }
  // A background sync killed inside the apply leaves the T2.0 remote-apply marker:
  // the next start takes the online path, whose recovery re-pulls the account copy.
  {
    const fixture = await createBoundAccountFixture();
    await prepareProfileStorage();
    activatePreparedProfile(fixture.selected.id, fixture.selected.kind);
    await markAccountRemoteApplyPending(fixture.accountId, productionLearningDataAdmissionContext);
    closeActiveProfileStorage();
    const counters = { getMe: 0, getProgress: 0 };
    const prep = preparationPorts(fixture.selected);
    const attempt = await prepareAuthenticatedAccountBootstrap(prep.ports, prep.auth as never, steadyApi(counters), USER, prep.generation);
    assert.equal(attempt?.kind, "authenticated", "interrupted apply: online start and T2.0 recovery");
    assert.equal(counters.getMe, 1);
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
  }
  // A scoped sign-out marker from a background sign-out never reopens the local copy.
  {
    const fixture = await createBoundAccountFixture();
    await prepareProfileStorage();
    activatePreparedProfile(fixture.selected.id, fixture.selected.kind);
    beginAccountSignOut(fixture.accountId);
    closeActiveProfileStorage();
    const prep = preparationPorts(fixture.selected);
    const attempt = await prepareAuthenticatedAccountBootstrap(prep.ports, prep.auth as never, steadyApi(), USER, prep.generation);
    assert.notEqual(attempt?.kind, "localOffline", "pending sign-out: no local session");
    assert.notEqual(prep.states.at(-1)?.kind, "localOffline");
  }
});

test("no data outside the lease: another Firebase user, a superseded generation or a closed lease never publish the local copy", async () => {
  // The binding belongs to a different Firebase user.
  {
    const fixture = await createBoundAccountFixture({ uid: "someone-else" });
    const prep = preparationPorts(fixture.selected);
    const attempt = await prepareAuthenticatedAccountBootstrap(prep.ports, prep.auth as never, steadyApi(), USER, prep.generation);
    assert.notEqual(attempt?.kind, "localOffline");
    assert.equal(readStartupRevalidationPending(), null);
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
  }
  // Account change: the generation is superseded before completion.
  {
    const fixture = await createBoundAccountFixture();
    const prep = preparationPorts(fixture.selected);
    const attempt = await prepareAuthenticatedAccountBootstrap(prep.ports, prep.auth as never, steadyApi(), USER, prep.generation);
    assert.equal(attempt?.kind, "localOffline");
    prep.coordinator.invalidate();
    await completeAccountBootstrap(completionPorts(prep, steadyApi()), attempt!.handoffToken);
    assert.notEqual(prep.states.at(-1)?.kind, "localOffline", "a superseded generation cannot publish the local actor");
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
  }
  // The Firebase user signs out in the background between preparation and completion.
  {
    const fixture = await createBoundAccountFixture();
    const prep = preparationPorts(fixture.selected);
    const attempt = await prepareAuthenticatedAccountBootstrap(prep.ports, prep.auth as never, steadyApi(), USER, prep.generation);
    assert.equal(attempt?.kind, "localOffline");
    prep.setSnapshotUid(null);
    await completeAccountBootstrap(completionPorts(prep, steadyApi()), attempt!.handoffToken);
    assert.notEqual(prep.states.at(-1)?.kind, "localOffline", "a signed-out SDK cannot publish the local actor");
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
  }
  // The profile lease is replaced before completion.
  {
    const fixture = await createBoundAccountFixture();
    const prep = preparationPorts(fixture.selected);
    const attempt = await prepareAuthenticatedAccountBootstrap(prep.ports, prep.auth as never, steadyApi(), USER, prep.generation);
    assert.equal(attempt?.kind, "localOffline");
    closeActiveProfileStorage();
    await completeAccountBootstrap(completionPorts(prep, steadyApi()), attempt!.handoffToken);
    assert.notEqual(prep.states.at(-1)?.kind, "localOffline", "a stale lease cannot publish the local actor");
  }
});

test("a first sign-in on this device (no local binding) keeps the online start", async () => {
  const fixture = await createBoundAccountFixture({ sync: false });
  await prepareProfileStorage();
  activatePreparedProfile(fixture.selected.id, fixture.selected.kind);
  const state = await getAccountSyncState(productionLearningDataAdmissionContext);
  assert.notEqual(state.status, "synced");
  closeActiveProfileStorage();
  const counters = { getMe: 0, getProgress: 0 };
  const prep = preparationPorts(fixture.selected);
  const attempt = await prepareAuthenticatedAccountBootstrap(prep.ports, prep.auth as never, steadyApi(counters), USER, prep.generation);
  assert.equal(attempt?.kind, "authenticated");
  assert.equal(counters.getMe, 1);
});
