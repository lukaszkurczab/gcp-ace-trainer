import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { PatternlyApiClientError, createPatternlyApiClient, type MeResponseDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { composePatternlyNativeAppCheck } from "../../infrastructure/clients/patternlyAppCheckToken";
import { createFirebaseAuthClient, firebaseAuthErrorCode, type FirebaseAuthClient, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import { readDevelopmentFirebaseAuthEmulatorOrigin, readFirebaseClientConfiguration, readPublicEnvironmentFromRuntime } from "../../infrastructure/firebase/publicConfig";
import { completeRemoteRevokedSignOut, confirmAccountDataAdoption, deleteBoundAccount, discardGuestDataAndLoadAccount, loadAccountDataSession, prepareAccountSignOut, retryAccountDataSync, retryPendingAccountDataSync, type AccountDataSession } from "./accountDataService";
import { getAccountDeletionState } from "../../storage/repositories/accountLifecycleRepository";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { readPatternlyRuntimeMode, requiresVerifiedPasswordIdentity, type PatternlyRuntimeMode } from "../../infrastructure/runtime/runtimeMode";
import { grantGuestAccess, hasGuestAccess, revokeGuestAccess } from "../../storage/repositories/guestAccessRepository";
import { hasUnboundGuestInstallation } from "../../storage/repositories/guestInstallationRepository";

export type AccountFailure = "backendUnavailable" | "conflict" | "duplicate" | "expiredAction" | "invalid" | "invalidCredential" | "invalidEmail" | "invalidRecoveryCode" | "journalRecoveryFailure" | "localCleanupFailure" | "localDeletionFailure" | "offline" | "passwordMismatch" | "pendingSyncRequiresNetwork" | "providerUnavailable" | "rateLimited" | "reauthenticationRequired" | "recoveryCodeUsed" | "remoteDeletionPending" | "remoteFailure" | "revokedSession" | "sessionRevocationPending" | "signOutPending" | "unverifiedIdentity" | "weakPassword";
export type AccountCommandResult = Readonly<{ kind: "failure"; failure: AccountFailure } | { kind: "success"; next: "authenticated" | "recoveryAccepted" | "recoveryCodesIssued" | "verificationPending" | "signedOut"; recoveryCodes?: readonly string[] }>;
export type PasswordVerificationCommand = "register" | "signIn" | "resend" | "persisted" | "refresh";
export type PasswordVerificationPlan =
  | Readonly<{ kind: "finalize" }>
  | Readonly<{ kind: "verificationPending"; action: "none" | "resend" | "signOut" }>;

export type AccountState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "unavailable"; reason: "auth_restore_timeout" | "firebase_unconfigured" | "public_environment_unconfigured" | "public_environment_invalid" }>
  | Readonly<{ kind: "signedOut" }>
  | Readonly<{ kind: "guest" }>
  | Readonly<{ kind: "guestAccessBlocked" }>
  | Readonly<{ kind: "verificationPending"; user: FirebaseAuthUserSnapshot }>
  | Readonly<{ kind: "authenticated"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "signingOut"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "deleting"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "backendUnavailable" | "revokedSession"; user: FirebaseAuthUserSnapshot }>;

export type AccountSessionContextValue = Readonly<{
  applyVerificationCode: (code: string) => Promise<AccountCommandResult>;
  confirmPasswordReset: (code: string, password: string) => Promise<AccountCommandResult>;
  requestPasswordRecovery: (email: string) => Promise<AccountCommandResult>;
  retrySessionRestore: () => void;
  refreshVerification: () => Promise<AccountCommandResult>;
  register: (email: string, password: string) => Promise<AccountCommandResult>;
  resendVerification: () => Promise<AccountCommandResult>;
  signIn: (email: string, password: string) => Promise<AccountCommandResult>;
  signInWithApple: () => Promise<AccountCommandResult>;
  signInWithGoogle: (idToken: string) => Promise<AccountCommandResult>;
  confirmAdoption: (resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[] ) => Promise<AccountCommandResult>;
  continueAsGuest: () => void;
  retryAccountSync: () => Promise<AccountCommandResult>;
  retryPendingAccountSync: () => Promise<AccountCommandResult>;
  deleteAccount: (password: string) => Promise<AccountCommandResult>;
  issueRecoveryCodes: (password?: string) => Promise<AccountCommandResult>;
  consumeRecoveryCode: (code: string) => Promise<AccountCommandResult>;
  discardGuestData: () => Promise<AccountCommandResult>;
  signOut: () => Promise<AccountCommandResult>;
  state: AccountState;
}>;

const AccountSessionContext = createContext<AccountSessionContextValue | null>(null);

export const AUTH_INITIALIZATION_TIMEOUT_MS = 15_000;

export type AccountSessionGenerationToken = Readonly<{ generation: number; uid: string }>;

export class AccountSessionGenerationStaleError extends Error {
  public constructor() {
    super("account_session_generation_stale");
    this.name = "AccountSessionGenerationStaleError";
  }
}

export type AccountSessionCoordinator<T> = Readonly<{
  activate: () => void;
  begin: (uid: string) => AccountSessionGenerationToken;
  dispose: () => void;
  invalidate: () => void;
  isCurrent: (token: AccountSessionGenerationToken) => boolean;
  restart: (uid: string) => AccountSessionGenerationToken;
  run: (token: AccountSessionGenerationToken, operation: (token: AccountSessionGenerationToken) => Promise<T>) => Promise<T>;
}>;

/**
 * Shares one account finalization per UID and generation. A completed result
 * remains reusable only until sign-out, a UID change, retry, or disposal.
 */
export function createAccountSessionCoordinator<T>(publish: (token: AccountSessionGenerationToken, value: T) => void): AccountSessionCoordinator<T> {
  let generation = 0;
  let activeUid: string | null = null;
  let disposed = false;
  let cached: Readonly<{ token: AccountSessionGenerationToken; promise: Promise<T> }> | null = null;

  const tokenMatches = (token: AccountSessionGenerationToken): boolean => token.generation === generation && token.uid === activeUid;
  const isCurrent = (token: AccountSessionGenerationToken): boolean => !disposed && tokenMatches(token);
  const invalidate = (): void => {
    generation += 1;
    activeUid = null;
    cached = null;
  };
  const begin = (uid: string): AccountSessionGenerationToken => {
    if (activeUid !== uid) {
      generation += 1;
      activeUid = uid;
      cached = null;
    }
    return Object.freeze({ generation, uid });
  };
  const restart = (uid: string): AccountSessionGenerationToken => {
    generation += 1;
    activeUid = uid;
    cached = null;
    return Object.freeze({ generation, uid });
  };
  const run = (token: AccountSessionGenerationToken, operation: (token: AccountSessionGenerationToken) => Promise<T>): Promise<T> => {
    if (!isCurrent(token)) return Promise.reject(new AccountSessionGenerationStaleError());
    if (cached && tokenMatches(cached.token)) return cached.promise;
    const promise = Promise.resolve()
      .then(() => operation(token))
      .then((value) => {
        if (isCurrent(token)) publish(token, value);
        return value;
      })
      .catch((error: unknown) => {
        if (cached?.promise === promise) cached = null;
        throw error;
      });
    cached = Object.freeze({ token, promise });
    return promise;
  };
  return Object.freeze({
    activate: () => { disposed = false; invalidate(); },
    begin,
    dispose: () => { disposed = true; invalidate(); },
    invalidate,
    isCurrent,
    restart,
    run,
  });
}

type FinalizationOutcome = Readonly<{ result: AccountCommandResult; state?: AccountState }>;

export function PatternlyAccountProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<AccountState>({ kind: "loading" });
  const [authClient, setAuthClient] = useState<FirebaseAuthClient | null>(null);
  const [apiClient, setApiClient] = useState<ReturnType<typeof createPatternlyApiClient> | null>(null);
  const [runtimeMode] = useState<PatternlyRuntimeMode | undefined>(readPatternlyRuntimeMode);
  const [authInitializationRevision, setAuthInitializationRevision] = useState(0);
  const sessionCoordinatorRef = useRef<AccountSessionCoordinator<FinalizationOutcome> | null>(null);
  const observerBlockedUidRef = useRef<string | null>(null);
  if (!sessionCoordinatorRef.current) {
    sessionCoordinatorRef.current = createAccountSessionCoordinator((_token, outcome) => {
      if (outcome.state) setState(outcome.state);
    });
  }
  const sessionCoordinator = sessionCoordinatorRef.current;

  const finalizeCurrent = useCallback(async (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>, user: FirebaseAuthUserSnapshot | null = auth.getSnapshot(), restart = false, expectedToken?: AccountSessionGenerationToken): Promise<AccountCommandResult> => {
    if (!user || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
    const token = expectedToken ?? (restart ? sessionCoordinator.restart(user.uid) : sessionCoordinator.begin(user.uid));
    if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
    try {
      const outcome = await sessionCoordinator.run(token, async () => {
        if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
        try {
          const response = await api.getMe();
          // Keep this guard immediately before local account loading. The data
          // service may persist state, so stale generations must not enter it.
          if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
          const accountData = await loadAccountDataSession(api, response.user.id);
          if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
          revokeGuestAccess();
          return {
            result: { kind: "success", next: "authenticated" },
            state: { kind: "authenticated", backendUser: response.user, user, accountData },
          };
        } catch (error) {
          if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
          const failure = classifyAccountFailure(error);
          return {
            result: { kind: "failure", failure },
            state: { kind: failure === "revokedSession" ? "revokedSession" : "backendUnavailable", user },
          };
        }
      });
      return outcome.result;
    } catch (error) {
      return error instanceof AccountSessionGenerationStaleError
        ? { kind: "failure", failure: "revokedSession" }
        : { kind: "failure", failure: classifyAccountFailure(error) };
    }
  }, [sessionCoordinator]);

  const retrySessionRestore = useCallback(() => {
    sessionCoordinator.invalidate();
    observerBlockedUidRef.current = null;
    setState({ kind: "loading" });
    setAuthInitializationRevision((revision) => revision + 1);
  }, [sessionCoordinator]);

  useEffect(() => {
    sessionCoordinator.activate();
    observerBlockedUidRef.current = null;
    let live = true;
    let unsubscribe: (() => void) | undefined;
    let observerDetached = false;
    let observerResolved = false;
    let observedUid: string | null = null;
    let initializationTimeout: ReturnType<typeof setTimeout> | undefined;
    const detachObserver = () => {
      if (observerDetached) return;
      observerDetached = true;
      if (initializationTimeout !== undefined) clearTimeout(initializationTimeout);
      unsubscribe?.();
      unsubscribe = undefined;
    };
    const publish = (nextState: AccountState) => {
      if (live && !observerDetached) setState(nextState);
    };
    const smokeRuntime = runtimeMode === "smoke";
    const guestAccess = hasGuestAccess();
    const persistedGuestState = (): AccountState => hasUnboundGuestInstallation() ? { kind: "guest" } : { kind: "guestAccessBlocked" };
    const publicEnvironment = readPublicEnvironmentFromRuntime();
    if (!smokeRuntime && publicEnvironment.kind !== "configured") {
      publish(guestAccess ? persistedGuestState() : { kind: "unavailable", reason: publicEnvironment.reason === "invalid_public_environment" ? "public_environment_invalid" : "public_environment_unconfigured" });
      return () => { live = false; observerBlockedUidRef.current = null; sessionCoordinator.dispose(); };
    }
    const firebaseConfiguration = readFirebaseClientConfiguration();
    if (firebaseConfiguration.kind !== "configured") {
      publish(guestAccess ? persistedGuestState() : { kind: "unavailable", reason: "firebase_unconfigured" });
      return () => { live = false; observerBlockedUidRef.current = null; sessionCoordinator.dispose(); };
    }
    const androidProvider = process.env.EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER;
    const appleProvider = process.env.EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER;
    if (androidProvider === "debug" || androidProvider === "playIntegrity") {
      if (appleProvider === "debug" || appleProvider === "deviceCheck" || appleProvider === "appAttest" || appleProvider === "appAttestWithDeviceCheckFallback") {
        void composePatternlyNativeAppCheck({ androidProvider, appleProvider });
      } else {
        void composePatternlyNativeAppCheck({ androidProvider });
      }
    }
    let auth: FirebaseAuthClient;
    try {
      const authEmulatorOrigin = readDevelopmentFirebaseAuthEmulatorOrigin();
      const apiOrigin = smokeRuntime
        ? process.env.EXPO_PUBLIC_PATTERNLY_API_ORIGIN
        : publicEnvironment.kind === "configured" ? publicEnvironment.value.apiOrigin : undefined;
      const authActionOrigin = smokeRuntime
        ? apiOrigin
        : publicEnvironment.kind === "configured" ? publicEnvironment.value.authActionOrigin : undefined;
      if (!apiOrigin || !authActionOrigin || (smokeRuntime && !authEmulatorOrigin)) {
        publish(guestAccess ? persistedGuestState() : { kind: "unavailable", reason: "public_environment_unconfigured" });
        return () => { live = false; observerBlockedUidRef.current = null; sessionCoordinator.dispose(); };
      }
      auth = createFirebaseAuthClient({
        authActionOrigin,
        authEmulatorOrigin,
        config: firebaseConfiguration.value,
      });
      const client = createPatternlyApiClient({ allowLocalHttpForSimulator: smokeRuntime, apiOrigin, getIdToken: auth.getIdToken });
      setAuthClient(auth);
      setApiClient(client);
      initializationTimeout = setTimeout(() => {
        if (!live || observerResolved) return;
        detachObserver();
        setState({ kind: "unavailable", reason: "auth_restore_timeout" });
      }, AUTH_INITIALIZATION_TIMEOUT_MS);
      unsubscribe = auth.onUserChanged((user) => {
        if (!live || observerDetached) return;
        if (!observerResolved) {
          observerResolved = true;
          if (initializationTimeout !== undefined) clearTimeout(initializationTimeout);
        }
        if (!user) {
          observerBlockedUidRef.current = null;
          observedUid = null;
          sessionCoordinator.invalidate();
          publish(hasGuestAccess() ? persistedGuestState() : { kind: "signedOut" });
          return;
        }
        if (observerBlockedUidRef.current === user.uid) return;
        const uidChanged = observedUid !== null && observedUid !== user.uid;
        observedUid = user.uid;
        const generation = sessionCoordinator.begin(user.uid);
        const isCurrentObserver = () => live && !observerDetached && sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === generation.uid;
        if (uidChanged && isCurrentObserver()) setState({ kind: "loading" });
        void reconcileAuthenticatedUser(
          auth,
          client,
          runtimeMode,
          user,
          (nextUser) => finalizeCurrent(auth, client, nextUser, false, generation),
          (nextState) => { if (isCurrentObserver()) setState(nextState); },
          isCurrentObserver,
        );
      });
      return () => {
        live = false;
        observerBlockedUidRef.current = null;
        detachObserver();
        sessionCoordinator.dispose();
      };
    } catch {
      publish({ kind: "unavailable", reason: "firebase_unconfigured" });
      return () => { live = false; observerBlockedUidRef.current = null; sessionCoordinator.dispose(); };
    }
  }, [authInitializationRevision, finalizeCurrent, runtimeMode, sessionCoordinator]);

  const runWithAuth = useCallback(async (operation: (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>) => Promise<AccountCommandResult>): Promise<AccountCommandResult> => {
    if (!authClient || !apiClient) return { kind: "failure", failure: "providerUnavailable" };
    try { return await operation(authClient, apiClient); } catch (error) { return { kind: "failure", failure: classifyAccountFailure(error) }; }
  }, [apiClient, authClient]);

  const value = useMemo<AccountSessionContextValue>(() => ({
    continueAsGuest: () => {
      sessionCoordinator.invalidate();
      if (!hasUnboundGuestInstallation()) {
        setState({ kind: "guestAccessBlocked" });
        return;
      }
      grantGuestAccess();
      setState({ kind: "guest" });
    },
    applyVerificationCode: (code) => runWithAuth(async (auth, api) => {
      if (!code.trim()) return { kind: "failure", failure: "invalid" };
      await auth.applyActionCode(code.trim());
      return finalizeCurrent(auth, api, auth.getSnapshot(), true);
    }),
    confirmPasswordReset: (code, password) => runWithAuth(async (auth) => {
      if (!code.trim()) return { kind: "failure", failure: "invalid" };
      if (!isValidPassword(password)) return { kind: "failure", failure: "weakPassword" };
      sessionCoordinator.invalidate();
      const user = auth.getSnapshot();
      const generation = user ? sessionCoordinator.begin(user.uid) : null;
      if (user) observerBlockedUidRef.current = user.uid;
      const canContinue = () => user
        ? sessionCoordinator.isCurrent(generation!) && auth.getSnapshot()?.uid === user.uid
        : auth.getSnapshot() === null;
      const clearBlockedUid = () => {
        if (user && observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
      };
      try {
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        await auth.confirmPasswordReset(code.trim(), password);
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        await auth.signOut();
        const afterSignOut = auth.getSnapshot();
        if (afterSignOut && user && afterSignOut.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
        setState({ kind: "signedOut" });
        return { kind: "success", next: "signedOut" };
      } finally {
        clearBlockedUid();
      }
    }),
    requestPasswordRecovery: (email) => runWithAuth(async (auth) => {
      if (!isValidEmail(email)) return { kind: "failure", failure: "invalidEmail" };
      try {
        await auth.requestPasswordRecovery(email.trim().toLowerCase());
      } catch (error) {
        if (!isNonEnumeratingRecoveryError(error)) throw error;
      }
      return { kind: "success", next: "recoveryAccepted" };
    }),
    retrySessionRestore,
    refreshVerification: () => runWithAuth(async (auth, api) => {
      const previousUser = auth.getSnapshot();
      sessionCoordinator.invalidate();
      const generation = previousUser ? sessionCoordinator.begin(previousUser.uid) : null;
      if (previousUser) observerBlockedUidRef.current = previousUser.uid;
      const canContinue = (user: FirebaseAuthUserSnapshot | null) => previousUser
        ? user?.uid === previousUser.uid && sessionCoordinator.isCurrent(generation!) && auth.getSnapshot()?.uid === previousUser.uid
        : user !== null && auth.getSnapshot()?.uid === user.uid;
      try {
        const user = await auth.refreshVerification();
        if (!user) return { kind: "failure", failure: "revokedSession" };
        if (!canContinue(user)) return { kind: "failure", failure: "revokedSession" };
        const plan = planPasswordVerificationCommand("refresh", runtimeMode, user);
        if (plan.kind === "verificationPending") {
          setState({ kind: "verificationPending", user });
          return { kind: "failure", failure: "unverifiedIdentity" };
        }
        const token = generation ?? sessionCoordinator.begin(user.uid);
        return finalizeCurrent(auth, api, user, false, token);
      } finally {
        if (previousUser && observerBlockedUidRef.current === previousUser.uid) observerBlockedUidRef.current = null;
      }
    }),
    register: (email, password) => runWithAuth(async (auth, api) => {
      if (!isValidEmail(email)) return { kind: "failure", failure: "invalidEmail" };
      if (!isValidPassword(password)) return { kind: "failure", failure: "weakPassword" };
      sessionCoordinator.invalidate();
      let user: FirebaseAuthUserSnapshot;
      try {
        user = await auth.register(email.trim().toLowerCase(), password);
      } catch (error) {
        if (firebaseAuthErrorCode(error) === "auth/email-already-in-use") return { kind: "failure", failure: "duplicate" };
        throw error;
      }
      const plan = planPasswordVerificationCommand("register", runtimeMode, user);
      if (plan.kind === "finalize") {
        return finalizeCurrent(auth, api, user);
      }
      const generation = sessionCoordinator.begin(user.uid);
      observerBlockedUidRef.current = user.uid;
      try {
        if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
        await auth.resendVerification();
        if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
        setState({ kind: "verificationPending", user });
        return { kind: "success", next: "verificationPending" };
      } finally {
        if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
      }
    }),
    resendVerification: () => runWithAuth(async (auth, api) => {
      const user = auth.getSnapshot();
      if (!user) return { kind: "failure", failure: "providerUnavailable" };
      const plan = planPasswordVerificationCommand("resend", runtimeMode, user);
      if (plan.kind === "finalize") {
        return finalizeCurrent(auth, api, user, true);
      }
      await auth.resendVerification();
      return { kind: "success", next: "verificationPending" };
    }),
    signIn: (email, password) => runWithAuth(async (auth, api) => {
      if (!isValidEmail(email)) return { kind: "failure", failure: "invalidEmail" };
      if (password.length === 0) return { kind: "failure", failure: "invalid" };
      sessionCoordinator.invalidate();
      const user = await auth.signIn(email.trim().toLowerCase(), password);
      const plan = planPasswordVerificationCommand("signIn", runtimeMode, user);
      if (plan.kind === "verificationPending") {
        const generation = sessionCoordinator.restart(user.uid);
        observerBlockedUidRef.current = user.uid;
        try {
          if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
          await auth.signOut();
          const afterSignOut = auth.getSnapshot();
          if (afterSignOut && afterSignOut.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
          setState({ kind: "signedOut" });
          return { kind: "failure", failure: "unverifiedIdentity" };
        } finally {
          if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
        }
      }
      return finalizeCurrent(auth, api, user);
    }),
    signInWithApple: () => runWithAuth(async (auth, api) => {
      sessionCoordinator.invalidate();
      const user = await auth.signInWithApple();
      return finalizeCurrent(auth, api, user);
    }),
    signInWithGoogle: (idToken) => runWithAuth(async (auth, api) => {
      sessionCoordinator.invalidate();
      const user = await auth.signInWithGoogle(idToken);
      return finalizeCurrent(auth, api, user);
    }),
    confirmAdoption: (resolutions) => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated" || !state.accountData.preview) return { kind: "failure", failure: "conflict" };
      const generation = sessionCoordinator.restart(current.uid);
      const next = await confirmAccountDataAdoption(api, state.backendUser.id, state.accountData.preview, resolutions);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      return next.status === "synced" ? { kind: "success", next: "authenticated" } : { kind: "failure", failure: next.lastFailureCode === "offline" ? "offline" : "conflict" };
    }),
    retryAccountSync: () => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated") return { kind: "failure", failure: "providerUnavailable" };
      const generation = sessionCoordinator.restart(current.uid);
      const next = await retryAccountDataSync(api, state.backendUser.id);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      return next.status === "synced" || next.status === "previewReady" ? { kind: "success", next: "authenticated" } : { kind: "failure", failure: next.lastFailureCode === "offline" ? "offline" : "remoteFailure" };
    }),
    retryPendingAccountSync: () => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated" || state.user.uid !== current.uid) return { kind: "failure", failure: "providerUnavailable" };
      const generation = sessionCoordinator.restart(current.uid);
      const next = await retryPendingAccountDataSync(api, state.backendUser.id);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      if (!next) return { kind: "success", next: "authenticated" };
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      return next.status === "synced" ? { kind: "success", next: "authenticated" } : { kind: "failure", failure: next.lastFailureCode === "offline" ? "offline" : "remoteFailure" };
    }),
    signOut: () => runWithAuth(async (auth, api) => {
      const user = auth.getSnapshot();
      sessionCoordinator.invalidate();
      const generation = user ? sessionCoordinator.begin(user.uid) : null;
      if (user) observerBlockedUidRef.current = user.uid;
      const canContinue = () => user
        ? sessionCoordinator.isCurrent(generation!) && auth.getSnapshot()?.uid === user.uid
        : auth.getSnapshot() === null;
      const clearBlockedUid = () => {
        if (user && observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
      };
      try {
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        if (user && state.kind === "authenticated") {
          setState({ kind: "signingOut", backendUser: state.backendUser, user, accountData: state.accountData });
          const prepared = await prepareAccountSignOut(api, state.backendUser.id);
          if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
          if (!prepared.ok) {
            const preservedBindingMismatch = state.accountData.lastFailureCode === "account_binding_mismatch";
            const lastFailureCode = preservedBindingMismatch ? "account_binding_mismatch" : prepared.failure;
            setState({ kind: "authenticated", backendUser: state.backendUser, user, accountData: { ...state.accountData, status: prepared.failure === "signOutPending" ? "signOutPending" : state.accountData.status, lastFailureCode } });
            return { kind: "failure", failure: prepared.failure === "signOutPending" ? "signOutPending" : prepared.failure };
          }
        }
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        try {
          await auth.signOut();
        } catch {
          if (auth.getSnapshot()?.uid === user?.uid) {
            setState({ kind: "revokedSession", user: auth.getSnapshot() ?? user ?? { uid: "unknown", email: null, emailVerified: false, provider: "password" } });
          }
          return { kind: "failure", failure: "revokedSession" };
        }
        const afterSignOut = auth.getSnapshot();
        if (afterSignOut && user && afterSignOut.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
        revokeGuestAccess();
        setState({ kind: "signedOut" });
        return { kind: "success", next: "signedOut" };
      } finally {
        clearBlockedUid();
      }
    }),
    deleteAccount: (password) => runWithAuth(async (auth, api) => {
      const user = auth.getSnapshot();
      if (!user || state.kind !== "authenticated") return { kind: "failure", failure: "providerUnavailable" };
      if (user.provider !== "password" || password.length < 8) return { kind: "failure", failure: "reauthenticationRequired" };
      sessionCoordinator.invalidate();
      const generation = sessionCoordinator.begin(user.uid);
      observerBlockedUidRef.current = user.uid;
      const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
      const clearBlockedUid = () => {
        if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
      };
      try {
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        setState({ kind: "deleting", backendUser: state.backendUser, user, accountData: state.accountData });
        try {
          await auth.reauthenticateWithPassword(password);
        } catch (error) {
          if (canContinue()) setState({ kind: "authenticated", backendUser: state.backendUser, user, accountData: state.accountData });
          const failure = classifyAccountFailure(error);
          return { kind: "failure", failure: failure === "invalidCredential" ? "reauthenticationRequired" : failure };
        }
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        const result = await deleteBoundAccount(api, state.backendUser.id, user.uid);
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        if (!result.ok) {
          setState({ kind: "authenticated", backendUser: state.backendUser, user, accountData: { ...state.accountData, status: result.failure === "remoteDeletionPending" ? "remoteDeletionPending" : result.failure === "localCleanupFailure" ? "localCleanupPending" : state.accountData.status, lastFailureCode: result.failure } });
          return { kind: "failure", failure: result.failure };
        }
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        try {
          await auth.signOut();
        } catch {
          if (auth.getSnapshot()?.uid === user.uid) setState({ kind: "revokedSession", user: auth.getSnapshot() ?? user });
          return { kind: "failure", failure: "revokedSession" };
        }
        const afterSignOut = auth.getSnapshot();
        if (afterSignOut && afterSignOut.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
        revokeGuestAccess();
        setState({ kind: "signedOut" });
        return { kind: "success", next: "signedOut" };
      } finally {
        clearBlockedUid();
      }
    }),
    issueRecoveryCodes: (password) => runWithAuth(async (auth, api) => {
      const user = auth.getSnapshot();
      if (!user || state.kind !== "authenticated") return { kind: "failure", failure: "providerUnavailable" };
      if (password !== undefined && (user.provider !== "password" || password.length < 8)) return { kind: "failure", failure: "reauthenticationRequired" };
      try {
        if (password !== undefined) await auth.reauthenticateWithPassword(password);
        const issued = await api.issueRecoveryCodes();
        if (auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
        return { kind: "success", next: "recoveryCodesIssued", recoveryCodes: issued.codes };
      } catch (error) {
        const failure = classifyAccountFailure(error);
        return { kind: "failure", failure: failure === "invalidCredential" ? "reauthenticationRequired" : failure };
      }
    }),
    consumeRecoveryCode: (code) => runWithAuth(async (auth, api) => {
      if (!/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u.test(code.trim().toUpperCase())) return { kind: "failure", failure: "invalidRecoveryCode" };
      const token = await api.consumeRecoveryCode(code.trim().toUpperCase());
      sessionCoordinator.invalidate();
      const user = await auth.signInWithRecoveryToken(token.customToken);
      return finalizeCurrent(auth, api, user);
    }),
    discardGuestData: () => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated") return { kind: "failure", failure: "providerUnavailable" };
      const generation = sessionCoordinator.restart(current.uid);
      const next = await discardGuestDataAndLoadAccount(api, state.backendUser.id);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      if (next.status === "synced") {
        revokeGuestAccess();
        setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
        return { kind: "success", next: "authenticated" };
      }
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      if (next.lastFailureCode === "offline") return { kind: "failure", failure: "offline" };
      if (next.status === "conflict") return { kind: "failure", failure: "conflict" };
      return { kind: "failure", failure: "remoteFailure" };
    }),
    state,
  }), [apiClient, retrySessionRestore, runWithAuth, runtimeMode, sessionCoordinator, state]);

  return <AccountSessionContext.Provider value={value}>{children}</AccountSessionContext.Provider>;
}

export function usePatternlyAccount(): AccountSessionContextValue {
  const context = useContext(AccountSessionContext);
  if (!context) throw new Error("patternly_account_provider_required");
  return context;
}

async function reconcileAuthenticatedUser(
  auth: FirebaseAuthClient,
  api: ReturnType<typeof createPatternlyApiClient>,
  runtimeMode: PatternlyRuntimeMode | undefined,
  user: FirebaseAuthUserSnapshot,
  finalize: (user: FirebaseAuthUserSnapshot) => Promise<AccountCommandResult>,
  setState: (state: AccountState) => void,
  canContinue: () => boolean,
): Promise<void> {
  try {
    if (!canContinue()) return;
    const deletion = getAccountDeletionState();
    if (!canContinue()) return;
    if (deletion?.accountUidHash === sha256Utf8(user.uid)) {
      if (deletion.status === "complete") {
        if (!canContinue()) return;
        await auth.signOut();
        if (canContinue()) setState({ kind: "signedOut" });
        return;
      }
      if (!canContinue()) return;
      const recovered = await deleteBoundAccount(api, deletion.accountId, user.uid);
      if (recovered.ok) {
        if (!canContinue()) return;
        await auth.signOut();
        if (canContinue()) setState({ kind: "signedOut" });
        return;
      }
    }
    if (!canContinue()) return;
    if (await completeRemoteRevokedSignOut()) {
      if (!canContinue()) return;
      await auth.signOut();
      if (canContinue()) setState({ kind: "signedOut" });
      return;
    }
    if (!canContinue()) return;
    if (planPasswordVerificationCommand("persisted", runtimeMode, user).kind === "verificationPending") {
      if (canContinue()) setState({ kind: "verificationPending", user });
      return;
    }
    await finalize(user);
  } catch (error) {
    if (canContinue()) setState({ kind: classifyAccountFailure(error) === "revokedSession" ? "revokedSession" : "backendUnavailable", user });
  }
}

export function requiresPasswordEmailVerification(runtimeMode: PatternlyRuntimeMode | undefined, user: FirebaseAuthUserSnapshot): boolean {
  return user.provider === "password" && !user.emailVerified && requiresVerifiedPasswordIdentity(runtimeMode);
}

/**
 * Keeps every password-identity entry point on one explicit decision: local
 * smoke can finalize an unverified password user, while all other runtimes
 * remain on the verification path.
 */
export function planPasswordVerificationCommand(command: PasswordVerificationCommand, runtimeMode: PatternlyRuntimeMode | undefined, user: FirebaseAuthUserSnapshot): PasswordVerificationPlan {
  if (!requiresPasswordEmailVerification(runtimeMode, user)) return { kind: "finalize" };
  if (command === "register" || command === "resend") return { kind: "verificationPending", action: "resend" };
  if (command === "signIn") return { kind: "verificationPending", action: "signOut" };
  return { kind: "verificationPending", action: "none" };
}

export function classifyAccountFailure(error: unknown): AccountFailure {
  if (error instanceof PatternlyApiClientError) {
    if (error.serverCode === "recovery_code_invalid") return "invalidRecoveryCode";
    if (error.serverCode === "recovery_code_used") return "recoveryCodeUsed";
    if (error.serverCode === "recent_reauthentication_required") return "reauthenticationRequired";
    if (error.status === 401 || error.serverCode === "account_deleted" || error.serverCode === "authentication_required") return "revokedSession";
    if (error.status !== undefined && error.status >= 500) return "backendUnavailable";
    if (error.code === "transport_failed" || error.code === "request_timeout") return "offline";
    return "backendUnavailable";
  }
  const code = firebaseAuthErrorCode(error);
  if (code === "auth/credential-already-in-use" || code === "auth/provider-already-linked") return "duplicate";
  if (code === "auth/weak-password") return "weakPassword";
  if (code === "auth/invalid-email") return "invalidEmail";
  if (["auth/missing-password", "auth/invalid-action-code", "auth/invalid-verification-code", "auth/argument-error"].includes(code)) return "invalid";
  if (["auth/expired-action-code", "auth/code-expired"].includes(code)) return "expiredAction";
  if (["auth/too-many-requests", "auth/quota-exceeded"].includes(code)) return "rateLimited";
  if (["auth/network-request-failed", "auth/timeout"].includes(code)) return "offline";
  if (["auth/user-token-expired", "auth/invalid-user-token", "auth/user-disabled"].includes(code)) return "revokedSession";
  if (["auth/requires-recent-login", "auth/reauthentication-provider-unavailable"].includes(code)) return "reauthenticationRequired";
  if (["auth/operation-not-allowed", "auth/app-not-authorized", "auth/invalid-api-key", "auth/invalid-app-id", "auth/provider-unavailable", "auth/apple-unavailable"].includes(code)) return "providerUnavailable";
  if (["auth/wrong-password", "auth/invalid-credential", "auth/email-already-in-use", "auth/user-not-found"].includes(code)) return "invalidCredential";
  return "providerUnavailable";
}

export function isNonEnumeratingRecoveryError(error: unknown): boolean {
  return ["auth/user-not-found", "auth/invalid-credential", "auth/email-not-found"].includes(firebaseAuthErrorCode(error));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email.trim());
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}
