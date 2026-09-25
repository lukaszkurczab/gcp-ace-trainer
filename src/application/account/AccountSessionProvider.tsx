import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { PatternlyApiClientError, createPatternlyApiClient, type AccountDataExportDto, type LegalRequestDto, type LegalRequestKindDto, type MeResponseDto, type PrivacyRequestListItemDto, type PrivacyRequestResponseDto, type PrivacyRequestRightDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { PREMIUM_ENTITLEMENT, isPremiumAccessConfirmedOnline } from "../../domain/entitlements";
import { clearPremiumCache, clearPremiumCacheUnlessBoundTo, replacePremiumCacheFromFreshResponse } from "../../storage/repositories/premiumEntitlementCacheRepository";
import { createPremiumRefreshQueue } from "./premiumRefreshQueue";
import { getMeWithExchangedSession } from "./accountSessionExchange";
import { composePatternlyNativeAppCheck, configurePatternlyAppCheckTokenProvider, getPatternlyAppCheckToken } from "../../infrastructure/clients/patternlyAppCheckToken";
import { readLocalSmokeAppCheckToken } from "../../infrastructure/clients/localSmokeAppCheck";
import { createContentReportTransport, registerContentReportRuntimeTransport, type ContentReportRuntimeRegistration } from "../contentReports";
import { createFirebaseAuthClient, firebaseAuthErrorCode, type FirebaseAuthClient, type FirebaseAuthCredentials, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import { readDevelopmentFirebaseAuthEmulatorOrigin, readFirebaseClientConfiguration, readPublicEnvironmentFromRuntime } from "../../infrastructure/firebase/publicConfig";
import { confirmAccountDataAdoption, deleteBoundAccount, discardGuestDataAndLoadAccount, loadAccountDataSession, resetAccountLocalLearningHistory, retryAccountDataSync, retryPendingAccountDataSync, retryPendingAccountDeletion, type AccountDataSession } from "./accountDataService";
import { commitLearningStateReset } from "../learningMutations";
import { activatePreparedProfile, closeActiveProfileStorage, continueAsGuestInNewProfile, getActiveStorageProfile, getActiveStorageProfileOrNull, inspectPreparedProfileState, notifyProfileStorageReady, prepareProfileStorage, selectAccountProfileAndRestart, selectPreparedAccountProfile, selectPreparedGuestProfile, validatePreparedGuestAccess } from "../../infrastructure/storage/mmkvClient";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";
import { useProfileStoragePreparation } from "./profileStoragePreparationContext";
import { AccountSessionGenerationStaleError, findMatchingLocalLogoutBlock, finishLocalSignOutSetupFailure, guardAuthenticatedScopeAgainstIncompleteSignOut, isPreparedGuestChoiceRequired, lockAndCloseProfileAfterAuthLoss, performLocalAccountSignOut, prepareAuthenticatedProfileScope, prepareGuestProfileScope, recoverAfterGuestPreparationFailure, shouldRejectPersistedAuthRestore, shouldShowGuestSelectionLoading } from "./profileStartupCoordination";
import { beginAccountSignOut, getAccountSignOutState } from "../../storage/repositories/accountLifecycleRepository";
import type { LocalLogoutControl, LocalLogoutControlSnapshot } from "../../infrastructure/storage/localLogoutControl";

export { AccountSessionGenerationStaleError, findMatchingLocalLogoutBlock, finishLocalSignOutSetupFailure, guardAuthenticatedScopeAgainstIncompleteSignOut, isPreparedGuestChoiceRequired, lockAndCloseProfileAfterAuthLoss, performLocalAccountSignOut, prepareAuthenticatedProfileScope, prepareGuestProfileScope, recoverAfterGuestPreparationFailure, shouldRejectPersistedAuthRestore, shouldShowGuestSelectionLoading } from "./profileStartupCoordination";

async function reconcileMaterializedAccountReminders(): Promise<void> {
  const { reconcileDeviceReminder } = await import("../../preferences/reconcileDeviceReminder");
  await reconcileDeviceReminder();
}

async function disableAccountRemindersForDeletion(): Promise<boolean> {
  try {
    const [{ disableLearningPlanReminders }, { expoNotificationPlatform }] = await Promise.all([
      import("../notificationPreferences"),
      import("../../infrastructure/notifications/expoNotificationPlatform"),
    ]);
    return (await disableLearningPlanReminders(expoNotificationPlatform)).kind === "disabled";
  } catch {
    return false;
  }
}
import { clearAccountDeletionState, getAccountDeletionState } from "../../storage/repositories/accountLifecycleRepository";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { isPatternlySmokeRuntime, readPatternlyRuntimeMode, requiresVerifiedPasswordIdentity, type PatternlyRuntimeMode } from "../../infrastructure/runtime/runtimeMode";
import { grantGuestAccess, hasGuestAccess, revokeGuestAccess } from "../../storage/repositories/guestAccessRepository";
import { hasUnboundGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { createDeletionAuthorizationVault, createSensitiveCommandLane, isLiveDeletionAuthorization, prepareDeletionAuthorization, runReauthenticatedMutation, type DeletionAuthorizationVault, type SensitiveCommandLane } from "./accountCommandGuards";
import { shareAccountDataExport as shareDownloadedAccountData } from "./accountDataExportService";
import { legalVariables } from "../../legal/legalVariables";
import { ownerPreservationOracle, type OwnerPreservationRestartResult } from "../testing/ownerPreservationOracle";

export type AccountFailure = "accountNotFound" | "backendUnavailable" | "conflict" | "duplicate" | "emailUnavailable" | "expiredAction" | "guestChoiceRequired" | "invalid" | "invalidCredential" | "invalidEmail" | "invalidRecoveryCode" | "journalRecoveryFailure" | "localCleanupFailure" | "localDeletionFailure" | "offline" | "passwordMismatch" | "pendingSyncRequiresNetwork" | "providerUnavailable" | "rateLimited" | "reauthenticationRequired" | "recoveryCodeUsed" | "remoteDeletionPending" | "remoteFailure" | "revokedSession" | "sessionRevocationPending" | "signOutPending" | "unverifiedIdentity" | "weakPassword";
export type AccountCommandResult = Readonly<{ kind: "failure"; failure: AccountFailure } | { kind: "success"; next: "authenticated" | "deletionAuthorized" | "guest" | "recoveryAccepted" | "recoveryCodesIssued" | "verificationPending" | "verificationSent" | "signedOut"; recoveryCodes?: readonly string[] }>;
export type OwnerPreservationGuestCommandResult = Readonly<{ status: "denied" } | { status: "blocked"; oracle: "blocked" } | { status: "pending"; oracle: "armed" }>;
export type AccountDataExportFailure = "authenticationRequired" | "sessionRevoked" | "offline" | "rateLimited" | "responseTooLarge" | "serverFailure" | "invalidResponse" | "sharingUnavailable" | "fileFailure" | "sharingFailed" | "cleanupFailed";
export type AccountDataExportCommandResult = Readonly<
  | { kind: "success" }
  | { kind: "failure"; failure: AccountDataExportFailure; retryAfterSeconds?: number }
>;
export type PrivacyRequestFailure = "authenticationRequired" | "offline" | "recentAuthenticationRequired" | "serverFailure" | "invalidResponse" | "appCheckUnavailable" | "invalidCode" | "rateLimited" | "conflict";
export type PrivacyRequestCommandResult<T> = Readonly<{ kind: "success"; value: T } | { kind: "failure"; failure: PrivacyRequestFailure }>;
export type PasswordVerificationCommand = "register" | "signIn" | "resend" | "persisted" | "refresh";
export type PasswordVerificationPlan =
  | Readonly<{ kind: "finalize" }>
  | Readonly<{ kind: "verificationPending"; action: "none" | "resend" | "signOut" }>;

export type AccountState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "profilePreparing"; profile: StorageProfile }>
  | Readonly<{ kind: "unavailable"; reason: "auth_restore_timeout" | "firebase_unconfigured" | "public_environment_unconfigured" | "public_environment_invalid" }>
  | Readonly<{ kind: "signedOut" }>
  | Readonly<{ kind: "guest" }>
  | Readonly<{ kind: "guestAccessBlocked" }>
  | Readonly<{ kind: "verificationPending"; user: FirebaseAuthUserSnapshot }>
  | Readonly<{ kind: "authenticated"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "deletionPending"; user: FirebaseAuthUserSnapshot; accountId: string; status: "remoteDeletionPending" | "localCleanupPending"; failure: AccountFailure }>
  | Readonly<{ kind: "signingOut"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "signOutPending"; user: FirebaseAuthUserSnapshot; operationId?: string }>
  | Readonly<{ kind: "deleting"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "backendUnavailable" | "reauthenticationRequired" | "revokedSession"; user: FirebaseAuthUserSnapshot }>;

export type AccountSessionContextValue = Readonly<{
  applyVerificationCode: (code: string) => Promise<AccountCommandResult>;
  changePassword: (credentials: FirebaseAuthCredentials, newPassword: string) => Promise<AccountCommandResult>;
  confirmPasswordReset: (code: string, password: string) => Promise<AccountCommandResult>;
  deleteAccount: () => Promise<AccountCommandResult>;
  exportAccountData: (isRequestActive?: () => boolean) => Promise<AccountDataExportCommandResult>;
  resetLocalLearningHistory: () => Promise<AccountCommandResult>;
  createPrivacyRequest: (right: PrivacyRequestRightDto, narrative?: string) => Promise<PrivacyRequestCommandResult<PrivacyRequestListItemDto>>;
  createGuestPrivacyRequest: (input: Readonly<{ clientRequestId: string; email: string; right: PrivacyRequestRightDto; narrative?: string; reportSubmissionIds: readonly string[] }>) => Promise<PrivacyRequestCommandResult<string>>;
  resendGuestPrivacyCode: (requestId: string, email: string) => Promise<PrivacyRequestCommandResult<void>>;
  verifyGuestPrivacyCode: (code: string) => Promise<PrivacyRequestCommandResult<Readonly<{ requestId: string; sessionToken: string }>>>;
  readGuestPrivacyResponse: (requestId: string, sessionToken: string) => Promise<PrivacyRequestCommandResult<PrivacyRequestResponseDto>>;
  listPrivacyRequests: () => Promise<PrivacyRequestCommandResult<readonly PrivacyRequestListItemDto[]>>;
  readPrivacyRequest: (requestId: string) => Promise<PrivacyRequestCommandResult<PrivacyRequestResponseDto>>;
  createLegalRequest: (input: Readonly<{ kind: LegalRequestKindDto; narrative?: string; transactionId?: string }>) => Promise<PrivacyRequestCommandResult<LegalRequestDto>>;
  createPublicLegalRequest: (input: Readonly<{ email: string; kind: LegalRequestKindDto; narrative?: string; transactionId?: string }>) => Promise<PrivacyRequestCommandResult<LegalRequestDto>>;
  listLegalRequests: () => Promise<PrivacyRequestCommandResult<readonly LegalRequestDto[]>>;
  readLegalRequest: (requestId: string) => Promise<PrivacyRequestCommandResult<LegalRequestDto>>;
  recordPurchaseConfirmation: (input: Readonly<{ confirmationId: string; termsVersion: string; productIdentifier: string; storefrontPrice: string; locale: "en" | "pl"; immediateStartRequested: true }>) => Promise<AccountCommandResult>;
  refreshPremiumEntitlement: (accountId: string) => Promise<"verified" | "denied" | "pending">;
  requestPasswordRecovery: (email: string) => Promise<AccountCommandResult>;
  requestEmailChange: (credentials: FirebaseAuthCredentials, email: string) => Promise<AccountCommandResult>;
  retrySessionRestore: () => void;
  completeProfilePreparation: () => Promise<void>;
  accountEntryMode: "welcome" | "login";
  guestTransitionFailure: Readonly<{ kind: "failure"; failure: AccountFailure }> | null;
  holdAccountIdentityRefresh: () => () => void;
  refreshAccountIdentity: () => Promise<AccountCommandResult>;
  refreshAccountIdentityFailure: AccountFailure | null;
  refreshVerification: () => Promise<AccountCommandResult>;
  register: (email: string, password: string, acceptanceConfirmed: boolean, locale: "en" | "pl") => Promise<AccountCommandResult>;
  resendVerification: () => Promise<AccountCommandResult>;
  signIn: (email: string, password: string) => Promise<AccountCommandResult>;
  signInWithApple: () => Promise<AccountCommandResult>;
  signInWithGoogle: (idToken: string) => Promise<AccountCommandResult>;
  registerWithApple: (acceptanceConfirmed: boolean, locale: "en" | "pl") => Promise<AccountCommandResult>;
  registerWithGoogle: (idToken: string, acceptanceConfirmed: boolean, locale: "en" | "pl") => Promise<AccountCommandResult>;
  confirmAdoption: (resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[], groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[]) => Promise<AccountCommandResult>;
  continueAsGuest: () => Promise<AccountCommandResult>;
  runOwnerPreservationGuestCommand: () => Promise<OwnerPreservationGuestCommandResult>;
  ownerPreservationResult: OwnerPreservationRestartResult | null;
  retryAccountSync: () => Promise<AccountCommandResult>;
  retryPendingAccountSync: () => Promise<AccountCommandResult>;
  retryPendingDeletion: () => Promise<AccountCommandResult>;
  prepareDeletion: (credentials: FirebaseAuthCredentials) => Promise<AccountCommandResult>;
  reauthenticateForExport: (credentials: FirebaseAuthCredentials) => Promise<AccountCommandResult>;
  issueRecoveryCodes: (credentials: FirebaseAuthCredentials) => Promise<AccountCommandResult>;
  revokeDeletionAuthorization: () => void;
  consumeRecoveryCode: (code: string) => Promise<AccountCommandResult>;
  discardGuestData: () => Promise<AccountCommandResult>;
  signOut: () => Promise<AccountCommandResult>;
  pendingRemoteRevokeCount: number;
  state: AccountState;
}>;

const AccountSessionContext = createContext<AccountSessionContextValue | null>(null);

export const AUTH_INITIALIZATION_TIMEOUT_MS = 15_000;

export type AccountSessionGenerationToken = Readonly<{ generation: number; uid: string }>;

export function canContinueAccountIdentityRefresh(input: Readonly<{
  authUid: string | null;
  currentState: AccountState;
  expectedUid: string;
  generation: AccountSessionGenerationToken;
  isCurrentGeneration: (token: AccountSessionGenerationToken) => boolean;
  refreshedUid: string | null;
}>): boolean {
  return input.currentState.kind === "authenticated"
    && input.currentState.user.uid === input.expectedUid
    && input.refreshedUid === input.expectedUid
    && input.authUid === input.expectedUid
    && input.isCurrentGeneration(input.generation);
}

export function createGuestTransitionLock(): Readonly<{ tryAcquire: () => (() => void) | null }> {
  let held = false;
  return Object.freeze({
    tryAcquire: (): (() => void) | null => {
      if (held) return null;
      held = true;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        held = false;
      };
    },
  });
}

export async function runWithGuestTransitionLock<T>(lock: ReturnType<typeof createGuestTransitionLock>, denied: T, operation: () => Promise<T>): Promise<T> {
  const release = lock.tryAcquire();
  if (!release) return denied;
  try { return await operation(); } finally { release(); }
}

export async function runOwnerPreservationGuestTransition(input: Readonly<{
  lock: ReturnType<typeof createGuestTransitionLock>;
  preflight: () => boolean;
  recheck: () => boolean;
  arm: () => Promise<"unchanged" | "changed" | "blocked">;
  cleanup: () => Promise<"unchanged" | "changed" | "blocked">;
  beginTransition: () => Promise<void>;
}>): Promise<OwnerPreservationGuestCommandResult> {
  let armed = false;
  let transitionStarted = false;
  let cleanupAttempted = false;
  const cleanupArmedRecord = async (): Promise<"unchanged" | "changed" | "blocked"> => {
    cleanupAttempted = true;
    try { return await input.cleanup(); } catch { return "blocked"; }
  };
  return runWithGuestTransitionLock(input.lock, { status: "denied" }, async () => {
  try {
    if (!input.preflight()) return { status: "denied" };
    if (await input.arm() !== "unchanged") return { status: "blocked", oracle: "blocked" };
    armed = true;
    if (!input.recheck()) {
      const cleanup = await cleanupArmedRecord();
      armed = false;
      return cleanup === "unchanged" ? { status: "denied" } : { status: "blocked", oracle: "blocked" };
    }
    transitionStarted = true;
    await input.beginTransition();
    return { status: "pending", oracle: "armed" };
  } catch {
    if (armed && !transitionStarted && !cleanupAttempted) await cleanupArmedRecord();
    return { status: "blocked", oracle: "blocked" };
  }
  });
}

export type AccountSessionCoordinator<T> = Readonly<{
  activate: () => void;
  begin: (uid: string) => AccountSessionGenerationToken;
  current: (uid: string) => AccountSessionGenerationToken | null;
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
  const current = (uid: string): AccountSessionGenerationToken | null => !disposed && activeUid === uid ? Object.freeze({ generation, uid }) : null;
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
    current,
    dispose: () => { disposed = true; invalidate(); },
    invalidate,
    isCurrent,
    restart,
    run,
  });
}

type FinalizationOutcome = Readonly<{ result: AccountCommandResult; state?: AccountState }>;

type ProfilePreparationAttempt = {
  kind: "authenticated" | "guest";
  profile: StorageProfile;
  user?: FirebaseAuthUserSnapshot;
  generation?: AccountSessionGenerationToken;
  completion: Promise<AccountCommandResult>;
  resolveCompletion: (result: AccountCommandResult) => void;
  completing: Promise<AccountCommandResult> | null;
  bootstrapFailure?: AccountCommandResult;
};

export function publishRefreshedAuthenticatedState(latest: AccountState, input: Readonly<{
  backendUser: MeResponseDto["user"];
  isCurrent: () => boolean;
  user: FirebaseAuthUserSnapshot;
}>): AccountState {
  if (!input.isCurrent() || latest.kind !== "authenticated" || latest.user.uid !== input.user.uid) return latest;
  return {
    kind: "authenticated",
    backendUser: input.backendUser,
    user: input.user,
    accountData: latest.accountData,
  };
}

function createSignOutOperationId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  try {
    const crypto = require("expo-crypto") as typeof import("expo-crypto");
    return crypto.randomUUID();
  } catch {
    throw new Error("secure_operation_id_unavailable");
  }
}

function deletionRecoverySession(state: ReturnType<typeof getAccountDeletionState>): AccountDataSession | null {
  if (!state || state.status === "failed" || state.status === "complete") return null;
  const lastFailureCode = state.lastFailureCode === "reauthentication_required"
    ? "reauthenticationRequired"
    : state.lastFailureCode;
  return Object.freeze({
    status: state.status === "remotePending" ? "remoteDeletionPending" : "localCleanupPending",
    preview: null,
    lastSuccessfulSyncAt: null,
    pendingMutationCount: 0,
    blockingConflictCode: null,
    lastFailureCode,
    activeSessionBlocked: false,
  });
}

function deletionRecoveryFailure(state: NonNullable<ReturnType<typeof getAccountDeletionState>>, fallback: AccountFailure = "remoteDeletionPending"): AccountFailure {
  if (state.lastFailureCode === "reauthentication_required") return "reauthenticationRequired";
  if (state.lastFailureCode === "offline") return "pendingSyncRequiresNetwork";
  if (state.lastFailureCode === "journal_recovery_required") return "journalRecoveryFailure";
  if (state.lastFailureCode === "local_cleanup_failure") return "localCleanupFailure";
  if (state.lastFailureCode === "remoteFailure") return "remoteFailure";
  return fallback;
}

function deletionPendingState(user: FirebaseAuthUserSnapshot, deletion: NonNullable<ReturnType<typeof getAccountDeletionState>>, failure?: AccountFailure): Extract<AccountState, { kind: "deletionPending" }> {
  const accountData = deletionRecoverySession(deletion);
  if (!accountData) throw new Error("deletion_recovery_marker_not_resumable");
  return {
    kind: "deletionPending",
    user,
    accountId: deletion.accountId,
    status: accountData.status === "remoteDeletionPending" ? "remoteDeletionPending" : "localCleanupPending",
    failure: failure ?? deletionRecoveryFailure(deletion, accountData.status === "localCleanupPending" ? "localCleanupFailure" : "remoteDeletionPending"),
  };
}

export function PatternlyAccountProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { profile: preparedProfileState, logoutControl, logoutControlSnapshot: initialLogoutControlSnapshot } = useProfileStoragePreparation();
  const [logoutControlSnapshot, setLogoutControlSnapshot] = useState<LocalLogoutControlSnapshot>(initialLogoutControlSnapshot);
  const logoutControlSnapshotRef = useRef(initialLogoutControlSnapshot);
  const [state, setState] = useState<AccountState>({ kind: "loading" });
  const [accountEntryMode, setAccountEntryMode] = useState<"welcome" | "login">(preparedProfileState.isFreshInstallation ? "welcome" : "login");
  const [guestTransitionFailure, setGuestTransitionFailure] = useState<Readonly<{ kind: "failure"; failure: AccountFailure }> | null>(null);
  const [ownerPreservationResult, setOwnerPreservationResult] = useState<OwnerPreservationRestartResult | null>(null);
  const ownerPreservationRestartCheckRef = useRef<Promise<OwnerPreservationRestartResult> | null>(null);
  const stateRef = useRef<AccountState>({ kind: "loading" });
  stateRef.current = state;
  const [authClient, setAuthClient] = useState<FirebaseAuthClient | null>(null);
  const authInitializationResolvedRef = useRef(false);
  const guestCommandLockRef = useRef(createGuestTransitionLock());
  const [apiClient, setApiClient] = useState<ReturnType<typeof createPatternlyApiClient> | null>(null);
  const [appCheckReady, setAppCheckReady] = useState(false);
  const [refreshAccountIdentityFailure, setRefreshAccountIdentityFailure] = useState<AccountFailure | null>(null);
  const [runtimeMode] = useState<PatternlyRuntimeMode | undefined>(readPatternlyRuntimeMode);
  const [authInitializationRevision, setAuthInitializationRevision] = useState(0);
  const sessionCoordinatorRef = useRef<AccountSessionCoordinator<FinalizationOutcome> | null>(null);
  const profilePreparationRef = useRef<ProfilePreparationAttempt | null>(null);
  const observerBlockedUidRef = useRef<string | null>(null);
  const sessionExchangeUidRef = useRef<string | null>(null);
  const legalAcceptancePendingRef = useRef(false);
  const registrationIntentRef = useRef<Readonly<{ uid: string; promise: Promise<AccountCommandResult> }> | null>(null);
  const deletionAuthorizationRef = useRef<DeletionAuthorizationVault | null>(null);
  const deletionAuthorizationTokenRef = useRef<AccountSessionGenerationToken | null>(null);
  const sensitiveCommandLaneRef = useRef<SensitiveCommandLane | null>(null);
  const contentReportRegistrationRef = useRef<ContentReportRuntimeRegistration | null>(null);
  const premiumRefreshQueueRef = useRef(createPremiumRefreshQueue());
  if (!sessionCoordinatorRef.current) {
    sessionCoordinatorRef.current = createAccountSessionCoordinator((_token, outcome) => {
      if (outcome.state) setState(outcome.state);
    });
  }
  if (!deletionAuthorizationRef.current) deletionAuthorizationRef.current = createDeletionAuthorizationVault();
  if (!sensitiveCommandLaneRef.current) sensitiveCommandLaneRef.current = createSensitiveCommandLane();
  const sessionCoordinator = sessionCoordinatorRef.current;
  const deletionAuthorization = deletionAuthorizationRef.current!;
  const sensitiveCommandLane = sensitiveCommandLaneRef.current!;

  useEffect(() => {
    if (!apiClient || !appCheckReady) {
      contentReportRegistrationRef.current?.unregister();
      contentReportRegistrationRef.current = null;
      return;
    }
    const registration = registerContentReportRuntimeTransport(createContentReportTransport(apiClient));
    contentReportRegistrationRef.current = registration;
    void registration.ready.catch(() => undefined);
    return () => {
      registration.unregister();
      if (contentReportRegistrationRef.current === registration) contentReportRegistrationRef.current = null;
    };
  }, [apiClient, appCheckReady]);

  const revokeDeletionAuthorization = useCallback(() => {
    deletionAuthorization.revoke();
    deletionAuthorizationTokenRef.current = null;
  }, [deletionAuthorization]);

  const finalizeCurrent = useCallback(async (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>, user: FirebaseAuthUserSnapshot | null = auth.getSnapshot(), restart = false, expectedToken?: AccountSessionGenerationToken, preserveGuestScope = false): Promise<AccountCommandResult> => {
    if (!user || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
    const token = expectedToken ?? (restart ? sessionCoordinator.restart(user.uid) : sessionCoordinator.begin(user.uid));
    if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
    try {
      const outcome = await sessionCoordinator.run(token, async () => {
        if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
        try {
          const response = await getMeWithExchangedSession({
            api,
            auth,
            canContinue: () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid,
            onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
            user,
          });
          // Keep this guard immediately before local account loading. The data
          // service may persist state, so stale generations must not enter it.
          if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
          if (!preserveGuestScope && await selectAccountProfileAndRestart(response.user.id, () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid)) {
            return { result: { kind: "failure", failure: "providerUnavailable" } };
          }
          let deletion = getAccountDeletionState();
          // A completed marker belongs to the account that was deleted. If a
          // later /me resolves a different account for the same auth subject,
          // discard only that terminal marker so the new account can start its
          // own lifecycle. Resumable markers remain untouched on mismatch.
          if (deletion?.status === "complete" && deletion.accountId !== response.user.id) {
            clearAccountDeletionState();
            deletion = null;
          }
          const pendingDeletion = deletion?.accountUidHash === sha256Utf8(user.uid) && deletion.accountId === response.user.id
            ? deletionRecoverySession(deletion)
            : null;
          const accountData = pendingDeletion ?? await loadAccountDataSession(api, response.user.id);
          if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
          if (accountData.status === "synced") await reconcileMaterializedAccountReminders().catch(() => undefined);
          if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
          revokeGuestAccess();
          return {
            result: { kind: "success", next: "authenticated" },
            state: { kind: "authenticated", backendUser: response.user, user, accountData },
          };
        } catch (error) {
          if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
          const deletion = getAccountDeletionState();
          if (deletion?.accountUidHash === sha256Utf8(user.uid)) {
            const accountData = deletionRecoverySession(deletion);
            if (accountData) {
              const recoveryState = deletionPendingState(user, deletion);
              return {
                result: { kind: "failure", failure: recoveryState.failure },
                state: recoveryState,
              };
            }
          }
          const failure = classifyAccountFailure(error);
          return {
            result: { kind: "failure", failure },
            state: accountSessionFailureState(failure, user),
          };
        }
      });
      return outcome.result;
    } catch (error) {
      return error instanceof AccountSessionGenerationStaleError
        ? { kind: "failure", failure: "revokedSession" }
        : { kind: "failure", failure: classifyAccountFailure(error) };
    } finally {
      if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
    }
  }, [sessionCoordinator]);

  const startAuthenticatedProfilePreparation = useCallback(async (
    auth: FirebaseAuthClient,
    api: ReturnType<typeof createPatternlyApiClient>,
    user: FirebaseAuthUserSnapshot,
    generation: AccountSessionGenerationToken,
  ): Promise<ProfilePreparationAttempt | null> => {
    const existing = profilePreparationRef.current;
    if (existing?.kind === "authenticated" && existing.user?.uid === user.uid && existing.generation?.generation === generation.generation) return existing;
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
      completing: null,
    };
    profilePreparationRef.current = attempt;
    const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
    const finishPendingSignOut = (operationId?: string, failure: AccountFailure = "signOutPending"): ProfilePreparationAttempt => {
      profilePreparationRef.current = null;
      observerBlockedUidRef.current = user.uid;
      if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
      setAccountEntryMode("login");
      setState({ kind: "signOutPending", user, ...(operationId ? { operationId } : {}) });
      attempt.bootstrapFailure = { kind: "failure", failure };
      resolveCompletion(attempt.bootstrapFailure);
      return attempt;
    };
    try {
      if (!canContinue()) throw new AccountSessionGenerationStaleError();
      const blockedLogout = findMatchingLocalLogoutBlock(logoutControlSnapshotRef.current, user.uid);
      if (blockedLogout) return finishPendingSignOut(blockedLogout.operationId);
      setAccountEntryMode("login");
      setState({ kind: "loading" });
      const activeProfile = getActiveStorageProfileOrNull();
      if (activeProfile) closeActiveProfileStorage();
      const selectedProfile = await prepareAuthenticatedProfileScope({
        canContinue,
        prepareStorage: prepareProfileStorage,
        getMe: async () => {
          return getMeWithExchangedSession({
            api,
            auth,
            canContinue,
            onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
            user,
          });
        },
        selectAccount: (accountId, guard) => selectPreparedAccountProfile(accountId, guard),
        activate: (profile) => { activatePreparedProfile(profile.id, profile.kind, { deferReadyNotification: true }); },
      });
      attempt.profile = selectedProfile;
      const logoutGuard = await guardAuthenticatedScopeAgainstIncompleteSignOut({
        accountId: selectedProfile.accountId ?? "",
        authUid: user.uid,
        canContinue,
        pending: logoutControlSnapshotRef.current.pending,
        readScopedSignOut: getAccountSignOutState,
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
        profilePreparationRef.current = null;
        resolveCompletion(attempt.bootstrapFailure);
        return attempt;
      }
      notifyProfileStorageReady();
      setState({ kind: "profilePreparing", profile: selectedProfile });
      return attempt;
    } catch (error) {
      const ownsPreparation = profilePreparationRef.current === attempt;
      if (ownsPreparation) {
        profilePreparationRef.current = null;
        const activeProfile = getActiveStorageProfileOrNull();
        if (activeProfile && activeProfile.id === attempt.profile.id) closeActiveProfileStorage();
      }
      const failure = error instanceof AccountSessionGenerationStaleError || !canContinue()
        ? "revokedSession"
        : classifyAccountFailure(error);
      if (ownsPreparation && canContinue()) setState(accountSessionFailureState(failure, user));
      if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
      attempt.bootstrapFailure = { kind: "failure", failure };
      resolveCompletion(attempt.bootstrapFailure);
      return attempt;
    }
  }, [preparedProfileState.selectedProfile, sessionCoordinator]);

  const completeProfilePreparation = useCallback(async (): Promise<void> => {
    const attempt = profilePreparationRef.current;
    if (!attempt) return;
    if (attempt.completing) { await attempt.completing; return; }
    const completion = (async (): Promise<AccountCommandResult> => {
      if (attempt.kind === "guest") {
        const result = hasGuestAccess() && hasUnboundGuestInstallation()
          ? { kind: "success", next: "guest" } as const
          : { kind: "failure", failure: "providerUnavailable" } as const;
        if (profilePreparationRef.current === attempt) {
          setState(result.kind === "success" ? { kind: "guest" } : { kind: "guestAccessBlocked" });
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
          profilePreparationRef.current = null;
          if (user) setState({ kind: "revokedSession", user });
          else setState({ kind: "signedOut" });
        }
        attempt.resolveCompletion(result);
        return result;
      }
      const reconciliationOutcome: { result: AccountCommandResult | null; state: AccountState | null } = { result: null, state: null };
      await reconcileAuthenticatedUser(
        auth,
        api,
        runtimeMode,
        user,
        async (nextUser) => {
          reconciliationOutcome.result = await finalizeCurrent(auth, api, nextUser, false, generation, true);
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
      if (profilePreparationRef.current === attempt) profilePreparationRef.current = null;
      if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
      attempt.resolveCompletion(result);
      return result;
    })();
    attempt.completing = completion;
    await completion;
  }, [apiClient, authClient, finalizeCurrent, runtimeMode, sessionCoordinator]);

  const retrySessionRestore = useCallback(() => {
    sessionCoordinator.invalidate();
    revokeDeletionAuthorization();
    observerBlockedUidRef.current = null;
    setState({ kind: "loading" });
    setAuthInitializationRevision((revision) => revision + 1);
  }, [revokeDeletionAuthorization, sessionCoordinator]);

  useEffect(() => {
    authInitializationResolvedRef.current = false;
    sessionCoordinator.activate();
    revokeDeletionAuthorization();
    observerBlockedUidRef.current = null;
    let live = true;
    let unsubscribe: (() => void) | undefined;
    let observerDetached = false;
    let observerResolved = false;
    let authObserverRevision = 0;
    let observedUid: string | null = null;
    let rejectedRestoreUid: string | null = null;
    let auth: FirebaseAuthClient | null = null;
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
    const entryModeForPreparedProfile = preparedProfileState.isFreshInstallation ? "welcome" : "login";
    const publishEntryState = (nextState: AccountState) => {
      setAccountEntryMode(entryModeForPreparedProfile);
      publish(nextState);
    };
    const prepareSelectedGuest = async (): Promise<void> => {
      try {
        await prepareProfileStorage();
        const prepared = await inspectPreparedProfileState();
        const selected = prepared.selectedProfile;
        if (prepared.isFreshInstallation || (selected.kind !== "guest" && selected.kind !== "legacy_guest")) {
          publishEntryState({ kind: "signedOut" });
          return;
        }
        if (!live || observerDetached || auth?.getSnapshot()) return;
        const guestProfile = await prepareGuestProfileScope({
          allowNewSelection: false,
          canContinue: () => live && !observerDetached && !auth?.getSnapshot(),
          isFreshInstallation: prepared.isFreshInstallation,
          validatePersistedAccess: () => validatePreparedGuestAccess(selected.id),
          selectGuest: () => selectPreparedGuestProfile(selected.id, () => live && !observerDetached && !auth?.getSnapshot()),
          activate: (profile) => { activatePreparedProfile(profile.id, profile.kind); },
        });
        if (!guestProfile) {
          publishEntryState({ kind: "signedOut" });
          return;
        }
        if (!live || observerDetached || auth?.getSnapshot()) return;
        const guest = { profile: guestProfile };
        let resolveCompletion!: (result: AccountCommandResult) => void;
        const completion = new Promise<AccountCommandResult>((resolve) => { resolveCompletion = resolve; });
        const attempt: ProfilePreparationAttempt = {
          kind: "guest",
          profile: guest.profile,
          completion,
          resolveCompletion,
          completing: null,
        };
        profilePreparationRef.current = attempt;
        setAccountEntryMode("login");
        publish({ kind: "profilePreparing", profile: guest.profile });
      } catch {
        if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
        if (live && !observerDetached) publishEntryState({ kind: "guestAccessBlocked" });
      }
    };
    const publicEnvironment = readPublicEnvironmentFromRuntime();
    if (!smokeRuntime && publicEnvironment.kind !== "configured") {
      if (preparedProfileState.selectedProfile.kind === "guest" || preparedProfileState.selectedProfile.kind === "legacy_guest") void prepareSelectedGuest();
      else publishEntryState({ kind: "unavailable", reason: publicEnvironment.reason === "invalid_public_environment" ? "public_environment_invalid" : "public_environment_unconfigured" });
      return () => { live = false; observerBlockedUidRef.current = null; revokeDeletionAuthorization(); sessionCoordinator.dispose(); };
    }
      const firebaseConfiguration = readFirebaseClientConfiguration();
    if (firebaseConfiguration.kind !== "configured") {
      if (preparedProfileState.selectedProfile.kind === "guest" || preparedProfileState.selectedProfile.kind === "legacy_guest") void prepareSelectedGuest();
      else publishEntryState({ kind: "unavailable", reason: "firebase_unconfigured" });
      return () => { live = false; observerBlockedUidRef.current = null; revokeDeletionAuthorization(); sessionCoordinator.dispose(); };
    }
    setAppCheckReady(false);
    const androidProvider = process.env.EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER;
    const appleProvider = process.env.EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER;
    const localAppCheckToken = readLocalSmokeAppCheckToken();
    if (process.env.EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN) {
      // A rejected local configuration must not silently contact a real provider.
      configurePatternlyAppCheckTokenProvider(localAppCheckToken ? async () => localAppCheckToken : null);
      setAppCheckReady(localAppCheckToken !== null);
    } else {
      const configuration = {
        ...(androidProvider === "debug" || androidProvider === "playIntegrity" ? { androidProvider } : {}),
        ...(appleProvider === "debug" || appleProvider === "deviceCheck" || appleProvider === "appAttest" || appleProvider === "appAttestWithDeviceCheckFallback" ? { appleProvider } : {}),
      };
      if (Object.keys(configuration).length > 0) {
        void composePatternlyNativeAppCheck(configuration).then((result) => { if (live && result === "available") setAppCheckReady(true); });
      } else {
        configurePatternlyAppCheckTokenProvider(null);
      }
    }
    try {
      const authEmulatorOrigin = readDevelopmentFirebaseAuthEmulatorOrigin();
      const apiOrigin = smokeRuntime
        ? process.env.EXPO_PUBLIC_PATTERNLY_API_ORIGIN
        : publicEnvironment.kind === "configured" ? publicEnvironment.value.apiOrigin : undefined;
      const authActionOrigin = smokeRuntime
        ? apiOrigin
        : publicEnvironment.kind === "configured" ? publicEnvironment.value.authActionOrigin : undefined;
      if (!apiOrigin || !authActionOrigin || (smokeRuntime && !authEmulatorOrigin)) {
        if (preparedProfileState.selectedProfile.kind === "guest" || preparedProfileState.selectedProfile.kind === "legacy_guest") void prepareSelectedGuest();
        else publishEntryState({ kind: "unavailable", reason: "public_environment_unconfigured" });
        return () => { live = false; observerBlockedUidRef.current = null; revokeDeletionAuthorization(); sessionCoordinator.dispose(); };
      }
      const configuredAuth = createFirebaseAuthClient({
        authActionOrigin,
        authEmulatorOrigin,
        config: firebaseConfiguration.value,
      });
      auth = configuredAuth;
      const client = createPatternlyApiClient({ allowLocalHttpForSimulator: smokeRuntime, apiOrigin, getIdToken: configuredAuth.getIdToken });
      setAuthClient(configuredAuth);
      setApiClient(client);
      initializationTimeout = setTimeout(() => {
        if (!live || observerResolved) return;
        detachObserver();
        setState({ kind: "unavailable", reason: "auth_restore_timeout" });
      }, AUTH_INITIALIZATION_TIMEOUT_MS);
      unsubscribe = configuredAuth.onUserChanged((user) => {
        if (!live || observerDetached) return;
        const eventRevision = ++authObserverRevision;
        const isRestoredAuthEvent = !observerResolved;
        if (!observerResolved) {
          observerResolved = true;
          authInitializationResolvedRef.current = true;
          if (initializationTimeout !== undefined) clearTimeout(initializationTimeout);
        }
        if (!user) {
          const previousObservedUid = observedUid;
          // Keep all scoped reads behind an explicit guest decision. A selected
          // account always returns to login with its scope still closed.
          setAccountEntryMode("login");
          lockAndCloseProfileAfterAuthLoss({
            publishLockedState: () => publish({ kind: "signedOut" }),
            closeProfileStorage: closeActiveProfileStorage,
          });
          const logoutBlock = logoutControlSnapshotRef.current.blocked;
          if (logoutBlock) {
            const canClearLogoutBlock = () => live && !observerDetached && eventRevision === authObserverRevision && configuredAuth.getSnapshot() === null;
            void logoutControl.clearBlockForAuth(previousObservedUid, logoutBlock.operationId, canClearLogoutBlock).then((snapshot) => {
              if (!canClearLogoutBlock()) return;
              logoutControlSnapshotRef.current = snapshot;
              setLogoutControlSnapshot(snapshot);
            }).catch(() => undefined);
          }
          revokeDeletionAuthorization();
          setRefreshAccountIdentityFailure(null);
          observerBlockedUidRef.current = null;
          observedUid = null;
          sessionCoordinator.invalidate();
          const pendingPreparation = profilePreparationRef.current;
          if (pendingPreparation) {
            profilePreparationRef.current = null;
            pendingPreparation.resolveCompletion({ kind: "failure", failure: "revokedSession" });
          }
          if (rejectedRestoreUid !== null && previousObservedUid === rejectedRestoreUid) {
            rejectedRestoreUid = null;
            publish({ kind: "signedOut" });
            return;
          }
          void prepareSelectedGuest();
          return;
        }
        if (rejectedRestoreUid !== null && rejectedRestoreUid !== user.uid) rejectedRestoreUid = null;
        if (legalAcceptancePendingRef.current || observerBlockedUidRef.current === user.uid || sessionExchangeUidRef.current === user.uid) return;
        const matchingLogoutBlock = findMatchingLocalLogoutBlock(logoutControlSnapshotRef.current, user.uid);
        if (matchingLogoutBlock) {
          observedUid = user.uid;
          sessionCoordinator.invalidate();
          closeActiveProfileStorage();
          setAccountEntryMode("login");
          setState({ kind: "signOutPending", user, operationId: matchingLogoutBlock.operationId });
          return;
        }
        const uidChanged = observedUid !== null && observedUid !== user.uid;
        if (uidChanged) {
          revokeDeletionAuthorization();
          setRefreshAccountIdentityFailure(null);
        }
        observedUid = user.uid;
        const generation = sessionCoordinator.begin(user.uid);
        const isCurrentObserver = () => live && !observerDetached && sessionCoordinator.isCurrent(generation) && configuredAuth.getSnapshot()?.uid === generation.uid;
        if (planPasswordVerificationCommand("persisted", runtimeMode, user).kind === "verificationPending") {
          if (isCurrentObserver()) setState({ kind: "verificationPending", user });
          return;
        }
        if (isCurrentObserver()) setState({ kind: "loading" });
        void startAuthenticatedProfilePreparation(configuredAuth, client, user, generation).then(async (attempt) => {
          const bootstrapFailure = attempt?.bootstrapFailure;
          if (!bootstrapFailure || !shouldRejectPersistedAuthRestore({
            failure: bootstrapFailure.kind === "failure" ? bootstrapFailure.failure : "",
            isRestoredAuthEvent,
            isCurrentGeneration: isCurrentObserver(),
          })) return;
          rejectedRestoreUid = user.uid;
          try { await configuredAuth.signOut(); } catch { /* Publish the still-live UID below. */ }
          const afterSignOut = configuredAuth.getSnapshot();
          if (!sessionCoordinator.isCurrent(generation) || (afterSignOut && afterSignOut.uid !== user.uid)) {
            rejectedRestoreUid = null;
            return;
          }
          if (afterSignOut) {
            rejectedRestoreUid = null;
            setState({ kind: "signOutPending", user });
          } else {
            try { clearPremiumCache(); } catch { /* Retried on the next signed-out hydration. */ }
            setAccountEntryMode("login");
            setState({ kind: "signedOut" });
          }
        });
      });
      return () => {
        live = false;
        observerBlockedUidRef.current = null;
        revokeDeletionAuthorization();
        detachObserver();
        sessionCoordinator.dispose();
      };
    } catch {
      publish({ kind: "unavailable", reason: "firebase_unconfigured" });
      return () => { live = false; observerBlockedUidRef.current = null; revokeDeletionAuthorization(); sessionCoordinator.dispose(); };
    }
  }, [authInitializationRevision, finalizeCurrent, logoutControl, preparedProfileState, revokeDeletionAuthorization, runtimeMode, sessionCoordinator, startAuthenticatedProfilePreparation]);

  useEffect(() => {
    if (state.kind !== "guest" || runtimeMode !== "smoke" || typeof __DEV__ === "undefined" || !__DEV__ || ownerPreservationResult !== null) return;
    let active = true;
    ownerPreservationRestartCheckRef.current ??= ownerPreservationOracle.verifyAfterRestart();
    void ownerPreservationRestartCheckRef.current.then((result) => {
      if (active && result !== "not_armed") setOwnerPreservationResult(result);
    });
    return () => { active = false; };
  }, [ownerPreservationResult, runtimeMode, state.kind]);

  const runWithAuth = useCallback(async (operation: (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>) => Promise<AccountCommandResult>): Promise<AccountCommandResult> => {
    if (!authClient || !apiClient) return { kind: "failure", failure: "providerUnavailable" };
    try { return await operation(authClient, apiClient); } catch (error) { return { kind: "failure", failure: classifyAccountFailure(error) }; }
  }, [apiClient, authClient]);

  const runSensitiveWithAuth = useCallback((operation: (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>) => Promise<AccountCommandResult>): Promise<AccountCommandResult> => {
    return sensitiveCommandLane.run(() => runWithAuth(operation)).catch((error) => ({ kind: "failure", failure: classifyAccountFailure(error) }));
  }, [runWithAuth, sensitiveCommandLane]);

  const runAuthMutationWithAuth = useCallback((operation: (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>) => Promise<AccountCommandResult>): Promise<AccountCommandResult> => {
    return sensitiveCommandLane.runWhenIdle(() => runWithAuth(operation)).catch((error) => ({ kind: "failure", failure: classifyAccountFailure(error) }));
  }, [runWithAuth, sensitiveCommandLane]);

  const runRefreshWithAuth = useCallback((operation: (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>) => Promise<AccountCommandResult>): Promise<AccountCommandResult> => {
    return sensitiveCommandLane.runWhenIdle(() => runWithAuth(operation));
  }, [runWithAuth, sensitiveCommandLane]);
  const holdAccountIdentityRefresh = useCallback(() => sensitiveCommandLane.holdRefresh(), [sensitiveCommandLane]);

  const registrationEvidence = useCallback((locale: "en" | "pl") => Object.freeze({
    termsVersion: legalVariables.documentVersion[locale],
    termsLocale: locale,
    privacyPolicyVersion: legalVariables.documentVersion[locale],
    privacyPolicyLocale: locale,
    privacyPolicyAcknowledged: true as const,
  }), []);

  const finalizeExplicitAuthentication = useCallback(async (
    auth: FirebaseAuthClient,
    api: ReturnType<typeof createPatternlyApiClient>,
    user: FirebaseAuthUserSnapshot,
  ): Promise<AccountCommandResult> => {
    const current = stateRef.current;
    if (current.kind === "authenticated" && current.user.uid === user.uid && auth.getSnapshot()?.uid === user.uid) {
      return { kind: "success", next: "authenticated" };
    }
    const generation = sessionCoordinator.current(user.uid) ?? sessionCoordinator.begin(user.uid);
    const attempt = await startAuthenticatedProfilePreparation(auth, api, user, generation);
    if (!attempt) {
      const latest = stateRef.current;
      return { kind: "failure", failure: latest.kind === "revokedSession" ? "revokedSession" : latest.kind === "backendUnavailable" ? "backendUnavailable" : "providerUnavailable" };
    }
    return attempt.completion;
  }, [sessionCoordinator, startAuthenticatedProfilePreparation]);

  // Firebase publishes a new credential before our explicit Patternly
  // registration request returns.  Block only that UID, then release it after
  // the atomic backend decision; this prevents the observer from treating a
  // first-use provider identity as an existing account.
  const registerAuthenticatedIdentity = useCallback(async (
    auth: FirebaseAuthClient,
    api: ReturnType<typeof createPatternlyApiClient>,
    user: FirebaseAuthUserSnapshot,
    locale: "en" | "pl",
    finalize = true,
  ): Promise<AccountCommandResult> => {
    const inFlight = registrationIntentRef.current;
    if (inFlight?.uid === user.uid) return inFlight.promise;
    let promise!: Promise<AccountCommandResult>;
    promise = (async (): Promise<AccountCommandResult> => {
    const generation = sessionCoordinator.restart(user.uid);
    observerBlockedUidRef.current = user.uid;
    legalAcceptancePendingRef.current = true;
    try {
      await api.registerAccount(registrationEvidence(locale));
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
      return finalize
        ? ((getActiveStorageProfileOrNull()?.kind === "guest" || getActiveStorageProfileOrNull()?.kind === "legacy_guest")
          ? finalizeCurrent(auth, api, user, false, generation, true)
          : finalizeExplicitAuthentication(auth, api, user))
        : { kind: "success", next: "authenticated" };
    } catch (error) {
      // A timeout/transport failure leaves the server outcome unknown. Do not
      // let the observer continue with a credential whose account may not have
      // been created; a later explicit Create account retry is replay-safe.
      const failure = classifyAccountFailure(error);
      if (failure === "offline" || failure === "backendUnavailable") {
        await auth.signOut().catch(() => undefined);
        if (!auth.getSnapshot()) setState({ kind: "signedOut" });
        else return { kind: "failure", failure: "signOutPending" };
      }
      return { kind: "failure", failure };
    } finally {
      legalAcceptancePendingRef.current = false;
      if (finalize && observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
      if (registrationIntentRef.current?.promise === promise) registrationIntentRef.current = null;
    }
    })();
    registrationIntentRef.current = Object.freeze({ uid: user.uid, promise });
    return promise;
  }, [finalizeCurrent, finalizeExplicitAuthentication, registrationEvidence, sessionCoordinator]);

  const signOutRejectedIdentity = useCallback(async (auth: FirebaseAuthClient): Promise<AccountCommandResult> => {
    await auth.signOut().catch(() => undefined);
    if (auth.getSnapshot()) return { kind: "failure", failure: "signOutPending" };
    setState({ kind: "signedOut" });
    return { kind: "failure", failure: "accountNotFound" };
  }, []);

  const value = useMemo<AccountSessionContextValue>(() => ({
    refreshPremiumEntitlement: (accountId) => premiumRefreshQueueRef.current.request(async () => {
      const current = stateRef.current;
      if (!apiClient || !authClient || current.kind !== "authenticated" || current.backendUser.id !== accountId || authClient.getSnapshot()?.uid !== current.user.uid) return "pending";
      const generation = sessionCoordinator.current(current.user.uid);
      if (!generation) return "pending";
      if (!clearPremiumCacheUnlessBoundTo(accountId)) return "pending";
      const stillCurrent = () => sessionCoordinator.isCurrent(generation) && authClient.getSnapshot()?.uid === current.user.uid
        && stateRef.current.kind === "authenticated" && stateRef.current.backendUser.id === accountId;
      try {
        const response = await apiClient.getEntitlements();
        if (!stillCurrent()) return "pending";
        const identity = { accountId, entitlement: PREMIUM_ENTITLEMENT, productId: legalVariables.terms.premiumProductIdentifier.en };
        if (!replacePremiumCacheFromFreshResponse(response, identity, Date.now())) return "pending";
        return isPremiumAccessConfirmedOnline({ ...response.entitlements[0], serverObservedAt: response.serverObservedAt }) ? "verified" : "denied";
      } catch { return "pending"; }
    }),
    recordPurchaseConfirmation: async (input) => {
      if (!apiClient || state.kind !== "authenticated") return { kind: "failure", failure: "providerUnavailable" };
      try { await apiClient.recordPurchaseConfirmation(input); return { kind: "success", next: "authenticated" }; }
      catch (error) { return { kind: "failure", failure: classifyAccountFailure(error) }; }
    },
    continueAsGuest: async () => {
      setGuestTransitionFailure(null);
      const result = await runWithGuestTransitionLock<AccountCommandResult>(guestCommandLockRef.current, { kind: "failure", failure: "providerUnavailable" }, async () => {
      sessionCoordinator.invalidate();
      revokeDeletionAuthorization();
      const auth = authClient;
      if (auth?.getSnapshot()) {
        try { await sensitiveCommandLane.runWhenIdle(() => auth.signOut()); }
        catch { return { kind: "failure", failure: "signOutPending" }; }
        if (auth.getSnapshot() !== null) return { kind: "failure", failure: "signOutPending" };
      } else if (auth === null && stateRef.current.kind !== "unavailable") {
        return { kind: "failure", failure: "providerUnavailable" };
      }
      const activeProfile = getActiveStorageProfileOrNull();
      if (activeProfile && (activeProfile.kind === "guest" || activeProfile.kind === "legacy_guest") && hasUnboundGuestInstallation()) {
        grantGuestAccess();
        setState({ kind: "guest" });
        return { kind: "success", next: "guest" };
      }
      try {
        setAccountEntryMode("login");
        if (shouldShowGuestSelectionLoading(activeProfile)) setState({ kind: "loading" });
        await prepareProfileStorage();
        const prepared = await inspectPreparedProfileState();
        const selectedProfile = await prepareGuestProfileScope({
          allowNewSelection: true,
          canContinue: () => authClient === auth && auth?.getSnapshot() == null,
          isFreshInstallation: false,
          validatePersistedAccess: async () => true,
          selectGuest: () => selectPreparedGuestProfile(undefined, () => authClient === auth && auth?.getSnapshot() == null),
          activate: (profile) => { activatePreparedProfile(profile.id, profile.kind); },
        });
        if (!selectedProfile) {
          recoverAfterGuestPreparationFailure({
            closeProfileStorage: closeActiveProfileStorage,
            setAccountEntryMode: () => setAccountEntryMode("login"),
            publishSignedOut: () => setState({ kind: "signedOut" }),
          });
          return { kind: "failure", failure: "providerUnavailable" };
        }
        grantGuestAccess();
        let resolveCompletion!: (result: AccountCommandResult) => void;
        const completion = new Promise<AccountCommandResult>((resolve) => { resolveCompletion = resolve; });
        const attempt: ProfilePreparationAttempt = {
          kind: "guest",
          profile: selectedProfile,
          completion,
          resolveCompletion,
          completing: null,
        };
        profilePreparationRef.current = attempt;
        setAccountEntryMode(prepared.isFreshInstallation ? "welcome" : "login");
        setState({ kind: "profilePreparing", profile: selectedProfile });
        return await completion;
      } catch (error) {
        const result = { kind: "failure", failure: classifyAccountFailure(error) } as const;
        const pendingAttempt = profilePreparationRef.current;
        if (pendingAttempt?.kind === "guest") {
          profilePreparationRef.current = null;
          pendingAttempt.resolveCompletion(result);
        }
        if (authClient === auth && auth?.getSnapshot() == null) {
          recoverAfterGuestPreparationFailure({
            closeProfileStorage: closeActiveProfileStorage,
            setAccountEntryMode: () => setAccountEntryMode("login"),
            publishSignedOut: () => setState({ kind: "signedOut" }),
          });
        }
        return result;
      }
      });
      setGuestTransitionFailure(result.kind === "failure" ? { kind: "failure", failure: result.failure } : null);
      return result;
    },
    runOwnerPreservationGuestCommand: async () => {
      const auth = authClient;
      let initialProfile: ReturnType<typeof getActiveStorageProfile> | null = null;
      return runOwnerPreservationGuestTransition({
        lock: guestCommandLockRef.current,
        preflight: () => {
          initialProfile = getActiveStorageProfile();
          return typeof __DEV__ !== "undefined" && __DEV__ && isPatternlySmokeRuntime()
            && stateRef.current.kind === "guestAccessBlocked"
            && initialProfile.kind === "legacy_owner"
            && auth !== null && authInitializationResolvedRef.current && auth.getSnapshot() === null;
        },
        arm: () => ownerPreservationOracle.arm(),
        recheck: () => {
          const profile = getActiveStorageProfile();
          return initialProfile !== null && stateRef.current.kind === "guestAccessBlocked"
            && auth !== null && authClient === auth && authInitializationResolvedRef.current && auth.getSnapshot() === null
            && profile.kind === "legacy_owner" && profile.id === initialProfile.id;
        },
        cleanup: () => ownerPreservationOracle.cleanup(),
        beginTransition: async () => {
          sessionCoordinator.invalidate();
          revokeDeletionAuthorization();
          await continueAsGuestInNewProfile();
        },
      });
    },
    ownerPreservationResult,
    exportAccountData: async (isRequestActive = () => true) => {
      if (!authClient || !apiClient || state.kind !== "authenticated") return { kind: "failure", failure: "authenticationRequired" };
      return sensitiveCommandLane.run(async (): Promise<AccountDataExportCommandResult> => {
        const user = authClient.getSnapshot();
        if (!user || state.kind !== "authenticated" || state.user.uid !== user.uid) return { kind: "failure", failure: "sessionRevoked" };
        const generation = sessionCoordinator.begin(user.uid);
        const isCurrent = () => isRequestActive() && sessionCoordinator.isCurrent(generation) && authClient.getSnapshot()?.uid === user.uid;
        try {
          const data: AccountDataExportDto = await apiClient.exportAccountData();
          if (!isCurrent()) return { kind: "failure", failure: "sessionRevoked" };
          const shared = await shareDownloadedAccountData(data, undefined, isCurrent, getActiveStorageProfile().id);
          if (shared.kind === "shared") return { kind: "success" };
          if (shared.failure === "sessionChanged") return { kind: "failure", failure: "sessionRevoked" };
          return { kind: "failure", failure: shared.failure };
        } catch (error) {
          return classifyAccountDataExportFailure(error);
        }
      }).catch(() => ({ kind: "failure", failure: "serverFailure" }));
    },
    resetLocalLearningHistory: async () => {
      if (state.kind === "guest") {
        try {
          await commitLearningStateReset(new Date().toISOString());
          return { kind: "success", next: "guest" };
        } catch {
          return { kind: "failure", failure: "localCleanupFailure" };
        }
      }
      return runWithAuth(async (auth, api) => {
        const current = auth.getSnapshot();
        if (!current || state.kind !== "authenticated" || state.user.uid !== current.uid) return { kind: "failure", failure: "providerUnavailable" };
        const generation = sessionCoordinator.restart(current.uid);
        const next = await resetAccountLocalLearningHistory(api, state.backendUser.id);
        if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
        if (next.status === "synced") {
          await reconcileMaterializedAccountReminders().catch(() => undefined);
          if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
        }
        setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
        if (next.status === "synced") return { kind: "success", next: "authenticated" };
        return { kind: "failure", failure: next.lastFailureCode === "offline" ? "offline" : "localCleanupFailure" };
      });
    },
    createPrivacyRequest: async (right, narrative) => {
      if (!apiClient || state.kind !== "authenticated") return { kind: "failure", failure: "authenticationRequired" };
      try {
        const result = await apiClient.createPrivacyRequest(right, narrative);
        return { kind: "success", value: result.request };
      } catch (error) {
        return { kind: "failure", failure: classifyPrivacyRequestFailure(error) };
      }
    },
    createGuestPrivacyRequest: async (input) => {
      if (!apiClient || state.kind !== "guest") return { kind: "failure", failure: "serverFailure" };
      try { return { kind: "success", value: (await apiClient.createGuestPrivacyRequest(input)).requestId }; }
      catch (error) { return { kind: "failure", failure: classifyGuestPrivacyRequestFailure(error) }; }
    },
    resendGuestPrivacyCode: async (requestId, email) => {
      if (!apiClient || state.kind !== "guest") return { kind: "failure", failure: "serverFailure" };
      try { await apiClient.resendGuestPrivacyCode(requestId, email); return { kind: "success", value: undefined }; }
      catch (error) { return { kind: "failure", failure: classifyGuestPrivacyRequestFailure(error) }; }
    },
    verifyGuestPrivacyCode: async (code) => {
      if (!apiClient || state.kind !== "guest") return { kind: "failure", failure: "serverFailure" };
      try { return { kind: "success", value: await apiClient.verifyGuestPrivacyCode(code) }; }
      catch (error) { return { kind: "failure", failure: classifyGuestPrivacyRequestFailure(error) }; }
    },
    readGuestPrivacyResponse: async (requestId, sessionToken) => {
      if (!apiClient || state.kind !== "guest") return { kind: "failure", failure: "serverFailure" };
      try { return { kind: "success", value: await apiClient.readGuestPrivacyResponse(requestId, sessionToken) }; }
      catch (error) { return { kind: "failure", failure: classifyGuestPrivacyRequestFailure(error) }; }
    },
    listPrivacyRequests: async () => {
      if (!apiClient || state.kind !== "authenticated") return { kind: "failure", failure: "authenticationRequired" };
      try {
        const result = await apiClient.getPrivacyRequests();
        return { kind: "success", value: result.requests };
      } catch (error) {
        return { kind: "failure", failure: classifyPrivacyRequestFailure(error) };
      }
    },
    readPrivacyRequest: async (requestId) => {
      if (!apiClient || state.kind !== "authenticated") return { kind: "failure", failure: "authenticationRequired" };
      try {
        return { kind: "success", value: await apiClient.getPrivacyRequest(requestId) };
      } catch (error) {
        return { kind: "failure", failure: classifyPrivacyRequestFailure(error) };
      }
    },
    createLegalRequest: async (input) => {
      if (!apiClient || state.kind !== "authenticated") return { kind: "failure", failure: "authenticationRequired" };
      try {
        const result = await apiClient.createLegalRequest(input);
        return { kind: "success", value: result.request };
      } catch (error) {
        return { kind: "failure", failure: classifyPrivacyRequestFailure(error) };
      }
    },
    createPublicLegalRequest: async (input) => {
      if (!apiClient) return { kind: "failure", failure: "serverFailure" };
      const appCheckToken = await getPatternlyAppCheckToken();
      if (!appCheckToken) return { kind: "failure", failure: "appCheckUnavailable" };
      try {
        const result = await apiClient.createPublicLegalRequest(input, appCheckToken);
        return { kind: "success", value: result.request };
      } catch (error) {
        return { kind: "failure", failure: classifyPrivacyRequestFailure(error) };
      }
    },
    listLegalRequests: async () => {
      if (!apiClient || state.kind !== "authenticated") return { kind: "failure", failure: "authenticationRequired" };
      try {
        const result = await apiClient.getLegalRequests();
        return { kind: "success", value: result.requests };
      } catch (error) {
        return { kind: "failure", failure: classifyPrivacyRequestFailure(error) };
      }
    },
    readLegalRequest: async (requestId) => {
      if (!apiClient || state.kind !== "authenticated") return { kind: "failure", failure: "authenticationRequired" };
      try {
        const result = await apiClient.getLegalRequest(requestId);
        return { kind: "success", value: result.request };
      } catch (error) {
        return { kind: "failure", failure: classifyPrivacyRequestFailure(error) };
      }
    },
    applyVerificationCode: (code) => runSensitiveWithAuth(async (auth, api) => {
      revokeDeletionAuthorization();
      if (!code.trim()) return { kind: "failure", failure: "invalid" };
      await auth.applyActionCode(code.trim());
      return finalizeCurrent(auth, api, auth.getSnapshot(), true);
    }),
    confirmPasswordReset: (code, password) => runSensitiveWithAuth(async (auth) => {
      revokeDeletionAuthorization();
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
        try { clearPremiumCache(); } catch { return { kind: "failure", failure: "localCleanupFailure" }; }
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
    holdAccountIdentityRefresh,
    refreshAccountIdentityFailure,
    refreshVerification: () => runSensitiveWithAuth(async (auth, api) => {
      const previousUser = auth.getSnapshot();
      revokeDeletionAuthorization();
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
    refreshAccountIdentity: () => {
      const current = stateRef.current;
      const previousUser = authClient?.getSnapshot();
      if (!authClient || !apiClient || !previousUser || current.kind !== "authenticated" || current.user.uid !== previousUser.uid) {
        return Promise.resolve({ kind: "failure", failure: "providerUnavailable" } as const);
      }
      const generation = sessionCoordinator.begin(previousUser.uid);
      const canContinue = (auth: FirebaseAuthClient, user: FirebaseAuthUserSnapshot | null) => canContinueAccountIdentityRefresh({
        authUid: auth.getSnapshot()?.uid ?? null,
        currentState: stateRef.current,
        expectedUid: previousUser.uid,
        generation,
        isCurrentGeneration: sessionCoordinator.isCurrent,
        refreshedUid: user?.uid ?? null,
      });
      const hasLiveDeletionAuthorization = () => {
        return isLiveDeletionAuthorization({
          isCurrent: sessionCoordinator.isCurrent,
          token: deletionAuthorizationTokenRef.current,
          uid: previousUser.uid,
          vault: deletionAuthorization,
        });
      };
      let skippedForDeletionGrant = false;
      if (hasLiveDeletionAuthorization()) {
        skippedForDeletionGrant = true;
        return Promise.resolve({ kind: "success", next: "authenticated" } as const);
      }
      setRefreshAccountIdentityFailure(null);
      return runRefreshWithAuth(async (auth, api) => {
        if (hasLiveDeletionAuthorization()) {
          skippedForDeletionGrant = true;
          return { kind: "success", next: "authenticated" };
        }
        if (!canContinue(auth, auth.getSnapshot())) return { kind: "failure", failure: "revokedSession" };
        observerBlockedUidRef.current = previousUser.uid;
        try {
          const user = await auth.refreshAccountIdentity();
          if (!user || !canContinue(auth, user)) return { kind: "failure", failure: "revokedSession" };
          const response = await getMeWithExchangedSession({
            api,
            auth,
            canContinue: () => canContinue(auth, user),
            onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
            user,
          });
          if (!canContinue(auth, user)) return { kind: "failure", failure: "revokedSession" };
          setState((latest) => publishRefreshedAuthenticatedState(latest, {
            backendUser: response.user,
            isCurrent: () => canContinue(auth, auth.getSnapshot()),
            user,
          }));
          return { kind: "success", next: "authenticated" };
        } catch (error) {
          return { kind: "failure", failure: classifyAccountFailure(error) };
        } finally {
          if (observerBlockedUidRef.current === previousUser.uid) observerBlockedUidRef.current = null;
          if (sessionExchangeUidRef.current === previousUser.uid) sessionExchangeUidRef.current = null;
        }
      }).then((result) => {
        const currentAuth = authClient;
        const currentUser = currentAuth?.getSnapshot() ?? null;
        if (!skippedForDeletionGrant && currentAuth && canContinue(currentAuth, currentUser)) {
          setRefreshAccountIdentityFailure(result.kind === "failure" ? result.failure : null);
        }
        return result;
      });
    },
    register: (email, password, acceptanceConfirmed, locale) => runAuthMutationWithAuth(async (auth, api) => {
      if (!acceptanceConfirmed) return { kind: "failure", failure: "invalid" };
      if (!isValidEmail(email)) return { kind: "failure", failure: "invalidEmail" };
      if (!isValidPassword(password)) return { kind: "failure", failure: "weakPassword" };
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      let user: FirebaseAuthUserSnapshot;
      try {
        user = await auth.register(email.trim().toLowerCase(), password);
      } catch (error) {
        // Retrying an interrupted email registration must use the submitted
        // credential and the same explicit registration endpoint. Existing
        // Patternly accounts are a no-op at that endpoint.
        if (firebaseAuthErrorCode(error) === "auth/email-already-in-use") {
          try { user = await auth.signIn(email.trim().toLowerCase(), password); }
          catch { return { kind: "failure", failure: "duplicate" }; }
        } else {
          throw error;
        }
      }
      const registration = await registerAuthenticatedIdentity(auth, api, user, locale, false);
      if (registration.kind === "failure") return registration;
      const plan = planPasswordVerificationCommand("register", runtimeMode, user);
      if (plan.kind === "finalize") {
        try { return await finalizeExplicitAuthentication(auth, api, user); }
        finally { if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null; }
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
    signIn: (email, password) => runAuthMutationWithAuth(async (auth, api) => {
      if (!isValidEmail(email)) return { kind: "failure", failure: "invalidEmail" };
      if (password.length === 0) return { kind: "failure", failure: "invalid" };
      revokeDeletionAuthorization();
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
      const result = await finalizeExplicitAuthentication(auth, api, user);
      if (result.kind === "failure" && result.failure === "accountNotFound") {
        return signOutRejectedIdentity(auth);
      }
      return result;
    }),
    signInWithApple: () => runAuthMutationWithAuth(async (auth, api) => {
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      const user = await auth.signInWithApple();
      const result = await finalizeExplicitAuthentication(auth, api, user);
      if (result.kind === "failure" && result.failure === "accountNotFound") {
        return signOutRejectedIdentity(auth);
      }
      return result;
    }),
    signInWithGoogle: (idToken) => runAuthMutationWithAuth(async (auth, api) => {
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      const user = await auth.signInWithGoogle(idToken);
      const result = await finalizeExplicitAuthentication(auth, api, user);
      if (result.kind === "failure" && result.failure === "accountNotFound") {
        return signOutRejectedIdentity(auth);
      }
      return result;
    }),
    registerWithApple: (acceptanceConfirmed, locale) => runAuthMutationWithAuth(async (auth, api) => {
      if (!acceptanceConfirmed) return { kind: "failure", failure: "invalid" };
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      return registerAuthenticatedIdentity(auth, api, await auth.signInWithApple(), locale);
    }),
    registerWithGoogle: (idToken, acceptanceConfirmed, locale) => runAuthMutationWithAuth(async (auth, api) => {
      if (!acceptanceConfirmed) return { kind: "failure", failure: "invalid" };
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      return registerAuthenticatedIdentity(auth, api, await auth.signInWithGoogle(idToken), locale);
    }),
    confirmAdoption: (resolutions, groupChoices) => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated" || !state.accountData.preview) return { kind: "failure", failure: "conflict" };
      const generation = sessionCoordinator.restart(current.uid);
      const next = await confirmAccountDataAdoption(api, state.backendUser.id, state.accountData.preview, resolutions, groupChoices);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      if (next.status === "synced") await reconcileMaterializedAccountReminders().catch(() => undefined);
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
      if (next.status === "synced") await reconcileMaterializedAccountReminders().catch(() => undefined);
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
      if (next.status === "synced") await reconcileMaterializedAccountReminders().catch(() => undefined);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      return next.status === "synced" ? { kind: "success", next: "authenticated" } : { kind: "failure", failure: next.lastFailureCode === "offline" ? "offline" : "remoteFailure" };
    }),
    signOut: () => runAuthMutationWithAuth(async (auth) => {
      const user = auth.getSnapshot();
      if (!user) return { kind: "failure", failure: "providerUnavailable" };
      const signOutProfile = getActiveStorageProfileOrNull();
      const closeSignOutProfileStorage = () => {
        const activeProfile = getActiveStorageProfileOrNull();
        if (signOutProfile && activeProfile?.id === signOutProfile.id) closeActiveProfileStorage();
        else if (!signOutProfile && activeProfile === null) closeActiveProfileStorage();
      };
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      const generation = sessionCoordinator.begin(user.uid);
      const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
      try {
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        let operationId: string;
        let durableOperation = false;
        try {
          const existingBlock = findMatchingLocalLogoutBlock(logoutControlSnapshotRef.current, user.uid);
          const pendingState = stateRef.current.kind === "signOutPending" && stateRef.current.user.uid === user.uid
            ? stateRef.current
            : null;
          operationId = existingBlock?.operationId ?? pendingState?.operationId ?? "";
          durableOperation = existingBlock !== null || pendingState?.operationId !== undefined;
          if (!operationId) {
            const current = stateRef.current;
            if (current.kind === "authenticated" && current.user.uid === user.uid) {
              const scopedSignOut = getAccountSignOutState();
              if (scopedSignOut?.accountId === current.backendUser.id) operationId = scopedSignOut.operationId;
              else operationId = beginAccountSignOut(current.backendUser.id).operationId;
              durableOperation = true;
            } else {
              operationId = createSignOutOperationId();
            }
          }
        } catch {
          let operationId: string | undefined;
          let scopedOperationRecovered = false;
          const currentState = stateRef.current;
          if (currentState.kind === "authenticated" && currentState.user.uid === user.uid) {
            try {
              const recovered = getAccountSignOutState();
              if (recovered?.accountId === currentState.backendUser.id) {
                operationId = recovered.operationId;
                scopedOperationRecovered = true;
              }
            } catch { /* A failed scoped read cannot authorize reuse of its marker. */ }
          }
          let controlWriteVerified = false;
          const recoveryOutcome = await finishLocalSignOutSetupFailure({
            isCurrent: canContinue,
            retainAuthOnFailedControlWrite: scopedOperationRecovered,
            persistFallbackControlPair: async () => {
              operationId ??= createSignOutOperationId();
              const snapshot = await logoutControl.blockAndQueueRevoke(user.uid, operationId);
              logoutControlSnapshotRef.current = snapshot;
              setLogoutControlSnapshot(snapshot);
              controlWriteVerified = findMatchingLocalLogoutBlock(snapshot, user.uid)?.operationId === operationId;
              return controlWriteVerified;
            },
            publishLockedState: () => {
              observerBlockedUidRef.current = user.uid;
              setState({ kind: "signOutPending", user, ...(operationId && (scopedOperationRecovered || controlWriteVerified) ? { operationId } : {}) });
            },
            closeProfileStorage: closeSignOutProfileStorage,
            signOutFirebase: () => auth.signOut(),
          });
          return { kind: "failure", failure: recoveryOutcome === "stale" ? "revokedSession" : "localCleanupFailure" };
        }
        const outcome = await performLocalAccountSignOut({
          uid: user.uid,
          retainAuthOnControlFailure: durableOperation,
          persistBlock: async () => {
            const snapshot = await logoutControl.blockAndQueueRevoke(user.uid, operationId!);
            logoutControlSnapshotRef.current = snapshot;
            setLogoutControlSnapshot(snapshot);
            return snapshot;
          },
          publishLockedState: () => {
            observerBlockedUidRef.current = user.uid;
            setState({ kind: "signOutPending", user, ...(durableOperation ? { operationId } : {}) });
          },
          closeProfileStorage: closeSignOutProfileStorage,
          signOutFirebase: async () => {
            await auth.signOut();
            if (auth.getSnapshot() !== null) throw new Error("firebase_sign_out_incomplete");
          },
          isCurrent: canContinue,
        });
        if (outcome === "localLogoutControlFailure") {
          return { kind: "failure", failure: "localCleanupFailure" };
        }
        if (outcome === "signOutPending") return { kind: "failure", failure: "signOutPending" };
        if (outcome === "stale") return { kind: "failure", failure: "revokedSession" };
        if (auth.getSnapshot() !== null) return { kind: "failure", failure: "revokedSession" };
        setAccountEntryMode("login");
        setState({ kind: "signedOut" });
        try { clearPremiumCache(); } catch { /* Retried on signed-out hydration. */ }
        return { kind: "success", next: "signedOut" };
      } finally {
        revokeDeletionAuthorization();
      }
    }),
    changePassword: (credentials, newPassword) => runSensitiveWithAuth(async (auth) => {
      revokeDeletionAuthorization();
      const user = auth.getSnapshot();
      if (!user || state.kind !== "authenticated" || state.user.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
      if (!user.providers.includes("password") || credentials.kind !== "password") return { kind: "failure", failure: "providerUnavailable" };
      if (!isValidPassword(newPassword)) return { kind: "failure", failure: "weakPassword" };
      if (!credentials.password) return { kind: "failure", failure: "reauthenticationRequired" };
      const generation = sessionCoordinator.restart(user.uid);
      const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
      try {
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        await auth.changePassword(credentials, newPassword);
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        revokeDeletionAuthorization();
        return { kind: "success", next: "authenticated" };
      } catch (error) {
        const failure = classifyAccountFailure(error);
        return { kind: "failure", failure: failure === "invalidCredential" ? "reauthenticationRequired" : failure };
      } finally {
        revokeDeletionAuthorization();
      }
    }),
    requestEmailChange: (credentials, email) => runSensitiveWithAuth(async (auth) => {
      revokeDeletionAuthorization();
      const user = auth.getSnapshot();
      const nextEmail = email.trim().toLowerCase();
      if (!user || state.kind !== "authenticated" || state.user.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
      if (!isValidEmail(nextEmail)) return { kind: "failure", failure: "invalidEmail" };
      if (user.email?.toLowerCase() === nextEmail) return { kind: "failure", failure: "invalidEmail" };
      if (!credentialsMatchSnapshot(user, credentials)) return { kind: "failure", failure: "providerUnavailable" };
      const generation = sessionCoordinator.restart(user.uid);
      const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
      try {
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        await auth.requestEmailChange(credentials, nextEmail);
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        setRefreshAccountIdentityFailure(null);
        return { kind: "success", next: "verificationSent" };
      } catch (error) {
        return { kind: "failure", failure: classifyEmailChangeFailure(error) };
      } finally {
        revokeDeletionAuthorization();
      }
    }),
    prepareDeletion: (credentials) => runSensitiveWithAuth(async (auth) => {
      revokeDeletionAuthorization();
      const user = auth.getSnapshot();
      if (!user || state.kind !== "authenticated" || state.user.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
      if (!credentialsMatchSnapshot(user, credentials)) return { kind: "failure", failure: "reauthenticationRequired" };
      const generation = sessionCoordinator.restart(user.uid);
      const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
      deletionAuthorizationTokenRef.current = generation;
      const canPrepare = () => canContinue() && deletionAuthorizationTokenRef.current === generation;
      const prepared = await prepareDeletionAuthorization({
        credentials,
        generation: generation.generation,
        isCurrent: canPrepare,
        reauthenticate: auth.reauthenticateWithCredential,
        uid: user.uid,
        vault: deletionAuthorization,
      });
      if (prepared.ok) {
        return { kind: "success", next: "deletionAuthorized" };
      }
      try {
        if (!canPrepare()) return { kind: "failure", failure: "revokedSession" };
        const failure = classifyAccountFailure(prepared.error);
        return { kind: "failure", failure: failure === "invalidCredential" ? "reauthenticationRequired" : failure };
      } finally {
        deletionAuthorizationTokenRef.current = null;
        deletionAuthorization.revoke();
      }
    }),
    reauthenticateForExport: (credentials) => runSensitiveWithAuth(async (auth) => {
      const user = auth.getSnapshot();
      if (!user || state.kind !== "authenticated" || state.user.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
      if (!credentialsMatchSnapshot(user, credentials)) return { kind: "failure", failure: "reauthenticationRequired" };
      try {
        await auth.reauthenticateWithCredential(credentials);
        return { kind: "success", next: "authenticated" };
      } catch (error) {
        const failure = classifyAccountFailure(error);
        return { kind: "failure", failure: failure === "invalidCredential" ? "reauthenticationRequired" : failure };
      }
    }),
    deleteAccount: () => runSensitiveWithAuth(async (auth, api) => {
      const user = auth.getSnapshot();
      const token = deletionAuthorizationTokenRef.current;
      if (!user || state.kind !== "authenticated" || state.user.uid !== user.uid) {
        revokeDeletionAuthorization();
        return { kind: "failure", failure: "providerUnavailable" };
      }
      if (!token || token.uid !== user.uid || !sessionCoordinator.isCurrent(token)) {
        revokeDeletionAuthorization();
        return { kind: "failure", failure: "reauthenticationRequired" };
      }
      const canContinue = () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === user.uid;
      if (!canContinue() || !deletionAuthorization.consume(user.uid, token.generation)) {
        revokeDeletionAuthorization();
        return { kind: "failure", failure: "reauthenticationRequired" };
      }
      deletionAuthorizationTokenRef.current = null;
      observerBlockedUidRef.current = user.uid;
      const clearBlockedUid = () => {
        if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
      };
      try {
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        setState({ kind: "deleting", backendUser: state.backendUser, user, accountData: state.accountData });
        const result = await deleteBoundAccount(api, state.backendUser.id, user.uid, disableAccountRemindersForDeletion);
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
        try { clearPremiumCache(); } catch { return { kind: "failure", failure: "localCleanupFailure" }; }
        return { kind: "success", next: "signedOut" };
      } finally {
        revokeDeletionAuthorization();
        clearBlockedUid();
      }
    }),
    retryPendingDeletion: () => runSensitiveWithAuth(async (auth, api) => {
      revokeDeletionAuthorization();
      const user = auth.getSnapshot();
      const deletion = getAccountDeletionState();
      const accountId = state.kind === "authenticated"
        ? state.backendUser.id
        : state.kind === "deletionPending"
          ? state.accountId
          : null;
      const accountDataStatus = state.kind === "authenticated" ? state.accountData.status : state.kind === "deletionPending" ? state.status : null;
      if (!user || (state.kind !== "authenticated" && state.kind !== "deletionPending") || state.user.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
      if (!deletion || !accountId || (accountDataStatus !== "remoteDeletionPending" && accountDataStatus !== "localCleanupPending") || deletion.accountId !== accountId || deletion.accountUidHash !== sha256Utf8(user.uid) || (deletion.status !== "remotePending" && deletion.status !== "remoteDeleted" && deletion.status !== "localCleanupPending")) {
        return { kind: "failure", failure: "providerUnavailable" };
      }
      const generation = sessionCoordinator.restart(user.uid);
      const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
      observerBlockedUidRef.current = user.uid;
      const clearBlockedUid = () => {
        if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
      };
      try {
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        const result = await retryPendingAccountDeletion(api, accountId, user.uid, disableAccountRemindersForDeletion);
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        if (!result) return { kind: "failure", failure: "providerUnavailable" };
        if (!result.ok) {
          if (result.failure === "reauthenticationRequired") {
            const finalized = await finalizeCurrent(auth, api, user, false, generation);
            if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
            // A successful finalization publishes an authenticated pending
            // session, where AccountSecurityScreen can collect fresh
            // credentials. Keep the retry result truthful: remote deletion
            // still needs that reauthentication.
            if (finalized.kind === "success") return { kind: "failure", failure: result.failure };
          }
          const status = result.failure === "localCleanupFailure" || deletion.status === "remoteDeleted" || deletion.status === "localCleanupPending" ? "localCleanupPending" : "remoteDeletionPending";
          if (state.kind === "authenticated") {
            setState({ kind: "authenticated", backendUser: state.backendUser, user, accountData: { ...state.accountData, status, lastFailureCode: result.failure } });
          } else {
            setState({ kind: "deletionPending", user, accountId, status, failure: result.failure });
          }
          return { kind: "failure", failure: result.failure };
        }
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
        try { clearPremiumCache(); } catch { return { kind: "failure", failure: "localCleanupFailure" }; }
        return { kind: "success", next: "signedOut" };
      } finally {
        revokeDeletionAuthorization();
        clearBlockedUid();
      }
    }),
    issueRecoveryCodes: (credentials) => runSensitiveWithAuth(async (auth, api) => {
      revokeDeletionAuthorization();
      const user = auth.getSnapshot();
      if (!user || state.kind !== "authenticated" || state.user.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
      if (!credentialsMatchSnapshot(user, credentials)) return { kind: "failure", failure: "reauthenticationRequired" };
      if (credentials.kind === "password" && !credentials.password) return { kind: "failure", failure: "reauthenticationRequired" };
      const generation = sessionCoordinator.restart(user.uid);
      const result = await runReauthenticatedMutation({
        credentials,
        isCurrent: () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid,
        mutation: () => api.issueRecoveryCodes(),
        reauthenticate: auth.reauthenticateWithCredential,
      });
      if (!result.ok) {
        const failure = classifyAccountFailure(result.error);
        return { kind: "failure", failure };
      }
      return { kind: "success", next: "recoveryCodesIssued", recoveryCodes: result.value.codes };
    }),
    revokeDeletionAuthorization,
    consumeRecoveryCode: (code) => runSensitiveWithAuth(async (auth, api) => {
      revokeDeletionAuthorization();
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
        await reconcileMaterializedAccountReminders().catch(() => undefined);
        if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
        revokeGuestAccess();
        setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
        return { kind: "success", next: "authenticated" };
      }
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      if (next.lastFailureCode === "offline") return { kind: "failure", failure: "offline" };
      if (next.status === "conflict") return { kind: "failure", failure: "conflict" };
      return { kind: "failure", failure: "remoteFailure" };
    }),
    accountEntryMode,
    guestTransitionFailure,
    pendingRemoteRevokeCount: logoutControlSnapshot.pending.length + (state.kind === "signOutPending" && state.operationId && !logoutControlSnapshot.pending.some((pair) => pair.uid === state.user.uid && pair.operationId === state.operationId) ? 1 : 0),
    completeProfilePreparation,
    state,
  }), [accountEntryMode, apiClient, authClient, completeProfilePreparation, finalizeCurrent, finalizeExplicitAuthentication, guestTransitionFailure, holdAccountIdentityRefresh, logoutControlSnapshot, refreshAccountIdentityFailure, registerAuthenticatedIdentity, retrySessionRestore, revokeDeletionAuthorization, runAuthMutationWithAuth, runRefreshWithAuth, runSensitiveWithAuth, runWithAuth, runtimeMode, sensitiveCommandLane, sessionCoordinator, signOutRejectedIdentity, state]);

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

export function requiresPasswordEmailVerification(runtimeMode: PatternlyRuntimeMode | undefined, user: FirebaseAuthUserSnapshot): boolean {
  return user.providers.includes("password") && !user.emailVerified && requiresVerifiedPasswordIdentity(runtimeMode);
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

export function accountSessionFailureState(
  failure: AccountFailure,
  user: FirebaseAuthUserSnapshot,
): Extract<AccountState, { kind: "backendUnavailable" | "reauthenticationRequired" | "revokedSession" }> {
  const kind = failure === "revokedSession" ? "revokedSession" : failure === "reauthenticationRequired" ? "reauthenticationRequired" : "backendUnavailable";
  return { kind, user };
}

export function classifyAccountFailure(error: unknown): AccountFailure {
  if (isPreparedGuestChoiceRequired(error)) return "guestChoiceRequired";
  if (error instanceof PatternlyApiClientError) {
    if (error.serverCode === "account_not_found") return "accountNotFound";
    if (error.serverCode === "reauthentication_required" || error.serverCode === "recent_reauthentication_required" || error.serverCode === "authorization_generation_stale") return "reauthenticationRequired";
    if (error.serverCode === "recovery_code_invalid") return "invalidRecoveryCode";
    if (error.serverCode === "recovery_code_used") return "recoveryCodeUsed";
    if (error.serverCode === "purchase_attempt_active") return "conflict";
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
  if (code === "auth/command-in-flight") return "conflict";
  if (["auth/user-token-expired", "auth/invalid-user-token", "auth/user-disabled"].includes(code)) return "revokedSession";
  if (["auth/requires-recent-login", "auth/reauthentication-provider-unavailable"].includes(code)) return "reauthenticationRequired";
  if (code === "auth/authorization-generation-invalid") return "providerUnavailable";
  if (["auth/operation-not-allowed", "auth/app-not-authorized", "auth/invalid-api-key", "auth/invalid-app-id", "auth/provider-unavailable", "auth/apple-unavailable"].includes(code)) return "providerUnavailable";
  if (["auth/wrong-password", "auth/invalid-credential", "auth/email-already-in-use", "auth/user-not-found"].includes(code)) return "invalidCredential";
  return "providerUnavailable";
}

/**
 * Change-email needs one provider-specific distinction that the global
 * classifier intentionally cannot make: a new address can be unavailable
 * while the current credentials are valid. Keep this mapping local so other
 * account operations retain their existing failure contract.
 */
export function classifyEmailChangeFailure(error: unknown): AccountFailure {
  if (firebaseAuthErrorCode(error) === "auth/email-already-in-use") return "emailUnavailable";
  const failure = classifyAccountFailure(error);
  return failure === "invalidCredential" ? "reauthenticationRequired" : failure;
}

export function classifyAccountDataExportFailure(error: unknown): Extract<AccountDataExportCommandResult, { kind: "failure" }> {
  if (error instanceof PatternlyApiClientError) {
    if (error.serverCode === "recent_reauthentication_required") return { kind: "failure", failure: "authenticationRequired" };
    if (error.status === 401 || error.code === "authentication_required") return { kind: "failure", failure: "sessionRevoked" };
    if (error.status === 429) return error.retryAfterSeconds
      ? { kind: "failure", failure: "rateLimited", retryAfterSeconds: error.retryAfterSeconds }
      : { kind: "failure", failure: "serverFailure" };
    if (error.status === 413) return { kind: "failure", failure: "responseTooLarge" };
    if (error.status !== undefined && error.status >= 500) return { kind: "failure", failure: "serverFailure" };
    if (error.code === "transport_failed" || error.code === "request_timeout") return { kind: "failure", failure: "offline" };
    if (error.code === "invalid_response") return { kind: "failure", failure: "invalidResponse" };
    return { kind: "failure", failure: "serverFailure" };
  }
  if (firebaseAuthErrorCode(error) === "auth/uid-changed") return { kind: "failure", failure: "sessionRevoked" };
  const failure = classifyAccountFailure(error);
  if (failure === "offline") return { kind: "failure", failure: "offline" };
  if (failure === "revokedSession") return { kind: "failure", failure: "sessionRevoked" };
  if (failure === "reauthenticationRequired" || failure === "invalidCredential") return { kind: "failure", failure: "authenticationRequired" };
  return { kind: "failure", failure: "serverFailure" };
}

export function classifyPrivacyRequestFailure(error: unknown): PrivacyRequestFailure {
  if (error instanceof PatternlyApiClientError) {
    if (error.code === "app_check_unavailable" || ["app_check_required", "app_check_invalid", "app_check_not_configured"].includes(error.serverCode ?? "")) return "appCheckUnavailable";
    if (error.status === 429) return "rateLimited";
    if (error.serverCode === "privacy_request_idempotency_conflict") return "conflict";
    if (error.serverCode === "recent_reauthentication_required") return "recentAuthenticationRequired";
    if (error.status === 401 || error.code === "authentication_required") return "authenticationRequired";
    if (error.code === "transport_failed" || error.code === "request_timeout") return "offline";
    if (error.code === "invalid_response") return "invalidResponse";
  }
  return "serverFailure";
}

function classifyGuestPrivacyRequestFailure(error: unknown): PrivacyRequestFailure {
  if (error instanceof PatternlyApiClientError && error.status === 404) return "invalidCode";
  return classifyPrivacyRequestFailure(error);
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

function credentialsMatchSnapshot(user: FirebaseAuthUserSnapshot, credentials: FirebaseAuthCredentials): boolean {
  if (credentials.kind === "password") return user.providers.includes("password");
  if (credentials.kind === "google") return user.providers.includes("google") && credentials.idToken.trim().length > 0;
  return user.providers.includes("apple");
}
