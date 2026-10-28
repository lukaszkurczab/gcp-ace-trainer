import assert from "node:assert/strict";
import test from "node:test";

import { AccountSessionGenerationStaleError, accountSessionFailureState, classifyAccountFailure, createAccountSessionCoordinator, isAuthoritativeIdentityProofDenial, runAccountIdentityProof, type AccountCommandResult, type AccountSessionGenerationToken, type AccountState } from "../account/AccountSessionProvider";
import { MemoryKeyValueStorage, activatePreparedProfile, captureActiveProfileStorageLease, closeActiveProfileStorage, getActiveStorageProfileOrNull, installKeyValueStorageForTests, prepareProfileStorage, readActiveAccountIdentityBinding, setProfileStoragePreparationFactoryForTests, writeActiveAccountIdentityBinding } from "../../infrastructure/storage/mmkvClient";
import { openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";
import type { FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import { PatternlyApiClientError, type PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { accountFinalizationPolicies } from "../account/accountFinalization";
import { createProfilePreparationHandoffOwner } from "../account/profilePreparationHandoff";
import { createPendingSessionRevocationDrain } from "../account/pendingSessionRevocation";
import { bindGuestInstallationToAccount, markGuestInstallationAdoptionPending, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { grantGuestAccess } from "../../storage/repositories/guestAccessRepository";
import { loadAccountDataSession } from "../account/accountDataService";
import type { LocalLogoutControlSnapshot } from "../../infrastructure/storage/localLogoutControl";
import { AccountBootstrapStaleError, admitAccountBootstrap, completeAccountBootstrap, createAccountBootstrapCoordinator, prepareAuthenticatedAccountBootstrap, publishCompletedAccountState, type AccountBootstrapCompletionPorts, type AccountBootstrapPreparationPorts, type ProfilePreparationAttempt } from "./accountBootstrap";

test.afterEach(() => {
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("session coordinator publishes authenticated actor before deferred React dispatch and ignores a superseded completion", async () => {
  const loading: AccountState = { kind: "loading" };
  let stateRef: AccountState = loading;
  const dispatched: AccountState[] = [];
  const publish = (state: AccountState) => publishCompletedAccountState({ stateRef: { get current() { return stateRef; }, set current(next) { stateRef = next; } }, setState: (next) => { dispatched.push(next); } }, state);
  const coordinator = createAccountSessionCoordinator<Readonly<{ state: AccountState }>>((_token, outcome) => publish(outcome.state));
  const first = coordinator.begin("publish-uid-a");
  const authenticated = { kind: "authenticated" } as AccountState;
  await coordinator.run(first, async () => ({ state: authenticated }));
  assert.equal(stateRef, authenticated, "synchronous admission readers see the committed actor before React dispatch commits");
  assert.deepEqual(dispatched, [authenticated]);

  const staleCompletion = deferred<Readonly<{ state: AccountState }>>();
  const second = coordinator.begin("publish-uid-b");
  const stale = coordinator.run(second, () => staleCompletion.promise);
  const current = coordinator.begin("publish-uid-c");
  const guest = { kind: "guest" } as AccountState;
  await coordinator.run(current, async () => ({ state: guest }));
  staleCompletion.resolve({ state: authenticated });
  await stale;
  assert.equal(stateRef, guest, "a superseded completion cannot replace the current actor");
  assert.deepEqual(dispatched, [authenticated, guest]);
});

test("completed bootstrap publication admits guest and localOffline actors but does not synchronously publish failures", () => {
  const loading: AccountState = { kind: "loading" };
  let stateRef: AccountState = loading;
  const dispatched: AccountState[] = [];
  const ports = {
    stateRef: { get current() { return stateRef; }, set current(next: AccountState) { stateRef = next; } },
    setState: (next: AccountState) => { dispatched.push(next); },
  };
  const guest: AccountState = { kind: "guest" };
  publishCompletedAccountState(ports, guest);
  assert.equal(stateRef, guest);

  const localOffline = { kind: "localOffline" } as AccountState;
  publishCompletedAccountState(ports, localOffline);
  assert.equal(stateRef, localOffline);

  const failure: AccountState = { kind: "backendUnavailable", user: { uid: "publish-uid", email: null, emailVerified: false, providers: [] } };
  publishCompletedAccountState(ports, failure);
  assert.equal(stateRef, localOffline, "failure state is not exposed as a ready actor before React commits");
  assert.deepEqual(dispatched, [guest, localOffline, failure]);
});

test("guest bootstrap completion publishes its actor before a deferred React dispatch", async () => {
  const fixture = await createBootstrapFixture("guest-publication-account");
  const guestProfile = await fixture.router.selectGuest();
  fixture.setRouter(await openProfileStorageRouter(fixture.base, fixture.control));
  await prepareProfileStorage();
  activatePreparedProfile(guestProfile.id, guestProfile.kind);
  await provisionGuestInstallation();
  grantGuestAccess();

  const handoff = createProfilePreparationHandoffOwner<void>();
  const handoffToken = handoff.begin();
  const completion = deferred<AccountCommandResult>();
  let stateRef: AccountState = { kind: "profilePreparing", profile: guestProfile };
  const dispatched: AccountState[] = [];
  const attempt: ProfilePreparationAttempt = {
    kind: "guest", profile: guestProfile, completion: completion.promise, resolveCompletion: completion.resolve,
    guestAdoption: false, handoffToken, handoffReady: true,
  };
  const ports = {
    profilePreparationHandoffRef: { current: handoff },
    profilePreparationRef: { current: attempt },
    stateRef: { get current() { return stateRef; }, set current(next: AccountState) { stateRef = next; } },
    setState: (next: AccountState) => { dispatched.push(next); },
    authClient: null,
    apiClient: null,
    sessionCoordinator: { isCurrent: () => true },
    logoutControlSnapshotRef: { current: { blocked: null, completed: [], pending: [], version: 2 } },
    sessionExchangeUidRef: { current: null },
    finalizeCurrent: async () => ({ kind: "failure", failure: "providerUnavailable" }),
    runtimeMode: undefined,
    accountSessionFailureState,
  } as unknown as AccountBootstrapCompletionPorts;

  await completeAccountBootstrap(ports, handoffToken);
  assert.equal(stateRef.kind, "guest", "bootstrap readers see the completed guest actor before React commits");
  assert.deepEqual(dispatched, [{ kind: "guest" }]);
  assert.deepEqual(await completion.promise, { kind: "success", next: "guest" });
});

test("localOffline bootstrap publishes only with the current verified lease and generation", async () => {
  const accountId = "55555555-5555-4555-8555-555555555555";
  const user = { uid: "local-offline-bootstrap-uid", email: "offline@example.test", emailVerified: true, providers: ["password"] } as const;
  const makePorts = async () => {
    const fixture = await createBootstrapFixture(accountId);
    await prepareProfileStorage();
    activatePreparedProfile(fixture.selected.id, fixture.selected.kind);
    const lease = captureActiveProfileStorageLease();
    assert.ok(lease);
    await writeActiveAccountIdentityBinding({ lease, accountId, firebaseUid: user.uid, canContinue: () => true });
    await provisionGuestInstallation();
    await bindGuestInstallationToAccount(accountId);
    const binding = await readActiveAccountIdentityBinding(lease);
    assert.equal(binding.kind, "verified");
    if (binding.kind !== "verified") throw new Error("Test fixture account binding must be verified.");
    const api = {
      getProgress: async () => ({ accountRevision: 0, records: [] }),
      syncProgress: async () => ({ accountRevision: 0, applied: [], duplicates: [], conflicts: [] }),
    } as unknown as PatternlyApiClient;
    await loadAccountDataSession(api, accountId);

    const coordinator = createAccountSessionCoordinator<AccountCommandResult>(() => undefined);
    const generation = coordinator.begin(user.uid);
    let stateRef: AccountState = { kind: "profilePreparing", profile: fixture.selected };
    const dispatched: AccountState[] = [];
    const completion = deferred<AccountCommandResult>();
    const handoff = createProfilePreparationHandoffOwner<void>();
    const handoffToken = handoff.begin();
    const attempt: ProfilePreparationAttempt = {
      kind: "localOffline", profile: fixture.selected, user, generation,
      localOffline: { accountId, bindingRevision: binding.binding.verificationRevision, profileLease: lease },
      completion: completion.promise, resolveCompletion: completion.resolve,
      guestAdoption: false, handoffToken, handoffReady: true,
    };
    const ports = {
      profilePreparationHandoffRef: { current: handoff },
      profilePreparationRef: { current: attempt },
      stateRef: { get current() { return stateRef; }, set current(next: AccountState) { stateRef = next; } },
      setState: (next: AccountState) => { dispatched.push(next); },
      authClient: { getSnapshot: () => user },
      apiClient: api,
      sessionCoordinator: coordinator,
      logoutControlSnapshotRef: { current: { blocked: null, completed: [], pending: [], version: 2 } },
      sessionExchangeUidRef: { current: null },
      finalizeCurrent: async () => ({ kind: "failure", failure: "providerUnavailable" }),
      runtimeMode: undefined,
      accountSessionFailureState,
      classifyAccountFailure,
      planPasswordVerificationCommand: () => ({ kind: "finalize" }),
      disableAccountRemindersForDeletion: async () => true,
    } as unknown as AccountBootstrapCompletionPorts;
    return { ports, lease, coordinator, generation, completion, dispatched, getState: () => stateRef };
  };

  const valid = await makePorts();
  await completeAccountBootstrap(valid.ports, valid.ports.profilePreparationRef.current!.handoffToken);
  assert.equal(valid.getState().kind, "localOffline", "completion exposes the validated offline actor before React dispatch commits");
  assert.equal(valid.dispatched[0]?.kind, "localOffline");
  assert.deepEqual(await valid.completion.promise, { kind: "success", next: "localOffline" });

  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const staleLease = await makePorts();
  closeActiveProfileStorage();
  await completeAccountBootstrap(staleLease.ports, staleLease.ports.profilePreparationRef.current!.handoffToken);
  assert.notEqual(staleLease.getState().kind, "localOffline", "a stale profile lease cannot publish an offline actor");
  assert.equal(staleLease.dispatched.at(-1)?.kind, "backendUnavailable");

  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const staleGeneration = await makePorts();
  staleGeneration.coordinator.invalidate();
  await completeAccountBootstrap(staleGeneration.ports, staleGeneration.ports.profilePreparationRef.current!.handoffToken);
  assert.notEqual(staleGeneration.getState().kind, "localOffline", "a superseded generation cannot publish an offline actor");
  assert.equal(staleGeneration.dispatched.at(-1)?.kind, "revokedSession");
});

test("restore and explicit login join one drain and preparation until profile handoff completes", async () => {
  const coordinator = createAccountBootstrapCoordinator<{ completion: Promise<void> }>();
  const completion = deferred<void>();
  const drain = deferred<void>();
  const calls = { drain: 0, prepare: 0 };
  const input = {
    owner: { uid: "uid-a", generation: 4 },
    isCurrent: () => true,
    drainPendingRevocations: async () => { calls.drain += 1; await drain.promise; },
    prepareProfile: async () => { calls.prepare += 1; return { completion: completion.promise }; },
    holdUntil: (attempt: { completion: Promise<void> }) => attempt.completion,
  };

  const restore = coordinator.run(input);
  const explicitLogin = coordinator.run(input);
  assert.equal(restore, explicitLogin);
  await Promise.resolve();
  assert.deepEqual(calls, { drain: 1, prepare: 0 });

  drain.resolve();
  const [restoreAttempt, loginAttempt] = await Promise.all([restore, explicitLogin]);
  assert.equal(restoreAttempt, loginAttempt);
  assert.deepEqual(calls, { drain: 1, prepare: 1 });

  const observerRetry = coordinator.run(input);
  assert.equal(observerRetry, restore);
  completion.resolve();
  await restoreAttempt.completion;
  await Promise.resolve();

  const laterRetry = coordinator.run(input);
  assert.notEqual(laterRetry, restore);
  await laterRetry;
  assert.deepEqual(calls, { drain: 2, prepare: 2 });
});

test("a UID or generation switch fences the old drain before profile preparation", async () => {
  const coordinator = createAccountBootstrapCoordinator<string>();
  const oldDrain = deferred<void>();
  let current = { uid: "uid-a", generation: 1 };
  const prepared: string[] = [];
  const oldRun = coordinator.run({
    owner: current,
    isCurrent: () => current.uid === "uid-a" && current.generation === 1,
    drainPendingRevocations: () => oldDrain.promise,
    prepareProfile: async () => { prepared.push("old"); return "old"; },
  });
  await Promise.resolve();

  current = { uid: "uid-b", generation: 2 };
  const newRun = coordinator.run({
    owner: current,
    isCurrent: () => current.uid === "uid-b" && current.generation === 2,
    drainPendingRevocations: async () => undefined,
    prepareProfile: async () => { prepared.push("new"); return "new"; },
  });
  assert.equal(await newRun, "new");

  oldDrain.resolve();
  await assert.rejects(oldRun, AccountBootstrapStaleError);
  assert.deepEqual(prepared, ["new"]);
});

test("a UID or generation switch during profile preparation cannot return the stale attempt", async () => {
  const coordinator = createAccountBootstrapCoordinator<string>();
  const oldPreparation = deferred<string>();
  let current = { uid: "uid-a", generation: 1 };
  let oldPrepareStarted!: () => void;
  const started = new Promise<void>((resolve) => { oldPrepareStarted = resolve; });
  const oldRun = coordinator.run({
    owner: current,
    isCurrent: () => current.uid === "uid-a" && current.generation === 1,
    drainPendingRevocations: async () => undefined,
    prepareProfile: () => { oldPrepareStarted(); return oldPreparation.promise; },
  });
  await started;

  current = { uid: "uid-b", generation: 2 };
  const newRun = coordinator.run({
    owner: current,
    isCurrent: () => current.uid === "uid-b" && current.generation === 2,
    drainPendingRevocations: async () => undefined,
    prepareProfile: async () => "new",
  });
  assert.equal(await newRun, "new");

  oldPreparation.resolve("old");
  await assert.rejects(oldRun, AccountBootstrapStaleError);
});

test("a failed recovery drain releases admission so the same generation can retry", async () => {
  const coordinator = createAccountBootstrapCoordinator<string>();
  let drains = 0;
  const input = {
    owner: { uid: "uid-a", generation: 3 },
    isCurrent: () => true,
    drainPendingRevocations: async () => {
      drains += 1;
      if (drains === 1) throw new Error("temporary drain failure");
    },
    prepareProfile: async () => "prepared",
  };

  await assert.rejects(coordinator.run(input), /temporary drain failure/u);
  assert.equal(await coordinator.run(input), "prepared");
  assert.equal(drains, 2);
});

test("same-UID admission drains a freshly discovered revoke before preparation, and joins preserve the prepared profile", async () => {
  const user = { uid: "admission-order-uid", email: "person@example.test", emailVerified: true, providers: ["password"] } as const;
  const fixture = await createBootstrapFixture("admission-account");
  await prepareProfileStorage();
  activatePreparedProfile(fixture.selected.id, fixture.selected.kind);
  assert.equal(getActiveStorageProfileOrNull()?.accountId, "admission-account");

  const sessionCoordinator = createAccountSessionCoordinator<void>(() => undefined);
  const generation = sessionCoordinator.begin(user.uid);
  const completion = deferred<void>();
  const preparationStarted = deferred<void>();
  const handoff = createProfilePreparationHandoffOwner<void>();
  const profilePreparationRef: { current: ProfilePreparationAttempt | null } = { current: null };
  const accountBootstrapRef = { current: createAccountBootstrapCoordinator<ProfilePreparationAttempt | null>() };
  const emptySnapshot: LocalLogoutControlSnapshot = { blocked: null, completed: [], pending: [], version: 2 };
  const pending = { uid: user.uid, operationId: "0199aabb-ccdd-7000-8000-000000000001" };
  const pendingSnapshot: LocalLogoutControlSnapshot = { ...emptySnapshot, blocked: pending, pending: [pending] };
  const completedSnapshot: LocalLogoutControlSnapshot = { ...emptySnapshot, completed: [pending] };
  const sdkReached = deferred<void>();
  const sdkRelease = deferred<void>();
  const calls: string[] = [];
  let reads = 0;
  const ports = {
    accountBootstrapRef,
    accountBootstrapDiagnosticRef: { current: null },
    profilePreparationRef,
    sessionCoordinator,
    logoutControl: {
      async read() {
        reads += 1;
        assert.equal(getActiveStorageProfileOrNull(), null, "the prior account scope closes before reading fresh revoke state");
        return pendingSnapshot;
      },
      async completePendingRevoke(uid: string, operationId: string) {
        assert.deepEqual({ uid, operationId }, pending);
        assert.equal(getActiveStorageProfileOrNull(), null);
        calls.push("complete-exact");
        return completedSnapshot;
      },
    },
    pendingSessionRevocationDrainRef: { current: createPendingSessionRevocationDrain() },
    logoutControlSnapshotRef: { current: emptySnapshot },
    setLogoutControlSnapshot: () => undefined,
    sessionExchangeUidRef: { current: null },
    async startAuthenticatedProfilePreparation() {
      assert.deepEqual(calls, ["exchange", "sdk:initial", "revoke-exact", "sdk:replacement", "complete-exact"]);
      calls.push("prepare");
      await prepareProfileStorage();
      activatePreparedProfile(fixture.selected.id, fixture.selected.kind);
      const attempt = {
        kind: "authenticated" as const,
        profile: fixture.selected,
        user,
        generation,
        completion: completion.promise.then(() => ({ kind: "success", next: "authenticated" as const })),
        resolveCompletion: () => undefined,
        guestAdoption: false,
        handoffToken: handoff.begin(),
        handoffReady: true,
      } satisfies ProfilePreparationAttempt;
      profilePreparationRef.current = attempt;
      preparationStarted.resolve();
      return attempt;
    },
  };
  let authorizationGeneration: number | null = null;
  const auth = {
    getSnapshot: () => user,
    getAuthorizationGeneration: async () => authorizationGeneration,
    signInWithSessionToken: async (token: string) => {
      calls.push(`sdk:${token}`);
      if (token === "replacement") { sdkReached.resolve(); await sdkRelease.promise; }
      authorizationGeneration = 1;
      return user;
    },
  };
  const api = {
    exchangeAccountSession: async () => { calls.push("exchange"); return { customToken: "initial" }; },
    revokeSessions: async (operationId: string) => { assert.equal(operationId, pending.operationId); calls.push("revoke-exact"); return { operationId, status: "revoked", customToken: "replacement" }; },
  } as unknown as PatternlyApiClient;
  const first = admitAccountBootstrap(ports, auth as never, api, user, generation);
  await sdkReached.promise;
  assert.equal(profilePreparationRef.current, null, "same UID cannot prepare a profile before SDK replacement and exact local completion");
  assert.equal(getActiveStorageProfileOrNull(), null);
  assert.equal(admitAccountBootstrap(ports, auth as never, api, user, generation), first);
  sdkRelease.resolve();
  await preparationStarted.promise;
  assert.equal(reads, 1);
  assert.equal(getActiveStorageProfileOrNull()?.accountId, "admission-account");

  const joined = admitAccountBootstrap(ports, auth as never, api, user, generation);
  assert.equal(joined, first);
  await Promise.resolve();
  assert.equal(reads, 1, "the joining callback does not repeat the recovery drain");
  assert.equal(getActiveStorageProfileOrNull()?.accountId, "admission-account", "the join leaves the newly prepared account scope active");

  completion.resolve();
  await Promise.all([first, joined]);
});

async function createBootstrapFixture(selectedAccountId: string) {
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
  const selected = await router.selectAccount(selectedAccountId);
  router = await openProfileStorageRouter(base, control);
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  return { base, control, selected, router, setRouter: (next: typeof router) => { router = next; } };
}

function createPreparationPorts(input: Readonly<{
  selectedProfile: StorageProfile;
  user: FirebaseAuthUserSnapshot;
}>): Readonly<{
  ports: AccountBootstrapPreparationPorts;
  auth: Readonly<{ getSnapshot: () => FirebaseAuthUserSnapshot; getAuthorizationGeneration: () => Promise<number>; signInWithSessionToken: () => Promise<FirebaseAuthUserSnapshot> }>;
  state: AccountState[];
  generation: AccountSessionGenerationToken;
  coordinator: ReturnType<typeof createAccountSessionCoordinator<void>>;
}> {
  const profilePreparationRef: { current: ProfilePreparationAttempt | null } = { current: null };
  const profilePreparationHandoffRef = { current: createProfilePreparationHandoffOwner<void>() };
  const coordinator = createAccountSessionCoordinator<void>(() => undefined);
  const generation = coordinator.begin(input.user.uid);
  const state: AccountState[] = [{ kind: "loading" }];
  const stateRef = { get current() { return state.at(-1)!; }, set current(value: AccountState) { state.push(value); } };
  const auth = {
    getSnapshot: () => input.user,
    getAuthorizationGeneration: async () => 7,
    signInWithSessionToken: async () => input.user,
  };
  const ports = {
    profilePreparationRef,
    profilePreparationHandoffRef,
    sessionCoordinator: coordinator,
    stateRef,
    setState: (next: AccountState) => { state.push(next); },
    logoutControlSnapshotRef: { current: { blocked: null, completed: [], pending: [], version: 2 } },
    sessionExchangeUidRef: { current: null },
    classifyAccountFailure,
    accountSessionFailureState,
    preparedProfileState: { selectedProfile: input.selectedProfile },
    observerBlockedUidRef: { current: null },
    setAccountEntryMode: () => undefined,
    beginIdentityProofBarrier: async () => null,
    resolveIdentityProofBarrier: async () => { throw new Error("unexpected identity barrier"); },
    logoutControl: { blockAndQueueRevoke: async () => ({ blocked: null, completed: [], pending: [], version: 2 }) },
    setLogoutControlSnapshot: () => undefined,
    legalAcceptancePendingRef: { current: false },
    runAccountIdentityProof,
    isAuthoritativeIdentityProofDenial,
    isLocalAccountStartupUnavailable: () => false,
    revokeBindingForAuthoritativeIdentityDenial: async () => false,
  } as unknown as AccountBootstrapPreparationPorts;
  return { ports, auth, state, generation, coordinator };
}

function newerAttempt(ports: AccountBootstrapPreparationPorts, user: FirebaseAuthUserSnapshot, generation: AccountSessionGenerationToken): ProfilePreparationAttempt {
  return {
    kind: "authenticated",
    profile: ports.preparedProfileState.selectedProfile,
    user,
    generation,
    completion: Promise.resolve({ kind: "success", next: "authenticated" }),
    resolveCompletion: () => undefined,
    guestAdoption: false,
    handoffToken: ports.profilePreparationHandoffRef.current!.begin(),
    handoffReady: true,
  };
}

test("a stale preparation entry rejects before superseding the newer current attempt", async () => {
  const user = { uid: "stale-entry-uid", email: "person@example.test", emailVerified: true, providers: ["password"] } as const;
  const fixture = await createBootstrapFixture("existing-account");
  const { ports, auth, state, generation, coordinator } = createPreparationPorts({ selectedProfile: fixture.selected, user });
  const nextGeneration = coordinator.restart(user.uid);
  const currentAttempt = newerAttempt(ports, user, nextGeneration);
  ports.profilePreparationRef.current = currentAttempt;
  ports.setState({ kind: "signedOut" });
  const stateBeforeStaleEntry = state.at(-1);

  await assert.rejects(
    prepareAuthenticatedAccountBootstrap(ports, auth as never, {} as PatternlyApiClient, user, generation),
    AccountSessionGenerationStaleError,
  );
  assert.equal(ports.profilePreparationRef.current, currentAttempt);
  assert.equal(state.at(-1), stateBeforeStaleEntry);
});

test("the canonical preparation owner selects both new and returning /me accounts, then completion invokes prepared-profile finalization", async () => {
  const user = { uid: "bootstrap-uid", email: "person@example.test", emailVerified: true, providers: ["password"] } as const;
  for (const scenario of [
    { selectedAccount: "old-account", responseAccount: "new-account" },
    { selectedAccount: "returning-account", responseAccount: "returning-account" },
  ]) {
    const fixture = await createBootstrapFixture(scenario.selectedAccount);
    const { ports, auth, state, generation } = createPreparationPorts({ selectedProfile: fixture.selected, user });
    const calls: string[] = [];
    const response = { user: { id: scenario.responseAccount, email: user.email, emailVerified: true, providers: ["password"], identity: { subject: user.uid } } };
    const attempt = await prepareAuthenticatedAccountBootstrap(ports, auth as never, {
      getMe: async () => { calls.push("preparation-me"); return response; },
      exchangeAccountSession: async () => { throw new Error("exchange should not be needed for an existing auth generation"); },
    } as unknown as PatternlyApiClient, user, generation);
    assert.ok(attempt);
    assert.equal(attempt.profile.kind, "account");
    assert.equal(attempt.profile.accountId, scenario.responseAccount);
    assert.deepEqual(calls, ["preparation-me"]);
    assert.equal(state.at(-1)?.kind, "profilePreparing");

    const finalizeCalls: Readonly<{ responseUserId: string; policy: unknown }>[] = [];
    const completionPorts = {
      ...ports,
      authClient: auth,
      apiClient: {} as PatternlyApiClient,
      runtimeMode: undefined,
      planPasswordVerificationCommand: () => ({ kind: "finalize" }),
      disableAccountRemindersForDeletion: async () => true,
      finalizeCurrent: async (_auth: unknown, _api: unknown, nextUser: FirebaseAuthUserSnapshot, policy: unknown) => {
        finalizeCalls.push({ responseUserId: nextUser.uid, policy });
        ports.setState({ kind: "authenticated", backendUser: response.user as never, user, accountData: { status: "synced", preview: null, lastSuccessfulSyncAt: null, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null, activeSessionBlocked: false, guestAdoptionChoice: "discard" } as never });
        return { kind: "success", next: "authenticated" } as const;
      },
    } as unknown as AccountBootstrapCompletionPorts;
    await completeAccountBootstrap(completionPorts, attempt.handoffToken);
    assert.equal(finalizeCalls.length, 1);
    assert.deepEqual(finalizeCalls[0]?.policy, accountFinalizationPolicies.preparedProfile(generation, "discard"));
    assert.equal(state.at(-1)?.kind, "authenticated");
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("an active guest profile takes precedence over a stale prepared account snapshot during authenticated preparation", async () => {
  const user = { uid: "stale-snapshot-guest-uid", email: "person@example.test", emailVerified: true, providers: ["password"] } as const;
  const fixture = await createBootstrapFixture("stale-account-snapshot");
  const guest = await fixture.router.selectGuest();
  fixture.setRouter(await openProfileStorageRouter(fixture.base, fixture.control));
  await prepareProfileStorage();
  activatePreparedProfile(guest.id, guest.kind);
  await provisionGuestInstallation();
  await markGuestInstallationAdoptionPending();

  const { ports, auth, state, generation } = createPreparationPorts({ selectedProfile: fixture.selected, user });
  const attempt = await prepareAuthenticatedAccountBootstrap(ports, auth as never, {} as PatternlyApiClient, user, generation);

  assert.ok(attempt);
  assert.equal(attempt.guestAdoption, true);
  assert.equal(attempt.profile.id, guest.id);
  assert.equal(getActiveStorageProfileOrNull()?.id, guest.id, "preparation must keep the live guest available for account adoption");
  assert.equal(state.at(-1)?.kind, "profilePreparing");
});

test("the canonical preparation owner stops on unavailable and authoritative /me failures", async () => {
  const user = { uid: "bootstrap-failure-uid", email: "person@example.test", emailVerified: true, providers: ["password"] } as const;
  for (const [error, expectedFailure] of [
    [new PatternlyApiClientError("request_timeout"), "backendUnavailable"],
    [new PatternlyApiClientError("server_error", 401, "account_deleted"), "revokedSession"],
  ] as const) {
    const fixture = await createBootstrapFixture("existing-account");
    const { ports, auth, generation } = createPreparationPorts({ selectedProfile: fixture.selected, user });
    let meCalls = 0;
    const attempt = await prepareAuthenticatedAccountBootstrap(ports, auth as never, {
      getMe: async () => { meCalls += 1; throw error; },
      exchangeAccountSession: async () => { throw new Error("exchange should not be needed for an existing auth generation"); },
    } as unknown as PatternlyApiClient, user, generation);
    assert.ok(attempt);
    assert.equal(meCalls, 1);
    assert.deepEqual(attempt.bootstrapFailure, { kind: "failure", failure: expectedFailure });
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});


test("a failed login with closed profile storage can re-enter bootstrap and reach the awaited account handoff", async () => {
  const user = { uid: "retry-uid", email: "retry@example.test", emailVerified: true, providers: ["password"] } as const;
  const fixture = await createBootstrapFixture("retry-account");
  const { ports, auth, state, generation, coordinator } = createPreparationPorts({ selectedProfile: fixture.selected, user });
  let requests = 0;
  const api = {
    getMe: async () => {
      requests += 1;
      if (requests === 1) throw new PatternlyApiClientError("request_timeout");
      return { user: { id: "retry-account", email: user.email, emailVerified: true, providers: ["password"], identity: { subject: user.uid } } };
    },
    exchangeAccountSession: async () => { throw new Error("existing generation needs no exchange"); },
  } as unknown as PatternlyApiClient;
  const failed = await prepareAuthenticatedAccountBootstrap(ports, auth as never, api, user, generation);
  assert.deepEqual(failed?.bootstrapFailure, { kind: "failure", failure: "backendUnavailable" });
  assert.equal(state.at(-1)?.kind, "backendUnavailable");
  assert.equal(getActiveStorageProfileOrNull(), null);
  const retried = await prepareAuthenticatedAccountBootstrap(ports, auth as never, api, user, coordinator.restart(user.uid));
  assert.equal(requests, 2);
  assert.equal(retried?.bootstrapFailure, undefined);
  assert.equal(retried?.handoffReady, true);
  assert.equal(getActiveStorageProfileOrNull()?.accountId, "retry-account");
  assert.equal(state.at(-1)?.kind, "profilePreparing");
});
