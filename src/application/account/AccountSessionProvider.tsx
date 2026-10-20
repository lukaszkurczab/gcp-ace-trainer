import { createSessionRevocationOperationId } from "../../infrastructure/identity/sessionRevocationOperationId";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { PatternlyApiClientError, createPatternlyApiClient, type AccountDataExportDto, type AccountRegistrationInputDto, type LegalRequestDto, type LegalRequestKindDto, type MeResponseDto, type PrivacyRequestListItemDto, type PrivacyRequestResponseDto, type PrivacyRequestRightDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { isPremiumAccessConfirmedOnline } from "../../domain/entitlements";
import { premiumIdentityForAccount } from "./premiumEntitlementIdentity";
import type { TrackId } from "../../domain";
import { clearPremiumCache, clearPremiumCacheForAccountInProfile, clearPremiumCacheUnlessBoundTo, hasOfflinePremiumAccess, readCachedPremiumAccess, readCachedPremiumSnapshot, replacePremiumCacheFromFreshResponse } from "../../storage/repositories/premiumEntitlementCacheRepository";
import type { PremiumPurchaseActor } from "./premiumPurchaseCoordinator";
import { prepareRevenueCatAccountDeletion } from "../../infrastructure/purchases";
import { createPremiumRefreshQueue } from "./premiumRefreshQueue";
import { resolvePremiumSessionAdmission } from "./premiumSessionAdmission";
import { markStartup } from "../../infrastructure/diagnostics/startupTrace";
import { ensureAccountSessionGeneration, ensureRecoveryIssueSignInSession, getMeWithExchangedSession, prepareRecoveryIssueSession } from "./accountSessionExchange";
import { createRecoveryOperationCoordinator, isRecoveryIdentityUnavailable, type RecoveryOperationSnapshot } from "./recoveryOperationCoordinator";
import { createRecoveryIssuePublicationGate, readRecoveryIssueCommandIdentity } from "./recoveryIssueCommandGuard";
import { createSecureRecoveryOperationVault, type RecoveryOperationVault } from "../../infrastructure/security/recoveryOperationVault";
import { SessionRevocationExpiredError, createPendingSessionRevocationDrain } from "./pendingSessionRevocation";
import { composePatternlyNativeAppCheck, configurePatternlyAppCheckTokenProvider, getPatternlyAppCheckToken } from "../../infrastructure/clients/patternlyAppCheckToken";
import { readLocalSmokeAppCheckToken } from "../../infrastructure/clients/localSmokeAppCheck";
import { createContentReportTransport, registerContentReportRuntimeTransport, type ContentReportRuntimeRegistration } from "../contentReports";
import { createFirebaseAuthClient, firebaseAuthErrorCode, FirebaseAuthClientError, type AppleCredentialDependencies, type FirebaseAuthClient, type FirebaseAuthCredentials, type FirebaseAuthUserSnapshot } from "../../infrastructure/firebase/firebaseAuthClient";
import { readDevelopmentFirebaseAuthEmulatorOrigin, readFirebaseClientConfiguration, readPublicEnvironmentFromRuntime } from "../../infrastructure/firebase/publicConfig";
import { clearAccountIdentityDenialAfterProof, confirmAccountDataAdoption, deleteBoundAccount, dismissAccountLearningPlanRecovery, discardGuestDataAndLoadAccount, inspectAccountSyncConflict, loadAccountDataSession, resetAccountLocalLearningHistory, resolveAccountSyncConflict, resumeSelectedAccountDeletionWithoutAuth, retryAccountDataSync, retryLearningPlanRecovery, retryPendingAccountDataSync, retryPendingAccountDeletion, saveGuestAdoptionChoice, type AccountDataSession, type AccountSyncConflictPreview } from "./accountDataService";
import { commitLearningStateReset } from "../learningMutations";
import { activatePreparedProfile, beginAccountIdentityProofBarrier, captureActiveProfileStorageLease, capturePreparedProfileStorageLease, closeActiveProfileStorage, getActiveStorageProfile, getActiveStorageProfileOrNull, inspectPreparedProfileState, invalidateActiveAccountIdentityBinding, invalidatePreparedAccountIdentityBinding, isActiveProfileStorageLeaseCurrent, isPreparedProfileStorageLeaseCurrent, prepareProfileStorage, readActiveAccountIdentityBinding, readPreparedAccountIdentityBinding, resolveAccountIdentityProofBarrier, selectAccountProfileAndRestart, selectPreparedGuestProfile, validatePreparedGuestAccess, writeActiveAccountIdentityBinding, type AccountIdentityBinding, type AccountIdentityBindingRead, type AccountIdentityProofBarrier, type ActiveProfileStorageLease, type PreparedProfileStorageLease } from "../../storage/repositories/profileStorageRepository";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";
import { useProfileStoragePreparation } from "./profileStoragePreparationContext";
import { AccountSessionGenerationStaleError, findMatchingLocalLogoutBlock, findPendingSessionRevocation, finishLocalSignOutSetupFailure, hasVerifiedLocalLogoutReceipt, isPreparedGuestChoiceRequired, lockAndCloseProfileAfterAuthLoss, performLocalAccountSignOut, prepareGuestProfileScope, providerCancellationAuthObserverDecision, recoverAfterGuestPreparationFailure, shouldRejectPersistedAuthRestore, shouldShowGuestSelectionLoading } from "./profileStartupCoordination";
import { beginAccountSignOut, getAccountSignOutState } from "../../storage/repositories/accountLifecycleRepository";
import { markGuestInstallationAdoptionPending } from "../../storage/repositories/guestInstallationRepository";
import type { LocalLogoutControlSnapshot } from "../../infrastructure/storage/localLogoutControl";
import { createProviderFirstUseCoordinator } from "./providerFirstUseCoordinator";
export { completeUnrecognizedPersistedAuthSignOut } from "../bootstrap/accountBootstrap";
import { admitAccountBootstrap, completeAccountBootstrap, createAccountBootstrapCoordinator, prepareAuthenticatedAccountBootstrap, type ProfilePreparationAttempt } from "../bootstrap/accountBootstrap";
import { accountFinalizationPolicies, executeAccountFinalization, resolveAccountFinalizationBarrier, type AccountFinalizationOptions } from "./accountFinalization";
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
      || lease.profile.kind !== "account") return false;
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
  if (!input.canContinue() || input.profile.kind !== "account" || !input.profile.accountId) return;
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

/** Local attestation unavailability cannot invalidate a previously verified local account. */
export function isLocalAccountStartupUnavailable(error: unknown): boolean {
  return classifyAccountFailure(error) === "offline"
    || (error instanceof PatternlyApiClientError && ["app_check_unavailable", "request_timeout"].includes(error.code) && error.status === undefined);
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

export type VerifiedAccountIdentityFence = Readonly<{
  accountId: string;
  firebaseUid: string;
  profileId: string;
  profileKind: "account";
  leaseGeneration: number;
  verificationRevision: number;
  checksum: string;
}>;

export type AccountIdentityProofInFlight = Readonly<{ uid: string; accountId: string; generation: AccountSessionGenerationToken }>;

export function isAccountIdentityProofInFlightForActor(
  pending: AccountIdentityProofInFlight | null,
  uid: string,
  accountId: string,
): boolean {
  return pending !== null && pending.uid === uid && pending.accountId === accountId;
}

export function shouldClearAccountIdentityProofLatch(
  pending: AccountIdentityProofInFlight | null,
  flight: AccountIdentityProofInFlight,
  durableBindingRevalidated: boolean,
  currentActor: Readonly<{ uid: string | null; accountId: string | null; generation: AccountSessionGenerationToken | null; isCurrent: boolean }>,
): boolean {
  return durableBindingRevalidated && currentActor.isCurrent && pending === flight
    && currentActor.uid === flight.uid && currentActor.accountId === flight.accountId
    && currentActor.generation?.generation === flight.generation.generation;
}

export function readVerifiedAccountIdentityFence(
  binding: AccountIdentityBindingRead,
  lease: ActiveProfileStorageLease,
  accountId: string,
  firebaseUid: string,
): VerifiedAccountIdentityFence | null {
  if (binding.kind !== "verified" || lease.profile.kind !== "account" || lease.profile.accountId !== accountId) return null;
  const value = binding.binding;
  if (value.schema !== "patternly.account-binding.v1" || value.profileId !== lease.profile.id || value.profileKind !== lease.profile.kind
    || value.accountId !== accountId || value.firebaseUid !== firebaseUid || value.verified !== true
    || !Number.isSafeInteger(value.verificationRevision) || value.verificationRevision < 1
    || typeof value.checksum !== "string" || value.checksum.length === 0) return null;
  return Object.freeze({
    accountId: value.accountId,
    firebaseUid: value.firebaseUid,
    profileId: value.profileId,
    profileKind: value.profileKind,
    leaseGeneration: lease.generation,
    verificationRevision: value.verificationRevision,
    checksum: value.checksum,
  });
}

export function sameVerifiedAccountIdentityFence(
  left: VerifiedAccountIdentityFence | null,
  right: VerifiedAccountIdentityFence | null,
): boolean {
  return left !== null && right !== null
    && left.accountId === right.accountId && left.firebaseUid === right.firebaseUid
    && left.profileId === right.profileId && left.profileKind === right.profileKind
    && left.leaseGeneration === right.leaseGeneration
    && left.verificationRevision === right.verificationRevision && left.checksum === right.checksum;
}

export function accountIdentityProofMatchesSubject(
  response: MeResponseDto,
  accountId: string,
  firebaseUid: string,
): boolean {
  return response.user.id === accountId && response.user.identity.subject === firebaseUid;
}

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
import { grantGuestAccess, revokeGuestAccess } from "../../storage/repositories/guestAccessRepository";
import { hasUnboundGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { createDeletionAuthorizationVault, createSensitiveCommandLane, isLiveDeletionAuthorization, prepareDeletionAuthorization, runReauthenticatedMutation, type DeletionAuthorizationVault, type SensitiveCommandLane } from "./accountCommandGuards";
import { shareAccountDataExport as shareDownloadedAccountData } from "./accountDataExportService";
import { installPremiumNodeOffer } from "../../content/application/nodePackageInstaller";
import { legalVariables } from "../../legal/legalVariables";
import { createAccountStartupDiagnosticWriter, type AccountStartupDiagnosticWriter } from "../operationalDiagnostics";
import { createProfilePreparationHandoffOwner, type ProfilePreparationHandoffToken } from "./profilePreparationHandoff";

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
  | Readonly<{ kind: "deletionPending"; user: FirebaseAuthUserSnapshot | null; accountId: string; status: "remoteDeletionPending" | "localCleanupPending"; failure: AccountFailure }>
  | Readonly<{ kind: "signingOut"; backendUser: MeResponseDto["user"]; user: FirebaseAuthUserSnapshot; accountData: AccountDataSession }>
  | Readonly<{ kind: "signOutPending"; user: FirebaseAuthUserSnapshot; operationId?: string; provisional?: true; remoteRevokeExpired?: true }>
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
  capturePremiumPurchaseActor: () => PremiumPurchaseActor | null;
  refreshPremiumEntitlement: (accountId: string) => Promise<"verified" | "denied" | "pending">;
  retryLearningPlanRecovery: (accountId: string) => Promise<void>;
  authorizePremiumSessionStart: () => Promise<"allowed" | "denied" | "unavailable">;
  readCurrentPremiumAccess: () => "allowed" | "denied" | "unavailable";
  installPremiumNodePackage: (offerId: string, appVersion: string) => Promise<void>;
  requestPasswordRecovery: (email: string) => Promise<AccountCommandResult>;
  requestEmailChange: (credentials: FirebaseAuthCredentials, email: string) => Promise<AccountCommandResult>;
  retrySessionRestore: () => void;
  completeProfilePreparation: (token: ProfilePreparationHandoffToken) => Promise<void>;
  profilePreparationHandoffToken: ProfilePreparationHandoffToken | null;
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
  inspectAccountSyncConflict: () => Promise<Readonly<{ kind: "success"; preview: AccountSyncConflictPreview } | { kind: "failure"; failure: AccountFailure }>>;
  resolveAccountSyncConflict: (input: Readonly<{ conflictId: string; resolution: "rebase" | "keep_local" | "keep_account"; trackId?: TrackId }>) => Promise<AccountCommandResult>;
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
  restartExpiredSessionRevocation: () => Promise<AccountCommandResult>;
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

function createRecoveryOperationId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  try {
    const crypto = require("expo-crypto") as typeof import("expo-crypto");
    return crypto.randomUUID();
  } catch {
    throw new Error("secure_operation_id_unavailable");
  }
}

export function pendingRevokeFailureState(user: FirebaseAuthUserSnapshot, error: unknown, snapshot: LocalLogoutControlSnapshot): Extract<AccountState, { kind: "signOutPending" }> {
  const expired = error instanceof SessionRevocationExpiredError && error.pending.uid === user.uid
    && snapshot.pending.some((entry) => entry.uid === user.uid && entry.operationId === error.pending.operationId) ? error.pending : null;
  const pending = expired ?? findPendingSessionRevocation(snapshot, user.uid);
  return { kind: "signOutPending", user, ...(pending ? { operationId: pending.operationId } : {}), ...(expired ? { remoteRevokeExpired: true as const } : {}) };
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
  const detachAuthObserverRef = useRef<(() => void) | null>(null);
  const guestCommandLockRef = useRef(createGuestTransitionLock());
  const [apiClient, setApiClient] = useState<ReturnType<typeof createPatternlyApiClient> | null>(null);
  const [recoveryOperation, setRecoveryOperation] = useState<RecoveryOperationSnapshot>({ kind: "loading", blocksProfilePreparation: true });
  const recoveryOperationRef = useRef(recoveryOperation);
  recoveryOperationRef.current = recoveryOperation;
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
  const accountBootstrapDiagnosticRef = useRef<Readonly<{ uid: string; generation: number; diagnostic: AccountStartupDiagnosticWriter }> | null>(null);
  const accountBootstrapRef = useRef<ReturnType<typeof createAccountBootstrapCoordinator<ProfilePreparationAttempt | null>> | null>(null);
  if (!accountBootstrapRef.current) accountBootstrapRef.current = createAccountBootstrapCoordinator<ProfilePreparationAttempt | null>();
  const profilePreparationHandoffRef = useRef<ReturnType<typeof createProfilePreparationHandoffOwner<void>> | null>(null);
  if (!profilePreparationHandoffRef.current) profilePreparationHandoffRef.current = createProfilePreparationHandoffOwner<void>();
  const observerBlockedUidRef = useRef<string | null>(null);
  const accountIdentityProofInFlightRef = useRef<AccountIdentityProofInFlight | null>(null);
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

  const guardRecoveryBeforePreparation = useCallback(async (
    auth: FirebaseAuthClient | null,
    proofOwner?: RecoveryProofOwner,
    onTerminalState?: (kind: AccountState["kind"]) => void,
  ): Promise<boolean> => {
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
        onTerminalState?.("revokedSession");
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
                onTerminalState?.("revokedSession");
                return false;
              }
              proofScopeRef.current?.assertCurrent();
            } catch (error) {
              proofScopeRef.current?.assertCurrent();
              if (auth.getSnapshot()?.uid !== user.uid) return false;
              if (await revokeDeniedIdentity(error, user)) return false;
              setState({ kind: "backendUnavailable", user });
              onTerminalState?.("backendUnavailable");
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
      setRecoveryOperation({ kind: "unavailable", reason: isRecoveryIdentityUnavailable(error) ? "identity_unavailable" : "operation_unavailable", blocksProfilePreparation: true });
    }
    setAccountEntryMode("login");
    setState({ kind: "recoveryPending" });
    onTerminalState?.("recoveryPending");
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
    if (!profile || profile.kind !== "account" || !profile.accountId?.trim()) return null;
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

  const finalizeCurrent = useCallback(async (
    auth: FirebaseAuthClient,
    api: ReturnType<typeof createPatternlyApiClient>,
    user: FirebaseAuthUserSnapshot | null = auth.getSnapshot(),
    options: AccountFinalizationOptions<AccountSessionGenerationToken, AccountIdentityProofBarrierContext> = Object.freeze({
      generation: Object.freeze({ kind: "begin" }), profile: "select-account", guestAdoption: "discard", identityProof: Object.freeze({ kind: "capture" }),
    }),
  ): Promise<AccountCommandResult> => {
    if (!user || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
    const token = options.generation.kind === "captured" ? options.generation.token
      : options.generation.kind === "restart" ? sessionCoordinator.restart(user.uid) : sessionCoordinator.begin(user.uid);
    if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
    let proofBarrier: AccountIdentityProofBarrierContext | null;
    try {
      proofBarrier = await resolveAccountFinalizationBarrier(options, () => beginIdentityProofBarrier(auth, user, token));
      if (!sessionCoordinator.isCurrent(token) || auth.getSnapshot()?.uid !== user.uid) return { kind: "failure", failure: "revokedSession" };
    } catch (error) {
      return { kind: "failure", failure: classifyAccountFailure(error) };
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
          return await executeAccountFinalization<
            AccountSessionGenerationToken,
            AccountIdentityProofBarrierContext,
            MeResponseDto,
            Readonly<{ accountId: string; pendingDeletion: AccountDataSession | null }>,
            AccountDataSession,
            Readonly<{ result: AccountCommandResult; state?: AccountState }>
          >({
            options,
            barrier: proofBarrier ?? null,
            canContinue: () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid,
            staleResult: () => ({ result: { kind: "failure", failure: "revokedSession" } as const }),
            proveIdentity: async (barrier) => {
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
                barrier,
                barrierAlreadyCaptured: true,
                beginBarrier: () => beginIdentityProofBarrier(auth, user, token),
                resolveBarrier: (captured) => resolveIdentityProofBarrier(captured, auth, user, token),
                matchesProofSubject: (response, captured) => response.user.id === captured.previousBinding.accountId
                  && response.user.identity.subject === user.uid && captured.previousBinding.firebaseUid === user.uid,
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
              return identityProof.kind === "failed"
                ? { kind: "return" as const, outcome: { result: { kind: "failure" as const, failure: identityProof.failure }, state: identityProof.state } }
                : { kind: "continue" as const, value: identityProof.value };
            },
            selectAccountProfile: async (response) => await selectAccountProfileAndRestart(response.user.id,
              () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid,
              { recoverBoundGuest: true })
              ? { kind: "return" as const, outcome: { result: { kind: "failure" as const, failure: "providerUnavailable" as const } } }
              : { kind: "continue" as const, value: undefined },
            verifyAccountIdentity: async (response) => {
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
                && boundProfile?.kind === "account" && boundProfile.accountId === response.user.id) {
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
                    if (!cleared) return { kind: "return", outcome: { result: { kind: "failure", failure: "revokedSession" }, state: { kind: "revokedSession", user } } };
                  } catch {
                    // A failed durable binding or denial-marker update cannot admit sync/offline data under this identity.
                    return { kind: "return", outcome: { result: { kind: "failure", failure: "backendUnavailable" }, state: { kind: "backendUnavailable", user } } };
                  }
                }
              }
              return { kind: "continue", value: { accountId: response.user.id, pendingDeletion } };
            },
            loadAccountData: async (verified, guestAdoption) => ({
              kind: "continue" as const,
              value: verified.pendingDeletion ?? await loadAccountDataSession(api, verified.accountId, {
                guestAdoption,
                canContinue: () => sessionCoordinator.isCurrent(token) && auth.getSnapshot()?.uid === token.uid,
              }),
            }),
            shouldReconcileReminders: (accountData) => accountData.status === "synced",
            reconcileReminders: reconcileMaterializedAccountReminders,
            finish: (response, _verified, accountData) => {
              revokeGuestAccess();
              return {
                result: { kind: "success", next: "authenticated" },
                state: { kind: "authenticated", backendUser: response.user, user, accountData },
              };
            },
          });
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

  const startAuthenticatedProfilePreparation = useCallback((
    auth: FirebaseAuthClient,
    api: ReturnType<typeof createPatternlyApiClient>,
    user: FirebaseAuthUserSnapshot,
    generation: AccountSessionGenerationToken,
    startupDiagnostic?: AccountStartupDiagnosticWriter,
  ) => prepareAuthenticatedAccountBootstrap({
    profilePreparationRef, preparedProfileState, sessionCoordinator, profilePreparationHandoffRef,
    observerBlockedUidRef, setAccountEntryMode, setState, stateRef,
    beginIdentityProofBarrier, resolveIdentityProofBarrier, guardRecoveryBeforePreparation, logoutControlSnapshotRef,
    logoutControl, setLogoutControlSnapshot, recoverySessionIdentityRef, sessionExchangeUidRef,
    recoveryOperation: { get blocksProfilePreparation() { return recoveryOperationRef.current.blocksProfilePreparation; } },
    legalAcceptancePendingRef, runAccountIdentityProof, isAuthoritativeIdentityProofDenial,
    isLocalAccountStartupUnavailable, classifyAccountFailure, accountSessionFailureState, revokeBindingForAuthoritativeIdentityDenial,
  }, auth, api, user, generation, startupDiagnostic),
  [beginIdentityProofBarrier, resolveIdentityProofBarrier, guardRecoveryBeforePreparation, logoutControl, preparedProfileState.selectedProfile, sessionCoordinator]);

  const admitAuthenticatedBootstrap = useCallback((
    auth: FirebaseAuthClient,
    api: ReturnType<typeof createPatternlyApiClient>,
    user: FirebaseAuthUserSnapshot,
    generation: AccountSessionGenerationToken,
    startupDiagnostic?: AccountStartupDiagnosticWriter,
    isCurrent?: () => boolean,
  ) => admitAccountBootstrap({
    accountBootstrapRef, accountBootstrapDiagnosticRef, profilePreparationRef, sessionCoordinator,
    logoutControl, pendingSessionRevocationDrainRef, logoutControlSnapshotRef, setLogoutControlSnapshot,
    sessionExchangeUidRef, startAuthenticatedProfilePreparation,
  }, auth, api, user, generation, startupDiagnostic, isCurrent),
  [logoutControl, sessionCoordinator, startAuthenticatedProfilePreparation]);

  const completeProfilePreparation = useCallback((token: ProfilePreparationHandoffToken): Promise<void> => completeAccountBootstrap({
    profilePreparationHandoffRef, profilePreparationRef, stateRef, authClient,
    apiClient, sessionCoordinator, recoveryOperation, logoutControlSnapshotRef,
    setState, finalizeCurrent, planPasswordVerificationCommand, disableAccountRemindersForDeletion,
    classifyAccountFailure, runtimeMode, sessionExchangeUidRef, accountSessionFailureState,
  }, token),
  [apiClient, authClient, finalizeCurrent, recoveryOperation.blocksProfilePreparation, runtimeMode, sessionCoordinator]);

  const retrySessionRestore = useCallback(() => {
    detachAuthObserverRef.current?.();
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
    let startupDiagnostic = createAccountStartupDiagnosticWriter();
    startupDiagnostic.pending("auth_client_setup", stateRef.current.kind);
    const detachObserver = () => {
      if (observerDetached) return;
      observerDetached = true;
      providerCancellationUidRef.current = null;
      if (initializationTimeout !== undefined) clearTimeout(initializationTimeout);
      unsubscribe?.();
      unsubscribe = undefined;
      if (detachAuthObserverRef.current === detachObserver) detachAuthObserverRef.current = null;
    };
    detachAuthObserverRef.current = detachObserver;
    const publish = (nextState: AccountState) => {
      if (live && !observerDetached) setState(nextState);
    };
    const smokeRuntime = runtimeMode === "smoke";
    const entryModeForPreparedProfile = preparedProfileState.isFreshInstallation ? "welcome" : "login";
    const publishEntryState = (nextState: AccountState) => {
      setAccountEntryMode(entryModeForPreparedProfile);
      publish(nextState);
    };
    const prepareSelectedGuest = async (diagnostic: AccountStartupDiagnosticWriter = startupDiagnostic): Promise<void> => {
      let diagnosticStage: "recovery_guard" | "guest_storage_prepare" | "guest_state_inspect" | "guest_scope_prepare" = "recovery_guard";
      diagnostic.pending(diagnosticStage, stateRef.current.kind);
      let recoveryGuardTerminalState: AccountState["kind"] | undefined;
      if (!await guardRecoveryBeforePreparation(auth, undefined, (kind) => { recoveryGuardTerminalState = kind; })) {
        if (recoveryGuardTerminalState) diagnostic.failed("recovery_guard", new Error("guest_recovery_guard_blocked"), recoveryGuardTerminalState);
        return;
      }
      try {
        diagnosticStage = "guest_storage_prepare";
        diagnostic.pending(diagnosticStage, stateRef.current.kind);
        await prepareProfileStorage();
        diagnosticStage = "guest_state_inspect";
        diagnostic.pending(diagnosticStage, stateRef.current.kind);
        const prepared = await inspectPreparedProfileState();
        const selected = prepared.selectedProfile;
        if (prepared.isFreshInstallation || selected.kind !== "guest") {
          publishEntryState({ kind: "signedOut" });
          diagnostic.ready("signedOut");
          return;
        }
        if (!live || observerDetached || auth?.getSnapshot()) return;
        diagnosticStage = "guest_scope_prepare";
        diagnostic.pending(diagnosticStage, stateRef.current.kind);
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
          diagnostic.ready("signedOut");
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
          guestAdoption: false,
          startupDiagnostic: diagnostic,
          handoffToken: profilePreparationHandoffRef.current!.begin(),
          handoffReady: false,
        };
        profilePreparationRef.current = attempt;
        setAccountEntryMode("login");
        attempt.handoffReady = true;
        publish({ kind: "profilePreparing", profile: guest.profile });
        diagnostic.pending("profile_preparing", "profilePreparing");
      } catch (error) {
        if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
        if (live && !observerDetached) publishEntryState({ kind: "guestAccessBlocked" });
        diagnostic.failed(diagnosticStage, error, "guestAccessBlocked");
      }
    };
    const publicEnvironment = readPublicEnvironmentFromRuntime();
    if (!smokeRuntime && publicEnvironment.kind !== "configured") {
      if (preparedProfileState.selectedProfile.kind === "guest") void prepareSelectedGuest();
      else { publishEntryState({ kind: "unavailable", reason: publicEnvironment.reason === "invalid_public_environment" ? "public_environment_invalid" : "public_environment_unconfigured" }); startupDiagnostic.failed("auth_client_setup", new Error("public_environment_unconfigured"), "unavailable"); }
      return () => { live = false; observerBlockedUidRef.current = null; revokeDeletionAuthorization(); sessionCoordinator.dispose(); };
    }
      const firebaseConfiguration = readFirebaseClientConfiguration();
    if (firebaseConfiguration.kind !== "configured") {
      if (preparedProfileState.selectedProfile.kind === "guest") void prepareSelectedGuest();
      else { publishEntryState({ kind: "unavailable", reason: "firebase_unconfigured" }); startupDiagnostic.failed("auth_client_setup", new Error("firebase_unconfigured"), "unavailable"); }
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
        if (preparedProfileState.selectedProfile.kind === "guest") void prepareSelectedGuest();
        else { publishEntryState({ kind: "unavailable", reason: "public_environment_unconfigured" }); startupDiagnostic.failed("auth_client_setup", new Error("public_environment_unconfigured"), "unavailable"); }
        return () => { live = false; observerBlockedUidRef.current = null; revokeDeletionAuthorization(); sessionCoordinator.dispose(); };
      }
      startupDiagnostic.pending("auth_client_setup", stateRef.current.kind);
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
        newOperationId: createRecoveryOperationId,
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
        // The deadline exposes recovery UI; a genuine late SDK restore still belongs
        // to this live effect. Retry/cleanup detach it, and normal identity fences remain.
        setState({ kind: "unavailable", reason: "auth_restore_timeout" });
        startupDiagnostic.failed("auth_observer_wait", new Error("auth_restore_timeout"), "unavailable");
      }, AUTH_INITIALIZATION_TIMEOUT_MS);
      startupDiagnostic.pending("auth_observer_wait", stateRef.current.kind);
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
        const eventDiagnostic = createAccountStartupDiagnosticWriter();
        startupDiagnostic = eventDiagnostic;
        eventDiagnostic.pending("auth_event", stateRef.current.kind);
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
        eventDiagnostic.pending("recovery_guard", stateRef.current.kind);
        let recoveryGuardTerminalState: AccountState["kind"] | undefined;
        if (!await guardRecoveryBeforePreparation(configuredAuth, undefined, (kind) => { recoveryGuardTerminalState = kind; })) {
          if (recoveryGuardTerminalState) eventDiagnostic.failed("recovery_guard", new Error("auth_recovery_guard_blocked"), recoveryGuardTerminalState);
          else eventDiagnostic.pending("recovery_guard", stateRef.current.kind);
          return;
        }
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
          const canResumeDeletion = () => live && !observerDetached && eventRevision === authObserverRevision && configuredAuth.getSnapshot() === null;
          const deletionRecovery = await resumeSelectedAccountDeletionWithoutAuth(client, disableAccountRemindersForDeletion, prepareRevenueCatAccountDeletion, canResumeDeletion);
          if (!canResumeDeletion()) return;
          if (deletionRecovery) {
            publish(deletionRecovery.result.ok ? { kind: "signedOut" } : { kind: "deletionPending", user: null, accountId: deletionRecovery.accountId,
              status: deletionRecovery.result.failure === "localCleanupFailure" ? "localCleanupPending" : "remoteDeletionPending", failure: deletionRecovery.result.failure });
            eventDiagnostic.ready(deletionRecovery.result.ok ? "signedOut" : "deletionPending");
            return;
          }
          if (rejectedRestoreUid !== null && previousObservedUid === rejectedRestoreUid) {
            rejectedRestoreUid = null;
            publish({ kind: "signedOut" });
            eventDiagnostic.ready("signedOut");
            return;
          }
          if (authObserverDecision.action === "return_to_sign_in") {
            publish({ kind: "signedOut" });
            eventDiagnostic.ready("signedOut");
            return;
          }
          void prepareSelectedGuest(eventDiagnostic);
          return;
        }
        if (rejectedRestoreUid !== null && rejectedRestoreUid !== user.uid) rejectedRestoreUid = null;
        if (legalAcceptancePendingRef.current || observerBlockedUidRef.current === user.uid || sessionExchangeUidRef.current === user.uid) {
          eventDiagnostic.ready(stateRef.current.kind);
          return;
        }
        const pendingRevocations = logoutControlSnapshotRef.current.pending.filter((entry) => entry.uid === user.uid);
        if (pendingRevocations.length > 0) {
          eventDiagnostic.pending("recovery_guard", stateRef.current.kind);
          observedUid = user.uid;
          const generation = sessionCoordinator.begin(user.uid);
          const canContinue = () => live && !observerDetached && sessionCoordinator.isCurrent(generation) && configuredAuth.getSnapshot()?.uid === user.uid;
          closeActiveProfileStorage();
          setAccountEntryMode("login");
          setState({ kind: "loading" });
          void admitAuthenticatedBootstrap(configuredAuth, client, user, generation, eventDiagnostic, canContinue).catch((error: unknown) => {
              if (!canContinue()) return;
              setState(pendingRevokeFailureState(user, error, logoutControlSnapshotRef.current));
              eventDiagnostic.failed("recovery_guard", new Error("session_revocation_pending"), "signOutPending");
          });
          return;
        }
        const matchingLogoutBlock = findMatchingLocalLogoutBlock(logoutControlSnapshotRef.current, user.uid);
        if (matchingLogoutBlock) {
          observedUid = user.uid;
          sessionCoordinator.invalidate();
          closeActiveProfileStorage();
          setAccountEntryMode("login");
          setState({ kind: "signOutPending", user, operationId: matchingLogoutBlock.operationId });
          eventDiagnostic.failed("recovery_guard", new Error("local_logout_block"), "signOutPending");
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
          if (isCurrentObserver()) { setState({ kind: "verificationPending", user }); eventDiagnostic.ready("verificationPending"); }
          return;
        }
        if (isCurrentObserver()) setState({ kind: "loading" });
        void admitAuthenticatedBootstrap(configuredAuth, client, user, generation, eventDiagnostic, isCurrentObserver).then(async (attempt) => {
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
        }).catch((error: unknown) => {
          if (!isCurrentObserver()) return;
          setAccountEntryMode("login");
          setState(pendingRevokeFailureState(user, error, logoutControlSnapshotRef.current));
          eventDiagnostic.failed("recovery_guard", new Error("session_revocation_pending"), "signOutPending");
        });
        })().catch(() => {
          if (!live || observerDetached) return;
          setRecoveryOperation({ kind: "unavailable", reason: "operation_unavailable", blocksProfilePreparation: true });
          if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
          setState({ kind: "recoveryPending" });
          startupDiagnostic.failed("recovery_guard", new Error("recovery_operation_unavailable"), "recoveryPending");
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
        startupDiagnostic.dispose();
        sessionCoordinator.dispose();
      };
    } catch (error) {
      publish({ kind: "unavailable", reason: "firebase_unconfigured" });
      startupDiagnostic.failed("auth_client_setup", error, "unavailable");
      return () => { live = false; observerBlockedUidRef.current = null; revokeDeletionAuthorization(); startupDiagnostic.dispose(); sessionCoordinator.dispose(); };
    }
  }, [authInitializationRevision, admitAuthenticatedBootstrap, finalizeCurrent, getRecoveryVault, guardRecoveryBeforePreparation, logoutControl, preparedProfileState, revokeDeletionAuthorization, runtimeMode, sessionCoordinator]);

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
    const generation = sessionCoordinator.current(user.uid) ?? sessionCoordinator.begin(user.uid);
    const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
    try {
      const attempt = await admitAuthenticatedBootstrap(auth, api, user, generation, undefined, canContinue);
      if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
      if (!attempt) {
        const latest = stateRef.current;
        return { kind: "failure", failure: latest.kind === "revokedSession" ? "revokedSession" : latest.kind === "backendUnavailable" ? "backendUnavailable" : "providerUnavailable" };
      }
      return attempt.completion;
    } catch (error) {
      if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
      if (getActiveStorageProfileOrNull()) closeActiveProfileStorage();
      observerBlockedUidRef.current = user.uid;
      setAccountEntryMode("login");
      setState(pendingRevokeFailureState(user, error, logoutControlSnapshotRef.current));
      return { kind: "failure", failure: "signOutPending" };
    }
  }, [admitAuthenticatedBootstrap, logoutControl, sessionCoordinator]);

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
      if (registration.registration.created && getActiveStorageProfileOrNull()?.kind === "guest") await markGuestInstallationAdoptionPending();
      const result: Promise<AccountCommandResult> = finalize
        ? (registration.registration.created
          ? finalizeCurrent(auth, api, user, accountFinalizationPolicies.registrationCreated<AccountSessionGenerationToken, AccountIdentityProofBarrierContext>(generation))
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

  const refreshPremiumEntitlement = useCallback((accountId: string) => {
    // Capture before entering the queue: A→A with a new generation is a new actor.
    const current = stateRef.current;
    const lease = captureActiveProfileStorageLease();
    const generation = current.kind === "authenticated" ? sessionCoordinator.current(current.user.uid) : null;
    if (!apiClient || !authClient || current.kind !== "authenticated" || current.backendUser.id !== accountId
      || !generation || !lease || lease.profile.kind !== "account" || lease.profile.accountId !== accountId) return Promise.resolve("pending" as const);
    const stillCurrent = () => sessionCoordinator.isCurrent(generation) && authClient.getSnapshot()?.uid === current.user.uid
      && isActiveProfileStorageLeaseCurrent(lease) && stateRef.current.kind === "authenticated"
      && stateRef.current.backendUser.id === accountId && stateRef.current.user.uid === current.user.uid;
    return premiumRefreshQueueRef.current.request(async () => {
      if (!stillCurrent()) return "pending" as const;
      try {
        const initialFence = readVerifiedAccountIdentityFence(await readActiveAccountIdentityBinding(lease), lease, accountId, current.user.uid);
        if (!stillCurrent() || !initialFence || !clearPremiumCacheUnlessBoundTo(accountId)) return "pending" as const;
        const response = await apiClient.getEntitlements(stillCurrent);
        if (!stillCurrent()) return "pending" as const;
        const responseFence = readVerifiedAccountIdentityFence(await readActiveAccountIdentityBinding(lease), lease, accountId, current.user.uid);
        if (!stillCurrent() || !sameVerifiedAccountIdentityFence(initialFence, responseFence)) return "pending" as const;
        const observedItem = response?.entitlements?.[0];
        markStartup(observedItem && typeof observedItem === "object" && "mapVersion" in observedItem && "sources" in observedItem
          ? "premium:response_v2" : "premium:response_missing_v2");
        const identity = premiumIdentityForAccount(accountId);
        if (!identity) return "pending" as const;
        if (!replacePremiumCacheFromFreshResponse(response, identity, Date.now())) { markStartup("premium:response_rejected"); return "pending" as const; }
        return isPremiumAccessConfirmedOnline({ ...response.entitlements[0], serverObservedAt: response.serverObservedAt }) ? "verified" as const : "denied" as const;
      } catch { if (stillCurrent()) markStartup("premium:refresh_failed"); return "pending" as const; }
    });
  }, [apiClient, authClient, sessionCoordinator]);

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
    if (current.kind !== "authenticated" && current.kind !== "localOffline") { markStartup("premium:actor_denied"); return "denied" as const; }
    const accountId = current.kind === "authenticated" ? current.backendUser.id : current.accountId;
    const accountUid = current.user.uid;
    const identity = premiumIdentityForAccount(accountId);
    if (!identity) { markStartup("premium:scope_unavailable"); return "unavailable" as const; }
    if (current.kind === "localOffline") {
      let initialFence: VerifiedAccountIdentityFence | null = null;
      try { initialFence = readVerifiedAccountIdentityFence(await readActiveAccountIdentityBinding(current.profileLease), current.profileLease, current.accountId, current.user.uid); }
      catch { return "unavailable" as const; }
      if (!initialFence || initialFence.verificationRevision !== current.bindingRevision || !isCurrentLocalOfflineActor(current)) return "unavailable" as const;
      let confirmedOffline = false;
      try { confirmedOffline = (await (await import("@react-native-community/netinfo")).default.fetch()).isInternetReachable === false; }
      catch { return "unavailable" as const; }
      if (!confirmedOffline || !isCurrentLocalOfflineActor(current)) return "unavailable" as const;
      try {
        const latestFence = readVerifiedAccountIdentityFence(await readActiveAccountIdentityBinding(current.profileLease), current.profileLease, current.accountId, current.user.uid);
        if (!sameVerifiedAccountIdentityFence(initialFence, latestFence)) return "unavailable" as const;
      } catch { return "unavailable" as const; }
      const allowed = hasOfflinePremiumAccess(identity, Date.now());
      if (!isCurrentLocalOfflineActor(current)) return "unavailable" as const;
      try {
        const latestFence = readVerifiedAccountIdentityFence(await readActiveAccountIdentityBinding(current.profileLease), current.profileLease, current.accountId, current.user.uid);
        return sameVerifiedAccountIdentityFence(initialFence, latestFence) && isCurrentLocalOfflineActor(current)
          ? (allowed ? "allowed" : "denied") : "unavailable" as const;
      } catch { return "unavailable" as const; }
    }
    const auth = authClient;
    const lease = captureActiveProfileStorageLease();
    const generation = auth ? sessionCoordinator.current(accountUid) : null;
    if (!auth || !lease || !generation || lease.profile.kind !== "account" || lease.profile.accountId !== accountId
      || auth.getSnapshot()?.uid !== accountUid) return "unavailable" as const;
    const actorIsCurrent = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === accountUid
      && isActiveProfileStorageLeaseCurrent(lease) && stateRef.current.kind === "authenticated"
      && stateRef.current.backendUser.id === accountId && stateRef.current.user.uid === accountUid;
    let initialFence: VerifiedAccountIdentityFence | null = null;
    try { initialFence = readVerifiedAccountIdentityFence(await readActiveAccountIdentityBinding(lease), lease, accountId, accountUid); }
    catch { return "unavailable" as const; }
    if (!actorIsCurrent() || !initialFence) return "unavailable" as const;
    let offlineFenceCurrent = false;
    const admission = await resolvePremiumSessionAdmission({
      isConfirmedOffline: async () => {
        const offline = (await import("@react-native-community/netinfo")).default.fetch().then((network) => network.isInternetReachable === false);
        if (!await offline) return false;
        try {
          const latestFence = readVerifiedAccountIdentityFence(await readActiveAccountIdentityBinding(lease), lease, accountId, accountUid);
          offlineFenceCurrent = actorIsCurrent() && sameVerifiedAccountIdentityFence(initialFence, latestFence);
          return offlineFenceCurrent;
        } catch { return false; }
      },
      hasOfflineAccess: () => {
        const latest = stateRef.current;
        return offlineFenceCurrent && actorIsCurrent() && latest.kind === "authenticated"
          && latest.backendUser.id === accountId && latest.user.uid === accountUid
          && hasOfflinePremiumAccess(identity, Date.now());
      },
      refresh: () => refreshPremiumEntitlement(accountId),
    });
    try {
      const latestFence = readVerifiedAccountIdentityFence(await readActiveAccountIdentityBinding(lease), lease, accountId, accountUid);
      if (!actorIsCurrent() || !sameVerifiedAccountIdentityFence(initialFence, latestFence)) return "unavailable" as const;
    } catch { return "unavailable" as const; }
    markStartup(`premium:${admission}`);
    return admission;
  }, [authClient, isCurrentLocalOfflineActor, refreshPremiumEntitlement, sessionCoordinator]);

  const readCurrentPremiumAccess = useCallback(() => {
    const current = stateRef.current;
    if (current.kind === "guest" || current.kind === "signedOut") return "denied" as const;
    if (current.kind === "localOffline") {
      if (isAccountIdentityProofInFlightForActor(accountIdentityProofInFlightRef.current, current.user.uid, current.accountId)) return "unavailable" as const;
      if (!authClient || !isCurrentLocalOfflineActor(current)) return "unavailable" as const;
      const identity = premiumIdentityForAccount(current.accountId);
      if (!identity) return "unavailable" as const;
      const result = readCachedPremiumAccess(identity, Date.now());
      return isCurrentLocalOfflineActor(current) ? result : "unavailable" as const;
    }
    if (current.kind !== "authenticated" || !authClient || authClient.getSnapshot()?.uid !== current.user.uid) return "unavailable" as const;
    const accountId = current.backendUser.id;
    const uid = current.user.uid;
    const generation = sessionCoordinator.current(uid);
    if (isAccountIdentityProofInFlightForActor(accountIdentityProofInFlightRef.current, uid, accountId)) return "unavailable" as const;
    const profile = getActiveStorageProfileOrNull();
    if (!generation || !profile || profile.kind !== "account" || profile.accountId !== accountId) return "unavailable" as const;
    const identity = premiumIdentityForAccount(accountId);
    if (!identity) return "unavailable" as const;
    const result = readCachedPremiumAccess(identity, Date.now());
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
    if (!profile || profile.kind !== "account" || profile.accountId !== accountId || !generation || authClient.getSnapshot()?.uid !== uid) return null;
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

  const capturePremiumPurchaseActor = useCallback((): PremiumPurchaseActor | null => {
    const current = stateRef.current;
    const fence = captureCurrentAuthenticatedActorFence();
    const lease = captureActiveProfileStorageLease();
    if (!apiClient || !fence || !lease || current.kind !== "authenticated") return null;
    const accountId = current.backendUser.id;
    const isCurrent = () => {
      const latest = stateRef.current;
      const deletion = getAccountDeletionState();
      return fence.isCurrent()
        && isActiveProfileStorageLeaseCurrent(lease)
        && latest.kind === "authenticated"
        && latest.backendUser.id === accountId
        && deletion?.accountId !== accountId;
    };
    const guarded = async <T,>(work: () => Promise<T>): Promise<T> => {
      if (!isCurrent()) throw Error("purchase_actor_changed");
      const result = await work();
      if (!isCurrent()) throw Error("purchase_actor_changed");
      return result;
    };
    return Object.freeze({
      accountId, isCurrent,
      record: (input) => guarded(() => apiClient.recordPurchaseConfirmation(input, isCurrent)),
      attempt: (id) => guarded(() => apiClient.getPurchaseAttempt(id, isCurrent)),
      command: (id, command) => guarded(() => apiClient.commandPurchaseAttempt(id, command, isCurrent)),
      cases: () => guarded(() => apiClient.getPurchaseCases(isCurrent)),
      refresh: () => guarded(() => refreshPremiumEntitlement(accountId)),
      readPremiumSnapshot: () => {
        if (!isCurrent()) return null;
        const identity = premiumIdentityForAccount(accountId);
        return identity ? readCachedPremiumSnapshot(identity) : null;
      },
    });
  }, [apiClient, captureCurrentAuthenticatedActorFence, refreshPremiumEntitlement]);

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

  const currentProfilePreparation = profilePreparationRef.current;
  const profilePreparationHandoffToken = state.kind === "profilePreparing"
    && currentProfilePreparation?.handoffReady
    && currentProfilePreparation.profile.id === state.profile.id
    ? currentProfilePreparation.handoffToken
    : null;

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
    capturePremiumPurchaseActor,
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
      if (activeProfile?.kind === "guest" && hasUnboundGuestInstallation()) {
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
          guestAdoption: false,
          handoffToken: profilePreparationHandoffRef.current!.begin(),
          handoffReady: false,
        };
        profilePreparationRef.current = attempt;
        setAccountEntryMode(prepared.isFreshInstallation ? "welcome" : "login");
        attempt.handoffReady = true;
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
      return finalizeCurrent(auth, api, auth.getSnapshot(), accountFinalizationPolicies.verification<AccountSessionGenerationToken, AccountIdentityProofBarrierContext>());
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
        // Verification and a failed login can both leave profile storage closed.
        // Re-enter the awaited bootstrap instead of the active-profile refresh.
        if ((current.kind === "verificationPending" || current.kind === "backendUnavailable") && proofBarrier === null && getActiveStorageProfileOrNull() === null) {
          return finalizeExplicitAuthentication(auth, api, user);
        }
        return finalizeCurrent(auth, api, user, accountFinalizationPolicies.passwordRefresh<AccountSessionGenerationToken, AccountIdentityProofBarrierContext>(generation, proofBarrier));
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
      const expectedAccountId = current.kind === "authenticated" ? current.backendUser.id : current.accountId;
      const identityLease = current.kind === "localOffline" ? current.profileLease : captureActiveProfileStorageLease();
      if (!identityLease || identityLease.profile.kind !== "account" || identityLease.profile.accountId !== expectedAccountId) {
        setState({ kind: "backendUnavailable", user: previousUser });
        return Promise.resolve({ kind: "failure", failure: "backendUnavailable" } as const);
      }
      const canContinue = (auth: FirebaseAuthClient, user: FirebaseAuthUserSnapshot | null) => canContinueAccountIdentityRefresh({
        authUid: auth.getSnapshot()?.uid ?? null,
        currentState: stateRef.current,
        expectedUid: previousUser.uid,
        generation,
        isCurrentGeneration: sessionCoordinator.isCurrent,
        refreshedUid: user?.uid ?? null,
      }) && isActiveProfileStorageLeaseCurrent(identityLease)
        && identityLease.profile.kind === "account" && identityLease.profile.accountId === expectedAccountId
        && ((stateRef.current.kind === "authenticated" && stateRef.current.backendUser.id === expectedAccountId)
          || (stateRef.current.kind === "localOffline" && stateRef.current.accountId === expectedAccountId));
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
      const identityProofFlight = Object.freeze({ uid: previousUser.uid, accountId: expectedAccountId, generation });
      let identityProofFenceRevalidated = false;
      return runRefreshWithAuth(async (auth, api) => {
        if (hasLiveDeletionAuthorization()) {
          skippedForDeletionGrant = true;
          return { kind: "success", next: "authenticated" };
        }
        if (!canContinue(auth, auth.getSnapshot())) return { kind: "failure", failure: "revokedSession" };
        accountIdentityProofInFlightRef.current = identityProofFlight;
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
            if (canContinue(auth, auth.getSnapshot())) setState(sdkRefresh.state);
            return { kind: "failure", failure: sdkRefresh.failure };
          }
          const user = sdkRefresh.value;
          if (!user || !canContinue(auth, user)) {
            if (current.kind === "localOffline") setState({ kind: "revokedSession", user: previousUser });
            return { kind: "failure", failure: "revokedSession" };
          }
          if (current.kind === "localOffline") return finalizeCurrent(auth, api, user,
            accountFinalizationPolicies.localOfflineRefresh<AccountSessionGenerationToken, AccountIdentityProofBarrierContext>(generation, sdkRefresh.barrier));
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
            matchesProofSubject: (response, barrier) => accountIdentityProofMatchesSubject(response, barrier.previousBinding.accountId, user.uid)
              && barrier.previousBinding.firebaseUid === user.uid,
            getCurrentState: () => stateRef.current,
            getCurrentSdkUid: () => auth.getSnapshot()?.uid ?? null,
            isCurrentGeneration: sessionCoordinator.isCurrent,
            isLeaseCurrent: isActiveProfileStorageLeaseCurrent,
            readBinding: readActiveAccountIdentityBinding,
            revokeDeniedBinding: revokeDenied,
          });
          if (identityProof.kind === "failed") {
            if (canContinue(auth, auth.getSnapshot())) setState(identityProof.state);
            return { kind: "failure", failure: identityProof.failure };
          }
          const response = identityProof.value;
          if (!canContinue(auth, user)) return { kind: "failure", failure: "revokedSession" };
          if (identityProof.barrier !== null || !accountIdentityProofMatchesSubject(response, expectedAccountId, user.uid)) {
            if (canContinue(auth, user)) setState({ kind: "backendUnavailable", user });
            return { kind: "failure", failure: "backendUnavailable" };
          }
          let durableFence: VerifiedAccountIdentityFence | null = null;
          try {
            durableFence = readVerifiedAccountIdentityFence(
              await readActiveAccountIdentityBinding(identityLease), identityLease, expectedAccountId, user.uid,
            );
          } catch { /* Readback failure keeps the existing proof tombstone blocking. */ }
          if (!canContinue(auth, user) || !durableFence) {
            if (canContinue(auth, user)) setState({ kind: "backendUnavailable", user });
            return { kind: "failure", failure: "backendUnavailable" };
          }
          setState((latest) => publishRefreshedAuthenticatedState(latest, {
            backendUser: response.user,
            isCurrent: () => canContinue(auth, auth.getSnapshot()) && identityLease.generation === durableFence!.leaseGeneration,
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
      }).then(async (result) => {
        const currentAuth = authClient;
        const currentUser = currentAuth?.getSnapshot() ?? null;
        if (!skippedForDeletionGrant && currentAuth && canContinue(currentAuth, currentUser)) {
          setRefreshAccountIdentityFailure(result.kind === "failure" ? result.failure : null);
        }
        if (result.kind !== "success" || skippedForDeletionGrant || !currentAuth || !canContinue(currentAuth, currentUser)) return result;
        let finalFence: VerifiedAccountIdentityFence | null = null;
        try {
          finalFence = readVerifiedAccountIdentityFence(
            await readActiveAccountIdentityBinding(identityLease), identityLease, expectedAccountId, previousUser.uid,
          );
        } catch { /* Keep the actor latched when the durable proof cannot be reread. */ }
        if (!canContinue(currentAuth, currentAuth.getSnapshot()) || !finalFence) {
          if (currentAuth.getSnapshot()?.uid === previousUser.uid && canContinue(currentAuth, currentAuth.getSnapshot())) {
            setState({ kind: "backendUnavailable", user: previousUser });
            setRefreshAccountIdentityFailure("backendUnavailable");
          }
          return { kind: "failure", failure: "backendUnavailable" } as const;
        }
        identityProofFenceRevalidated = true;
        return result;
      }).finally(() => {
        const pending = accountIdentityProofInFlightRef.current;
        const latestAuth = authClient;
        const latestUser = latestAuth?.getSnapshot() ?? null;
        const currentState = stateRef.current;
        const currentActorAccountId = currentState.kind === "authenticated" ? currentState.backendUser.id
          : currentState.kind === "localOffline" ? currentState.accountId : null;
        const currentActorUid = currentState.kind === "authenticated" || currentState.kind === "localOffline" ? currentState.user.uid : null;
        const currentGeneration = latestAuth && currentActorUid ? sessionCoordinator.current(currentActorUid) : null;
        if (shouldClearAccountIdentityProofLatch(pending, identityProofFlight, identityProofFenceRevalidated, {
          uid: currentActorUid,
          accountId: currentActorAccountId,
          generation: currentGeneration,
          isCurrent: Boolean(latestAuth && canContinue(latestAuth, latestUser)),
        })) {
          accountIdentityProofInFlightRef.current = null;
        }
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
        return finalizeCurrent(auth, api, user, accountFinalizationPolicies.resendVerification<AccountSessionGenerationToken, AccountIdentityProofBarrierContext>());
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
    inspectAccountSyncConflict: async () => {
      const current = authClient?.getSnapshot();
      const live = stateRef.current;
      if (!apiClient || !current || live.kind !== "authenticated" || live.user.uid !== current.uid) return { kind: "failure", failure: "providerUnavailable" };
      try {
        const preview = await inspectAccountSyncConflict(apiClient, live.backendUser.id);
        const after = stateRef.current;
        if (authClient?.getSnapshot()?.uid !== current.uid || after.kind !== "authenticated" || after.user.uid !== current.uid || after.backendUser.id !== live.backendUser.id) return { kind: "failure", failure: "revokedSession" };
        return { kind: "success", preview };
      } catch (error) { return { kind: "failure", failure: classifyAccountFailure(error) }; }
    },
    resolveAccountSyncConflict: (input) => runWithAuth(async (auth, api) => {
      const current = auth.getSnapshot();
      const live = stateRef.current;
      if (!current || live.kind !== "authenticated" || live.user.uid !== current.uid) return { kind: "failure", failure: "revokedSession" };
      const next = await resolveAccountSyncConflict({ api, accountId: live.backendUser.id, ...input });
      const after = stateRef.current;
      if (auth.getSnapshot()?.uid !== current.uid || after.kind !== "authenticated" || after.user.uid !== current.uid || after.backendUser.id !== live.backendUser.id) return { kind: "failure", failure: "revokedSession" };
      setState({ ...after, accountData: next });
      return { kind: "success", next: "authenticated" };
    }),
    restartExpiredSessionRevocation: () => runAuthMutationWithAuth(async (auth, api) => {
      const current = stateRef.current;
      const user = auth.getSnapshot();
      if (!user || current.kind !== "signOutPending" || current.provisional || !current.remoteRevokeExpired
        || current.user.uid !== user.uid || !current.operationId) return { kind: "failure", failure: "conflict" };
      const generation = sessionCoordinator.restart(user.uid);
      const canContinue = () => sessionCoordinator.isCurrent(generation) && auth.getSnapshot()?.uid === user.uid;
      try {
        const snapshot = await logoutControl.replaceExpiredPendingRevoke(user.uid, current.operationId, createSessionRevocationOperationId(), canContinue);
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        logoutControlSnapshotRef.current = snapshot;
        setLogoutControlSnapshot(snapshot);
        return finalizeExplicitAuthentication(auth, api, user);
      } catch {
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        // An unconfirmed write may contain the old or the new durable pair.
        // Existing restore re-reads it before draining; never reuse stale UI IDs.
        retrySessionRestore();
        return { kind: "failure", failure: "localCleanupFailure" };
      }
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
        if (!operationId) return false;
        if (!signOutProfile) {
          // Pending verification has no active account cache to clear.
          // Its durable revoke fence is still required before Firebase sign-out.
          if (stateAtSignOut.kind !== "verificationPending" || stateAtSignOut.user.uid !== user.uid) return false;
          return getActiveStorageProfileOrNull() === null && canContinue() ? true : "stale";
        }
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
              operationId = createSessionRevocationOperationId();
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
              operationId ??= createSessionRevocationOperationId();
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
      if (!user || state.kind !== "authenticated" || state.user?.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
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
      if (!user || state.kind !== "authenticated" || state.user?.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
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
      if (!user || state.kind !== "authenticated" || state.user?.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
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
      if (!user || state.kind !== "authenticated" || state.user?.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
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
        }, prepareRevenueCatAccountDeletion);
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
      if (!user && stateRef.current.kind === "deletionPending" && stateRef.current.user === null) {
        const expectedAccount = stateRef.current.accountId;
        const canContinue = () => auth.getSnapshot() === null && stateRef.current.kind === "deletionPending" && stateRef.current.user === null && stateRef.current.accountId === expectedAccount;
        const recovery = await resumeSelectedAccountDeletionWithoutAuth(api, disableAccountRemindersForDeletion, prepareRevenueCatAccountDeletion, canContinue);
        if (!recovery || !canContinue()) return { kind: "failure", failure: "remoteDeletionPending" };
        if (!recovery.result.ok) {
          setState({ kind: "deletionPending", user: null, accountId: recovery.accountId, status: recovery.result.failure === "localCleanupFailure" ? "localCleanupPending" : "remoteDeletionPending", failure: recovery.result.failure });
          return { kind: "failure", failure: recovery.result.failure };
        }
        setState({ kind: "signedOut" });
        return { kind: "success", next: "signedOut" };
      }
      const deletion = getAccountDeletionState();
      const accountId = state.kind === "authenticated"
        ? state.backendUser.id
        : state.kind === "deletionPending"
          ? state.accountId
          : null;
      const accountDataStatus = state.kind === "authenticated" ? state.accountData.status : state.kind === "deletionPending" ? state.status : null;
      if (!user || (state.kind !== "authenticated" && state.kind !== "deletionPending") || state.user?.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
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
        }, prepareRevenueCatAccountDeletion);
        if (!canContinue()) return { kind: "failure", failure: "revokedSession" };
        if (!result) return { kind: "failure", failure: "providerUnavailable" };
        if (!result.ok) {
          if (result.failure === "reauthenticationRequired") {
            const finalized = await finalizeCurrent(auth, api, user,
              accountFinalizationPolicies.deletionReauthentication<AccountSessionGenerationToken, AccountIdentityProofBarrierContext>(generation));
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
      if (!user || state.kind !== "authenticated" || state.user?.uid !== user.uid) return { kind: "failure", failure: "providerUnavailable" };
      if (!credentialsMatchSnapshot(user, credentials)) return { kind: "failure", failure: "reauthenticationRequired" };
      if (credentials.kind === "password" && !credentials.password) return { kind: "failure", failure: "reauthenticationRequired" };
      const generation = sessionCoordinator.restart(user.uid);
      const coordinator = recoveryCoordinatorRef.current;
      if (!coordinator || !createRecoveryProofScopeRef.current) return { kind: "failure", failure: "providerUnavailable" };
      await coordinator.load();
      const pending = coordinator.getSnapshot();
      if (pending.kind !== "idle" && pending.kind !== "terminal" && pending.kind !== "issue") return { kind: "failure", failure: "conflict" };
      if (pending.kind === "issue" && (pending.firebaseUid !== user.uid || pending.deferredFor)) return { kind: "failure", failure: "conflict" };
      const proofScope = await createRecoveryProofScopeRef.current(auth, user, { generation, barrier: null });
      proofScope.bindRecoveryOperation(coordinator.getSnapshot());
      const isCurrent = () => {
        try { proofScope.assertCurrent(); return true; } catch { return false; }
      };
      proofScope.assertCurrent();
      let authorizationGeneration: number | null = null;
      let generationCaptured = false;
      recoveryCommandInFlightRef.current = true;
      setRecoveryOperation(recoveryIssuePublicationGateRef.current.hold());
      let result: Awaited<ReturnType<typeof runReauthenticatedMutation<FirebaseAuthCredentials, RecoveryOperationSnapshot>>> | null = null;
      let finalIdentityCurrent = false;
      try {
        result = await runReauthenticatedMutation({
          credentials,
          isCurrent,
          mutation: async () => {
            if (!isCurrent() || authorizationGeneration === null) throw new FirebaseAuthClientError("auth/authorization-generation-invalid");
            const currentCoordinator = recoveryCoordinatorRef.current;
            if (!currentCoordinator) throw new Error("recovery_coordinator_unavailable");
            const snapshot = await currentCoordinator.startIssue({ firebaseUid: user.uid, authorizationGeneration });
            proofScope.acceptRecoveryOperation(snapshot, { kind: "issueStart", firebaseUid: user.uid, authorizationGeneration });
            return snapshot;
          },
          reauthenticate: async (credentials) => {
            authorizationGeneration = await prepareRecoveryIssueSession({
              api, auth, user, credentials, pending, canContinue: isCurrent,
              onExchangeStarting: () => { sessionExchangeUidRef.current = user.uid; },
              onGenerationCaptured: (captured) => { authorizationGeneration = captured; generationCaptured = true; },
            });
          },
        });
      } finally {
        try {
          if (result?.ok) proofScope.acceptRecoveryOperation(result.value);
          proofScope.assertCurrent();
          const identity = await readRecoveryIssueCommandIdentity({
            auth,
            firebaseUid: user.uid,
            authorizationGeneration,
            allowUnexchangedIdentity: generationCaptured && result?.ok === false && (pending.kind === "idle" || pending.kind === "terminal"),
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
          if (sessionExchangeUidRef.current === user.uid) sessionExchangeUidRef.current = null;
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
    profilePreparationHandoffToken,
    state,
  }), [completeExplicitRecoveryAccountTransition, executeRecoveryCommand, finishRecoveryCommand, guardRecoveryBeforePreparation, recoveryOperation, accountEntryMode, apiClient, authClient, authorizePremiumSessionStart, readCurrentPremiumAccess, captureCurrentAuthenticatedActorFence, capturePremiumPurchaseActor, captureHomeResumeActorFence, inspectQ13ActorFence, installPremiumNodePackage, retryLearningPlanRecoveryForAccount, completeProfilePreparation, profilePreparationHandoffToken, finalizeCurrent, finalizeExplicitAuthentication, guestTransitionFailure, holdAccountIdentityRefresh, logoutControlSnapshot, refreshAccountIdentityFailure, refreshPremiumEntitlement, registerAuthenticatedIdentity, registerProviderIdentity, cancelProviderRegistration, retrySessionRestore, revokeDeletionAuthorization, runAuthMutationWithAuth, runProviderFirstUse, runRefreshWithAuth, runSensitiveWithAuth, runWithAuth, runtimeMode, sensitiveCommandLane, sessionCoordinator, signOutRejectedIdentity, state]);

  return <AccountSessionContext.Provider value={value}>{children}</AccountSessionContext.Provider>;
}

export function usePatternlyAccount(): AccountSessionContextValue {
  const context = useContext(AccountSessionContext);
  if (!context) throw new Error("patternly_account_provider_required");
  return context;
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
    if (error.status === 429) return "rateLimited";
    if (error.status !== undefined && error.status >= 500) return "backendUnavailable";
    if (error.code === "transport_failed") return "offline";
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
