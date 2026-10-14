import type { AccountCommandResult, AccountFailure, AccountIdentityProofBarrierContext, AccountSessionCoordinator, AccountSessionGenerationToken, AccountState } from "../account/AccountSessionProvider";
import type { FirebaseAuthClient, FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import type { PatternlyApiClient } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type { LocalLogoutControl, LocalLogoutControlSnapshot } from "../../infrastructure/storage/localLogoutControl";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";
import type { PatternlyRuntimeMode } from "../../infrastructure/runtime/runtimeMode";
import type { AccountStartupDiagnosticWriter } from "../operationalDiagnostics";
import { createProfilePreparationHandoffOwner, type ProfilePreparationHandoffToken } from "../account/profilePreparationHandoff";
import { activatePreparedProfile, captureActiveProfileStorageLease, closeActiveProfileStorage, getActiveStorageProfileOrNull, isActiveProfileStorageLeaseCurrent, notifyProfileStorageReady, prepareProfileStorage, readActiveAccountIdentityBinding, readPreparedAccountIdentityBinding, selectPreparedAccountProfile, type ActiveProfileStorageLease, type AccountIdentityBinding } from "../../storage/repositories/profileStorageRepository";
import { AccountSessionGenerationStaleError, findMatchingLocalLogoutBlock, findPendingSessionRevocation, guardAuthenticatedScopeAgainstIncompleteSignOut, prepareAuthenticatedProfileScope } from "../account/profileStartupCoordination";
import { clearAccountSignOutState, getAccountDeletionState, getAccountSignOutState } from "../../storage/repositories/accountLifecycleRepository";
import { getGuestInstallation, hasUnboundGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { hasGuestAccess, revokeGuestAccess } from "../../storage/repositories/guestAccessRepository";
import { clearPremiumCache } from "../../storage/repositories/premiumEntitlementCacheRepository";
import { retryPendingAccountDeletion, readLocalAccountDataSession } from "../account/accountDataService";
import { createPendingSessionRevocationDrain, drainPendingSessionRevocations } from "../account/pendingSessionRevocation";
import { getMeWithExchangedSession } from "../account/accountSessionExchange";
import { accountFinalizationPolicies, type AccountFinalizationOptions } from "../account/accountFinalization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

type Ref<T> = { current: T };
type BootstrapCommonPorts = Readonly<{
  profilePreparationRef: Ref<ProfilePreparationAttempt | null>;
  profilePreparationHandoffRef: Ref<ReturnType<typeof createProfilePreparationHandoffOwner<void>> | null>;
  sessionCoordinator: Pick<AccountSessionCoordinator<unknown>, "isCurrent">;
  stateRef: Ref<AccountState>;
  setState: (state: AccountState) => void;
  recoveryOperation: Readonly<{ blocksProfilePreparation: boolean }>;
  logoutControlSnapshotRef: Ref<LocalLogoutControlSnapshot>;
  sessionExchangeUidRef: Ref<string | null>;
  classifyAccountFailure: (error: unknown) => AccountFailure;
  accountSessionFailureState: typeof import("../account/AccountSessionProvider").accountSessionFailureState;
}>;

export type AccountBootstrapPreparationPorts = BootstrapCommonPorts & Readonly<{
  preparedProfileState: Readonly<{ selectedProfile: StorageProfile }>;
  observerBlockedUidRef: Ref<string | null>;
  setAccountEntryMode: (mode: "welcome" | "login") => void;
  beginIdentityProofBarrier: (auth: FirebaseAuthClient, user: FirebaseAuthUserSnapshot, generation: AccountSessionGenerationToken, preferPreparedProfile?: boolean) => Promise<AccountIdentityProofBarrierContext | null>;
  resolveIdentityProofBarrier: (barrier: AccountIdentityProofBarrierContext, auth: FirebaseAuthClient, user: FirebaseAuthUserSnapshot, generation: AccountSessionGenerationToken) => Promise<AccountIdentityBinding>;
  guardRecoveryBeforePreparation: (auth: FirebaseAuthClient | null, owner?: Readonly<{ generation: AccountSessionGenerationToken; barrier: AccountIdentityProofBarrierContext | null }>, onTerminalState?: (kind: AccountState["kind"]) => void) => Promise<boolean>;
  logoutControl: Pick<LocalLogoutControl, "blockAndQueueRevoke">;
  setLogoutControlSnapshot: (snapshot: LocalLogoutControlSnapshot) => void;
  recoverySessionIdentityRef: Ref<Readonly<{ firebaseUid: string; authorizationGeneration: number }> | null>;
  legalAcceptancePendingRef: Ref<boolean>;
  runAccountIdentityProof: typeof import("../account/AccountSessionProvider").runAccountIdentityProof;
  isAuthoritativeIdentityProofDenial: (error: unknown) => boolean;
  isLocalAccountStartupUnavailable: (error: unknown) => boolean;
  revokeBindingForAuthoritativeIdentityDenial: typeof import("../account/AccountSessionProvider").revokeBindingForAuthoritativeIdentityDenial;
}>;

export type AccountBootstrapCompletionPorts = BootstrapCommonPorts & Readonly<{
  authClient: FirebaseAuthClient | null;
  apiClient: PatternlyApiClient | null;
  runtimeMode: PatternlyRuntimeMode | undefined;
  finalizeCurrent: (auth: FirebaseAuthClient, api: PatternlyApiClient, user: FirebaseAuthUserSnapshot, options: AccountFinalizationOptions<AccountSessionGenerationToken, AccountIdentityProofBarrierContext>) => Promise<AccountCommandResult>;
  planPasswordVerificationCommand: typeof import("../account/AccountSessionProvider").planPasswordVerificationCommand;
  disableAccountRemindersForDeletion: () => Promise<boolean>;
}>;

export type ProfilePreparationAttempt = {
  kind: "authenticated" | "guest" | "localOffline";
  profile: StorageProfile;
  user?: FirebaseAuthUserSnapshot;
  generation?: AccountSessionGenerationToken;
  completion: Promise<AccountCommandResult>;
  resolveCompletion: (result: AccountCommandResult) => void;
  bootstrapFailure?: AccountCommandResult;
  guestAdoption: boolean;
  startupDiagnostic?: AccountStartupDiagnosticWriter;
  handoffToken: ProfilePreparationHandoffToken;
  handoffReady: boolean;
  localOffline?: Readonly<{ accountId: string; bindingRevision: number; profileLease: ActiveProfileStorageLease }>;
};

/**
 * Owns one authenticated bootstrap admission for a Firebase UID and app
 * session generation. Restore callbacks and explicit sign-in commands can
 * arrive for the same session; they must join while revoke draining or
 * profile preparation is still running.
 *
 * The provider supplies the stateful operations. Keeping this coordinator
 * independent of React lets the admission behavior be tested directly.
 */
export type AccountBootstrapOwner = Readonly<{
  uid: string;
  generation: number;
}>;

export class AccountBootstrapStaleError extends Error {
  constructor() {
    super("account_bootstrap_stale");
    this.name = "AccountBootstrapStaleError";
  }
}

export type AccountBootstrapCoordinator<T> = Readonly<{
  run: (input: Readonly<{
    owner: AccountBootstrapOwner;
    isCurrent: () => boolean;
    drainPendingRevocations: () => Promise<unknown>;
    prepareProfile: () => Promise<T>;
    onJoin?: () => void;
    /** Keep matching callers joined while the prepared profile is awaiting handoff. */
    holdUntil?: (prepared: T) => Promise<unknown> | null;
  }>) => Promise<T>;
}>;

/** Joins matching callers through both the recovery drain and preparation. */
export function createAccountBootstrapCoordinator<T>(): AccountBootstrapCoordinator<T> {
  type Active = Readonly<{
    owner: AccountBootstrapOwner;
    promise: Promise<T>;
  }>;

  let active: Active | null = null;

  const run: AccountBootstrapCoordinator<T>["run"] = (input) => {
    if (!input.isCurrent()) return Promise.reject(new AccountBootstrapStaleError());

    const current = active;
    if (current?.owner.uid === input.owner.uid
      && current.owner.generation === input.owner.generation) {
      input.onJoin?.();
      return current.promise;
    }

    let entry: Active;
    const promise = Promise.resolve().then(async () => {
      if (!input.isCurrent()) throw new AccountBootstrapStaleError();
      await input.drainPendingRevocations();
      if (!input.isCurrent()) throw new AccountBootstrapStaleError();
      const prepared = await input.prepareProfile();
      if (!input.isCurrent()) throw new AccountBootstrapStaleError();
      const held = input.holdUntil?.(prepared);
      if (held) {
        void held.then(release, release);
      } else {
        release();
      }
      return prepared;
    });
    entry = Object.freeze({ owner: input.owner, promise });
    active = entry;
    void promise.catch(() => {
      release();
    });
    return promise;

    function release(): void {
      if (active === entry) active = null;
    }
  };

  return Object.freeze({ run });
}


export async function prepareAuthenticatedAccountBootstrap(
  ports: AccountBootstrapPreparationPorts,
  auth: FirebaseAuthClient,
  api: PatternlyApiClient,
  user: FirebaseAuthUserSnapshot,
  generation: AccountSessionGenerationToken,
  startupDiagnostic?: AccountStartupDiagnosticWriter,
): Promise<ProfilePreparationAttempt | null> {
  const {
    profilePreparationRef, preparedProfileState, sessionCoordinator, profilePreparationHandoffRef,
    observerBlockedUidRef, setAccountEntryMode, setState, stateRef,
    beginIdentityProofBarrier, resolveIdentityProofBarrier, guardRecoveryBeforePreparation, logoutControlSnapshotRef,
    logoutControl, setLogoutControlSnapshot, recoverySessionIdentityRef, sessionExchangeUidRef,
    recoveryOperation, legalAcceptancePendingRef, runAccountIdentityProof, isAuthoritativeIdentityProofDenial,
    isLocalAccountStartupUnavailable, classifyAccountFailure, accountSessionFailureState, revokeBindingForAuthoritativeIdentityDenial,
  } = ports;
  if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid) throw new AccountSessionGenerationStaleError();
  const existing = profilePreparationRef.current;
  if ((existing?.kind === "authenticated" || existing?.kind === "localOffline") && existing.user?.uid === user.uid && existing.generation?.generation === generation.generation) {
    existing.startupDiagnostic = startupDiagnostic ?? existing.startupDiagnostic;
    return existing;
  }
  if (existing) {
    profilePreparationRef.current = null;
    existing.resolveCompletion({ kind: "failure", failure: "revokedSession" });
  }
  let resolveCompletion!: (result: AccountCommandResult) => void;
  const completion = new Promise<AccountCommandResult>((resolve) => { resolveCompletion = resolve; });
  const attempt: ProfilePreparationAttempt = {
    kind: "authenticated",
    profile: preparedProfileState.selectedProfile,
    user,
    generation,
    completion,
    resolveCompletion,
    guestAdoption: false,
    startupDiagnostic,
    handoffToken: profilePreparationHandoffRef.current!.begin(),
    handoffReady: false,
  };
  profilePreparationRef.current = attempt;
  const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
  let proofBarrier: AccountIdentityProofBarrierContext | null = null;
  let diagnosticStage: Exclude<import("../operationalDiagnostics").AccountStartupDiagnosticStage, "complete"> = "recovery_guard";
  const finishPendingSignOut = (operationId?: string, failure: AccountFailure = "signOutPending", blockObserver = true): ProfilePreparationAttempt => {
    profilePreparationRef.current = null;
    if (blockObserver) observerBlockedUidRef.current = user.uid;
    if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
    setAccountEntryMode("login");
    setState({ kind: "signOutPending", user, ...(operationId ? { operationId } : {}) });
    attempt.bootstrapFailure = { kind: "failure", failure };
    startupDiagnostic?.failed("recovery_guard", new Error(failure), "signOutPending");
    resolveCompletion(attempt.bootstrapFailure);
    return attempt;
  };
  try {
    if (!canContinue()) throw new AccountSessionGenerationStaleError();
    startupDiagnostic?.pending("recovery_guard", stateRef.current.kind);
    const activeBeforePreparation = getActiveStorageProfileOrNull();
    const selectedBeforePreparation = preparedProfileState.selectedProfile;
    if (activeBeforePreparation?.kind === "account" || selectedBeforePreparation.kind === "account") {
      if (activeBeforePreparation) closeActiveProfileStorage();
      diagnosticStage = "account_profile_prepare";
      startupDiagnostic?.pending(diagnosticStage, stateRef.current.kind);
      await prepareProfileStorage();
      proofBarrier = await beginIdentityProofBarrier(auth, user, generation, true);
    }
    diagnosticStage = "recovery_guard";
    startupDiagnostic?.pending(diagnosticStage, stateRef.current.kind);
    let recoveryGuardTerminalState: AccountState["kind"] | undefined;
    const recoveryAllowed = await guardRecoveryBeforePreparation(auth, { generation, barrier: proofBarrier }, (kind) => { recoveryGuardTerminalState = kind; });
    if (!canContinue()) throw new AccountSessionGenerationStaleError();
    if (!recoveryAllowed) {
      if (proofBarrier && stateRef.current.kind !== "revokedSession") {
        try { await resolveIdentityProofBarrier(proofBarrier, auth, user, generation); } catch { /* Keep an unconfirmed restore fail-closed. */ }
      }
      if (!canContinue()) throw new AccountSessionGenerationStaleError();
      profilePreparationRef.current = null;
      attempt.bootstrapFailure = { kind: "failure", failure: stateRef.current.kind === "revokedSession" ? "revokedSession" : "conflict" };
      if (recoveryGuardTerminalState) startupDiagnostic?.failed("recovery_guard", new Error("account_recovery_guard_blocked"), recoveryGuardTerminalState);
      else startupDiagnostic?.pending("recovery_guard", stateRef.current.kind);
      resolveCompletion(attempt.bootstrapFailure);
      return null;
    }
    const pendingRevoke = findPendingSessionRevocation(logoutControlSnapshotRef.current, user.uid);
    if (pendingRevoke) return finishPendingSignOut(pendingRevoke.operationId, "signOutPending", false);
    const blockedLogout = findMatchingLocalLogoutBlock(logoutControlSnapshotRef.current, user.uid);
    if (blockedLogout) return finishPendingSignOut(blockedLogout.operationId);
    setAccountEntryMode("login");
    setState({ kind: "loading" });
    let activeProfile = getActiveStorageProfileOrNull();
    const preparedSelection = preparedProfileState.selectedProfile;
    if (!activeProfile && preparedSelection.kind === "guest") {
      activatePreparedProfile(preparedSelection.id, preparedSelection.kind, { deferReadyNotification: true });
      activeProfile = getActiveStorageProfileOrNull();
    }
    const guestInstallation = activeProfile?.kind === "guest"
      ? await getGuestInstallation()
      : null;
    if (!canContinue()) throw new AccountSessionGenerationStaleError();
    if (activeProfile && guestInstallation?.bindingState === "adoption_pending") {
      attempt.profile = activeProfile;
      attempt.guestAdoption = true;
      notifyProfileStorageReady();
      attempt.handoffReady = true;
      setState({ kind: "profilePreparing", profile: activeProfile });
      startupDiagnostic?.pending("profile_preparing", "profilePreparing");
      return attempt;
    }
    if (activeProfile) closeActiveProfileStorage();
    diagnosticStage = "account_profile_prepare";
    startupDiagnostic?.pending("account_profile_prepare", stateRef.current.kind);
    const selectedProfile = await prepareAuthenticatedProfileScope({
      canContinue,
      prepareStorage: prepareProfileStorage,
      getMe: async () => {
        const identityProof = await runAccountIdentityProof({
          request: () => getMeWithExchangedSession({
            api,
            auth,
            ...(recoverySessionIdentityRef.current?.firebaseUid === user.uid ? { requiredAuthorizationGeneration: recoverySessionIdentityRef.current.authorizationGeneration } : {}),
            canContinue,
            onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
            user,
          }),
          user,
          generation,
          barrier: proofBarrier,
          barrierAlreadyCaptured: true,
          beginBarrier: () => beginIdentityProofBarrier(auth, user, generation, true),
          resolveBarrier: (barrier) => resolveIdentityProofBarrier(barrier, auth, user, generation),
          matchesProofSubject: (response, barrier) => response.user.id === barrier.previousBinding.accountId
            && response.user.identity.subject === barrier.previousBinding.firebaseUid
            && barrier.previousBinding.firebaseUid === user.uid,
          getCurrentState: () => stateRef.current,
          getCurrentSdkUid: () => auth.getSnapshot()?.uid ?? null,
          isCurrentGeneration: sessionCoordinator.isCurrent,
          isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
          readBinding: readActiveAccountIdentityBinding,
          revokeDeniedBinding: async (error) => { await revokeBindingForAuthoritativeIdentityDenial(error, { profile: preparedSelection, uid: user.uid, canContinue }); },
        });
        proofBarrier = null;
        if (identityProof.kind === "failed") throw identityProof.cause ?? new Error(identityProof.failure);
        return identityProof.value;
      },
      selectAccount: (accountId, guard) => selectPreparedAccountProfile(accountId, guard, { recoverBoundGuest: true }),
      activate: (profile) => { activatePreparedProfile(profile.id, profile.kind, { deferReadyNotification: true }); },
    });
    attempt.profile = selectedProfile;
    const logoutGuard = await guardAuthenticatedScopeAgainstIncompleteSignOut({
      accountId: selectedProfile.accountId ?? "",
      authUid: user.uid,
      canContinue,
      completed: logoutControlSnapshotRef.current.completed,
      pending: logoutControlSnapshotRef.current.pending,
      readScopedSignOut: getAccountSignOutState,
      clearScopedSignOut: clearAccountSignOutState,
      persistControlPair: async (operationId) => {
        const snapshot = await logoutControl.blockAndQueueRevoke(user.uid, operationId);
        if (!canContinue()) throw new AccountSessionGenerationStaleError();
        logoutControlSnapshotRef.current = snapshot;
        setLogoutControlSnapshot(snapshot);
      },
      closeProfileStorage: () => {
        const active = getActiveStorageProfileOrNull();
        if (active?.kind === "account" && active.accountId === selectedProfile.accountId) closeActiveProfileStorage();
      },
      blockAuthObserver: (uid) => { observerBlockedUidRef.current = uid; },
      publishPending: (operationId) => {
        setAccountEntryMode("login");
        setState({ kind: "signOutPending", user, ...(operationId ? { operationId } : {}) });
      },
    });
    if (logoutGuard === "stale") throw new AccountSessionGenerationStaleError();
    if (logoutGuard === "blocked") {
      attempt.bootstrapFailure = { kind: "failure", failure: "signOutPending" };
      startupDiagnostic?.failed("account_profile_prepare", new Error("sign_out_guard_blocked"), "signOutPending");
      profilePreparationRef.current = null;
      resolveCompletion(attempt.bootstrapFailure);
      return attempt;
    }
    notifyProfileStorageReady();
    attempt.handoffReady = true;
    setState({ kind: "profilePreparing", profile: selectedProfile });
    startupDiagnostic?.pending("profile_preparing", "profilePreparing");
    return attempt;
  } catch (error) {
    if (proofBarrier && !isAuthoritativeIdentityProofDenial(error)
      && sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid) {
      try { await resolveIdentityProofBarrier(proofBarrier, auth, user, generation); } catch { /* The durable barrier remains fail-closed. */ }
    }
    const ownsPreparation = profilePreparationRef.current === attempt;
    if (ownsPreparation) {
      profilePreparationRef.current = null;
      const activeProfile = getActiveStorageProfileOrNull();
      if (activeProfile && activeProfile.id === attempt.profile.id) closeActiveProfileStorage();
    }
    const failure = error instanceof AccountSessionGenerationStaleError || !canContinue()
      ? "revokedSession"
      : classifyAccountFailure(error);
    const failureState = accountSessionFailureState(failure, user);
    startupDiagnostic?.failed(diagnosticStage, error, failureState.kind);
    if (ownsPreparation && isLocalAccountStartupUnavailable(error) && canContinue()
      && !findPendingSessionRevocation(logoutControlSnapshotRef.current, user.uid)
      && !findMatchingLocalLogoutBlock(logoutControlSnapshotRef.current, user.uid)
      && !recoveryOperation.blocksProfilePreparation
      && !legalAcceptancePendingRef.current) {
      const profile = preparedProfileState.selectedProfile;
      if (profile.kind === "account" && profile.accountId) {
        try {
          const preparedBinding = await readPreparedAccountIdentityBinding(profile.id);
          if (preparedBinding.kind === "verified" && preparedBinding.binding.profileId === profile.id
            && preparedBinding.binding.profileKind === profile.kind && preparedBinding.binding.accountId === profile.accountId
            && preparedBinding.binding.firebaseUid === user.uid && canContinue()) {
            activatePreparedProfile(profile.id, profile.kind, { deferReadyNotification: true });
            const lease = captureActiveProfileStorageLease();
            if (!lease || lease.profile.id !== profile.id || lease.profile.kind !== profile.kind || lease.profile.accountId !== profile.accountId) {
              throw new Error("local_account_scope_unavailable");
            }
            const activeBinding = await readActiveAccountIdentityBinding(lease);
            const accountData = await readLocalAccountDataSession(profile.accountId);
            const signOutMarker = getAccountSignOutState();
            const deletionMarker = getAccountDeletionState();
            const scopedLogoutPending = signOutMarker?.accountId === profile.accountId;
            const deletionPending = deletionMarker !== null
              && (deletionMarker.accountId === profile.accountId || deletionMarker.accountUidHash === sha256Utf8(user.uid));
            if (!canContinue() || auth.getSnapshot()?.uid !== user.uid || !isActiveProfileStorageLeaseCurrent(lease)
              || activeBinding.kind !== "verified" || activeBinding.binding.checksum !== preparedBinding.binding.checksum
              || accountData === null || scopedLogoutPending || deletionPending) {
              throw new Error("local_account_scope_unavailable");
            }
            attempt.kind = "localOffline";
            attempt.profile = profile;
            attempt.localOffline = Object.freeze({ accountId: profile.accountId, bindingRevision: activeBinding.binding.verificationRevision, profileLease: lease });
            profilePreparationRef.current = attempt;
            notifyProfileStorageReady();
            attempt.handoffReady = true;
            setState({ kind: "profilePreparing", profile });
            startupDiagnostic?.pending("profile_preparing", "profilePreparing");
            return attempt;
          }
        } catch {
          const activeProfile = getActiveStorageProfileOrNull();
          if (activeProfile?.id === profile.id) closeActiveProfileStorage();
        }
      }
    }
    if (ownsPreparation && canContinue()) setState(failureState);
    if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
    attempt.bootstrapFailure = { kind: "failure", failure };
    resolveCompletion(attempt.bootstrapFailure);
    return attempt;
  }
}

export function completeAccountBootstrap(ports: AccountBootstrapCompletionPorts, token: ProfilePreparationHandoffToken): Promise<void> {
  const {
    profilePreparationHandoffRef, profilePreparationRef, stateRef, authClient,
    apiClient, sessionCoordinator, recoveryOperation, logoutControlSnapshotRef,
    setState, finalizeCurrent, runtimeMode, sessionExchangeUidRef,
    accountSessionFailureState,
  } = ports;
  return profilePreparationHandoffRef.current!.run(token, async () => {
    const attempt = profilePreparationRef.current;
    if (!attempt || attempt.handoffToken !== token) throw new Error("Profile preparation attempt is no longer current.");
    if (profilePreparationRef.current === attempt) attempt.startupDiagnostic?.pending("profile_completion", stateRef.current.kind);
    const completion = (async (): Promise<AccountCommandResult> => {
      if (attempt.kind === "guest") {
        const result = hasGuestAccess() && hasUnboundGuestInstallation()
          ? { kind: "success", next: "guest" } as const
          : { kind: "failure", failure: "providerUnavailable" } as const;
        if (profilePreparationRef.current === attempt) {
          setState(result.kind === "success" ? { kind: "guest" } : { kind: "guestAccessBlocked" });
          if (result.kind === "success") attempt.startupDiagnostic?.ready("guest");
          else attempt.startupDiagnostic?.failed("profile_completion", new Error("guest_profile_completion_failed"), "guestAccessBlocked");
          profilePreparationRef.current = null;
        }
        attempt.resolveCompletion(result);
        return result;
      }
      const auth = authClient;
      const api = apiClient;
      const user = attempt.user;
      const generation = attempt.generation;
      if (!auth || !api || !user || !generation || !sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid) {
        const result = { kind: "failure", failure: "revokedSession" } as const;
        if (profilePreparationRef.current === attempt) {
          if (user) setState({ kind: "revokedSession", user });
          else setState({ kind: "signedOut" });
          attempt.startupDiagnostic?.failed("profile_completion", new Error("account_profile_completion_unavailable"), user ? "revokedSession" : "signedOut");
          profilePreparationRef.current = null;
        }
        attempt.resolveCompletion(result);
        return result;
      }
      if (attempt.kind === "localOffline") {
        const offline = attempt.localOffline;
        try {
          if (!offline || !sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid
            || recoveryOperation.blocksProfilePreparation || findPendingSessionRevocation(logoutControlSnapshotRef.current, user.uid)
            || findMatchingLocalLogoutBlock(logoutControlSnapshotRef.current, user.uid)
            || !isActiveProfileStorageLeaseCurrent(offline.profileLease)) throw new Error("local_account_scope_unavailable");
          const binding = await readActiveAccountIdentityBinding(offline.profileLease);
          const accountData = await readLocalAccountDataSession(offline.accountId);
          const signOutMarker = getAccountSignOutState();
          const deletionMarker = getAccountDeletionState();
          if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid
            || !isActiveProfileStorageLeaseCurrent(offline.profileLease) || binding.kind !== "verified"
            || binding.binding.accountId !== offline.accountId || binding.binding.firebaseUid !== user.uid
            || binding.binding.profileId !== offline.profileLease.profile.id || binding.binding.profileKind !== offline.profileLease.profile.kind
            || binding.binding.verificationRevision !== offline.bindingRevision || accountData === null
            || signOutMarker?.accountId === offline.accountId
            || (deletionMarker !== null && (deletionMarker.accountId === offline.accountId || deletionMarker.accountUidHash === sha256Utf8(user.uid)))) {
            throw new Error("local_account_scope_unavailable");
          }
          revokeGuestAccess();
          setState({ kind: "localOffline", accountId: offline.accountId, accountData, bindingRevision: offline.bindingRevision, generation, profile: offline.profileLease.profile, profileLease: offline.profileLease, user });
          if (profilePreparationRef.current === attempt) attempt.startupDiagnostic?.ready("localOffline");
          profilePreparationRef.current = null;
          attempt.resolveCompletion({ kind: "success", next: "localOffline" });
          return { kind: "success", next: "localOffline" };
        } catch {
          if (offline && isActiveProfileStorageLeaseCurrent(offline.profileLease)) closeActiveProfileStorage();
          const current = sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
          const result = { kind: "failure", failure: current ? "backendUnavailable" : "revokedSession" } as const;
          if (profilePreparationRef.current === attempt) {
            attempt.startupDiagnostic?.failed("profile_completion", new Error(result.failure), current ? "backendUnavailable" : "revokedSession");
            profilePreparationRef.current = null;
          }
          if (current) setState(accountSessionFailureState(result.failure, user));
          attempt.resolveCompletion(result);
          return result;
        }
      }
      const reconciliationOutcome: { result: AccountCommandResult | null; state: AccountState | null } = { result: null, state: null };
      await reconcileAuthenticatedUser(
        ports,
        auth,
        api,
        runtimeMode,
        user,
        async (nextUser) => {
          reconciliationOutcome.result = await finalizeCurrent(auth, api, nextUser,
            accountFinalizationPolicies.preparedProfile<AccountSessionGenerationToken, AccountIdentityProofBarrierContext>(generation, attempt.guestAdoption ? "allow" : "discard"));
          return reconciliationOutcome.result;
        },
        (nextState) => {
          if (sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid) {
            reconciliationOutcome.state = nextState;
            setState(nextState);
          }
        },
        () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid,
      );
      const result: AccountCommandResult = !sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid
        ? { kind: "failure", failure: "revokedSession" }
        : reconciliationOutcome.result?.kind === "failure"
          ? reconciliationOutcome.result
          : reconciliationOutcome.result?.kind === "success"
            ? reconciliationOutcome.result
            : reconciliationOutcome.state?.kind === "authenticated" || stateRef.current.kind === "authenticated"
              ? { kind: "success", next: "authenticated" }
              : reconciliationOutcome.state?.kind === "signedOut" || stateRef.current.kind === "signedOut"
                ? { kind: "failure", failure: "accountNotFound" }
                : { kind: "failure", failure: reconciliationOutcome.state?.kind === "revokedSession" ? "revokedSession" : reconciliationOutcome.state?.kind === "backendUnavailable" ? "backendUnavailable" : "providerUnavailable" };
      if (profilePreparationRef.current === attempt) {
        const completedStateKind = reconciliationOutcome.state?.kind ?? (result.kind === "failure"
          ? result.failure === "revokedSession" ? "revokedSession" : result.failure === "backendUnavailable" ? "backendUnavailable" : result.failure === "signOutPending" ? "signOutPending" : stateRef.current.kind
          : result.next === "authenticated" ? "authenticated" : result.next === "localOffline" ? "localOffline" : result.next === "guest" ? "guest"
            : result.next === "providerRegistrationRequired" ? "providerRegistrationRequired" : result.next === "verificationPending" ? "verificationPending"
              : result.next === "signedOut" ? "signedOut" : stateRef.current.kind);
        if (result.kind === "success") attempt.startupDiagnostic?.ready(completedStateKind);
        else attempt.startupDiagnostic?.failed("profile_completion", new Error(result.failure), completedStateKind);
        profilePreparationRef.current = null;
      }
      if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
      attempt.resolveCompletion(result);
      return result;
    })();
    await completion;
  });
}

async function reconcileAuthenticatedUser(
  ports: Pick<AccountBootstrapCompletionPorts, "planPasswordVerificationCommand" | "disableAccountRemindersForDeletion" | "classifyAccountFailure">,
  auth: FirebaseAuthClient,
  api: PatternlyApiClient,
  runtimeMode: PatternlyRuntimeMode | undefined,
  user: FirebaseAuthUserSnapshot,
  finalize: (user: FirebaseAuthUserSnapshot) => Promise<AccountCommandResult>,
  setState: (state: AccountState) => void,
  canContinue: () => boolean,
): Promise<void> {
  const { planPasswordVerificationCommand, disableAccountRemindersForDeletion, classifyAccountFailure } = ports;
  try {
    if (!canContinue()) return;
    const deletion = getAccountDeletionState();
    if (!canContinue()) return;
    if (deletion?.accountUidHash === sha256Utf8(user.uid)) {
      if (deletion.status === "complete") {
        if (!canContinue()) return;
        await auth.signOut();
        if (auth.getSnapshot() === null) try { clearPremiumCache(); } catch { /* Retried on signed-out hydration. */ }
        if (canContinue()) setState({ kind: "signedOut" });
        return;
      }
      // A matching remote marker already represents an authorized/requested
      // deletion. Resume its status/proof/cleanup path after restart, even if
      // Firebase has revoked the session and /me can no longer be read. The
      // service rejects absent, failed, and mismatched markers, so restore
      // cannot create a new deletion operation here.
      if (deletion.status === "remotePending" || deletion.status === "remoteDeleted" || deletion.status === "localCleanupPending") {
        if (!canContinue()) return;
        const recovered = await retryPendingAccountDeletion(api, deletion.accountId, user.uid, disableAccountRemindersForDeletion);
        if (!canContinue()) return;
        if (recovered?.ok) {
          await auth.signOut();
          if (auth.getSnapshot() === null) try { clearPremiumCache(); } catch { /* Retried on signed-out hydration. */ }
          if (canContinue()) setState({ kind: "signedOut" });
          return;
        }
        // Keep the Firebase user available for an explicit retry or
        // reauthentication. finalizeCurrent projects the matching marker and
        // falls back to its marker-backed identity when /me is revoked.
        await finalize(user);
        return;
      }
    }
    if (!canContinue()) return;
    if (planPasswordVerificationCommand("persisted", runtimeMode, user).kind === "verificationPending") {
      if (canContinue()) setState({ kind: "verificationPending", user });
      return;
    }
    const finalized = await finalize(user);
    if (finalized.kind === "failure" && finalized.failure === "accountNotFound") {
      await completeUnrecognizedPersistedAuthSignOut(auth, user, setState, canContinue);
    }
  } catch (error) {
    if (canContinue()) setState({ kind: classifyAccountFailure(error) === "revokedSession" ? "revokedSession" : "backendUnavailable", user });
  }
}

export async function completeUnrecognizedPersistedAuthSignOut(
  auth: Pick<FirebaseAuthClient, "getSnapshot" | "signOut">,
  user: FirebaseAuthUserSnapshot,
  setState: (state: AccountState) => void,
  canContinue: () => boolean,
): Promise<void> {
  await auth.signOut().catch(() => undefined);
  if (!auth.getSnapshot()) try { clearPremiumCache(); } catch { /* Retried on signed-out hydration. */ }
  if (!canContinue()) return;
  setState(auth.getSnapshot() ? { kind: "signOutPending", user } : { kind: "signedOut" });
}


export type AccountBootstrapAdmissionPorts = Readonly<{
  accountBootstrapRef: Ref<AccountBootstrapCoordinator<ProfilePreparationAttempt | null> | null>;
  accountBootstrapDiagnosticRef: Ref<Readonly<{ uid: string; generation: number; diagnostic: AccountStartupDiagnosticWriter }> | null>;
  profilePreparationRef: Ref<ProfilePreparationAttempt | null>;
  sessionCoordinator: Pick<AccountSessionCoordinator<unknown>, "isCurrent">;
  logoutControl: Pick<LocalLogoutControl, "read" | "completePendingRevoke">;
  pendingSessionRevocationDrainRef: Ref<ReturnType<typeof createPendingSessionRevocationDrain> | null>;
  logoutControlSnapshotRef: Ref<LocalLogoutControlSnapshot>;
  setLogoutControlSnapshot: (snapshot: LocalLogoutControlSnapshot) => void;
  sessionExchangeUidRef: Ref<string | null>;
  startAuthenticatedProfilePreparation: (auth: FirebaseAuthClient, api: PatternlyApiClient, user: FirebaseAuthUserSnapshot, generation: AccountSessionGenerationToken, diagnostic?: AccountStartupDiagnosticWriter) => Promise<ProfilePreparationAttempt | null>;
}>;

export function admitAccountBootstrap(
  ports: AccountBootstrapAdmissionPorts,
  auth: FirebaseAuthClient,
  api: PatternlyApiClient,
  user: FirebaseAuthUserSnapshot,
  generation: AccountSessionGenerationToken,
  startupDiagnostic?: AccountStartupDiagnosticWriter,
  isCurrent: () => boolean = () => ports.sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid,
): Promise<ProfilePreparationAttempt | null> {
  const {
    accountBootstrapRef, accountBootstrapDiagnosticRef, profilePreparationRef, sessionCoordinator,
    logoutControl, pendingSessionRevocationDrainRef, logoutControlSnapshotRef, setLogoutControlSnapshot,
    sessionExchangeUidRef, startAuthenticatedProfilePreparation,
  } = ports;
  if (startupDiagnostic) {
    accountBootstrapDiagnosticRef.current = Object.freeze({ uid: user.uid, generation: generation.generation, diagnostic: startupDiagnostic });
  }
  return accountBootstrapRef.current!.run({
    owner: { uid: user.uid, generation: generation.generation },
    isCurrent,
    ...(startupDiagnostic ? { onJoin: () => {
      const latest = profilePreparationRef.current;
      if ((latest?.kind === "authenticated" || latest?.kind === "localOffline")
        && latest.user?.uid === user.uid && latest.generation?.generation === generation.generation) {
        latest.startupDiagnostic = startupDiagnostic;
      }
    } } : {}),
    drainPendingRevocations: async () => {
      // A fresh control read may discover a revoke after the observer snapshot.
      // Close only on the first admission; joined callbacks must not close a
      // profile that the shared preparation has already activated.
      if (getActiveStorageProfileOrNull()?.kind === "account") closeActiveProfileStorage();
      try {
        const snapshot = await drainPendingSessionRevocations({
          api,
          auth,
          canContinue: isCurrent,
          control: logoutControl,
          executor: pendingSessionRevocationDrainRef.current!,
          generation: generation.generation,
          onSnapshot: (next) => {
            if (!isCurrent()) return;
            logoutControlSnapshotRef.current = next;
            setLogoutControlSnapshot(next);
          },
          onSessionTokenSignIn: () => { sessionExchangeUidRef.current = user.uid; },
          user,
        });
        if (!isCurrent()) throw new AccountSessionGenerationStaleError();
        logoutControlSnapshotRef.current = snapshot;
        setLogoutControlSnapshot(snapshot);
      } finally {
        if (sessionCoordinator.isCurrent(generation) && sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
      }
    },
    prepareProfile: async () => {
      const currentUser = auth.getSnapshot();
      if (!isCurrent() || !currentUser || currentUser.uid !== user.uid) throw new AccountSessionGenerationStaleError();
      const latestDiagnostic = accountBootstrapDiagnosticRef.current;
      const diagnostic = latestDiagnostic?.uid === user.uid && latestDiagnostic.generation === generation.generation
        ? latestDiagnostic.diagnostic
        : startupDiagnostic;
      return startAuthenticatedProfilePreparation(auth, api, currentUser, generation, diagnostic);
    },
    holdUntil: (attempt) => attempt?.completion ?? null,
  });
}
