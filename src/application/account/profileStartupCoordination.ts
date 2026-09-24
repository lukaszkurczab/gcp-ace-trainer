import type { MeResponseDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";

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

export function isPreparedGuestChoiceRequired(error: unknown): boolean {
  return error instanceof Error && error.message === "prepared_guest_choice_required";
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
