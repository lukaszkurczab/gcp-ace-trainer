import type { MeResponseDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type { LocalLogoutControlSnapshot, PendingRevoke } from "../../infrastructure/storage/localLogoutControl";
import type { AccountSignOutState } from "../../storage/repositories/accountLifecycleRepository";
import { ProfileStorageError, type StorageProfile } from "../../infrastructure/storage/profileStorageRouter";

export class AccountSessionGenerationStaleError extends Error {
  public constructor() {
    super("account_session_generation_stale");
    this.name = "AccountSessionGenerationStaleError";
  }
}

export function shouldRejectPersistedAuthRestore(input: Readonly<{
  failure: string;
  isRestoredAuthEvent: boolean;
  isCurrentGeneration: boolean;
}>): boolean {
  return input.failure === "accountNotFound" && input.isRestoredAuthEvent && input.isCurrentGeneration;
}

export type ProviderCancellationAuthObserverDecision = Readonly<{
  action: "ignore_stale" | "handle_user" | "return_to_sign_in" | "restore_guest";
  cancellationUid: string | null;
}>;

/** Classifies an Auth observer callback without letting stale nulls revoke a live UID. */
export function providerCancellationAuthObserverDecision(input: Readonly<{
  eventUid: string | null;
  authUid: string | null;
  cancellationUid: string | null;
  ownerUid: string | null;
}>): ProviderCancellationAuthObserverDecision {
  if (input.eventUid !== input.authUid) return Object.freeze({ action: "ignore_stale", cancellationUid: input.cancellationUid });
  if (input.eventUid !== null) {
    return Object.freeze({ action: "handle_user", cancellationUid: input.cancellationUid === input.eventUid ? input.cancellationUid : null });
  }
  return Object.freeze({
    action: input.cancellationUid !== null && input.cancellationUid === input.ownerUid ? "return_to_sign_in" : "restore_guest",
    cancellationUid: null,
  });
}

/** A null Auth event must revoke rendered access before touching scoped storage. */
export function lockAndCloseProfileAfterAuthLoss(input: Readonly<{
  publishLockedState: () => void;
  closeProfileStorage: () => void;
}>): void {
  input.publishLockedState();
  input.closeProfileStorage();
}

/** A blocked restored identity stays on the login surface until local sign-out is retried. */
export function findMatchingLocalLogoutBlock(snapshot: LocalLogoutControlSnapshot, uid: string): PendingRevoke | null {
  return snapshot.blocked?.uid === uid ? snapshot.blocked : null;
}

/** A matching revoke must settle before the authenticated profile can reopen. */
export function findPendingSessionRevocation(snapshot: LocalLogoutControlSnapshot, uid: string): PendingRevoke | null {
  return snapshot.pending.find((entry) => entry.uid === uid) ?? null;
}

/** A sign-out cleanup may run only for the exact durable pending pair or completion receipt. */
export function hasVerifiedLocalLogoutReceipt(snapshot: LocalLogoutControlSnapshot, uid: string, operationId: string): boolean {
  const matches = (pair: PendingRevoke) => pair.uid === uid && pair.operationId === operationId;
  return (snapshot.blocked !== null && matches(snapshot.blocked) && snapshot.pending.some(matches))
    || snapshot.completed.some(matches);
}

/** A scoped sign-out marker without a pending pair or completion receipt is interrupted. */
export function shouldLockForIncompleteScopedSignOut(input: Readonly<{
  marker: AccountSignOutState | null;
  authenticatedAccountId: string;
  authUid: string;
  completed: LocalLogoutControlSnapshot["completed"];
  pending: LocalLogoutControlSnapshot["pending"];
}>): boolean {
  if (!input.marker || input.marker.accountId !== input.authenticatedAccountId) return false;
  if (input.completed.some((pair) => pair.uid === input.authUid && pair.operationId === input.marker!.operationId)) return false;
  return !input.pending.some((pair) => pair.uid === input.authUid && pair.operationId === input.marker!.operationId);
}

export async function guardAuthenticatedScopeAgainstIncompleteSignOut(input: Readonly<{
  accountId: string;
  authUid: string;
  canContinue: () => boolean;
  completed: LocalLogoutControlSnapshot["completed"];
  pending: LocalLogoutControlSnapshot["pending"];
  readScopedSignOut: () => AccountSignOutState | null;
  clearScopedSignOut: () => void;
  persistControlPair: (operationId: string) => Promise<void>;
  closeProfileStorage: () => void;
  blockAuthObserver: (uid: string) => void;
  publishPending: (operationId?: string) => void;
}>): Promise<"continue" | "blocked" | "stale"> {
  if (!input.canContinue()) return "stale";
  let marker: AccountSignOutState | null;
  try { marker = input.readScopedSignOut(); }
  catch {
    if (!input.canContinue()) return "stale";
    input.blockAuthObserver(input.authUid);
    input.closeProfileStorage();
    input.publishPending();
    return "blocked";
  }
  const completed = marker?.accountId === input.accountId
    && input.completed.some((pair) => pair.uid === input.authUid && pair.operationId === marker!.operationId);
  if (completed) {
    try { input.clearScopedSignOut(); }
    catch {
      if (!input.canContinue()) return "stale";
      input.blockAuthObserver(input.authUid);
      input.closeProfileStorage();
      input.publishPending(marker!.operationId);
      return "blocked";
    }
    return input.canContinue() ? "continue" : "stale";
  }
  if (!shouldLockForIncompleteScopedSignOut({
    marker,
    authenticatedAccountId: input.accountId,
    authUid: input.authUid,
    completed: input.completed,
    pending: input.pending,
  })) return input.canContinue() ? "continue" : "stale";
  try { await input.persistControlPair(marker!.operationId); } catch { /* Retry from the locked account-entry state. */ }
  if (!input.canContinue()) return "stale";
  input.blockAuthObserver(input.authUid);
  input.closeProfileStorage();
  input.publishPending(marker!.operationId);
  return "blocked";
}

/**
 * Establish the durable local logout marker before locking UI, closing scoped
 * storage, or asking Firebase to clear credentials. A failed/uncertain marker
 * write still closes the scope and attempts Firebase sign-out, but reports a
 * local failure because the durable revoke journal could not be verified.
 */
export async function performLocalAccountSignOut(input: Readonly<{
  uid: string;
  operationId: string;
  retainAuthOnControlFailure?: boolean;
  persistBlock: () => Promise<LocalLogoutControlSnapshot>;
  publishLockedState: () => void;
  clearOwnedPremiumCache: () => boolean | "stale";
  closeProfileStorage: () => void;
  signOutFirebase: () => Promise<void>;
  isCurrent: () => boolean;
}>): Promise<"signedOut" | "signOutPending" | "localLogoutControlFailure" | "localCleanupFailure" | "stale"> {
  let snapshot: LocalLogoutControlSnapshot;
  try {
    snapshot = await input.persistBlock();
  } catch {
    if (!input.isCurrent()) {
      input.closeProfileStorage();
      return "stale";
    }
    input.publishLockedState();
    input.closeProfileStorage();
    if (!input.retainAuthOnControlFailure) {
      try { await input.signOutFirebase(); }
      catch { return "signOutPending"; }
    }
    return "localLogoutControlFailure";
  }
  if (!input.isCurrent()) {
    input.closeProfileStorage();
    return "stale";
  }
  input.publishLockedState();
  if (!hasVerifiedLocalLogoutReceipt(snapshot, input.uid, input.operationId)) {
    input.closeProfileStorage();
    if (!input.retainAuthOnControlFailure) {
      try { await input.signOutFirebase(); }
      catch { return "signOutPending"; }
    }
    return "localLogoutControlFailure";
  }
  if (!input.isCurrent()) {
    input.closeProfileStorage();
    return "stale";
  }
  let cacheCleanupSucceeded = false;
  try {
    const cleanup = input.clearOwnedPremiumCache();
    if (cleanup === "stale") {
      input.closeProfileStorage();
      return "stale";
    }
    cacheCleanupSucceeded = cleanup;
  } catch { /* Sign-out continues after explicit local cleanup failure. */ }
  input.closeProfileStorage();
  try {
    await input.signOutFirebase();
  } catch {
    return "signOutPending";
  }
  return cacheCleanupSucceeded ? "signedOut" : "localCleanupFailure";
}

export async function finishLocalSignOutSetupFailure(input: Readonly<{
  uid: string;
  getOperationId: () => string | undefined;
  isCurrent: () => boolean;
  persistFallbackControlPair: () => Promise<LocalLogoutControlSnapshot>;
  retainAuthOnFailedControlWrite?: boolean;
  publishLockedState: () => void;
  clearOwnedPremiumCache: () => boolean | "stale";
  closeProfileStorage: () => void;
  signOutFirebase: () => Promise<void>;
}>): Promise<"localLogoutControlFailure" | "localCleanupFailure" | "signOutPending" | "stale"> {
  let controlWriteVerified = false;
  try {
    const snapshot = await input.persistFallbackControlPair();
    const operationId = input.getOperationId();
    controlWriteVerified = operationId !== undefined && hasVerifiedLocalLogoutReceipt(snapshot, input.uid, operationId);
  } catch { /* The provider reports this as a local failure. */ }
  if (!input.isCurrent()) {
    input.closeProfileStorage();
    return "stale";
  }
  input.publishLockedState();
  let cacheCleanupSucceeded = false;
  if (controlWriteVerified) {
    try {
      const cleanup = input.clearOwnedPremiumCache();
      if (cleanup === "stale") {
        input.closeProfileStorage();
        return "stale";
      }
      cacheCleanupSucceeded = cleanup;
    } catch { /* Sign-out continues after explicit local cleanup failure. */ }
  }
  input.closeProfileStorage();
  if (!(input.retainAuthOnFailedControlWrite && !controlWriteVerified)) {
    try { await input.signOutFirebase(); }
    catch { return "signOutPending"; }
  }
  if (!controlWriteVerified) return "localLogoutControlFailure";
  return cacheCleanupSucceeded ? "localLogoutControlFailure" : "localCleanupFailure";
}

export function isPreparedGuestChoiceRequired(error: unknown): boolean {
  return error instanceof ProfileStorageError && error.code === "prepared_guest_choice_required";
}

export function recoverAfterGuestPreparationFailure(input: Readonly<{
  closeProfileStorage: () => void;
  setAccountEntryMode: () => void;
  publishSignedOut: () => void;
}>): void {
  input.closeProfileStorage();
  input.setAccountEntryMode();
  input.publishSignedOut();
}

export function shouldShowGuestSelectionLoading(activeProfile: StorageProfile | null): boolean {
  return activeProfile !== null;
}

/** Auth/backend identity always precedes profile selection; only the exact
 * selected scope is activated. */
export async function prepareAuthenticatedProfileScope(input: Readonly<{
  canContinue: () => boolean;
  prepareStorage: () => Promise<unknown>;
  getMe: () => Promise<MeResponseDto>;
  selectAccount: (accountId: string, canContinue: () => boolean) => Promise<Readonly<{ profile: StorageProfile }>>;
  activate: (profile: StorageProfile) => void;
}>): Promise<StorageProfile> {
  await input.prepareStorage();
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  const response = await input.getMe();
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  const selected = await input.selectAccount(response.user.id, input.canContinue);
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  input.activate(selected.profile);
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  return selected.profile;
}

/** Validate persisted guest access before publishing storage. An explicit
 * user choice may select a new guest on a fresh installation. */
export async function prepareGuestProfileScope(input: Readonly<{
  allowNewSelection: boolean;
  canContinue: () => boolean;
  isFreshInstallation: boolean;
  validatePersistedAccess: () => Promise<boolean>;
  selectGuest: () => Promise<Readonly<{ profile: StorageProfile }>>;
  activate: (profile: StorageProfile) => void;
}>): Promise<StorageProfile | null> {
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  if (!input.allowNewSelection && (input.isFreshInstallation || !await input.validatePersistedAccess())) return null;
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  const selected = await input.selectGuest();
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  input.activate(selected.profile);
  if (!input.canContinue()) throw new AccountSessionGenerationStaleError();
  return selected.profile;
}
