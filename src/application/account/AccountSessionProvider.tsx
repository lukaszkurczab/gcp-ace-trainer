import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { PatternlyApiClientError, createPatternlyApiClient, type MeResponseDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { composePatternlyNativeAppCheck } from "../../infrastructure/clients/patternlyAppCheckToken";
import { createFirebaseAuthClient, firebaseAuthErrorCode, type FirebaseAuthClient, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import { readFirebaseClientConfiguration, readPublicEnvironmentFromRuntime } from "../../infrastructure/firebase/publicConfig";
import { confirmAccountDataAdoption, loadAccountDataSession, prepareAccountSignOut, retryAccountDataSync, type AccountDataSession } from "./accountDataService";

export type AccountFailure = "backendUnavailable" | "conflict" | "duplicate" | "expiredAction" | "invalid" | "invalidCredential" | "journalRecoveryFailure" | "localDeletionFailure" | "offline" | "passwordMismatch" | "pendingSyncRequiresNetwork" | "providerUnavailable" | "rateLimited" | "remoteFailure" | "revokedSession" | "unverifiedIdentity";
export type AccountCommandResult = Readonly<{ kind: "failure"; failure: AccountFailure } | { kind: "success"; next: "authenticated" | "recoveryAccepted" | "verificationPending" }>;

export type AccountState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "unavailable"; reason: "firebase_unconfigured" | "public_environment_unconfigured" | "public_environment_invalid" }>
  | Readonly<{ kind: "signedOut" }>
  | Readonly<{ kind: "verificationPending"; user: FirebaseAuthUserSnapshot }>
  | Readonly<{ kind: "authenticated"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "backendUnavailable" | "revokedSession"; user: FirebaseAuthUserSnapshot }>;

export type AccountSessionContextValue = Readonly<{
  applyVerificationCode: (code: string) => Promise<AccountCommandResult>;
  confirmPasswordReset: (code: string, password: string) => Promise<AccountCommandResult>;
  requestPasswordRecovery: (email: string) => Promise<AccountCommandResult>;
  refreshVerification: () => Promise<AccountCommandResult>;
  register: (email: string, password: string) => Promise<AccountCommandResult>;
  resendVerification: () => Promise<AccountCommandResult>;
  signIn: (email: string, password: string) => Promise<AccountCommandResult>;
  signInWithApple: () => Promise<AccountCommandResult>;
  signInWithGoogle: (idToken: string) => Promise<AccountCommandResult>;
  confirmAdoption: (resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[] ) => Promise<AccountCommandResult>;
  retryAccountSync: () => Promise<AccountCommandResult>;
  signOut: () => Promise<AccountCommandResult>;
  state: AccountState;
}>;

const AccountSessionContext = createContext<AccountSessionContextValue | null>(null);

export function PatternlyAccountProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<AccountState>({ kind: "loading" });
  const [authClient, setAuthClient] = useState<FirebaseAuthClient | null>(null);
  const [apiClient, setApiClient] = useState<ReturnType<typeof createPatternlyApiClient> | null>(null);

  useEffect(() => {
    const publicEnvironment = readPublicEnvironmentFromRuntime();
    if (publicEnvironment.kind !== "configured") {
      setState({ kind: "unavailable", reason: publicEnvironment.reason === "invalid_public_environment" ? "public_environment_invalid" : "public_environment_unconfigured" });
      return undefined;
    }
    const firebaseConfiguration = readFirebaseClientConfiguration();
    if (firebaseConfiguration.kind !== "configured") {
      setState({ kind: "unavailable", reason: "firebase_unconfigured" });
      return undefined;
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
      auth = createFirebaseAuthClient({
        authActionOrigin: publicEnvironment.value.authActionOrigin,
        authEmulatorOrigin: process.env.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN,
        config: firebaseConfiguration.value,
      });
      const client = createPatternlyApiClient({ apiOrigin: publicEnvironment.value.apiOrigin, getIdToken: auth.getIdToken });
      setAuthClient(auth);
      setApiClient(client);
      const unsubscribe = auth.onUserChanged((user) => {
        if (!user) {
          setState({ kind: "signedOut" });
          return;
        }
        void reconcileAuthenticatedUser(auth, client, user, setState);
      });
      return unsubscribe;
    } catch {
      setState({ kind: "unavailable", reason: "firebase_unconfigured" });
      return undefined;
    }
  }, []);

  const runWithAuth = useCallback(async (operation: (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>) => Promise<AccountCommandResult>): Promise<AccountCommandResult> => {
    if (!authClient || !apiClient) return { kind: "failure", failure: "providerUnavailable" };
    try { return await operation(authClient, apiClient); } catch (error) { return { kind: "failure", failure: classifyAccountFailure(error) }; }
  }, [apiClient, authClient]);

  const value = useMemo<AccountSessionContextValue>(() => ({
    applyVerificationCode: (code) => runWithAuth(async (auth) => {
      if (!code.trim()) return { kind: "failure", failure: "invalid" };
      await auth.applyActionCode(code.trim());
      return finalizeVerification(auth, apiClient);
    }),
    confirmPasswordReset: (code, password) => runWithAuth(async (auth) => {
      if (!isValidPassword(password) || !code.trim()) return { kind: "failure", failure: "invalid" };
      await auth.confirmPasswordReset(code.trim(), password);
      await auth.signOut();
      setState({ kind: "signedOut" });
      return { kind: "success", next: "authenticated" };
    }),
    requestPasswordRecovery: (email) => runWithAuth(async (auth) => {
      if (!isValidEmail(email)) return { kind: "failure", failure: "invalid" };
      try {
        await auth.requestPasswordRecovery(email.trim().toLowerCase());
      } catch (error) {
        if (!isNonEnumeratingRecoveryError(error)) throw error;
      }
      return { kind: "success", next: "recoveryAccepted" };
    }),
    refreshVerification: () => runWithAuth(async (auth, api) => {
      const user = await auth.refreshVerification();
      if (!user) return { kind: "failure", failure: "revokedSession" };
      if (!user.emailVerified) {
        setState({ kind: "verificationPending", user });
        return { kind: "failure", failure: "unverifiedIdentity" };
      }
      return finalizeVerification(auth, api);
    }),
    register: (email, password) => runWithAuth(async (auth) => {
      if (!isValidEmail(email) || !isValidPassword(password)) return { kind: "failure", failure: "invalid" };
      try {
        await auth.register(email.trim().toLowerCase(), password);
      } catch (error) {
        if (firebaseAuthErrorCode(error) === "auth/email-already-in-use") return { kind: "failure", failure: "duplicate" };
        throw error;
      }
      await auth.resendVerification();
      const user = auth.getSnapshot();
      if (!user) return { kind: "failure", failure: "providerUnavailable" };
      setState({ kind: "verificationPending", user });
      return { kind: "success", next: "verificationPending" };
    }),
    resendVerification: () => runWithAuth(async (auth) => {
      await auth.resendVerification();
      return { kind: "success", next: "verificationPending" };
    }),
    signIn: (email, password) => runWithAuth(async (auth, api) => {
      if (!isValidEmail(email) || password.length === 0) return { kind: "failure", failure: "invalid" };
      const user = await auth.signIn(email.trim().toLowerCase(), password);
      if (user.provider === "password" && !user.emailVerified) {
        await auth.signOut();
        setState({ kind: "signedOut" });
        return { kind: "failure", failure: "unverifiedIdentity" };
      }
      return finalizeVerification(auth, api);
    }),
    signInWithApple: () => runWithAuth(async (auth, api) => finalizeVerification(auth, api, await auth.signInWithApple())),
    signInWithGoogle: (idToken) => runWithAuth(async (auth, api) => finalizeVerification(auth, api, await auth.signInWithGoogle(idToken))),
    confirmAdoption: (resolutions) => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated" || !state.accountData.preview) return { kind: "failure", failure: "conflict" };
      const next = await confirmAccountDataAdoption(api, state.backendUser.id, state.accountData.preview, resolutions);
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      return next.status === "synced" ? { kind: "success", next: "authenticated" } : { kind: "failure", failure: next.lastFailureCode === "offline" ? "offline" : "conflict" };
    }),
    retryAccountSync: () => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated") return { kind: "failure", failure: "providerUnavailable" };
      const next = await retryAccountDataSync(api, state.backendUser.id);
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      return next.status === "synced" || next.status === "previewReady" ? { kind: "success", next: "authenticated" } : { kind: "failure", failure: next.lastFailureCode === "offline" ? "offline" : "remoteFailure" };
    }),
    signOut: () => runWithAuth(async (auth, api) => {
      const user = auth.getSnapshot();
      if (user && state.kind === "authenticated") {
        const prepared = await prepareAccountSignOut(api, state.backendUser.id);
        if (!prepared.ok) return { kind: "failure", failure: prepared.failure };
      }
      await auth.signOut(); setState({ kind: "signedOut" }); return { kind: "success", next: "authenticated" };
    }),
    state,
  }), [apiClient, runWithAuth, state]);

  return <AccountSessionContext.Provider value={value}>{children}</AccountSessionContext.Provider>;
}

export function usePatternlyAccount(): AccountSessionContextValue {
  const context = useContext(AccountSessionContext);
  if (!context) throw new Error("patternly_account_provider_required");
  return context;
}

async function reconcileAuthenticatedUser(auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>, user: FirebaseAuthUserSnapshot, setState: (state: AccountState) => void): Promise<void> {
  if (user.provider === "password" && !user.emailVerified) {
    setState({ kind: "verificationPending", user });
    return;
  }
  await finalizeVerification(auth, api, user, setState);
}

async function finalizeVerification(auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient> | null, user = auth.getSnapshot(), setState?: (state: AccountState) => void): Promise<AccountCommandResult> {
  if (!user || !api) return { kind: "failure", failure: "providerUnavailable" };
  try {
    const response = await api.getMe();
    const accountData = await loadAccountDataSession(api, response.user.id);
    setState?.({ kind: "authenticated", backendUser: response.user, user, accountData });
    return { kind: "success", next: "authenticated" };
  } catch (error) {
    const failure = classifyAccountFailure(error);
    setState?.({ kind: failure === "revokedSession" ? "revokedSession" : "backendUnavailable", user });
    return { kind: "failure", failure };
  }
}

export function classifyAccountFailure(error: unknown): AccountFailure {
  if (error instanceof PatternlyApiClientError) {
    if (error.status === 401 || error.serverCode === "account_deleted" || error.serverCode === "authentication_required") return "revokedSession";
    if (error.status !== undefined && error.status >= 500) return "backendUnavailable";
    if (error.code === "transport_failed" || error.code === "request_timeout") return "offline";
    return "backendUnavailable";
  }
  const code = firebaseAuthErrorCode(error);
  if (code === "auth/credential-already-in-use" || code === "auth/provider-already-linked") return "duplicate";
  if (["auth/invalid-email", "auth/missing-password", "auth/weak-password", "auth/invalid-action-code", "auth/invalid-verification-code", "auth/argument-error"].includes(code)) return "invalid";
  if (["auth/expired-action-code", "auth/code-expired"].includes(code)) return "expiredAction";
  if (["auth/too-many-requests", "auth/quota-exceeded"].includes(code)) return "rateLimited";
  if (["auth/network-request-failed", "auth/timeout"].includes(code)) return "offline";
  if (["auth/user-token-expired", "auth/invalid-user-token", "auth/user-disabled", "auth/user-not-found"].includes(code)) return "revokedSession";
  if (["auth/operation-not-allowed", "auth/app-not-authorized", "auth/invalid-api-key", "auth/invalid-app-id", "auth/provider-unavailable", "auth/apple-unavailable"].includes(code)) return "providerUnavailable";
  if (["auth/wrong-password", "auth/invalid-credential", "auth/email-already-in-use"].includes(code)) return "invalidCredential";
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
