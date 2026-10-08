import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { PatternlyApiClientError, createPatternlyApiClient, type AccountDataExportDto, type AccountRegistrationInputDto, type LegalRequestDto, type LegalRequestKindDto, type MeResponseDto, type PrivacyRequestListItemDto, type PrivacyRequestResponseDto, type PrivacyRequestRightDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { PREMIUM_ENTITLEMENT, isPremiumAccessConfirmedOnline } from "../../domain/entitlements";
import { clearPremiumCache, clearPremiumCacheForAccountInProfile, clearPremiumCacheUnlessBoundTo, hasOfflinePremiumAccess, readCachedPremiumAccess, replacePremiumCacheFromFreshResponse } from "../../storage/repositories/premiumEntitlementCacheRepository";
import { createPremiumRefreshQueue } from "./premiumRefreshQueue";
import { resolvePremiumSessionAdmission } from "./premiumSessionAdmission";
import { ensureAccountSessionGeneration, ensureRecoveryIssueSignInSession, getMeWithExchangedSession } from "./accountSessionExchange";
import { createRecoveryOperationCoordinator, type RecoveryOperationSnapshot } from "./recoveryOperationCoordinator";
import { createRecoveryIssuePublicationGate, readRecoveryIssueCommandIdentity } from "./recoveryIssueCommandGuard";
import { createSecureRecoveryOperationVault, type RecoveryOperationVault } from "../../infrastructure/security/recoveryOperationVault";
import { createPendingSessionRevocationDrain, drainPendingSessionRevocations } from "./pendingSessionRevocation";
import { composePatternlyNativeAppCheck, configurePatternlyAppCheckTokenProvider, getPatternlyAppCheckToken } from "../../infrastructure/clients/patternlyAppCheckToken";
import { readLocalSmokeAppCheckToken } from "../../infrastructure/clients/localSmokeAppCheck";
import { createContentReportTransport, registerContentReportRuntimeTransport, type ContentReportRuntimeRegistration } from "../contentReports";
import { createFirebaseAuthClient, firebaseAuthErrorCode, FirebaseAuthClientError, type AppleCredentialDependencies, type FirebaseAuthClient, type FirebaseAuthCredentials, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import { readDevelopmentFirebaseAuthEmulatorOrigin, readFirebaseClientConfiguration, readPublicEnvironmentFromRuntime } from "../../infrastructure/firebase/publicConfig";
import { clearAccountIdentityDenialAfterProof, confirmAccountDataAdoption, deleteBoundAccount, dismissAccountLearningPlanRecovery, discardGuestDataAndLoadAccount, loadAccountDataSession, readLocalAccountDataSession, resetAccountLocalLearningHistory, retryAccountDataSync, retryLearningPlanRecovery, retryPendingAccountDataSync, retryPendingAccountDeletion, saveGuestAdoptionChoice, type AccountDataSession } from "./accountDataService";
import { commitLearningStateReset } from "../learningMutations";
import { activatePreparedProfile, beginAccountIdentityProofBarrier, captureActiveProfileStorageLease, capturePreparedProfileStorageLease, closeActiveProfileStorage, continueAsGuestInNewProfile, getActiveStorageProfile, getActiveStorageProfileOrNull, inspectPreparedProfileState, invalidateActiveAccountIdentityBinding, invalidatePreparedAccountIdentityBinding, isActiveProfileStorageLeaseCurrent, isPreparedProfileStorageLeaseCurrent, notifyProfileStorageReady, prepareProfileStorage, readActiveAccountIdentityBinding, readPreparedAccountIdentityBinding, resolveAccountIdentityProofBarrier, selectAccountProfileAndRestart, selectPreparedAccountProfile, selectPreparedGuestProfile, validatePreparedGuestAccess, writeActiveAccountIdentityBinding, type AccountIdentityBinding, type AccountIdentityBindingRead, type AccountIdentityProofBarrier, type ActiveProfileStorageLease, type PreparedProfileStorageLease } from "../../storage/repositories/profileStorageRepository";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";
import { useProfileStoragePreparation } from "./profileStoragePreparationContext";
import { AccountSessionGenerationStaleError, findMatchingLocalLogoutBlock, findPendingSessionRevocation, finishLocalSignOutSetupFailure, guardAuthenticatedScopeAgainstIncompleteSignOut, hasVerifiedLocalLogoutReceipt, isPreparedGuestChoiceRequired, lockAndCloseProfileAfterAuthLoss, performLocalAccountSignOut, prepareAuthenticatedProfileScope, prepareGuestProfileScope, providerCancellationAuthObserverDecision, recoverAfterGuestPreparationFailure, shouldRejectPersistedAuthRestore, shouldShowGuestSelectionLoading } from "./profileStartupCoordination";
import { beginAccountSignOut, clearAccountSignOutState, getAccountSignOutState } from "../../storage/repositories/accountLifecycleRepository";
import { getGuestInstallation, markGuestInstallationAdoptionPending } from "../../storage/repositories/guestInstallationRepository";
import type { LocalLogoutControl, LocalLogoutControlSnapshot } from "../../infrastructure/storage/localLogoutControl";
import { createProviderFirstUseCoordinator } from "./providerFirstUseCoordinator";
import { resolveProviderRegistrationDocuments, type ProviderRegistrationDocumentsResult } from "../../legal/providerRegistrationDocuments";
import type { TargetLocale } from "../../preferences/localeResolver";
import { matchesAccountActorIdentity, type AccountActorIdentity, type AccountActorIdentityObservation } from "./accountActorIdentityFence";

export { AccountSessionGenerationStaleError, findMatchingLocalLogoutBlock, findPendingSessionRevocation, finishLocalSignOutSetupFailure, guardAuthenticatedScopeAgainstIncompleteSignOut, hasVerifiedLocalLogoutReceipt, isPreparedGuestChoiceRequired, lockAndCloseProfileAfterAuthLoss, performLocalAccountSignOut, prepareAuthenticatedProfileScope, prepareGuestProfileScope, recoverAfterGuestPreparationFailure, shouldRejectPersistedAuthRestore, shouldShowGuestSelectionLoading } from "./profileStartupCoordination";

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

async function invalidateAccountBindingForConfirmedDeletion(input: Readonly<{ accountId: string; uid: string; canContinue: () => boolean }>): Promise<boolean> {
  try {
    const lease = captureActiveProfileStorageLease();
    if (!lease || !input.canContinue() || lease.profile.accountId !== input.accountId
      || (lease.profile.kind !== "account" && lease.profile.kind !== "legacy_owner")) return false;
    const binding = await readActiveAccountIdentityBinding(lease);
    if (binding.kind === "verified") {
      if (binding.binding.accountId !== input.accountId || binding.binding.firebaseUid !== input.uid
        || binding.binding.profileId !== lease.profile.id || binding.binding.profileKind !== lease.profile.kind) return false;
      await invalidateActiveAccountIdentityBinding({ lease, canContinue: input.canContinue });
    }
    return input.canContinue() && isActiveProfileStorageLeaseCurrent(lease);
  } catch { return false; }
}

const AUTHORITATIVE_IDENTITY_DENIAL_CODES = new Set([
  "account_deleted",
  "authentication_required",
  "authorization_generation_invalid",
  "authorization_generation_required",
  "authorization_generation_stale",
  "firebase_authorization_generation_invalid",
]);

/** Only denial codes emitted by identity proof, or definitive Firebase identity failures, revoke a local binding. */
export function isAuthoritativeIdentityProofDenial(error: unknown): boolean {
  if (error instanceof PatternlyApiClientError) {
    return (error.status === 401 && error.serverCode !== undefined && AUTHORITATIVE_IDENTITY_DENIAL_CODES.has(error.serverCode))
      || (error.status === 404 && (error.serverCode === "user_not_found" || error.serverCode === "account_not_found"));
  }
  return ["auth/invalid-user-token", "auth/user-disabled", "auth/user-not-found", "auth/user-token-expired"].includes(firebaseAuthErrorCode(error));
}

async function invalidateAccountBindingAfterIdentityDenial(input: Readonly<{
  profile: StorageProfile;
  uid: string;
  lease?: ActiveProfileStorageLease;
  verificationRevision?: number;
  canContinue: () => boolean;
}>): Promise<void> {
  if (!input.canContinue() || (input.profile.kind !== "account" && input.profile.kind !== "legacy_owner") || !input.profile.accountId) return;
  const lease = input.lease;
  if (lease && (lease.profile.id !== input.profile.id || lease.profile.kind !== input.profile.kind
    || lease.profile.accountId !== input.profile.accountId || !isActiveProfileStorageLeaseCurrent(lease))) return;
  const binding = lease ? await readActiveAccountIdentityBinding(lease) : await readPreparedAccountIdentityBinding(input.profile.id);
  if (!input.canContinue() || binding.kind !== "verified" || binding.binding.profileId !== input.profile.id
    || binding.binding.profileKind !== input.profile.kind || binding.binding.accountId !== input.profile.accountId
    || binding.binding.firebaseUid !== input.uid
    || (input.verificationRevision !== undefined && binding.binding.verificationRevision !== input.verificationRevision)
    || (lease && !isActiveProfileStorageLeaseCurrent(lease))) return;
  if (lease) await invalidateActiveAccountIdentityBinding({ lease, canContinue: input.canContinue });
  else await invalidatePreparedAccountIdentityBinding({ profileId: input.profile.id, canContinue: input.canContinue });
}

export async function revokeBindingForAuthoritativeIdentityDenial(error: unknown, input: Readonly<{
  profile: StorageProfile;
  uid: string;
  lease?: ActiveProfileStorageLease;
  verificationRevision?: number;
  canContinue: () => boolean;
}>): Promise<boolean> {
  if (!isAuthoritativeIdentityProofDenial(error)) return false;
  await invalidateAccountBindingAfterIdentityDenial(input);
  return true;
}

export function isTemporaryIdentityProofUnavailable(error: unknown): boolean {
  if (error instanceof PatternlyApiClientError) {
    return error.code === "transport_failed" || error.code === "request_timeout"
      || (error.status !== undefined && error.status >= 500 && error.status <= 599);
  }
  return ["auth/network-request-failed", "auth/timeout"].includes(firebaseAuthErrorCode(error));
}

export type AccountIdentityProofBarrierContext = Readonly<{
  receipt: AccountIdentityProofBarrier;
  lease: ActiveProfileStorageLease | null;
  preparedLease?: PreparedProfileStorageLease | null;
  profile: StorageProfile;
  previousBinding: AccountIdentityBinding;
  requestUid: string;
  generation: AccountSessionGenerationToken;
}>;

type RecoveryProofOwner = Readonly<{ generation: AccountSessionGenerationToken; barrier: AccountIdentityProofBarrierContext | null }>;
export type RecoveryOperationSuccessor =
  | Readonly<{ kind: "issueStart"; firebaseUid: string; authorizationGeneration: number }>
  | Readonly<{ kind: "issueResume"; operationId: string; firebaseUid: string; authorizationGeneration: number; deferredFor: Readonly<{ firebaseUid: string; authorizationGeneration: number }> }>
  | Readonly<{ kind: "issueReplace"; previousOperationId: string; firebaseUid: string; authorizationGeneration: number }>;
type RecoveryIdentityProofScope = Readonly<{
  user: FirebaseAuthUserSnapshot;
  generation: AccountSessionGenerationToken;
  barrier: AccountIdentityProofBarrierContext | null;
  ownsBarrier: boolean;
  assertCurrent: () => void;
  bindRecoveryOperation: (snapshot: RecoveryOperationSnapshot) => void;
  acceptRecoveryOperation: (snapshot: RecoveryOperationSnapshot, successor?: RecoveryOperationSuccessor) => void;
  restoreAfterNonDenial: (error: unknown) => Promise<void>;
}>;

function recoveryOperationIdentity(snapshot: RecoveryOperationSnapshot): string {
  if (snapshot.kind === "issue") return JSON.stringify([snapshot.kind, snapshot.operationId, snapshot.firebaseUid, snapshot.authorizationGeneration, snapshot.deferredFor?.firebaseUid ?? null, snapshot.deferredFor?.authorizationGeneration ?? null]);
  if (snapshot.kind === "consume") return JSON.stringify([snapshot.kind, snapshot.operationId, snapshot.expectedFirebaseUid, snapshot.expectedAuthorizationGeneration]);
  if (snapshot.kind === "terminal") return JSON.stringify([snapshot.kind, snapshot.operationId]);
  if (snapshot.kind === "unavailable") return JSON.stringify([snapshot.kind, snapshot.reason]);
  return snapshot.kind;
}

function recoveryOperationId(snapshot: RecoveryOperationSnapshot): string | null {
  return snapshot.kind === "issue" || snapshot.kind === "consume" || snapshot.kind === "terminal" ? snapshot.operationId : null;
}

/** Accepts only the same operation or a narrowly witnessed coordinator transition. */
export function recoveryOperationTransitionIsAllowed(
  previous: RecoveryOperationSnapshot,
  next: RecoveryOperationSnapshot,
  actorUid: string,
  successor?: RecoveryOperationSuccessor,
): boolean {
  const previousId = recoveryOperationId(previous);
  const sameIdTerminal = previousId !== null && previousId === recoveryOperationId(next) && next.kind === "terminal";
  if (recoveryOperationIdentity(previous) === recoveryOperationIdentity(next) || sameIdTerminal) return true;

  const expectedIssueStart = next.kind === "issue" && successor?.kind === "issueStart"
    && next.firebaseUid === successor.firebaseUid && next.firebaseUid === actorUid
    && next.authorizationGeneration === successor.authorizationGeneration
    && (previous.kind === "idle" || previous.kind === "terminal");
  const expectedIssueResume = next.kind === "issue" && successor?.kind === "issueResume"
    && previous.kind === "issue" && previous.operationId === successor.operationId
    && next.operationId === successor.operationId && next.firebaseUid === successor.firebaseUid
    && next.firebaseUid === actorUid && next.authorizationGeneration === successor.authorizationGeneration
    && previous.deferredFor?.firebaseUid === successor.deferredFor.firebaseUid
    && previous.deferredFor.authorizationGeneration === successor.deferredFor.authorizationGeneration
    && next.deferredFor === null && !next.blocksProfilePreparation;
  const replacementLineageMatches = successor?.kind === "issueReplace"
    && previous.kind === "issue" && previous.operationId === successor.previousOperationId
    && previous.status === "delivery_unconfirmed" && previous.firebaseUid === successor.firebaseUid
    && previous.authorizationGeneration === successor.authorizationGeneration;
  const expectedIssueReplacement = replacementLineageMatches && next.kind === "issue"
    && next.previousIssueOperationId === previous.operationId
    && next.operationId !== previous.operationId && next.firebaseUid === successor.firebaseUid
    && next.firebaseUid === actorUid && next.authorizationGeneration === successor.authorizationGeneration;
  const expectedTerminalReplacement = replacementLineageMatches && next.kind === "terminal"
    && next.previousIssueOperationId === previous.operationId && next.operationId !== previous.operationId;
  return Boolean(expectedIssueStart || expectedIssueResume || expectedIssueReplacement || expectedTerminalReplacement);
}

/** Runs the production `/me` proof boundary and retains an already-authorized local actor only on a same-actor temporary failure. */
export async function runAccountIdentityProof<T>(input: Readonly<{
  request: () => Promise<T>;
  user: FirebaseAuthUserSnapshot;
  generation: AccountSessionGenerationToken;
  beginBarrier: () => Promise<AccountIdentityProofBarrierContext | null>;
  barrier?: AccountIdentityProofBarrierContext | null;
  barrierAlreadyCaptured?: boolean;
  resolveBarrier: (barrier: AccountIdentityProofBarrierContext) => Promise<AccountIdentityBinding>;
  matchesProofSubject: (value: T, barrier: AccountIdentityProofBarrierContext) => boolean;
  resolveOnSuccess?: boolean;
  getCurrentState: () => AccountState;
  getCurrentSdkUid: () => string | null;
  isCurrentGeneration: (token: AccountSessionGenerationToken) => boolean;
  isLeaseCurrent: (lease: ActiveProfileStorageLease) => boolean;
  readBinding: (lease: ActiveProfileStorageLease) => Promise<AccountIdentityBindingRead>;
  revokeDeniedBinding: (error: unknown) => Promise<void>;
}>): Promise<Readonly<{ kind: "verified"; value: T; barrier: AccountIdentityProofBarrierContext | null } | { kind: "failed"; failure: AccountFailure; state: AccountState; cause?: unknown }>> {
  let barrier = input.barrier ?? null;
  let value!: T;
  let requestError: unknown;
  let requestFailed = false;
  try {
    if (!barrier && !input.barrierAlreadyCaptured) barrier = await input.beginBarrier();
    value = await input.request();
  } catch (error) {
    requestFailed = true;
    requestError = error;
  }
  if (!requestFailed && barrier && input.resolveOnSuccess !== false && input.matchesProofSubject(value, barrier)) {
    try {
      await input.resolveBarrier(barrier);
      barrier = null;
    } catch (error) {
      // A successful proof whose exact receipt could not be acknowledged may
      // not retain the current local capability. A later cold read can accept
      // a fully verified owner record after its own fences.
      const failure = classifyAccountFailure(error);
      return { kind: "failed", failure, state: accountSessionFailureState(failure, input.user), cause: error };
    }
  }
  if (!requestFailed) return { kind: "verified", value, barrier };
  {
    const error = requestError;
    await input.revokeDeniedBinding(error);
    let restored: AccountIdentityBinding | null = null;
    if (barrier && barrier.previousBinding.firebaseUid === input.user.uid && !isAuthoritativeIdentityProofDenial(error)) {
      try { restored = await input.resolveBarrier(barrier); } catch { /* A failed restore remains blocked by the durable tombstone. */ }
    }
    const original = input.getCurrentState();
    if (original.kind === "localOffline" && !isAuthoritativeIdentityProofDenial(error)
      && original.user.uid === input.user.uid
      && input.getCurrentSdkUid() === input.user.uid
      && input.isCurrentGeneration(input.generation)
      && original.generation.uid === input.generation.uid
      && original.profileLease.profile.id === original.profile.id
      && original.profileLease.profile.kind === original.profile.kind
      && original.profileLease.profile.accountId === original.accountId
      && input.isLeaseCurrent(original.profileLease)) {
      const binding = await input.readBinding(original.profileLease);
      const latest = input.getCurrentState();
      if (latest.kind === "localOffline" && latest.user.uid === original.user.uid
        && latest.accountId === original.accountId && latest.bindingRevision === original.bindingRevision
        && latest.generation.generation === original.generation.generation
        && latest.profile.id === original.profile.id && latest.profile.kind === original.profile.kind
        && latest.profileLease.generation === original.profileLease.generation
        && input.getCurrentSdkUid() === input.user.uid
        && input.isCurrentGeneration(input.generation)
        && input.isLeaseCurrent(original.profileLease)
        && binding.kind === "verified" && binding.binding.accountId === original.accountId
        && binding.binding.firebaseUid === original.user.uid
        && binding.binding.profileId === original.profile.id
        && binding.binding.profileKind === original.profile.kind
        && binding.binding.verificationRevision === (restored?.verificationRevision ?? original.bindingRevision)) {
        const failure = classifyAccountFailure(error);
        return { kind: "failed", failure, state: { ...latest, bindingRevision: binding.binding.verificationRevision, generation: input.generation }, cause: error };
      }
    }
    const failure = classifyAccountFailure(error);
    return { kind: "failed", failure, state: accountSessionFailureState(failure, input.user), cause: error };
  }
}
import { clearAccountDeletionState, getAccountDeletionState } from "../../storage/repositories/accountLifecycleRepository";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { readPatternlyRuntimeMode, requiresVerifiedPasswordIdentity, type PatternlyRuntimeMode } from "../../infrastructure/runtime/runtimeMode";
import { grantGuestAccess, hasGuestAccess, revokeGuestAccess } from "../../storage/repositories/guestAccessRepository";
import { hasUnboundGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { createDeletionAuthorizationVault, createSensitiveCommandLane, isLiveDeletionAuthorization, prepareDeletionAuthorization, runReauthenticatedMutation, type DeletionAuthorizationVault, type SensitiveCommandLane } from "./accountCommandGuards";
import { shareAccountDataExport as shareDownloadedAccountData } from "./accountDataExportService";
import { installPremiumNodeOffer } from "../../content/application/nodePackageInstaller";
import { legalVariables } from "../../legal/legalVariables";

export type AccountFailure = "accountNotFound" | "backendUnavailable" | "conflict" | "duplicate" | "emailUnavailable" | "expiredAction" | "guestChoiceRequired" | "invalid" | "invalidCredential" | "invalidEmail" | "invalidRecoveryCode" | "journalRecoveryFailure" | "localCleanupFailure" | "localDeletionFailure" | "offline" | "passwordMismatch" | "pendingSyncRequiresNetwork" | "providerUnavailable" | "rateLimited" | "reauthenticationRequired" | "recoveryCodeUsed" | "remoteDeletionPending" | "remoteFailure" | "revokedSession" | "sessionRevocationPending" | "signOutPending" | "unverifiedIdentity" | "weakPassword";
export type AccountCommandResult = Readonly<{ kind: "failure"; failure: AccountFailure } | { kind: "success"; next: "authenticated" | "localOffline" | "deletionAuthorized" | "guest" | "providerRegistrationRequired" | "recoveryAccepted" | "recoveryCodesIssued" | "verificationPending" | "verificationSent" | "signedOut"; recoveryCodes?: readonly string[] }>;
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
  | Readonly<{ kind: "recoveryPending" }>
  | Readonly<{ kind: "providerRegistrationRequired"; user: FirebaseAuthUserSnapshot; generation: AccountSessionGenerationToken; documents: ProviderRegistrationDocumentsResult }>
  | Readonly<{ kind: "verificationPending"; user: FirebaseAuthUserSnapshot }>
  | Readonly<{ kind: "authenticated"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "localOffline"; accountId: string; accountData: AccountDataSession; bindingRevision: number; generation: AccountSessionGenerationToken; profile: StorageProfile; profileLease: ActiveProfileStorageLease; user: FirebaseAuthUserSnapshot }>
  | Readonly<{ kind: "deletionPending"; user: FirebaseAuthUserSnapshot; accountId: string; status: "remoteDeletionPending" | "localCleanupPending"; failure: AccountFailure }>
  | Readonly<{ kind: "signingOut"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "signOutPending"; user: FirebaseAuthUserSnapshot; operationId?: string; provisional?: true }>
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
  retryLearningPlanRecovery: (accountId: string) => Promise<void>;
  authorizePremiumSessionStart: () => Promise<"allowed" | "denied" | "unavailable">;
  readCurrentPremiumAccess: () => "allowed" | "denied" | "unavailable";
  installPremiumNodePackage: (offerId: string, appVersion: string) => Promise<void>;
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
  signInWithApple: (locale: TargetLocale, appleCredentialDependencies?: AppleCredentialDependencies) => Promise<AccountCommandResult>;
  signInWithGoogle: (idToken: string, locale: TargetLocale) => Promise<AccountCommandResult>;
  registerProviderIdentity: (termsAccepted: boolean, privacyPolicyAcknowledged: boolean, locale: TargetLocale) => Promise<AccountCommandResult>;
  cancelProviderRegistration: () => Promise<AccountCommandResult>;
  confirmAdoption: (resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" }>[], groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[]) => Promise<AccountCommandResult>;
  setGuestAdoptionChoice: (choice: "transfer" | "discard") => Promise<AccountCommandResult>;
  continueAsGuest: () => Promise<AccountCommandResult>;
  retryAccountSync: () => Promise<AccountCommandResult>;
  retryPendingAccountSync: () => Promise<AccountCommandResult>;
  dismissLearningPlanRecovery: (incidentId: string) => void;
  retryPendingDeletion: () => Promise<AccountCommandResult>;
  prepareDeletion: (credentials: FirebaseAuthCredentials) => Promise<AccountCommandResult>;
  reauthenticateForExport: (credentials: FirebaseAuthCredentials) => Promise<AccountCommandResult>;
  issueRecoveryCodes: (credentials: FirebaseAuthCredentials) => Promise<AccountCommandResult>;
  revokeDeletionAuthorization: () => void;
  consumeRecoveryCode: (code: string) => Promise<AccountCommandResult>;
  confirmRecoveryCodesSaved: () => Promise<AccountCommandResult>;
  retryRecoveryOperation: () => Promise<AccountCommandResult>;
  resumePendingRecovery: () => Promise<AccountCommandResult>;
  continueWithCurrentAccount: () => Promise<AccountCommandResult>;
  requestRecoveryCodeReplacement: () => Promise<AccountCommandResult>;
  recoveryOperation: RecoveryOperationSnapshot;
  discardGuestData: () => Promise<AccountCommandResult>;
  signOut: () => Promise<AccountCommandResult>;
  pendingRemoteRevokeCount: number;
  captureCurrentAuthenticatedActorFence: () => Readonly<{ accountIdSha256: string; profileIdSha256: string; uidSha256: string; isCurrent: () => boolean; isCurrentSdkUid: (uid: string) => boolean }> | null;
  captureHomeResumeActorFence: () => HomeResumeActorFence | null;
  inspectQ13ActorFence: () => Q13ActorFence;
  state: AccountState;
}>;

export type Q13ActorFence = Readonly<{ kind: "ready"; accountIdSha256: string; profileIdSha256: string; uidSha256: string; isCurrent: () => boolean; isCurrentSdkUid: (uid: string) => boolean } | { kind: "denied" | "unavailable" }>;
export type HomeResumeActorFence = Readonly<{ isCurrent: () => boolean }>;

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
  return (input.currentState.kind === "authenticated" || input.currentState.kind === "localOffline")
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
  kind: "authenticated" | "guest" | "localOffline";
  profile: StorageProfile;
  user?: FirebaseAuthUserSnapshot;
  generation?: AccountSessionGenerationToken;
  completion: Promise<AccountCommandResult>;
  resolveCompletion: (result: AccountCommandResult) => void;
  completing: Promise<AccountCommandResult> | null;
  bootstrapFailure?: AccountCommandResult;
  guestAdoption: boolean;
  localOffline?: Readonly<{ accountId: string; bindingRevision: number; profileLease: ActiveProfileStorageLease }>;
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
    guestAdoptionChoice: "transfer",
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
  const stateRef = useRef<AccountState>({ kind: "loading" });
  stateRef.current = state;
  const [authClient, setAuthClient] = useState<FirebaseAuthClient | null>(null);
  const authInitializationResolvedRef = useRef(false);
  const guestCommandLockRef = useRef(createGuestTransitionLock());
  const [apiClient, setApiClient] = useState<ReturnType<typeof createPatternlyApiClient> | null>(null);
  const [recoveryOperation, setRecoveryOperation] = useState<RecoveryOperationSnapshot>({ kind: "loading", blocksProfilePreparation: true });
  const recoveryCoordinatorRef = useRef<ReturnType<typeof createRecoveryOperationCoordinator> | null>(null);
  const recoveryApiClientRef = useRef<ReturnType<typeof createPatternlyApiClient> | null>(null);
  const recoveryVaultRef = useRef<RecoveryOperationVault | null>(null);
  const recoveryCommandInFlightRef = useRef(false);
  const recoveryIssuePublicationGateRef = useRef(createRecoveryIssuePublicationGate());
  const recoverySessionIdentityRef = useRef<Readonly<{ firebaseUid: string; authorizationGeneration: number }> | null>(null);
  const explicitRecoveryIssueSignInRef = useRef<Readonly<{ operationId: string; firebaseUid: string; authorizationGeneration: number; action: "resume" | "replace" }> | null>(null);
  const explicitRecoveryAccountTransitionRef = useRef<Readonly<{ operationId: string; firebaseUid: string; authorizationGeneration: number }> | null>(null);
  const [appCheckReady, setAppCheckReady] = useState(false);
  const [refreshAccountIdentityFailure, setRefreshAccountIdentityFailure] = useState<AccountFailure | null>(null);
  const [runtimeMode] = useState<PatternlyRuntimeMode | undefined>(readPatternlyRuntimeMode);
  const [authInitializationRevision, setAuthInitializationRevision] = useState(0);
  const sessionCoordinatorRef = useRef<AccountSessionCoordinator<FinalizationOutcome> | null>(null);
  const profilePreparationRef = useRef<ProfilePreparationAttempt | null>(null);
  const observerBlockedUidRef = useRef<string | null>(null);
  const sessionExchangeUidRef = useRef<string | null>(null);
  const pendingSessionRevocationDrainRef = useRef<ReturnType<typeof createPendingSessionRevocationDrain> | null>(null);
  const legalAcceptancePendingRef = useRef(false);
  const registrationIntentRef = useRef<Readonly<{ uid: string; promise: Promise<AccountCommandResult> }> | null>(null);
  const providerAuthenticationInFlightRef = useRef(false);
  const providerRegistrationInFlightRef = useRef(false);
  const providerCancellationUidRef = useRef<string | null>(null);
  const deletionAuthorizationRef = useRef<DeletionAuthorizationVault | null>(null);
  const deletionAuthorizationTokenRef = useRef<AccountSessionGenerationToken | null>(null);
  const sensitiveCommandLaneRef = useRef<SensitiveCommandLane | null>(null);
  const contentReportRegistrationRef = useRef<ContentReportRuntimeRegistration | null>(null);
  const beginIdentityProofBarrierRef = useRef<((auth: FirebaseAuthClient, user: FirebaseAuthUserSnapshot, generation: AccountSessionGenerationToken, preferPreparedProfile?: boolean, preparedLease?: PreparedProfileStorageLease | null) => Promise<AccountIdentityProofBarrierContext | null>) | null>(null);
  const resolveIdentityProofBarrierRef = useRef<((barrier: AccountIdentityProofBarrierContext, auth: FirebaseAuthClient, user: FirebaseAuthUserSnapshot, generation: AccountSessionGenerationToken) => Promise<AccountIdentityBinding>) | null>(null);
  const createRecoveryProofScopeRef = useRef<((auth: FirebaseAuthClient, user: FirebaseAuthUserSnapshot, owner?: RecoveryProofOwner) => Promise<RecoveryIdentityProofScope>) | null>(null);
  const premiumRefreshQueueRef = useRef(createPremiumRefreshQueue());
  if (!sessionCoordinatorRef.current) {
    sessionCoordinatorRef.current = createAccountSessionCoordinator((_token, outcome) => {
      if (outcome.state) setState(outcome.state);
    });
  }
  if (!pendingSessionRevocationDrainRef.current) pendingSessionRevocationDrainRef.current = createPendingSessionRevocationDrain();
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
    sessionExchangeUidRef.current = null;
  }, [deletionAuthorization]);

  const getRecoveryVault = useCallback((): RecoveryOperationVault => {
    if (!recoveryVaultRef.current) recoveryVaultRef.current = createSecureRecoveryOperationVault();
    return recoveryVaultRef.current;
  }, []);

  const guardRecoveryBeforePreparation = useCallback(async (auth: FirebaseAuthClient | null, proofOwner?: RecoveryProofOwner): Promise<boolean> => {
    const proofScopeRef = { current: null as RecoveryIdentityProofScope | null };
    const ensureProofScope = async (user: FirebaseAuthUserSnapshot): Promise<RecoveryIdentityProofScope> => {
      if (proofScopeRef.current) { proofScopeRef.current.assertCurrent(); return proofScopeRef.current; }
      if (!auth || user.uid !== auth.getSnapshot()?.uid || !createRecoveryProofScopeRef.current) throw new AccountSessionGenerationStaleError();
      proofScopeRef.current = await createRecoveryProofScopeRef.current(auth, user, proofOwner?.generation.uid === user.uid ? proofOwner : undefined);
      proofScopeRef.current.assertCurrent();
      return proofScopeRef.current;
    };
    const revokeDeniedIdentity = async (error: unknown, user: FirebaseAuthUserSnapshot | null): Promise<boolean> => {
      if (!auth || !user || !isAuthoritativeIdentityProofDenial(error)) return false;
      const proofScope = proofScopeRef.current;
      const generation = proofScope?.generation ?? sessionCoordinator.current(user.uid);
      const canContinue = () => !!generation && sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid
        && (!proofScope || proofScope.generation.generation === generation.generation);
      if (!canContinue()) return false;
      const current = stateRef.current;
      const lease = current.kind === "localOffline" && current.user.uid === user.uid ? current.profileLease : captureActiveProfileStorageLease();
      const profile = current.kind === "localOffline" && current.user.uid === user.uid ? current.profile : lease?.profile;
      if (profile && !proofScope?.barrier) {
        await revokeBindingForAuthoritativeIdentityDenial(error, {
          profile,
          uid: user.uid,
          ...(lease ? { lease } : {}),
          ...(current.kind === "localOffline" && current.user.uid === user.uid ? { verificationRevision: current.bindingRevision } : {}),
          canContinue,
        });
      }
      if (canContinue()) {
        if (lease && isActiveProfileStorageLeaseCurrent(lease)) closeActiveProfileStorage();
        setState({ kind: "revokedSession", user });
      }
      return true;
    };
    try {
      const coordinator = recoveryCoordinatorRef.current;
      if (!coordinator) {
        const pending = await getRecoveryVault().load();
        if (!pending) {
          setRecoveryOperation({ kind: "idle", blocksProfilePreparation: false });
          return true;
        }
        setRecoveryOperation({ kind: "unavailable", reason: "operation_unavailable", blocksProfilePreparation: true });
      } else {
        await coordinator.load();
        let pending = coordinator.getSnapshot();
        if (proofScopeRef.current) { proofScopeRef.current.assertCurrent(); proofScopeRef.current.acceptRecoveryOperation(pending); }
        if (pending.kind === "issue" && pending.deferredFor && !pending.blocksProfilePreparation) {
          const user = auth?.getSnapshot() ?? null;
          let authorizationGeneration: number | null = null;
          if (auth && user) {
            await ensureProofScope(user);
            try { authorizationGeneration = await auth.getAuthorizationGeneration(); } catch (error) {
              proofScopeRef.current?.assertCurrent();
              if (await revokeDeniedIdentity(error, user)) return false;
              // A failed non-authoritative claim read keeps the defer gated.
            }
            proofScopeRef.current?.assertCurrent();
          }
          if (user) await ensureProofScope(user);
          const reconciled = await coordinator.reconcilePending(user ? { firebaseUid: user.uid, authorizationGeneration } : null);
          if (proofScopeRef.current) proofScopeRef.current.acceptRecoveryOperation(reconciled);
          pending = coordinator.getSnapshot();
        }
        if (!pending.blocksProfilePreparation) {
          explicitRecoveryIssueSignInRef.current = null;
          const user = auth?.getSnapshot() ?? null;
          const recovered = recoverySessionIdentityRef.current;
          if (auth && user && recovered?.firebaseUid === user.uid) {
            await ensureProofScope(user);
            try {
              if (await auth.getAuthorizationGeneration() !== recovered.authorizationGeneration) {
                proofScopeRef.current?.assertCurrent();
                if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
                setState({ kind: "revokedSession", user });
                return false;
              }
              proofScopeRef.current?.assertCurrent();
            } catch (error) {
              proofScopeRef.current?.assertCurrent();
              if (auth.getSnapshot()?.uid !== user.uid) return false;
              if (await revokeDeniedIdentity(error, user)) return false;
              setState({ kind: "backendUnavailable", user });
              return false;
            }
          }
          return true;
        }
        if (recoveryCommandInFlightRef.current || (pending.kind === "consume" && pending.signInInFlight)) return false;
        const user = auth?.getSnapshot() ?? null;
        const accountTransition = explicitRecoveryAccountTransitionRef.current;
        if (accountTransition && (pending.kind !== "issue" || pending.operationId !== accountTransition.operationId || pending.firebaseUid !== accountTransition.firebaseUid || pending.authorizationGeneration !== accountTransition.authorizationGeneration)) {
          explicitRecoveryAccountTransitionRef.current = null;
        } else if (accountTransition && !user) {
          // An explicit transition is in its sign-out/login leg. Allow the
          // signed-out screen to render; profile preparation still has no user.
          return true;
        }
        let intent = explicitRecoveryIssueSignInRef.current;
        if (intent && (pending.kind !== "issue" || intent.operationId !== pending.operationId || intent.firebaseUid !== pending.firebaseUid || intent.authorizationGeneration !== pending.authorizationGeneration || (user !== null && user.uid !== intent.firebaseUid))) {
          explicitRecoveryIssueSignInRef.current = null;
          intent = null;
        }
        if (auth && user && pending.kind === "issue" && intent?.operationId === pending.operationId && intent.firebaseUid === user.uid && pending.firebaseUid === user.uid && intent.authorizationGeneration === pending.authorizationGeneration) {
          const scope = await ensureProofScope(user);
          scope.bindRecoveryOperation(pending);
          const recoveryApi = recoveryApiClientRef.current;
          if (!recoveryApi) throw new Error("recovery_api_unavailable");
          recoveryCommandInFlightRef.current = true;
          try {
            await ensureRecoveryIssueSignInSession({
              api: recoveryApi,
              auth,
              canContinue: () => auth.getSnapshot()?.uid === user.uid,
              isExplicitSignInCurrent: () => {
                const current = coordinator.getSnapshot();
                return explicitRecoveryIssueSignInRef.current === intent && current.kind === "issue" && current.operationId === intent.operationId && current.firebaseUid === intent.firebaseUid && current.authorizationGeneration === intent.authorizationGeneration;
              },
              onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
              user,
              requiredAuthorizationGeneration: pending.authorizationGeneration,
            });
            scope.assertCurrent();
            if (intent.action === "replace") {
              const replacement = await coordinator.startIssue({ firebaseUid: pending.firebaseUid, authorizationGeneration: pending.authorizationGeneration }, { replaceUnavailable: true });
              scope.acceptRecoveryOperation(replacement, {
                kind: "issueReplace",
                firebaseUid: pending.firebaseUid,
                authorizationGeneration: pending.authorizationGeneration,
                previousOperationId: pending.operationId,
              });
            } else if (pending.deferredFor) {
              const resumed = await coordinator.resumePendingRecovery();
              scope.acceptRecoveryOperation(resumed, {
                kind: "issueResume",
                operationId: pending.operationId,
                firebaseUid: pending.firebaseUid,
                authorizationGeneration: pending.authorizationGeneration,
                deferredFor: pending.deferredFor,
              });
            }
            explicitRecoveryIssueSignInRef.current = null;
          } catch (error) {
            explicitRecoveryIssueSignInRef.current = null;
            throw error;
          } finally {
            recoveryCommandInFlightRef.current = false;
            if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
          }
        }
        if (auth && user && (pending.kind === "issue" || pending.kind === "consume")) await ensureProofScope(user);
        const authorizationGeneration = auth && user && (pending.kind === "issue" || pending.kind === "consume")
          ? await auth.getAuthorizationGeneration()
          : null;
        proofScopeRef.current?.assertCurrent();
        const identity = auth && user ? { firebaseUid: user.uid, authorizationGeneration } : null;
        const reconciled = await coordinator.reconcilePending(identity);
        if (proofScopeRef.current) proofScopeRef.current.acceptRecoveryOperation(reconciled);
        if (!coordinator.getSnapshot().blocksProfilePreparation) return true;
      }
    } catch (error) {
      if (await revokeDeniedIdentity(error, auth?.getSnapshot() ?? null)) return false;
      if (proofScopeRef.current) await proofScopeRef.current.restoreAfterNonDenial(error);
      setRecoveryOperation({ kind: "unavailable", reason: "operation_unavailable", blocksProfilePreparation: true });
    }
    setAccountEntryMode("login");
    setState({ kind: "recoveryPending" });
    return false;
  }, [getRecoveryVault, sessionCoordinator]);

  const beginIdentityProofBarrier = useCallback(async (
    auth: FirebaseAuthClient,
    user: FirebaseAuthUserSnapshot,
    generation: AccountSessionGenerationToken,
    preferPreparedProfile = false,
    preparedLeaseOverride?: PreparedProfileStorageLease | null,
  ): Promise<AccountIdentityProofBarrierContext | null> => {
    const current = stateRef.current;
    let profile: StorageProfile | null = null;
    let lease: ActiveProfileStorageLease | null = null;
    let preparedLease: PreparedProfileStorageLease | null = null;
    let expectedRevision: number | undefined;
    if (!preferPreparedProfile && current.kind === "localOffline" && current.user.uid === user.uid) {
      profile = current.profile;
      lease = current.profileLease;
      expectedRevision = current.bindingRevision;
    } else if (!preferPreparedProfile && getActiveStorageProfileOrNull()) {
      lease = captureActiveProfileStorageLease();
      profile = lease?.profile ?? null;
    } else {
      preparedLease = preparedLeaseOverride === undefined ? capturePreparedProfileStorageLease() : preparedLeaseOverride;
      profile = preparedLease?.profile ?? null;
    }
    if (!profile || (profile.kind !== "account" && profile.kind !== "legacy_owner") || !profile.accountId?.trim()) return null;
    const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid
      && (!lease || isActiveProfileStorageLeaseCurrent(lease))
      && (!preparedLease || isPreparedProfileStorageLeaseCurrent(preparedLease));
    if (!canContinue()) throw new AccountSessionGenerationStaleError();
    const observed = lease ? await readActiveAccountIdentityBinding(lease) : await readPreparedAccountIdentityBinding(profile.id);
    if (!canContinue()) throw new AccountSessionGenerationStaleError();
    if (observed.kind !== "verified") {
      if (current.kind === "localOffline" && current.user.uid === user.uid) throw new Error("account_binding_conflict");
      return null;
    }
    const previousBinding = observed.binding;
    if (previousBinding.profileId !== profile.id || previousBinding.profileKind !== profile.kind
      || previousBinding.accountId !== profile.accountId || previousBinding.firebaseUid !== user.uid
      || (expectedRevision !== undefined && previousBinding.verificationRevision !== expectedRevision)) {
      if (current.kind === "localOffline" && current.user.uid === user.uid) throw new Error("account_binding_conflict");
      return null;
    }
    const receipt = await beginAccountIdentityProofBarrier({
      profileId: profile.id,
      accountId: previousBinding.accountId,
      firebaseUid: previousBinding.firebaseUid,
      verificationRevision: previousBinding.verificationRevision,
      ...(lease ? { lease } : {}),
      canContinue,
    });
    if (!receipt) return null;
    if (!canContinue()) throw new AccountSessionGenerationStaleError();
    return Object.freeze({ receipt, lease, preparedLease, profile, previousBinding, requestUid: user.uid, generation });
  }, [sessionCoordinator]);

  const resolveIdentityProofBarrier = useCallback(async (
    barrier: AccountIdentityProofBarrierContext,
    auth: FirebaseAuthClient,
    user: FirebaseAuthUserSnapshot,
    generation: AccountSessionGenerationToken,
  ): Promise<AccountIdentityBinding> => {
    const canContinue = () => barrier.requestUid === user.uid && barrier.generation.generation === generation.generation
      && sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid
      && (!barrier.lease || isActiveProfileStorageLeaseCurrent(barrier.lease))
      && (!barrier.preparedLease || isPreparedProfileStorageLeaseCurrent(barrier.preparedLease));
    if (!canContinue()) throw new AccountSessionGenerationStaleError();
    const binding = await resolveAccountIdentityProofBarrier({
      receipt: barrier.receipt,
      ...(barrier.lease ? { lease: barrier.lease } : {}),
      canContinue,
    });
    if (!canContinue()) throw new AccountSessionGenerationStaleError();
    return binding;
  }, [sessionCoordinator]);

  const createRecoveryProofScope = useCallback(async (
    auth: FirebaseAuthClient,
    user: FirebaseAuthUserSnapshot,
    owner?: RecoveryProofOwner,
  ): Promise<RecoveryIdentityProofScope> => {
    const generation = owner?.generation ?? sessionCoordinator.current(user.uid) ?? sessionCoordinator.begin(user.uid);
    const activeLease = owner?.barrier?.lease ?? captureActiveProfileStorageLease();
    const preparedLease = owner?.barrier?.preparedLease ?? (!activeLease ? capturePreparedProfileStorageLease() : null);
    if (!activeLease && !preparedLease) throw new AccountSessionGenerationStaleError();
    let barrier = owner?.barrier ?? null;
    const ownsBarrier = !owner?.barrier;
    const baseCurrent = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid
      && (!activeLease || isActiveProfileStorageLeaseCurrent(activeLease))
      && (!preparedLease || isPreparedProfileStorageLeaseCurrent(preparedLease));
    if (!baseCurrent()) throw new AccountSessionGenerationStaleError();
    if (ownsBarrier) {
      const beginBarrier = beginIdentityProofBarrierRef.current;
      if (!beginBarrier) throw new AccountSessionGenerationStaleError();
      barrier = await beginBarrier(auth, user, generation, !activeLease, preparedLease);
      if (!baseCurrent()) throw new AccountSessionGenerationStaleError();
      if (barrier && ((barrier.lease && !isActiveProfileStorageLeaseCurrent(barrier.lease))
        || (barrier.preparedLease && !isPreparedProfileStorageLeaseCurrent(barrier.preparedLease)))) {
        throw new AccountSessionGenerationStaleError();
      }
    }
    let expectedRecoveryOperation: string | null = null;
    let expectedRecoverySnapshot: RecoveryOperationSnapshot | null = null;
    const assertCurrent = () => {
      if (!baseCurrent() || (barrier?.lease && !isActiveProfileStorageLeaseCurrent(barrier.lease))
        || (barrier?.preparedLease && !isPreparedProfileStorageLeaseCurrent(barrier.preparedLease))) {
        throw new AccountSessionGenerationStaleError();
      }
      if (expectedRecoveryOperation !== null) {
        const current = recoveryCoordinatorRef.current?.getSnapshot();
        if (!current || recoveryOperationIdentity(current) !== expectedRecoveryOperation) throw new AccountSessionGenerationStaleError();
      }
    };
    const bindRecoveryOperation = (snapshot: RecoveryOperationSnapshot) => {
      assertCurrent();
      const current = recoveryCoordinatorRef.current?.getSnapshot();
      if (!current || recoveryOperationIdentity(current) !== recoveryOperationIdentity(snapshot)) throw new AccountSessionGenerationStaleError();
      expectedRecoveryOperation = recoveryOperationIdentity(snapshot);
      expectedRecoverySnapshot = snapshot;
    };
    const acceptRecoveryOperation = (snapshot: RecoveryOperationSnapshot, successor?: RecoveryOperationSuccessor) => {
      if (!baseCurrent()) throw new AccountSessionGenerationStaleError();
      const current = recoveryCoordinatorRef.current?.getSnapshot();
      if (!current || recoveryOperationIdentity(current) !== recoveryOperationIdentity(snapshot)) throw new AccountSessionGenerationStaleError();
      if (expectedRecoveryOperation !== null && recoveryOperationIdentity(snapshot) !== expectedRecoveryOperation) {
        const previous = expectedRecoverySnapshot;
        if (!previous || !recoveryOperationTransitionIsAllowed(previous, snapshot, user.uid, successor)) throw new AccountSessionGenerationStaleError();
      }
      expectedRecoveryOperation = recoveryOperationIdentity(snapshot);
      expectedRecoverySnapshot = snapshot;
    };
    const restoreAfterNonDenial = async (error: unknown) => {
      if (!ownsBarrier || !barrier || isAuthoritativeIdentityProofDenial(error)) return;
      assertCurrent();
      const resolveBarrier = resolveIdentityProofBarrierRef.current;
      if (!resolveBarrier) return;
      await resolveBarrier(barrier, auth, user, generation);
      assertCurrent();
    };
    return Object.freeze({ user, generation, barrier, ownsBarrier, assertCurrent, bindRecoveryOperation, acceptRecoveryOperation, restoreAfterNonDenial });
  }, [sessionCoordinator]);

  beginIdentityProofBarrierRef.current = beginIdentityProofBarrier;
  resolveIdentityProofBarrierRef.current = resolveIdentityProofBarrier;
  createRecoveryProofScopeRef.current = createRecoveryProofScope;

  const finalizeCurrent = useCallback(async (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>, user: FirebaseAuthUserSnapshot | null = auth.getSnapshot(), restart = false, expectedToken?: AccountSessionGenerationToken, preserveGuestScope = false, allowGuestAdoption = false, identityProofBarrier?: AccountIdentityProofBarrierContext | null): Promise<AccountCommandResult> => {
    if (!user || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
    const token = expectedToken ?? (restart ? sessionCoordinator.restart(user.uid) : sessionCoordinator.begin(user.uid));
    if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
    let proofBarrier = identityProofBarrier;
    if (proofBarrier === undefined) {
      try { proofBarrier = await beginIdentityProofBarrier(auth, user, token); }
      catch (error) { return { kind: "failure", failure: classifyAccountFailure(error) }; }
    }
    if (!await guardRecoveryBeforePreparation(auth, { generation: token, barrier: proofBarrier })) {
      if (proofBarrier && stateRef.current.kind !== "revokedSession") {
        try { await resolveIdentityProofBarrier(proofBarrier, auth, user, token); } catch { /* An unconfirmed restore remains fail-closed. */ }
      }
      return { kind: "failure", failure: stateRef.current.kind === "revokedSession" ? "revokedSession" : "conflict" };
    }
    try {
      const outcome = await sessionCoordinator.run(token, async () => {
        if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
        try {
          const identityProof = await runAccountIdentityProof({
            request: () => getMeWithExchangedSession({
              api,
              auth,
              ...(recoverySessionIdentityRef.current?.firebaseUid === user.uid ? { requiredAuthorizationGeneration: recoverySessionIdentityRef.current.authorizationGeneration } : {}),
              canContinue: () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid,
              onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
              user,
            }),
            user,
            generation: token,
            barrier: proofBarrier,
            barrierAlreadyCaptured: true,
            beginBarrier: () => beginIdentityProofBarrier(auth, user, token),
            resolveBarrier: (barrier) => resolveIdentityProofBarrier(barrier, auth, user, token),
            matchesProofSubject: (response, barrier) => response.user.id === barrier.previousBinding.accountId
              && response.user.identity.subject === user.uid && barrier.previousBinding.firebaseUid === user.uid,
            getCurrentState: () => stateRef.current,
            getCurrentSdkUid: () => auth.getSnapshot()?.uid ?? null,
            isCurrentGeneration: sessionCoordinator.isCurrent,
            isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
            readBinding: readActiveAccountIdentityBinding,
            revokeDeniedBinding: async (error) => { await revokeBindingForAuthoritativeIdentityDenial(error, {
              profile: preparedProfileState.selectedProfile,
              uid: user.uid,
              canContinue: () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid,
            }); },
          });
          if (identityProof.kind === "failed") return { result: { kind: "failure", failure: identityProof.failure }, state: identityProof.state };
          const response = identityProof.value;
          // Keep this guard immediately before local account loading. The data
          // service may persist state, so stale generations must not enter it.
          if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
          if (!preserveGuestScope && await selectAccountProfileAndRestart(response.user.id, () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid, { recoverBoundGuest: true })) {
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
          const boundProfile = getActiveStorageProfileOrNull();
          if (!pendingDeletion && response.user.identity.subject === user.uid
            && (boundProfile?.kind === "account" || boundProfile?.kind === "legacy_owner") && boundProfile.accountId === response.user.id) {
            const lease = captureActiveProfileStorageLease();
            if (lease && lease.profile.id === boundProfile.id && lease.profile.kind === boundProfile.kind && lease.profile.accountId === response.user.id) {
              try {
                const initialBinding = await readActiveAccountIdentityBinding(lease);
                const verifiedBinding = initialBinding.kind === "verified"
                  && initialBinding.binding.accountId === response.user.id
                  && initialBinding.binding.firebaseUid === user.uid
                  && initialBinding.binding.profileId === boundProfile.id
                  && initialBinding.binding.profileKind === boundProfile.kind
                  ? initialBinding.binding
                  : await writeActiveAccountIdentityBinding({ lease, accountId: response.user.id, firebaseUid: user.uid, canContinue: () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid && isActiveProfileStorageLeaseCurrent(lease) });
                const cleared = await clearAccountIdentityDenialAfterProof({
                  accountId: response.user.id,
                  firebaseUid: user.uid,
                  canContinue: async () => {
                    if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid
                      || !isActiveProfileStorageLeaseCurrent(lease)) return false;
                    const latest = await readActiveAccountIdentityBinding(lease);
                    return latest.kind === "verified" && latest.binding.accountId === response.user.id
                      && latest.binding.firebaseUid === user.uid && latest.binding.profileId === boundProfile.id
                      && latest.binding.profileKind === boundProfile.kind
                      && latest.binding.checksum === verifiedBinding.checksum
                      && latest.binding.verificationRevision === verifiedBinding.verificationRevision
                      && sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid
                      && isActiveProfileStorageLeaseCurrent(lease);
                  },
                });
                if (!cleared) return { result: { kind: "failure", failure: "revokedSession" }, state: { kind: "revokedSession", user } };
              } catch {
                // A failed durable binding or denial-marker update cannot admit sync/offline data under this identity.
                return { result: { kind: "failure", failure: "backendUnavailable" }, state: { kind: "backendUnavailable", user } };
              }
            }
          }
          const accountData = pendingDeletion ?? await loadAccountDataSession(api, response.user.id, { guestAdoption: allowGuestAdoption ? "allow" : "discard" });
          if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== token.uid) return { result: { kind: "failure", failure: "revokedSession" } };
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
  }, [beginIdentityProofBarrier, guardRecoveryBeforePreparation, resolveIdentityProofBarrier, sessionCoordinator]);

  const startAuthenticatedProfilePreparation = useCallback(async (
    auth: FirebaseAuthClient,
    api: ReturnType<typeof createPatternlyApiClient>,
    user: FirebaseAuthUserSnapshot,
    generation: AccountSessionGenerationToken,
  ): Promise<ProfilePreparationAttempt | null> => {
    const existing = profilePreparationRef.current;
    if ((existing?.kind === "authenticated" || existing?.kind === "localOffline") && existing.user?.uid === user.uid && existing.generation?.generation === generation.generation) return existing;
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
      guestAdoption: false,
    };
    profilePreparationRef.current = attempt;
    const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
    let proofBarrier: AccountIdentityProofBarrierContext | null = null;
    const finishPendingSignOut = (operationId?: string, failure: AccountFailure = "signOutPending", blockObserver = true): ProfilePreparationAttempt => {
      profilePreparationRef.current = null;
      if (blockObserver) observerBlockedUidRef.current = user.uid;
      if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
      setAccountEntryMode("login");
      setState({ kind: "signOutPending", user, ...(operationId ? { operationId } : {}) });
      attempt.bootstrapFailure = { kind: "failure", failure };
      resolveCompletion(attempt.bootstrapFailure);
      return attempt;
    };
    try {
      if (!canContinue()) throw new AccountSessionGenerationStaleError();
      const activeBeforePreparation = getActiveStorageProfileOrNull();
      const selectedBeforePreparation = preparedProfileState.selectedProfile;
      if ((activeBeforePreparation?.kind === "account" || activeBeforePreparation?.kind === "legacy_owner")
        || selectedBeforePreparation.kind === "account" || selectedBeforePreparation.kind === "legacy_owner") {
        if (activeBeforePreparation) closeActiveProfileStorage();
        await prepareProfileStorage();
        proofBarrier = await beginIdentityProofBarrier(auth, user, generation, true);
      }
      if (!await guardRecoveryBeforePreparation(auth, { generation, barrier: proofBarrier })) {
        if (proofBarrier && stateRef.current.kind !== "revokedSession") {
          try { await resolveIdentityProofBarrier(proofBarrier, auth, user, generation); } catch { /* Keep an unconfirmed restore fail-closed. */ }
        }
        profilePreparationRef.current = null;
        attempt.bootstrapFailure = { kind: "failure", failure: stateRef.current.kind === "revokedSession" ? "revokedSession" : "conflict" };
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
      if (!activeProfile && (preparedSelection.kind === "guest" || preparedSelection.kind === "legacy_guest")) {
        activatePreparedProfile(preparedSelection.id, preparedSelection.kind, { deferReadyNotification: true });
        activeProfile = getActiveStorageProfileOrNull();
      }
      const guestInstallation = activeProfile?.kind === "guest" || activeProfile?.kind === "legacy_guest"
        ? await getGuestInstallation()
        : null;
      if (activeProfile && guestInstallation?.bindingState === "adoption_pending") {
        attempt.profile = activeProfile;
        attempt.guestAdoption = true;
        notifyProfileStorageReady();
        setState({ kind: "profilePreparing", profile: activeProfile });
        return attempt;
      }
      if (activeProfile) closeActiveProfileStorage();
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
        profilePreparationRef.current = null;
        resolveCompletion(attempt.bootstrapFailure);
        return attempt;
      }
      notifyProfileStorageReady();
      setState({ kind: "profilePreparing", profile: selectedProfile });
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
      if (ownsPreparation && failure === "offline" && canContinue()
        && !findPendingSessionRevocation(logoutControlSnapshotRef.current, user.uid)
        && !findMatchingLocalLogoutBlock(logoutControlSnapshotRef.current, user.uid)
        && !recoveryOperation.blocksProfilePreparation
        && !legalAcceptancePendingRef.current) {
        const profile = preparedProfileState.selectedProfile;
        if ((profile.kind === "account" || profile.kind === "legacy_owner") && profile.accountId) {
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
              setState({ kind: "profilePreparing", profile });
              return attempt;
            }
          } catch {
            const activeProfile = getActiveStorageProfileOrNull();
            if (activeProfile?.id === profile.id) closeActiveProfileStorage();
          }
        }
      }
      if (ownsPreparation && canContinue()) setState(accountSessionFailureState(failure, user));
      if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
      attempt.bootstrapFailure = { kind: "failure", failure };
      resolveCompletion(attempt.bootstrapFailure);
      return attempt;
    }
  }, [guardRecoveryBeforePreparation, preparedProfileState.selectedProfile, recoveryOperation.blocksProfilePreparation, sessionCoordinator]);

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
          profilePreparationRef.current = null;
          attempt.resolveCompletion({ kind: "success", next: "localOffline" });
          return { kind: "success", next: "localOffline" };
        } catch {
          if (offline && isActiveProfileStorageLeaseCurrent(offline.profileLease)) closeActiveProfileStorage();
          const current = sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
          const result = { kind: "failure", failure: current ? "backendUnavailable" : "revokedSession" } as const;
          if (profilePreparationRef.current === attempt) profilePreparationRef.current = null;
          if (current) setState(accountSessionFailureState(result.failure, user));
          attempt.resolveCompletion(result);
          return result;
        }
      }
      const reconciliationOutcome: { result: AccountCommandResult | null; state: AccountState | null } = { result: null, state: null };
      await reconcileAuthenticatedUser(
        auth,
        api,
        runtimeMode,
        user,
        async (nextUser) => {
          reconciliationOutcome.result = await finalizeCurrent(auth, api, nextUser, false, generation, true, attempt.guestAdoption);
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
  }, [apiClient, authClient, finalizeCurrent, recoveryOperation.blocksProfilePreparation, runtimeMode, sessionCoordinator]);

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
      providerCancellationUidRef.current = null;
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
      if (!await guardRecoveryBeforePreparation(auth)) return;
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
          guestAdoption: false,
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
      recoveryApiClientRef.current = client;
      const recoveryCoordinator = createRecoveryOperationCoordinator({
        vault: getRecoveryVault(),
        api: client,
        auth: configuredAuth,
        newOperationId: createSignOutOperationId,
      });
      recoveryCoordinatorRef.current = recoveryCoordinator;
      const unsubscribeRecovery = recoveryCoordinator.subscribe((snapshot) => {
        if (!live || observerDetached) return;
        setRecoveryOperation(recoveryIssuePublicationGateRef.current.publish(snapshot));
        if (snapshot.kind === "consume" && snapshot.expectedFirebaseUid !== null && snapshot.expectedAuthorizationGeneration !== null) {
          recoverySessionIdentityRef.current = { firebaseUid: snapshot.expectedFirebaseUid, authorizationGeneration: snapshot.expectedAuthorizationGeneration };
        }
      });
      setAuthClient(configuredAuth);
      setApiClient(client);
      initializationTimeout = setTimeout(() => {
        if (!live || observerResolved) return;
        detachObserver();
        setState({ kind: "unavailable", reason: "auth_restore_timeout" });
      }, AUTH_INITIALIZATION_TIMEOUT_MS);
      unsubscribe = configuredAuth.onUserChanged((restoredUser) => {
        const recoverySnapshot = recoveryCoordinator.getSnapshot();
        if (!live || observerDetached || recoveryCommandInFlightRef.current || (recoverySnapshot.kind === "consume" && recoverySnapshot.signInInFlight)) return;
        void (async () => {
        const authObserverDecision = providerCancellationAuthObserverDecision({
          eventUid: restoredUser?.uid ?? null,
          authUid: configuredAuth.getSnapshot()?.uid ?? null,
          cancellationUid: providerCancellationUidRef.current,
          ownerUid: observerBlockedUidRef.current,
        });
        if (authObserverDecision.action === "ignore_stale") return;
        if (recoverySnapshot.kind === "issue" || recoverySnapshot.kind === "consume") {
          recoveryCoordinator.suspendPendingIdentity();
          sessionCoordinator.invalidate();
          revokeDeletionAuthorization();
          if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
          setAccountEntryMode("login");
          setState({ kind: "recoveryPending" });
        }
        providerCancellationUidRef.current = authObserverDecision.cancellationUid;
        const eventRevision = ++authObserverRevision;
        const isRestoredAuthEvent = !observerResolved;
        if (!observerResolved) {
          observerResolved = true;
          authInitializationResolvedRef.current = true;
          if (initializationTimeout !== undefined) clearTimeout(initializationTimeout);
        }
        if (!await guardRecoveryBeforePreparation(configuredAuth)) return;
        if (!live || observerDetached || eventRevision !== authObserverRevision) return;
        const user = configuredAuth.getSnapshot();
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
          if (authObserverDecision.action === "return_to_sign_in") {
            publish({ kind: "signedOut" });
            return;
          }
          void prepareSelectedGuest();
          return;
        }
        if (rejectedRestoreUid !== null && rejectedRestoreUid !== user.uid) rejectedRestoreUid = null;
        if (legalAcceptancePendingRef.current || observerBlockedUidRef.current === user.uid || sessionExchangeUidRef.current === user.uid) return;
        const pendingRevocations = logoutControlSnapshotRef.current.pending.filter((entry) => entry.uid === user.uid);
        if (pendingRevocations.length > 0) {
          observedUid = user.uid;
          const generation = sessionCoordinator.begin(user.uid);
          const canContinue = () => live && !observerDetached && sessionCoordinator.isCurrent(generation) && configuredAuth.getSnapshot()?.uid === user.uid;
          closeActiveProfileStorage();
          setAccountEntryMode("login");
          setState({ kind: "loading" });
          void (async () => {
            try {
              const snapshot = await drainPendingSessionRevocations({
                api: client,
                auth: configuredAuth,
                canContinue,
                control: logoutControl,
                executor: pendingSessionRevocationDrainRef.current!,
                generation: generation.generation,
                onSnapshot: (next) => {
                  if (!canContinue()) return;
                  logoutControlSnapshotRef.current = next;
                  setLogoutControlSnapshot(next);
                },
                onSessionTokenSignIn: () => { sessionExchangeUidRef.current = user.uid; },
                user,
              });
              if (!canContinue()) throw new AccountSessionGenerationStaleError();
              logoutControlSnapshotRef.current = snapshot;
              setLogoutControlSnapshot(snapshot);
              if (!canContinue()) return;
              sessionExchangeUidRef.current = null;
              const currentUser = configuredAuth.getSnapshot();
              if (!currentUser || currentUser.uid !== user.uid) return;
              void startAuthenticatedProfilePreparation(configuredAuth, client, currentUser, generation);
            } catch {
              const pending = findPendingSessionRevocation(logoutControlSnapshotRef.current, user.uid) ?? pendingRevocations[0]!;
              if (canContinue()) setState({ kind: "signOutPending", user, operationId: pending.operationId });
            } finally {
              if (sessionCoordinator.isCurrent(generation) && sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
            }
          })();
          return;
        }
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
        })().catch(() => {
          if (!live || observerDetached) return;
          setRecoveryOperation({ kind: "unavailable", reason: "operation_unavailable", blocksProfilePreparation: true });
          if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
          setState({ kind: "recoveryPending" });
        });
      });
      return () => {
        live = false;
        unsubscribeRecovery();
        if (recoveryCoordinatorRef.current === recoveryCoordinator) {
          recoveryCoordinatorRef.current = null;
          recoveryApiClientRef.current = null;
        }
        observerBlockedUidRef.current = null;
        revokeDeletionAuthorization();
        detachObserver();
        sessionCoordinator.dispose();
      };
    } catch {
      publish({ kind: "unavailable", reason: "firebase_unconfigured" });
      return () => { live = false; observerBlockedUidRef.current = null; revokeDeletionAuthorization(); sessionCoordinator.dispose(); };
    }
  }, [authInitializationRevision, finalizeCurrent, getRecoveryVault, guardRecoveryBeforePreparation, logoutControl, preparedProfileState, revokeDeletionAuthorization, runtimeMode, sessionCoordinator, startAuthenticatedProfilePreparation]);

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
    const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
    try {
      const snapshot = await drainPendingSessionRevocations({
        api,
        auth,
        canContinue,
        control: logoutControl,
        executor: pendingSessionRevocationDrainRef.current!,
        generation: generation.generation,
        onSnapshot: (next) => {
          if (!canContinue()) return;
          logoutControlSnapshotRef.current = next;
          setLogoutControlSnapshot(next);
        },
        onSessionTokenSignIn: () => { sessionExchangeUidRef.current = user.uid; },
        user,
      });
      if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
      logoutControlSnapshotRef.current = snapshot;
      setLogoutControlSnapshot(snapshot);
    } catch {
      if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
      const pending = findPendingSessionRevocation(logoutControlSnapshotRef.current, user.uid);
      if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
      observerBlockedUidRef.current = user.uid;
      setAccountEntryMode("login");
      setState({ kind: "signOutPending", user, ...(pending ? { operationId: pending.operationId } : {}) });
      return { kind: "failure", failure: "signOutPending" };
    } finally {
      if (sessionCoordinator.isCurrent(generation) && sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
    }
    const attempt = await startAuthenticatedProfilePreparation(auth, api, user, generation);
    if (!attempt) {
      const latest = stateRef.current;
      return { kind: "failure", failure: latest.kind === "revokedSession" ? "revokedSession" : latest.kind === "backendUnavailable" ? "backendUnavailable" : "providerUnavailable" };
    }
    return attempt.completion;
  }, [logoutControl, sessionCoordinator, startAuthenticatedProfilePreparation]);

  const completeExplicitRecoveryAccountTransition = useCallback(async (
    auth: FirebaseAuthClient,
    api: ReturnType<typeof createPatternlyApiClient>,
    user: FirebaseAuthUserSnapshot,
  ): Promise<AccountCommandResult | null> => {
    const intent = explicitRecoveryAccountTransitionRef.current;
    if (!intent) return null;
    const coordinator = recoveryCoordinatorRef.current;
    const pending = coordinator?.getSnapshot();
    if (!coordinator || pending?.kind !== "issue" || pending.operationId !== intent.operationId || pending.firebaseUid !== intent.firebaseUid || pending.authorizationGeneration !== intent.authorizationGeneration) {
      explicitRecoveryAccountTransitionRef.current = null;
      return { kind: "failure", failure: "conflict" };
    }
    const generation = sessionCoordinator.current(user.uid) ?? sessionCoordinator.begin(user.uid);
    const canContinue = () => {
      const current = coordinator.getSnapshot();
      return explicitRecoveryAccountTransitionRef.current === intent
        && current.kind === "issue"
        && current.operationId === intent.operationId
        && sessionCoordinator.isCurrent(generation)
        && auth.getSnapshot()?.uid === user.uid;
    };
    let proofBarrier: AccountIdentityProofBarrierContext | null = null;
    let proofBarrierResolutionAttempted = false;
    try {
      proofBarrier = await beginIdentityProofBarrier(auth, user, generation);
      const identityProof = await runAccountIdentityProof({
        request: () => getMeWithExchangedSession({
          api,
          auth,
          canContinue,
          onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
          user,
        }),
        user,
        generation,
        barrier: proofBarrier,
        barrierAlreadyCaptured: true,
        beginBarrier: () => beginIdentityProofBarrier(auth, user, generation),
        resolveBarrier: (barrier) => resolveIdentityProofBarrier(barrier, auth, user, generation),
        resolveOnSuccess: false,
        matchesProofSubject: (response, barrier) => response.user.id === barrier.previousBinding.accountId
          && response.user.identity.subject === barrier.previousBinding.firebaseUid
          && barrier.previousBinding.firebaseUid === user.uid,
        getCurrentState: () => stateRef.current,
        getCurrentSdkUid: () => auth.getSnapshot()?.uid ?? null,
        isCurrentGeneration: sessionCoordinator.isCurrent,
        isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
        readBinding: readActiveAccountIdentityBinding,
        revokeDeniedBinding: async (error) => {
          const lease = proofBarrier?.lease;
          await revokeBindingForAuthoritativeIdentityDenial(error, {
            profile: proofBarrier?.profile ?? preparedProfileState.selectedProfile,
            uid: user.uid,
            ...(lease ? { lease } : {}),
            ...(proofBarrier ? { verificationRevision: proofBarrier.previousBinding.verificationRevision } : {}),
            canContinue,
          });
        },
      });
      if (identityProof.kind === "failed") {
        proofBarrier = null;
        explicitRecoveryAccountTransitionRef.current = null;
        if (identityProof.state.kind === "revokedSession" || identityProof.state.kind === "reauthenticationRequired") setState(identityProof.state);
        return { kind: "failure", failure: identityProof.failure };
      }
      proofBarrier = identityProof.barrier;
      const response = identityProof.value;
      const exactPreviousIdentity = !!proofBarrier
        && response.user.id === proofBarrier.previousBinding.accountId
        && response.user.identity.subject === proofBarrier.previousBinding.firebaseUid
        && proofBarrier.previousBinding.firebaseUid === user.uid;
      if (!exactPreviousIdentity) proofBarrier = null;
      const restoreExactProofBinding = async () => {
        if (!proofBarrier || !exactPreviousIdentity || proofBarrierResolutionAttempted) return;
        proofBarrierResolutionAttempted = true;
        await resolveIdentityProofBarrier(proofBarrier, auth, user, generation);
        proofBarrier = null;
      };
      if (!canContinue() || auth.getSnapshot()?.uid !== user.uid) throw new AccountSessionGenerationStaleError();
      const authorizationGeneration = await auth.getAuthorizationGeneration();
      if (!canContinue() || !Number.isSafeInteger(authorizationGeneration) || authorizationGeneration === null || authorizationGeneration < 1) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
      if (user.uid === intent.firebaseUid && authorizationGeneration === intent.authorizationGeneration) {
        await restoreExactProofBinding();
        explicitRecoveryAccountTransitionRef.current = null;
        return { kind: "failure", failure: "conflict" };
      }
      const deferred = await coordinator.deferIssueToIdentity(intent.operationId, { firebaseUid: user.uid, authorizationGeneration });
      const afterGeneration = await auth.getAuthorizationGeneration();
      const after = coordinator.getSnapshot();
      if (!canContinue() || afterGeneration !== authorizationGeneration || after.kind !== "issue" || after.operationId !== intent.operationId || after.deferredFor?.firebaseUid !== user.uid || after.deferredFor.authorizationGeneration !== authorizationGeneration || deferred.blocksProfilePreparation) {
        if (canContinue() && afterGeneration === authorizationGeneration) await restoreExactProofBinding();
        explicitRecoveryAccountTransitionRef.current = null;
        return { kind: "failure", failure: "conflict" };
      }
      await restoreExactProofBinding();
      explicitRecoveryAccountTransitionRef.current = null;
      return { kind: "success", next: "authenticated" };
    } catch (error) {
      if (proofBarrier && !proofBarrierResolutionAttempted && !isAuthoritativeIdentityProofDenial(error) && canContinue()) {
        try { await resolveIdentityProofBarrier(proofBarrier, auth, user, generation); } catch { /* Leave the durable denial barrier fail-closed. */ }
      }
      if (isAuthoritativeIdentityProofDenial(error) && canContinue()) setState({ kind: "revokedSession", user });
      explicitRecoveryAccountTransitionRef.current = null;
      return { kind: "failure", failure: classifyAccountFailure(error) };
    } finally {
      if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
    }
  }, [beginIdentityProofBarrier, preparedProfileState.selectedProfile, resolveIdentityProofBarrier, sessionCoordinator]);

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
    evidence: AccountRegistrationInputDto = registrationEvidence(locale),
    preserveObserverBlockOnFailure = false,
    expectedGeneration?: AccountSessionGenerationToken,
    finalizeExisting?: () => Promise<AccountCommandResult>,
  ): Promise<AccountCommandResult> => {
    const inFlight = registrationIntentRef.current;
    if (inFlight?.uid === user.uid) return inFlight.promise;
    let promise!: Promise<AccountCommandResult>;
    promise = (async (): Promise<AccountCommandResult> => {
    const generation = expectedGeneration ?? sessionCoordinator.restart(user.uid);
    observerBlockedUidRef.current = user.uid;
    let registrationFlowResolved = false;
    try {
      const registration = await api.registerAccount(evidence);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
      if (registration.registration.created) await markGuestInstallationAdoptionPending();
      const result: Promise<AccountCommandResult> = finalize
        ? (registration.registration.created
          ? finalizeCurrent(auth, api, user, false, generation, true, true)
          : finalizeExisting ? finalizeExisting() : finalizeExplicitAuthentication(auth, api, user))
        : Promise.resolve({ kind: "success", next: "authenticated" });
      const resolved = await result;
      registrationFlowResolved = resolved.kind === "success";
      return resolved;
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
      if (finalize && (!preserveObserverBlockOnFailure || registrationFlowResolved) && observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
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

  const runProviderFirstUse = useCallback((
    auth: FirebaseAuthClient,
    api: ReturnType<typeof createPatternlyApiClient>,
    locale: TargetLocale,
    authenticate: () => Promise<FirebaseAuthUserSnapshot>,
  ): Promise<AccountCommandResult> => {
    if (providerAuthenticationInFlightRef.current) return Promise.resolve({ kind: "failure", failure: "conflict" });
    providerAuthenticationInFlightRef.current = true;
    providerCancellationUidRef.current = null;
    legalAcceptancePendingRef.current = true;
    return runAuthMutationWithAuth(async () => {
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      legalAcceptancePendingRef.current = true;
      let user: FirebaseAuthUserSnapshot | null = null;
      try {
        if (recoveryCoordinatorRef.current?.getSnapshot().blocksProfilePreparation === false) recoverySessionIdentityRef.current = null;
        user = await authenticate();
        if (auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
        const recoveryTransitionIntent = explicitRecoveryAccountTransitionRef.current;
        const recoveryTransition = await completeExplicitRecoveryAccountTransition(auth, api, user);
        if (recoveryTransition?.kind === "failure") return recoveryTransition;
        if (recoveryTransition?.kind === "success") {
          const pending = recoveryCoordinatorRef.current?.getSnapshot();
          const generation = sessionCoordinator.current(user.uid);
          if (!recoveryTransitionIntent || !generation || !sessionCoordinator.isCurrent(generation)
            || auth.getSnapshot()?.uid !== user.uid
            || pending?.kind !== "issue" || pending.operationId !== recoveryTransitionIntent.operationId
            || pending.firebaseUid !== recoveryTransitionIntent.firebaseUid
            || pending.authorizationGeneration !== recoveryTransitionIntent.authorizationGeneration
            || pending.deferredFor?.firebaseUid !== user.uid
            || pending.deferredFor.authorizationGeneration !== pending.authorizationGeneration
            || pending.blocksProfilePreparation) return { kind: "failure", failure: "conflict" };
        } else if (!await guardRecoveryBeforePreparation(auth)) {
          return { kind: "failure", failure: "conflict" };
        }

        const generation = sessionCoordinator.restart(user.uid);
        // The Auth observer must stay blocked from this point through exchange,
        // custom-token sign-in and explicit finalization or registration.
        observerBlockedUidRef.current = user.uid;
        const coordinator = createProviderFirstUseCoordinator<AccountCommandResult>({
          exchange: () => api.exchangeAccountSession(),
          signInWithSessionToken: (customToken) => auth.signInWithSessionToken(customToken),
          finalize: () => finalizeExplicitAuthentication(auth, api, user!),
          getAuthUid: () => auth.getSnapshot()?.uid ?? null,
          isCurrentGeneration: (token) => sessionCoordinator.isCurrent(token),
          isAccountNotFound: (error) => error instanceof PatternlyApiClientError
            && error.status === 404
            && error.serverCode === "account_not_found",
        });

        try {
          const resolution = await coordinator.run(generation);
          if (resolution.kind === "provisional") {
            setState({ kind: "providerRegistrationRequired", user, generation, documents: resolveProviderRegistrationDocuments(locale, runtimeMode) });
            return { kind: "success", next: "providerRegistrationRequired" };
          }
          if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
          return resolution.value;
        } catch (error) {
          if (auth.getSnapshot()?.uid !== user.uid || !sessionCoordinator.isCurrent(generation)) {
            if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
            return { kind: "failure", failure: "revokedSession" };
          }
          const failure = classifyAccountFailure(error);
          await auth.signOut().catch(() => undefined);
          if (auth.getSnapshot()?.uid === user.uid) {
            setState({ kind: "signOutPending", user, provisional: true });
            return { kind: "failure", failure: "signOutPending" };
          }
          if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
          setState({ kind: "signedOut" });
          return { kind: "failure", failure };
        }
      } catch (error) {
        const current = auth.getSnapshot();
        if (!user && isProviderAuthenticationCancelled(error)) {
          return { kind: "success", next: "signedOut" };
        }
        if (user && current?.uid === user.uid) {
          observerBlockedUidRef.current = user.uid;
          await auth.signOut().catch(() => undefined);
          if (auth.getSnapshot()?.uid === user.uid) {
            setState({ kind: "signOutPending", user, provisional: true });
            return { kind: "failure", failure: "signOutPending" };
          }
          if (observerBlockedUidRef.current === user.uid) observerBlockedUidRef.current = null;
        }
        return { kind: "failure", failure: classifyAccountFailure(error) };
      } finally {
        legalAcceptancePendingRef.current = false;
      }
    }).finally(() => {
      legalAcceptancePendingRef.current = false;
      providerAuthenticationInFlightRef.current = false;
    });
  }, [completeExplicitRecoveryAccountTransition, finalizeExplicitAuthentication, guardRecoveryBeforePreparation, revokeDeletionAuthorization, runAuthMutationWithAuth, runtimeMode, sessionCoordinator]);

  const registerProviderIdentity = useCallback((termsAccepted: boolean, privacyPolicyAcknowledged: boolean, locale: TargetLocale): Promise<AccountCommandResult> => {
    if (!termsAccepted || !privacyPolicyAcknowledged) return Promise.resolve({ kind: "failure", failure: "invalid" });
    if (providerRegistrationInFlightRef.current) return Promise.resolve({ kind: "failure", failure: "conflict" });
    providerRegistrationInFlightRef.current = true;
    return runAuthMutationWithAuth(async (auth, api) => {
      const current = stateRef.current;
      if (current.kind !== "providerRegistrationRequired"
        || current.documents.kind !== "ready"
        || current.documents.documents.locale !== locale
        || auth.getSnapshot()?.uid !== current.user.uid
        || !sessionCoordinator.isCurrent(current.generation)) return { kind: "failure", failure: "revokedSession" };

      const refreshedDocuments = resolveProviderRegistrationDocuments(locale, runtimeMode);
      if (refreshedDocuments.kind !== "ready"
        || refreshedDocuments.documents.terms.version !== current.documents.documents.terms.version
        || refreshedDocuments.documents.privacy.version !== current.documents.documents.privacy.version
        || refreshedDocuments.documents.terms.content !== current.documents.documents.terms.content
        || refreshedDocuments.documents.privacy.content !== current.documents.documents.privacy.content) return { kind: "failure", failure: "invalid" };

      legalAcceptancePendingRef.current = true;
      observerBlockedUidRef.current = current.user.uid;
      const evidence: AccountRegistrationInputDto = Object.freeze({
        termsVersion: current.documents.documents.terms.version,
        termsLocale: current.documents.documents.locale,
        privacyPolicyVersion: current.documents.documents.privacy.version,
        privacyPolicyLocale: current.documents.documents.locale,
        privacyPolicyAcknowledged: true,
      });
      const finalizeExisting = async (): Promise<AccountCommandResult> => {
        const generation = current.generation;
        const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === current.user.uid;
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        const exchanged = await api.exchangeAccountSession();
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        const exchangedUser = await auth.signInWithSessionToken(exchanged.customToken);
        if (!canContinue() || exchangedUser.uid !== current.user.uid) return { kind: "failure", failure: "revokedSession" };
        return finalizeExplicitAuthentication(auth, api, current.user);
      };

      try {
        const result = await registerAuthenticatedIdentity(auth, api, current.user, current.documents.documents.locale, true, evidence, true, current.generation, finalizeExisting);
        if (result.kind === "failure") {
          if (result.failure === "signOutPending" && auth.getSnapshot()?.uid === current.user.uid) {
            setState({ kind: "signOutPending", user: current.user, provisional: true });
          } else if (auth.getSnapshot() === null) {
            if (observerBlockedUidRef.current === current.user.uid) observerBlockedUidRef.current = null;
          } else if (auth.getSnapshot()?.uid === current.user.uid) {
            const generation = sessionCoordinator.current(current.user.uid);
            if (generation) setState({ ...current, generation });
            if (generation) observerBlockedUidRef.current = current.user.uid;
            else if (observerBlockedUidRef.current === current.user.uid) observerBlockedUidRef.current = null;
          }
        }
        return result;
      } finally {
        legalAcceptancePendingRef.current = false;
      }
    }).finally(() => {
      providerRegistrationInFlightRef.current = false;
    });
  }, [finalizeExplicitAuthentication, registerAuthenticatedIdentity, runAuthMutationWithAuth, runtimeMode, sessionCoordinator]);

  const cancelProviderRegistration = useCallback((): Promise<AccountCommandResult> => runAuthMutationWithAuth(async (auth) => {
    const currentState = stateRef.current;
    const user = currentState.kind === "providerRegistrationRequired"
      ? currentState.user
      : currentState.kind === "signOutPending" && currentState.provisional ? currentState.user : null;
    if (!user || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };

    legalAcceptancePendingRef.current = true;
    providerCancellationUidRef.current = user.uid;
    observerBlockedUidRef.current = user.uid;
    sessionCoordinator.invalidate();
    try {
      await auth.signOut();
    } catch {
      // Check the actual Auth snapshot below; a rejected promise can still have
      // completed the local sign-out.
    } finally {
      legalAcceptancePendingRef.current = false;
    }
    if (auth.getSnapshot()?.uid === user.uid) {
      setState({ kind: "signOutPending", user, provisional: true });
      return { kind: "failure", failure: "signOutPending" };
    }
    setAccountEntryMode("login");
    setState({ kind: "signedOut" });
    return { kind: "success", next: "signedOut" };
  }), [runAuthMutationWithAuth, sessionCoordinator]);

  const refreshPremiumEntitlement = useCallback((accountId: string) => premiumRefreshQueueRef.current.request(async () => {
    const current = stateRef.current;
    if (!apiClient || !authClient || current.kind !== "authenticated" || current.backendUser.id !== accountId || authClient.getSnapshot()?.uid !== current.user.uid) return "pending" as const;
    const generation = sessionCoordinator.current(current.user.uid);
    if (!generation) return "pending" as const;
    if (!clearPremiumCacheUnlessBoundTo(accountId)) return "pending" as const;
    const stillCurrent = () => sessionCoordinator.isCurrent(generation) && authClient.getSnapshot()?.uid === current.user.uid
      && stateRef.current.kind === "authenticated" && stateRef.current.backendUser.id === accountId;
    try {
      const response = await apiClient.getEntitlements();
      if (!stillCurrent()) return "pending" as const;
      const identity = { accountId, entitlement: PREMIUM_ENTITLEMENT, productId: legalVariables.terms.premiumProductIdentifier.en };
      if (!replacePremiumCacheFromFreshResponse(response, identity, Date.now())) return "pending" as const;
      return isPremiumAccessConfirmedOnline({ ...response.entitlements[0], serverObservedAt: response.serverObservedAt }) ? "verified" as const : "denied" as const;
    } catch { return "pending" as const; }
  }), [apiClient, authClient, sessionCoordinator]);

  const isCurrentLocalOfflineActor = useCallback((expected: Extract<AccountState, { kind: "localOffline" }>): boolean => {
    const latest = stateRef.current;
    const generationCurrent = sessionCoordinator.isCurrent(expected.generation);
    const observation: AccountActorIdentityObservation = {
      stateKind: latest.kind,
      uid: latest.kind === "localOffline" ? latest.user.uid : null,
      accountId: latest.kind === "localOffline" ? latest.accountId : null,
      sdkUid: authClient?.getSnapshot()?.uid ?? null,
      generation: latest.kind === "localOffline" ? latest.generation : null,
      generationCurrent,
      profile: getActiveStorageProfileOrNull(),
    };
    return latest.kind === "localOffline" && latest.bindingRevision === expected.bindingRevision
      && latest.profileLease.generation === expected.profileLease.generation
      && isActiveProfileStorageLeaseCurrent(expected.profileLease)
      && matchesAccountActorIdentity({
        stateKind: "localOffline",
        uid: expected.user.uid,
        accountId: expected.accountId,
        generation: expected.generation,
        profile: expected.profile,
      }, observation);
  }, [authClient, sessionCoordinator]);

  const authorizePremiumSessionStart = useCallback(async () => {
    const current = stateRef.current;
    if (current.kind !== "authenticated" && current.kind !== "localOffline") return "denied" as const;
    const accountId = current.kind === "authenticated" ? current.backendUser.id : current.accountId;
    const accountUid = current.user.uid;
    const identity = { accountId, entitlement: PREMIUM_ENTITLEMENT, productId: legalVariables.terms.premiumProductIdentifier.en };
    if (current.kind === "localOffline") {
      let confirmedOffline = false;
      try { confirmedOffline = (await (await import("@react-native-community/netinfo")).default.fetch()).isInternetReachable === false; }
      catch { return "unavailable" as const; }
      if (!confirmedOffline || !isCurrentLocalOfflineActor(current)) return "unavailable" as const;
      const allowed = hasOfflinePremiumAccess(identity, Date.now());
      return isCurrentLocalOfflineActor(current) ? (allowed ? "allowed" : "denied") : "unavailable" as const;
    }
    return resolvePremiumSessionAdmission({
      isConfirmedOffline: async () => (await import("@react-native-community/netinfo")).default.fetch().then((network) => network.isInternetReachable === false),
      hasOfflineAccess: () => {
        const latest = stateRef.current;
        return latest.kind === "authenticated" && latest.backendUser.id === accountId && latest.user.uid === accountUid
          && authClient?.getSnapshot()?.uid === accountUid
          && hasOfflinePremiumAccess(identity, Date.now());
      },
      refresh: () => refreshPremiumEntitlement(accountId),
    });
  }, [authClient, isCurrentLocalOfflineActor, refreshPremiumEntitlement]);

  const readCurrentPremiumAccess = useCallback(() => {
    const current = stateRef.current;
    if (current.kind === "guest" || current.kind === "signedOut") return "denied" as const;
    if (current.kind === "localOffline") {
      if (!authClient || !isCurrentLocalOfflineActor(current)) return "unavailable" as const;
      const result = readCachedPremiumAccess({ accountId: current.accountId, entitlement: PREMIUM_ENTITLEMENT, productId: legalVariables.terms.premiumProductIdentifier.en }, Date.now());
      return isCurrentLocalOfflineActor(current) ? result : "unavailable" as const;
    }
    if (current.kind !== "authenticated" || !authClient || authClient.getSnapshot()?.uid !== current.user.uid) return "unavailable" as const;
    const accountId = current.backendUser.id;
    const uid = current.user.uid;
    const generation = sessionCoordinator.current(uid);
    const profile = getActiveStorageProfileOrNull();
    if (!generation || !profile || !["account", "legacy_owner"].includes(profile.kind) || profile.accountId !== accountId) return "unavailable" as const;
    const result = readCachedPremiumAccess({ accountId, entitlement: PREMIUM_ENTITLEMENT, productId: legalVariables.terms.premiumProductIdentifier.en }, Date.now());
    const latest = stateRef.current;
    const latestProfile = getActiveStorageProfileOrNull();
    const sameProfile = latestProfile !== null && latestProfile.id === profile.id && latestProfile.kind === profile.kind && latestProfile.accountId === profile.accountId;
    if (latest !== current || latest.kind !== "authenticated" || latest.backendUser.id !== accountId || latest.user.uid !== uid ||
      authClient.getSnapshot()?.uid !== uid || !sessionCoordinator.isCurrent(generation) || !sameProfile) return "unavailable" as const;
    return result;
  }, [authClient, isCurrentLocalOfflineActor, sessionCoordinator]);

  const captureCurrentAuthenticatedActorFence = useCallback(() => {
    const current = stateRef.current;
    if (current.kind !== "authenticated" || !authClient) return null;
    const uid = current.user.uid;
    const accountId = current.backendUser.id;
    const profile = getActiveStorageProfileOrNull();
    const generation = sessionCoordinator.current(uid);
    if (!profile || !["account", "legacy_owner"].includes(profile.kind) || profile.accountId !== accountId || !generation || authClient.getSnapshot()?.uid !== uid) return null;
    const expected: AccountActorIdentity = Object.freeze({
      stateKind: "authenticated",
      uid,
      accountId,
      generation,
      profile: Object.freeze({ id: profile.id, kind: profile.kind, accountId: profile.accountId }),
    });
    const observe = (): AccountActorIdentityObservation => {
      const latest = stateRef.current;
      const latestAuthenticated = latest.kind === "authenticated";
      return {
        stateKind: latest.kind,
        uid: latestAuthenticated ? latest.user.uid : null,
        accountId: latestAuthenticated ? latest.backendUser.id : null,
        sdkUid: authClient.getSnapshot()?.uid ?? null,
        generation: latestAuthenticated ? sessionCoordinator.current(latest.user.uid) : null,
        generationCurrent: sessionCoordinator.isCurrent(generation),
        profile: getActiveStorageProfileOrNull(),
      };
    };
    const isCurrent = () => {
      return matchesAccountActorIdentity(expected, observe());
    };
    if (!isCurrent()) return null;
    return Object.freeze({
      accountIdSha256: sha256Utf8(accountId),
      profileIdSha256: sha256Utf8(profile.id),
      uidSha256: sha256Utf8(uid),
      isCurrent,
      isCurrentSdkUid: (candidate: string) => candidate === uid && isCurrent(),
    });
  }, [authClient, sessionCoordinator]);

  const captureHomeResumeActorFence = useCallback((): HomeResumeActorFence | null => {
    const current = stateRef.current;
    if (current.kind === "authenticated") {
      const fence = captureCurrentAuthenticatedActorFence();
      return fence ? Object.freeze({ isCurrent: fence.isCurrent }) : null;
    }
    if (current.kind === "localOffline" && isCurrentLocalOfflineActor(current)) {
      return Object.freeze({ isCurrent: () => isCurrentLocalOfflineActor(current) });
    }
    return null;
  }, [captureCurrentAuthenticatedActorFence, isCurrentLocalOfflineActor]);

  const inspectQ13ActorFence = useCallback((): Q13ActorFence => {
    const current = stateRef.current;
    if (current.kind === "guest") return Object.freeze({ kind: "denied" });
    const fence = captureCurrentAuthenticatedActorFence();
    if (!fence) return Object.freeze({ kind: "unavailable" });
    return Object.freeze({ kind: "ready", ...fence });
  }, [captureCurrentAuthenticatedActorFence]);

  const installPremiumNodePackage = useCallback(async (offerId: string, appVersion: string): Promise<void> => {
    const current = stateRef.current;
    const auth = authClient;
    const api = apiClient;
    if (!auth || !api || current.kind !== "authenticated" || auth.getSnapshot()?.uid !== current.user.uid) throw new PatternlyApiClientError("authentication_required");
    const generation = sessionCoordinator.current(current.user.uid);
    if (!generation) throw new PatternlyApiClientError("authentication_required");
    await installPremiumNodeOffer({
      api,
      offerId,
      appVersion,
      assertActivationAllowed() {
        if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.user.uid || stateRef.current.kind !== "authenticated" || stateRef.current.backendUser.id !== current.backendUser.id) {
          throw new PatternlyApiClientError("authentication_required");
        }
      },
    });
  }, [apiClient, authClient, sessionCoordinator]);

  const retryLearningPlanRecoveryForAccount = useCallback(async (accountId: string): Promise<void> => {
    const auth = authClient;
    const api = apiClient;
    const current = stateRef.current;
    if (!auth || !api || current.kind !== "authenticated" || current.backendUser.id !== accountId || auth.getSnapshot()?.uid !== current.user.uid) return;
    const generation = sessionCoordinator.current(current.user.uid);
    if (!generation) return;
    const next = await retryLearningPlanRecovery(api, accountId);
    if (!next || !sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.user.uid) return;
    const latest = stateRef.current;
    if (latest.kind !== "authenticated" || latest.backendUser.id !== accountId || latest.user.uid !== current.user.uid) return;
    setState({ ...latest, accountData: next });
  }, [apiClient, authClient, sessionCoordinator]);

  const finishRecoveryCommand = useCallback(async (snapshot: RecoveryOperationSnapshot, auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>): Promise<AccountCommandResult> => {
    if (snapshot.kind === "idle") {
      const user = auth.getSnapshot();
      if (user) return finalizeExplicitAuthentication(auth, api, user);
      if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
      setAccountEntryMode("login");
      setState({ kind: "signedOut" });
      return { kind: "success", next: "signedOut" };
    }
    if (snapshot.kind === "terminal" && snapshot.status === "acknowledged") {
      const user = auth.getSnapshot();
      if (!user) return { kind: "failure", failure: "revokedSession" };
      return finalizeExplicitAuthentication(auth, api, user);
    }
    if (snapshot.kind === "issue" && snapshot.codes && !snapshot.needsAccountResolution && !snapshot.savedIntent) {
      return { kind: "success", next: "recoveryCodesIssued", recoveryCodes: snapshot.codes };
    }
    if (snapshot.kind !== "issue" || stateRef.current.kind === "recoveryPending") {
      if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
      setAccountEntryMode("login");
      setState({ kind: "recoveryPending" });
    }
    if (snapshot.kind === "terminal") return { kind: "failure", failure: snapshot.status === "expired_or_invalid" ? "expiredAction" : "conflict" };
    if (snapshot.kind === "issue" || snapshot.kind === "consume") {
      const failures: Readonly<Record<NonNullable<typeof snapshot.failure>, AccountFailure>> = {
        offline: "offline", unauthorized: "reauthenticationRequired", conflict: "conflict", rate_limited: "rateLimited", unavailable: "backendUnavailable", invalid_response: "remoteFailure",
      };
      return { kind: "failure", failure: snapshot.failure ? failures[snapshot.failure] : "conflict" };
    }
    return { kind: "failure", failure: "providerUnavailable" };
  }, [finalizeExplicitAuthentication]);

  const executeRecoveryCommand = useCallback(async (auth: FirebaseAuthClient, api: ReturnType<typeof createPatternlyApiClient>, operation: (coordinator: ReturnType<typeof createRecoveryOperationCoordinator>) => Promise<RecoveryOperationSnapshot>): Promise<AccountCommandResult> => {
    const coordinator = recoveryCoordinatorRef.current;
    if (!coordinator || recoveryCommandInFlightRef.current) return { kind: "failure", failure: "conflict" };
    recoveryCommandInFlightRef.current = true;
    let result: RecoveryOperationSnapshot;
    try { result = await operation(coordinator); }
    finally { recoveryCommandInFlightRef.current = false; }
    return finishRecoveryCommand(result, auth, api);
  }, [finishRecoveryCommand]);

  const value = useMemo<AccountSessionContextValue>(() => ({
    recoveryOperation,
    refreshPremiumEntitlement,
    retryLearningPlanRecovery: retryLearningPlanRecoveryForAccount,
    authorizePremiumSessionStart,
    readCurrentPremiumAccess,
    inspectQ13ActorFence,
    installPremiumNodePackage,
    dismissLearningPlanRecovery: (incidentId) => {
      const current = stateRef.current;
      if (current.kind !== "authenticated") return;
      const incident = current.accountData.learningPlanRecovery;
      if (!incident || incident.incidentId !== incidentId || incident.dismissed) return;
      dismissAccountLearningPlanRecovery(current.backendUser.id, incidentId);
      setState({
        ...current,
        accountData: {
          ...current.accountData,
          learningPlanRecovery: { ...incident, dismissed: true },
        },
      });
    },
    recordPurchaseConfirmation: async (input) => {
      if (!apiClient || state.kind !== "authenticated") return { kind: "failure", failure: "providerUnavailable" };
      try { await apiClient.recordPurchaseConfirmation(input); return { kind: "success", next: "authenticated" }; }
      catch (error) { return { kind: "failure", failure: classifyAccountFailure(error) }; }
    },
    continueAsGuest: async () => {
      if (!await guardRecoveryBeforePreparation(authClient)) return { kind: "failure", failure: "conflict" };
      setGuestTransitionFailure(null);
      providerCancellationUidRef.current = null;
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
          guestAdoption: false,
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
      const current = stateRef.current;
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      const generation = previousUser ? sessionCoordinator.begin(previousUser.uid) : null;
      if (previousUser) observerBlockedUidRef.current = previousUser.uid;
      const canContinue = (user: FirebaseAuthUserSnapshot | null) => previousUser
        ? user?.uid === previousUser.uid && sessionCoordinator.isCurrent(generation!) && auth.getSnapshot()?.uid === previousUser.uid
        : user !== null && auth.getSnapshot()?.uid === user.uid;
      try {
        let user: FirebaseAuthUserSnapshot | null;
        let proofBarrier: AccountIdentityProofBarrierContext | null | undefined;
        if (previousUser && generation) {
          const revokeDenied = async (error: unknown) => {
            const lease = current.kind === "localOffline" ? current.profileLease : captureActiveProfileStorageLease();
            const profile = current.kind === "localOffline" ? current.profile : lease?.profile;
            if (profile) await revokeBindingForAuthoritativeIdentityDenial(error, {
              profile, uid: previousUser.uid, ...(lease ? { lease } : {}),
              ...(current.kind === "localOffline" ? { verificationRevision: current.bindingRevision } : {}),
              canContinue: () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === previousUser.uid,
            });
          };
          const refresh = await runAccountIdentityProof({
            request: () => auth.refreshVerification(), user: previousUser, generation,
            beginBarrier: () => beginIdentityProofBarrier(auth, previousUser, generation),
            resolveBarrier: (barrier) => resolveIdentityProofBarrier(barrier, auth, previousUser, generation),
            matchesProofSubject: (refreshed, barrier) => refreshed?.uid === barrier.requestUid && refreshed?.uid === previousUser.uid,
            resolveOnSuccess: false,
            getCurrentState: () => stateRef.current, getCurrentSdkUid: () => auth.getSnapshot()?.uid ?? null,
            isCurrentGeneration: sessionCoordinator.isCurrent, isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
            readBinding: readActiveAccountIdentityBinding, revokeDeniedBinding: revokeDenied,
          });
          if (refresh.kind === "failed") {
            if (current.kind === "localOffline" || refresh.state.kind === "revokedSession" || refresh.state.kind === "reauthenticationRequired") setState(refresh.state);
            return { kind: "failure", failure: refresh.failure };
          }
          user = refresh.value;
          proofBarrier = refresh.barrier;
        } else {
          user = await auth.refreshVerification();
        }
        if (!user || !canContinue(user)) {
          if (current.kind === "localOffline") setState({ kind: "revokedSession", user: previousUser! });
          return { kind: "failure", failure: "revokedSession" };
        }
        const plan = planPasswordVerificationCommand("refresh", runtimeMode, user);
        if (plan.kind === "verificationPending") {
          if (proofBarrier && user.uid === previousUser?.uid && generation
            && sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid) {
            try { await resolveIdentityProofBarrier(proofBarrier, auth, user, generation); }
            catch {
              if (current.kind === "localOffline") setState({ kind: "backendUnavailable", user });
              return { kind: "failure", failure: "backendUnavailable" };
            }
          }
          setState({ kind: "verificationPending", user });
          return { kind: "failure", failure: "unverifiedIdentity" };
        }
        const token = generation ?? sessionCoordinator.begin(user.uid);
        return finalizeCurrent(auth, api, user, false, token, false, false, proofBarrier);
      } finally {
        if (previousUser && observerBlockedUidRef.current === previousUser.uid) observerBlockedUidRef.current = null;
      }
    }),
    refreshAccountIdentity: () => {
      const current = stateRef.current;
      const previousUser = authClient?.getSnapshot();
      if (!authClient || !apiClient || !previousUser || (current.kind !== "authenticated" && current.kind !== "localOffline") || current.user.uid !== previousUser.uid) {
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
          const revokeDenied = async (error: unknown) => {
            const lease = current.kind === "localOffline" ? current.profileLease : captureActiveProfileStorageLease();
            const profile = current.kind === "localOffline" ? current.profile : lease?.profile;
            if (profile) await revokeBindingForAuthoritativeIdentityDenial(error, {
              profile,
              uid: previousUser.uid,
              ...(lease ? { lease } : {}),
              ...(current.kind === "localOffline" ? { verificationRevision: current.bindingRevision } : {}),
              canContinue: () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === previousUser.uid,
            });
          };
          const sdkRefresh = await runAccountIdentityProof({
            request: () => auth.refreshAccountIdentity(),
            user: previousUser,
            generation,
            beginBarrier: () => beginIdentityProofBarrier(auth, previousUser, generation),
            resolveBarrier: (barrier) => resolveIdentityProofBarrier(barrier, auth, previousUser, generation),
            matchesProofSubject: (refreshed, barrier) => refreshed?.uid === barrier.requestUid && refreshed?.uid === previousUser.uid,
            resolveOnSuccess: false,
            getCurrentState: () => stateRef.current,
            getCurrentSdkUid: () => auth.getSnapshot()?.uid ?? null,
            isCurrentGeneration: sessionCoordinator.isCurrent,
            isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
            readBinding: readActiveAccountIdentityBinding,
            revokeDeniedBinding: revokeDenied,
          });
          if (sdkRefresh.kind === "failed") {
            if (current.kind === "localOffline" || sdkRefresh.state.kind === "revokedSession" || sdkRefresh.state.kind === "reauthenticationRequired") setState(sdkRefresh.state);
            return { kind: "failure", failure: sdkRefresh.failure };
          }
          const user = sdkRefresh.value;
          if (!user || !canContinue(auth, user)) {
            if (current.kind === "localOffline") setState({ kind: "revokedSession", user: previousUser });
            return { kind: "failure", failure: "revokedSession" };
          }
          if (current.kind === "localOffline") return finalizeCurrent(auth, api, user, false, generation, false, false, sdkRefresh.barrier);
          const identityProof = await runAccountIdentityProof({
            request: () => getMeWithExchangedSession({
              api,
              auth,
              canContinue: () => canContinue(auth, user),
              ...(recoverySessionIdentityRef.current?.firebaseUid === user.uid ? { requiredAuthorizationGeneration: recoverySessionIdentityRef.current.authorizationGeneration } : {}),
              onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
              user,
            }),
            user,
            generation,
            barrier: sdkRefresh.barrier,
            barrierAlreadyCaptured: true,
            beginBarrier: () => beginIdentityProofBarrier(auth, user, generation),
            resolveBarrier: (barrier) => resolveIdentityProofBarrier(barrier, auth, user, generation),
            matchesProofSubject: (response, barrier) => response.user.id === barrier.previousBinding.accountId
              && barrier.previousBinding.firebaseUid === user.uid,
            getCurrentState: () => stateRef.current,
            getCurrentSdkUid: () => auth.getSnapshot()?.uid ?? null,
            isCurrentGeneration: sessionCoordinator.isCurrent,
            isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
            readBinding: readActiveAccountIdentityBinding,
            revokeDeniedBinding: revokeDenied,
          });
          if (identityProof.kind === "failed") {
            if (identityProof.state.kind === "revokedSession" || identityProof.state.kind === "reauthenticationRequired") setState(identityProof.state);
            return { kind: "failure", failure: identityProof.failure };
          }
          const response = identityProof.value;
          if (!canContinue(auth, user)) return { kind: "failure", failure: "revokedSession" };
          setState((latest) => publishRefreshedAuthenticatedState(latest, {
            backendUser: response.user,
            isCurrent: () => canContinue(auth, auth.getSnapshot()),
            user,
          }));
          return { kind: "success", next: "authenticated" };
        } catch (error) {
          const failure = classifyAccountFailure(error);
          const identityDenied = isAuthoritativeIdentityProofDenial(error);
          if (identityDenied) {
            try {
              const lease = current.kind === "localOffline" ? current.profileLease : captureActiveProfileStorageLease();
              const profile = current.kind === "localOffline" ? current.profile : lease?.profile;
              if (profile) await revokeBindingForAuthoritativeIdentityDenial(error, {
                profile,
                uid: current.user.uid,
                ...(lease ? { lease } : {}),
                ...(current.kind === "localOffline" ? { verificationRevision: current.bindingRevision } : {}),
                canContinue: () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === current.user.uid,
              });
            } catch { /* Keep the denial blocking even if local persistence reports an error. */ }
            if (sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === current.user.uid) {
              setState(accountSessionFailureState(failure === "reauthenticationRequired" ? failure : "revokedSession", current.user));
            }
          } else if (current.kind === "localOffline" && sessionCoordinator.isCurrent(generation)
            && auth.getSnapshot()?.uid === current.user.uid && isActiveProfileStorageLeaseCurrent(current.profileLease)) {
            setState({ ...current, generation });
          }
          return { kind: "failure", failure };
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
      if (recoveryCoordinatorRef.current?.getSnapshot().blocksProfilePreparation !== false) {
        setState({ kind: "recoveryPending" });
        return { kind: "failure", failure: "conflict" };
      }
      if (!acceptanceConfirmed) return { kind: "failure", failure: "invalid" };
      if (!isValidEmail(email)) return { kind: "failure", failure: "invalidEmail" };
      if (!isValidPassword(password)) return { kind: "failure", failure: "weakPassword" };
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      legalAcceptancePendingRef.current = true;
      try {
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
      } finally {
        legalAcceptancePendingRef.current = false;
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
      if (recoveryCoordinatorRef.current?.getSnapshot().blocksProfilePreparation === false) recoverySessionIdentityRef.current = null;
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
      const recoveryTransition = await completeExplicitRecoveryAccountTransition(auth, api, user);
      if (recoveryTransition?.kind === "failure") return recoveryTransition;
      const result = await finalizeExplicitAuthentication(auth, api, user);
      if (result.kind === "failure" && result.failure === "accountNotFound") {
        return signOutRejectedIdentity(auth);
      }
      return result;
    }),
    signInWithApple: (locale, appleCredentialDependencies) => authClient && apiClient ? runProviderFirstUse(authClient, apiClient, locale, () => authClient.signInWithApple(appleCredentialDependencies)) : Promise.resolve({ kind: "failure", failure: "providerUnavailable" }),
    signInWithGoogle: (idToken, locale) => authClient && apiClient ? runProviderFirstUse(authClient, apiClient, locale, () => authClient.signInWithGoogle(idToken)) : Promise.resolve({ kind: "failure", failure: "providerUnavailable" }),
    registerProviderIdentity,
    cancelProviderRegistration,
    confirmAdoption: (resolutions, groupChoices) => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated" || !state.accountData.preview) return { kind: "failure", failure: "conflict" };
      const generation = sessionCoordinator.restart(current.uid);
      const next = await confirmAccountDataAdoption(api, state.backendUser.id, state.accountData.preview, resolutions, groupChoices);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      if (next.status === "synced" && await selectAccountProfileAndRestart(state.backendUser.id, () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === current.uid, { recoverBoundGuest: true })) return { kind: "success", next: "authenticated" };
      if (next.status === "synced") await reconcileMaterializedAccountReminders().catch(() => undefined);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      return next.status === "synced" ? { kind: "success", next: "authenticated" } : { kind: "failure", failure: next.lastFailureCode === "offline" ? "offline" : "conflict" };
    }),
    setGuestAdoptionChoice: (choice) => runWithAuth(async (auth) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated" || state.user.uid !== current.uid || state.accountData.status !== "previewReady") return { kind: "failure", failure: "conflict" };
      await saveGuestAdoptionChoice(choice);
      if (auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      setState({ ...state, accountData: { ...state.accountData, guestAdoptionChoice: choice } });
      return { kind: "success", next: "authenticated" };
    }),
    retryAccountSync: () => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated") return { kind: "failure", failure: "providerUnavailable" };
      const generation = sessionCoordinator.restart(current.uid);
      const next = await retryAccountDataSync(api, state.backendUser.id);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      if (next.status === "synced" && await selectAccountProfileAndRestart(state.backendUser.id, () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === current.uid, { recoverBoundGuest: true })) return { kind: "success", next: "authenticated" };
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
      if (next.status === "synced" && await selectAccountProfileAndRestart(state.backendUser.id, () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === current.uid, { recoverBoundGuest: true })) return { kind: "success", next: "authenticated" };
      if (next.status === "synced") await reconcileMaterializedAccountReminders().catch(() => undefined);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      setState({ kind: "authenticated", backendUser: state.backendUser, user: current, accountData: next });
      return next.status === "synced" ? { kind: "success", next: "authenticated" } : { kind: "failure", failure: next.lastFailureCode === "offline" ? "offline" : "remoteFailure" };
    }),
    signOut: () => runAuthMutationWithAuth(async (auth) => {
      const user = auth.getSnapshot();
      if (!user) return { kind: "failure", failure: "providerUnavailable" };
      const signOutProfile = getActiveStorageProfileOrNull();
      const signOutProfileLease = captureActiveProfileStorageLease();
      const stateAtSignOut = stateRef.current;
      const authenticatedAccountId = (stateAtSignOut.kind === "authenticated" || stateAtSignOut.kind === "localOffline" || stateAtSignOut.kind === "signingOut")
        && stateAtSignOut.user.uid === user.uid
        ? stateAtSignOut.kind === "authenticated" || stateAtSignOut.kind === "signingOut" ? stateAtSignOut.backendUser.id : stateAtSignOut.accountId
        : null;
      const sameSignOutProfile = (activeProfile: StorageProfile | null): boolean => !!signOutProfile
        && activeProfile?.id === signOutProfile.id
        && activeProfile.kind === signOutProfile.kind
        && activeProfile.accountId === signOutProfile.accountId;
      const clearSigningOutAccountCache = (operationId: string | undefined): boolean | "stale" => {
        if (!operationId || !signOutProfile) return false;
        if (!sameSignOutProfile(getActiveStorageProfileOrNull()) || !canContinue()) return "stale";
        let accountId = authenticatedAccountId;
        if (!accountId) {
          try {
            const scopedSignOut = getAccountSignOutState();
            if (!scopedSignOut || scopedSignOut.operationId !== operationId) return false;
            accountId = scopedSignOut.accountId;
          } catch { return false; }
        }
        if (signOutProfile.accountId !== null && signOutProfile.accountId !== accountId) return "stale";
        return clearPremiumCacheForAccountInProfile(accountId, signOutProfile) !== "unavailable";
      };
      const closeSignOutProfileStorage = () => {
        const activeProfile = getActiveStorageProfileOrNull();
        if (sameSignOutProfile(activeProfile)) closeActiveProfileStorage();
        else if (!signOutProfile && activeProfile === null) closeActiveProfileStorage();
      };
      revokeDeletionAuthorization();
      sessionCoordinator.invalidate();
      const generation = sessionCoordinator.begin(user.uid);
      const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
      const invalidateSignOutBinding = async () => {
        if (!authenticatedAccountId || !signOutProfileLease || !signOutProfile
          || signOutProfileLease.profile.id !== signOutProfile.id || signOutProfileLease.profile.kind !== signOutProfile.kind
          || signOutProfile.accountId !== authenticatedAccountId) return;
        await invalidateActiveAccountIdentityBinding({ lease: signOutProfileLease, canContinue });
      };
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
            if ((current.kind === "authenticated" || current.kind === "localOffline") && current.user.uid === user.uid) {
              const accountId = current.kind === "authenticated" ? current.backendUser.id : current.accountId;
              const scopedSignOut = getAccountSignOutState();
              if (scopedSignOut?.accountId === accountId) operationId = scopedSignOut.operationId;
              else operationId = beginAccountSignOut(accountId).operationId;
              durableOperation = true;
            } else {
              operationId = createSignOutOperationId();
            }
          }
        } catch {
          let operationId: string | undefined;
          let scopedOperationRecovered = false;
          const currentState = stateRef.current;
          if ((currentState.kind === "authenticated" || currentState.kind === "localOffline") && currentState.user.uid === user.uid) {
            try {
              const recovered = getAccountSignOutState();
              const accountId = currentState.kind === "authenticated" ? currentState.backendUser.id : currentState.accountId;
              if (recovered?.accountId === accountId) {
                operationId = recovered.operationId;
                scopedOperationRecovered = true;
              }
            } catch { /* A failed scoped read cannot authorize reuse of its marker. */ }
          }
          let controlWriteVerified = false;
          const recoveryOutcome = await finishLocalSignOutSetupFailure({
            uid: user.uid,
            getOperationId: () => operationId,
            isCurrent: canContinue,
            retainAuthOnFailedControlWrite: scopedOperationRecovered,
            persistFallbackControlPair: async () => {
              operationId ??= createSignOutOperationId();
              const snapshot = await logoutControl.blockAndQueueRevoke(user.uid, operationId);
              logoutControlSnapshotRef.current = snapshot;
              setLogoutControlSnapshot(snapshot);
              await invalidateSignOutBinding();
              controlWriteVerified = hasVerifiedLocalLogoutReceipt(snapshot, user.uid, operationId);
              return snapshot;
            },
            publishLockedState: () => {
              observerBlockedUidRef.current = user.uid;
              setState({ kind: "signOutPending", user, ...(operationId && (scopedOperationRecovered || controlWriteVerified) ? { operationId } : {}) });
            },
            clearOwnedPremiumCache: () => clearSigningOutAccountCache(operationId),
            closeProfileStorage: closeSignOutProfileStorage,
            signOutFirebase: () => auth.signOut(),
          });
          if (recoveryOutcome === "stale") return { kind: "failure", failure: "revokedSession" };
          if (recoveryOutcome === "signOutPending") return { kind: "failure", failure: "signOutPending" };
          return { kind: "failure", failure: "localCleanupFailure" };
        }
        const outcome = await performLocalAccountSignOut({
          uid: user.uid,
          operationId,
          retainAuthOnControlFailure: durableOperation,
          persistBlock: async () => {
            const snapshot = await logoutControl.blockAndQueueRevoke(user.uid, operationId!);
            logoutControlSnapshotRef.current = snapshot;
            setLogoutControlSnapshot(snapshot);
            await invalidateSignOutBinding();
            return snapshot;
          },
          publishLockedState: () => {
            observerBlockedUidRef.current = user.uid;
            setState({ kind: "signOutPending", user, ...(durableOperation ? { operationId } : {}) });
          },
          clearOwnedPremiumCache: () => clearSigningOutAccountCache(operationId),
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
        if (outcome === "localCleanupFailure") return { kind: "failure", failure: "localCleanupFailure" };
        if (outcome === "signOutPending") return { kind: "failure", failure: "signOutPending" };
        if (outcome === "stale") return { kind: "failure", failure: "revokedSession" };
        if (auth.getSnapshot() !== null) return { kind: "failure", failure: "revokedSession" };
        setAccountEntryMode("login");
        setState({ kind: "signedOut" });
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
    prepareDeletion: (credentials) => runSensitiveWithAuth(async (auth, api) => {
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
        prepareSession: () => ensureAccountSessionGeneration({
          api,
          auth,
          canContinue: canPrepare,
          onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
          user,
        }),
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
        if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
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
        const result = await deleteBoundAccount(api, state.backendUser.id, user.uid, async () => {
          if (!await invalidateAccountBindingForConfirmedDeletion({ accountId: state.backendUser.id, uid: user.uid, canContinue })) return false;
          return disableAccountRemindersForDeletion();
        });
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
        const result = await retryPendingAccountDeletion(api, accountId, user.uid, async () => {
          if (!await invalidateAccountBindingForConfirmedDeletion({ accountId, uid: user.uid, canContinue })) return false;
          return disableAccountRemindersForDeletion();
        });
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
      const coordinator = recoveryCoordinatorRef.current;
      if (!coordinator || !createRecoveryProofScopeRef.current) return { kind: "failure", failure: "providerUnavailable" };
      await coordinator.load();
      const proofScope = await createRecoveryProofScopeRef.current(auth, user, { generation, barrier: null });
      proofScope.bindRecoveryOperation(coordinator.getSnapshot());
      const isCurrent = () => {
        try { proofScope.assertCurrent(); return true; } catch { return false; }
      };
      proofScope.assertCurrent();
      const authorizationGeneration = await auth.getAuthorizationGeneration();
      proofScope.assertCurrent();
      if (!Number.isSafeInteger(authorizationGeneration) || authorizationGeneration === null || authorizationGeneration < 1 || !isCurrent()) return { kind: "failure", failure: "reauthenticationRequired" };
      recoveryCommandInFlightRef.current = true;
      setRecoveryOperation(recoveryIssuePublicationGateRef.current.hold());
      let result: Awaited<ReturnType<typeof runReauthenticatedMutation<FirebaseAuthCredentials, RecoveryOperationSnapshot>>> | null = null;
      let finalIdentityCurrent = false;
      try {
        result = await runReauthenticatedMutation({
          credentials,
          isCurrent,
          mutation: async () => {
            await ensureRecoveryIssueSignInSession({
              api,
              auth,
              user,
              canContinue: isCurrent,
              isExplicitSignInCurrent: isCurrent,
              onExchangeStarting: () => undefined,
              requiredAuthorizationGeneration: authorizationGeneration,
            });
            if (!isCurrent()) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
            const currentCoordinator = recoveryCoordinatorRef.current;
            if (!currentCoordinator) throw new Error("recovery_coordinator_unavailable");
            const snapshot = await currentCoordinator.startIssue({ firebaseUid: user.uid, authorizationGeneration });
            proofScope.acceptRecoveryOperation(snapshot, { kind: "issueStart", firebaseUid: user.uid, authorizationGeneration });
            return snapshot;
          },
          reauthenticate: auth.reauthenticateWithCredential,
        });
      } finally {
        try {
          if (result?.ok) proofScope.acceptRecoveryOperation(result.value);
          proofScope.assertCurrent();
          const identity = await readRecoveryIssueCommandIdentity({
            auth,
            firebaseUid: user.uid,
            authorizationGeneration,
            isRevisionCurrent: () => sessionCoordinator.isCurrent(generation),
          });
          proofScope.assertCurrent();
          const liveUser = auth.getSnapshot();
          finalIdentityCurrent = identity.current && liveUser?.uid === user.uid && sessionCoordinator.isCurrent(generation);
          if (!finalIdentityCurrent) {
            recoveryCoordinatorRef.current?.suspendPendingIdentity();
            sessionCoordinator.invalidate();
            if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
            setAccountEntryMode("login");
            setState(recoveryCoordinatorRef.current?.getSnapshot().blocksProfilePreparation
              ? { kind: "recoveryPending" }
              : liveUser ? { kind: "reauthenticationRequired", user: liveUser } : { kind: "signedOut" });
          }
        } finally {
          recoveryIssuePublicationGateRef.current.release();
          recoveryCommandInFlightRef.current = false;
          setRecoveryOperation(recoveryCoordinatorRef.current?.getSnapshot() ?? { kind: "unavailable", reason: "operation_unavailable", blocksProfilePreparation: true });
        }
      }
      if (!finalIdentityCurrent) return { kind: "failure", failure: "reauthenticationRequired" };
      if (!result) return { kind: "failure", failure: "reauthenticationRequired" };
      if (!result.ok) {
        await proofScope.restoreAfterNonDenial(result.error);
        const failure = classifyAccountFailure(result.error);
        return { kind: "failure", failure };
      }
      return finishRecoveryCommand(result.value, auth, api);
    }),
    revokeDeletionAuthorization,
    consumeRecoveryCode: (code) => runSensitiveWithAuth(async (auth, api) => {
      revokeDeletionAuthorization();
      if (!/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u.test(code.trim().toUpperCase())) return { kind: "failure", failure: "invalidRecoveryCode" };
      sessionCoordinator.invalidate();
      if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
      setState({ kind: "recoveryPending" });
      return executeRecoveryCommand(auth, api, (coordinator) => coordinator.startConsume(code));
    }),
    confirmRecoveryCodesSaved: () => runSensitiveWithAuth((auth, api) => executeRecoveryCommand(auth, api, (coordinator) => coordinator.confirmRecoveryCodesSaved())),
    retryRecoveryOperation: () => runSensitiveWithAuth((auth, api) => executeRecoveryCommand(auth, api, (coordinator) => coordinator.retryRecoveryOperation())),
    requestRecoveryCodeReplacement: () => runSensitiveWithAuth(async (auth) => {
      const coordinator = recoveryCoordinatorRef.current;
      if (!coordinator || recoveryCommandInFlightRef.current) return { kind: "failure", failure: "conflict" };
      await coordinator.load();
      const pending = coordinator.getSnapshot();
      if (pending.kind !== "issue" || pending.needsAccountResolution || (pending.status !== "delivery_unconfirmed" && !pending.replacementPending)) return { kind: "failure", failure: "conflict" };
      const current = auth.getSnapshot();
      let proofScope: RecoveryIdentityProofScope | null = null;
      if (current && current.uid === pending.firebaseUid) {
        if (!createRecoveryProofScopeRef.current) return { kind: "failure", failure: "conflict" };
        proofScope = await createRecoveryProofScopeRef.current(auth, current);
        proofScope.bindRecoveryOperation(pending);
        proofScope.assertCurrent();
        const generation = await auth.getAuthorizationGeneration();
        proofScope.assertCurrent();
        if (generation !== pending.authorizationGeneration) return { kind: "failure", failure: "reauthenticationRequired" };
      } else if (current) return { kind: "failure", failure: "reauthenticationRequired" };
      if ((auth.getSnapshot()?.uid ?? null) !== (current?.uid ?? null)) return { kind: "failure", failure: "conflict" };
      explicitRecoveryIssueSignInRef.current = { operationId: pending.operationId, firebaseUid: pending.firebaseUid, authorizationGeneration: pending.authorizationGeneration, action: "replace" };
      recoveryCommandInFlightRef.current = true;
      try {
        if (current) await auth.signOut();
        if (auth.getSnapshot()) {
          explicitRecoveryIssueSignInRef.current = null;
          if (proofScope) await proofScope.restoreAfterNonDenial(new Error("recovery_sign_out_incomplete"));
          return { kind: "failure", failure: "signOutPending" };
        }
      } catch (error) {
        explicitRecoveryIssueSignInRef.current = null;
        if (proofScope) await proofScope.restoreAfterNonDenial(error);
        return { kind: "failure", failure: classifyAccountFailure(error) };
      } finally { recoveryCommandInFlightRef.current = false; }
      sessionCoordinator.invalidate();
      revokeDeletionAuthorization();
      if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
      setAccountEntryMode("login");
      setState({ kind: "signedOut" });
      return { kind: "success", next: "signedOut" };
    }),
    resumePendingRecovery: () => runSensitiveWithAuth(async (auth, api) => {
      const coordinator = recoveryCoordinatorRef.current;
      if (!coordinator) return { kind: "failure", failure: "providerUnavailable" };
      await coordinator.load();
      const pending = coordinator.getSnapshot();
      if (pending.kind === "terminal" || pending.kind === "idle") {
        explicitRecoveryIssueSignInRef.current = null;
        if (pending.kind === "terminal" && pending.status !== "acknowledged") recoverySessionIdentityRef.current = null;
        const user = auth.getSnapshot();
        if (user) return finalizeExplicitAuthentication(auth, api, user);
        setAccountEntryMode("login");
        setState({ kind: "signedOut" });
        return { kind: "success", next: "signedOut" };
      }
      if (pending.kind === "issue") {
        explicitRecoveryIssueSignInRef.current = { operationId: pending.operationId, firebaseUid: pending.firebaseUid, authorizationGeneration: pending.authorizationGeneration, action: "resume" };
        const current = auth.getSnapshot();
        if (current && current.uid === pending.firebaseUid) {
          if (!await guardRecoveryBeforePreparation(auth)) return { kind: "failure", failure: "conflict" };
          const restoredUser = auth.getSnapshot();
          if (!restoredUser) return { kind: "failure", failure: "revokedSession" };
          return finalizeExplicitAuthentication(auth, api, restoredUser);
        }
        recoveryCommandInFlightRef.current = true;
        try {
          if (current) await auth.signOut();
          if (auth.getSnapshot()) return { kind: "failure", failure: "signOutPending" };
        } finally { recoveryCommandInFlightRef.current = false; }
        if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
        setAccountEntryMode("login");
        setState({ kind: "signedOut" });
        return { kind: "success", next: "signedOut" };
      }
      if (pending.kind === "consume") {
        const current = auth.getSnapshot();
        const generation = current ? await auth.getAuthorizationGeneration() : null;
        if (current && (current.uid !== pending.expectedFirebaseUid || generation !== pending.expectedAuthorizationGeneration)) {
          recoveryCommandInFlightRef.current = true;
          try {
            await auth.signOut();
            if (auth.getSnapshot()) return { kind: "failure", failure: "signOutPending" };
          } finally { recoveryCommandInFlightRef.current = false; }
        }
        sessionCoordinator.invalidate();
        if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
        setState({ kind: "recoveryPending" });
        return executeRecoveryCommand(auth, api, (operation) => operation.resumePendingRecovery());
      }
      return { kind: "failure", failure: "providerUnavailable" };
    }),
    continueWithCurrentAccount: () => runSensitiveWithAuth(async (auth) => {
      const coordinator = recoveryCoordinatorRef.current;
      if (!coordinator || recoveryCommandInFlightRef.current) return { kind: "failure", failure: "conflict" };
      await coordinator.load();
      const pending = coordinator.getSnapshot();
      const current = auth.getSnapshot();
      if (!current || pending.kind !== "issue") return { kind: "failure", failure: "conflict" };
      if (!createRecoveryProofScopeRef.current) return { kind: "failure", failure: "conflict" };
      const proofScope = await createRecoveryProofScopeRef.current(auth, current);
      proofScope.bindRecoveryOperation(pending);
      proofScope.assertCurrent();
      let authorizationGeneration: number | null = null;
      try { authorizationGeneration = await auth.getAuthorizationGeneration(); }
      catch (error) { proofScope.assertCurrent(); if (isAuthoritativeIdentityProofDenial(error)) throw error; }
      proofScope.assertCurrent();
      if (auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "conflict" };
      const checked = await coordinator.reconcilePending({ firebaseUid: current.uid, authorizationGeneration });
      proofScope.assertCurrent();
      proofScope.acceptRecoveryOperation(checked);
      if (checked.kind !== "issue" || !["different_uid", "different_generation"].includes(checked.accountResolution ?? "")) {
        await proofScope.restoreAfterNonDenial(new Error("recovery_identity_transition_not_required"));
        return { kind: "failure", failure: "conflict" };
      }
      explicitRecoveryAccountTransitionRef.current = Object.freeze({ operationId: checked.operationId, firebaseUid: checked.firebaseUid, authorizationGeneration: checked.authorizationGeneration });
      recoveryCommandInFlightRef.current = true;
      sessionCoordinator.invalidate();
      revokeDeletionAuthorization();
      if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
      try {
        await auth.signOut();
        if (auth.getSnapshot()) {
          explicitRecoveryAccountTransitionRef.current = null;
          return { kind: "failure", failure: "signOutPending" };
        }
      } catch (error) {
        explicitRecoveryAccountTransitionRef.current = null;
        return { kind: "failure", failure: classifyAccountFailure(error) };
      } finally { recoveryCommandInFlightRef.current = false; }
      coordinator.suspendPendingIdentity();
      setAccountEntryMode("login");
      setState({ kind: "signedOut" });
      return { kind: "success", next: "signedOut" };
    }),
    discardGuestData: () => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      if (!current || state.kind !== "authenticated") return { kind: "failure", failure: "providerUnavailable" };
      const generation = sessionCoordinator.restart(current.uid);
      const next = await discardGuestDataAndLoadAccount(api, state.backendUser.id);
      if (!sessionCoordinator.isCurrent(generation) || auth.getSnapshot()?.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      if (next.status === "synced") {
        if (await selectAccountProfileAndRestart(state.backendUser.id, () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === current.uid, { recoverBoundGuest: true })) return { kind: "success", next: "authenticated" };
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
    captureCurrentAuthenticatedActorFence,
    captureHomeResumeActorFence,
    completeProfilePreparation,
    state,
  }), [completeExplicitRecoveryAccountTransition, executeRecoveryCommand, finishRecoveryCommand, guardRecoveryBeforePreparation, recoveryOperation, accountEntryMode, apiClient, authClient, authorizePremiumSessionStart, readCurrentPremiumAccess, captureCurrentAuthenticatedActorFence, captureHomeResumeActorFence, inspectQ13ActorFence, installPremiumNodePackage, retryLearningPlanRecoveryForAccount, completeProfilePreparation, finalizeCurrent, finalizeExplicitAuthentication, guestTransitionFailure, holdAccountIdentityRefresh, logoutControlSnapshot, refreshAccountIdentityFailure, refreshPremiumEntitlement, registerAuthenticatedIdentity, registerProviderIdentity, cancelProviderRegistration, retrySessionRestore, revokeDeletionAuthorization, runAuthMutationWithAuth, runProviderFirstUse, runRefreshWithAuth, runSensitiveWithAuth, runWithAuth, runtimeMode, sensitiveCommandLane, sessionCoordinator, signOutRejectedIdentity, state]);

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

export function isProviderAuthenticationCancelled(error: unknown): boolean {
  const code = firebaseAuthErrorCode(error);
  return ["ERR_REQUEST_CANCELED", "auth/cancelled-popup-request", "auth/popup-closed-by-user", "auth/user-cancelled"].includes(code);
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
