import assert from "node:assert/strict";
import test from "node:test";

import { AccountSessionGenerationStaleError, accountSessionFailureState, classifyAccountFailure, createAccountSessionCoordinator, isAuthoritativeIdentityProofDenial, runAccountIdentityProof, type AccountSessionGenerationToken, type AccountState } from "../account/AccountSessionProvider";
import { MemoryKeyValueStorage, activatePreparedProfile, closeActiveProfileStorage, getActiveStorageProfileOrNull, installKeyValueStorageForTests, prepareProfileStorage, setProfileStoragePreparationFactoryForTests } from "../../infrastructure/storage/mmkvClient";
import { openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";
import type { FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import { PatternlyApiClientError, type PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { accountFinalizationPolicies } from "../account/accountFinalization";
import { createProfilePreparationHandoffOwner } from "../account/profilePreparationHandoff";
import { createPendingSessionRevocationDrain } from "../account/pendingSessionRevocation";
import { AccountBootstrapStaleError, admitAccountBootstrap, completeAccountBootstrap, createAccountBootstrapCoordinator, prepareAuthenticatedAccountBootstrap, type AccountBootstrapCompletionPorts, type AccountBootstrapPreparationPorts, type ProfilePreparationAttempt } from "./accountBootstrap";

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

test("admission reads fresh logout control after closing scope, and a join does not close the prepared profile", async () => {
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
  const emptySnapshot = { blocked: null, completed: [], pending: [], version: 2 } as const;
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
        return emptySnapshot;
      },
      async completePendingRevoke() { return emptySnapshot; },
    },
    pendingSessionRevocationDrainRef: { current: createPendingSessionRevocationDrain() },
    logoutControlSnapshotRef: { current: emptySnapshot },
    setLogoutControlSnapshot: () => undefined,
    sessionExchangeUidRef: { current: null },
    async startAuthenticatedProfilePreparation() {
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
  const auth = {
    getSnapshot: () => user,
    getAuthorizationGeneration: async () => 1,
    signInWithSessionToken: async () => user,
  };
  const api = {} as PatternlyApiClient;
  const first = admitAccountBootstrap(ports, auth as never, api, user, generation);
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
  return { base, selected, router };
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
    recoveryOperation: { blocksProfilePreparation: false },
    logoutControlSnapshotRef: { current: { blocked: null, completed: [], pending: [], version: 2 } },
    sessionExchangeUidRef: { current: null },
    classifyAccountFailure,
    accountSessionFailureState,
    preparedProfileState: { selectedProfile: input.selectedProfile },
    observerBlockedUidRef: { current: null },
    setAccountEntryMode: () => undefined,
    beginIdentityProofBarrier: async () => null,
    resolveIdentityProofBarrier: async () => { throw new Error("unexpected identity barrier"); },
    guardRecoveryBeforePreparation: async () => true,
    logoutControl: { blockAndQueueRevoke: async () => ({ blocked: null, completed: [], pending: [], version: 2 }) },
    setLogoutControlSnapshot: () => undefined,
    recoverySessionIdentityRef: { current: null },
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

test("a recovery guard that settles after a generation switch cannot clear or publish over the newer attempt", async () => {
  const user = { uid: "guard-race-uid", email: "person@example.test", emailVerified: true, providers: ["password"] } as const;
  const fixture = await createBootstrapFixture("existing-account");
  const { ports, auth, state, generation, coordinator } = createPreparationPorts({ selectedProfile: fixture.selected, user });
  const guard = deferred<boolean>();
  const guardStarted = deferred<void>();
  const racedPorts = {
    ...ports,
    guardRecoveryBeforePreparation: async () => { guardStarted.resolve(); return guard.promise; },
  } as AccountBootstrapPreparationPorts;
  const oldPreparation = prepareAuthenticatedAccountBootstrap(racedPorts, auth as never, {} as PatternlyApiClient, user, generation);
  await guardStarted.promise;

  const nextGeneration = coordinator.restart(user.uid);
  const currentAttempt = newerAttempt(ports, user, nextGeneration);
  ports.profilePreparationRef.current = currentAttempt;
  ports.setState({ kind: "signedOut" });
  const stateBeforeOldGuardSettles = state.at(-1);

  guard.resolve(false);
  const oldAttempt = await oldPreparation;
  assert.ok(oldAttempt);
  assert.deepEqual(await oldAttempt.completion, { kind: "failure", failure: "revokedSession" });
  assert.equal(ports.profilePreparationRef.current, currentAttempt);
  assert.equal(state.at(-1), stateBeforeOldGuardSettles);
});

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

test("the canonical preparation owner stops on offline and authoritative /me failures", async () => {
  const user = { uid: "bootstrap-failure-uid", email: "person@example.test", emailVerified: true, providers: ["password"] } as const;
  for (const [error, expectedFailure] of [
    [new PatternlyApiClientError("request_timeout"), "offline"],
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
