import type { AccountSyncConflictPreview, AccountDataSession } from "../../application/account/accountDataService";

export type AccountSyncConflictPresentation =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "inspect" }>
  | Readonly<{ kind: "rebase" }>
  | Readonly<{ kind: "pair_choice"; trackIds: readonly AccountSyncConflictPreview["changedPairTrackIds"][number][] }>
  | Readonly<{ kind: "unsupported" }>;

/** Only a matching, freshly-inspected conflict can expose a resolution action. */
export function getAccountSyncConflictPresentation(
  accountData: AccountDataSession,
  preview: AccountSyncConflictPreview | null,
): AccountSyncConflictPresentation {
  const conflict = accountData.syncConflict;
  if (!conflict) return Object.freeze({ kind: "none" });
  if (!preview || preview.conflictId !== conflict.conflictId) return Object.freeze({ kind: "inspect" });
  if (preview.kind === "rebase_available") return Object.freeze({ kind: "rebase" });
  if (preview.kind === "unsupported_changes") return Object.freeze({ kind: "unsupported" });
  return Object.freeze({ kind: "pair_choice", trackIds: Object.freeze([...preview.changedPairTrackIds]) });
}

export function accountSyncAutomaticRetryAllowed(accountData: AccountDataSession): boolean {
  return accountData.syncConflict == null;
}
