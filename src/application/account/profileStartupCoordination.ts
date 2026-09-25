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
  retainAuthOnControlFailure?: boolean;
  persistBlock: () => Promise<LocalLogoutControlSnapshot>;
  publishLockedState: () => void;
  closeProfileStorage: () => void;
  signOutFirebase: () => Promise<void>;
  isCurrent: () => boolean;
}>): Promise<"signedOut" | "signOutPending" | "localLogoutControlFailure" | "stale"> {
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
      try { await input.signOutFirebase(); } catch { /* The explicit local failure remains the result. */ }
    }
    return "localLogoutControlFailure";
  }
  if (!input.isCurrent()) {
    input.closeProfileStorage();
    return "stale";
  }
  input.publishLockedState();
  input.closeProfileStorage();
  if (!findMatchingLocalLogoutBlock(snapshot, input.uid)) {
    if (!input.retainAuthOnControlFailure) {
      try { await input.signOutFirebase(); } catch { /* Keep the control-write failure explicit. */ }
    }
    return "localLogoutControlFailure";
  }
  try {
    await input.signOutFirebase();
  } catch {
    return "signOutPending";
  }
  return "signedOut";
}

export async function finishLocalSignOutSetupFailure(input: Readonly<{
  isCurrent: () => boolean;
  persistFallbackControlPair: () => Promise<boolean>;
  retainAuthOnFailedControlWrite?: boolean;
  publishLockedState: () => void;
  closeProfileStorage: () => void;
  signOutFirebase: () => Promise<void>;
}>): Promise<"localLogoutControlFailure" | "stale"> {
  let controlWriteVerified = false;
  try { controlWriteVerified = await input.persistFallbackControlPair(); } catch { /* The provider reports this as a local failure. */ }
  if (!input.isCurrent()) {
    input.closeProfileStorage();
    return "stale";
  }
  input.publishLockedState();
  input.closeProfileStorage();
  if (!(input.retainAuthOnFailedControlWrite && !controlWriteVerified)) {
    try { await input.signOutFirebase(); } catch { /* Keep the local failure explicit. */ }
  }
  return "localLogoutControlFailure";
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
