import type { AccountState } from "../../../application/account/AccountSessionProvider";
import type { AccountDataSession } from "../../../application/account/accountDataService";

export type SettingsAccountStatus = "guest" | "signedOut" | "authenticated" | "attention" | "verificationPending" | "guestAccessBlocked" | "busy" | "unavailable";

export type SettingsAccountPresentation = Readonly<{
  accountDataStatus: AccountDataSession["status"] | null;
  canOpenAccount: boolean;
  canSignOut: boolean;
  email: string | null;
  providerLabel?: string;
  status: SettingsAccountStatus;
}>;

function accountDataNeedsAttention(accountData: AccountDataSession): boolean {
  return accountData.status !== "synced"
    || accountData.lastFailureCode !== null
    || accountData.pendingMutationCount > 0
    || accountData.blockingConflictCode !== null;
}

export function getSettingsAccountPresentation(state: AccountState): SettingsAccountPresentation {
  switch (state.kind) {
    case "guest":
      return { accountDataStatus: null, canOpenAccount: true, canSignOut: false, email: null, status: "guest" };
    case "signedOut":
      return { accountDataStatus: null, canOpenAccount: true, canSignOut: false, email: null, status: "signedOut" };
    case "authenticated":
      return {
        accountDataStatus: state.accountData.status,
        canOpenAccount: true,
        canSignOut: true,
        email: state.user.email,
        providerLabel: state.user.providers.map((provider) => provider === "apple" ? "Apple" : provider === "google" ? "Google" : "Patternly").join(", "),
        status: accountDataNeedsAttention(state.accountData) ? "attention" : "authenticated",
      };
    case "signingOut":
    case "deleting":
      return {
        accountDataStatus: state.accountData.status,
        canOpenAccount: false,
        canSignOut: false,
        email: state.user.email,
        providerLabel: state.user.providers.map((provider) => provider === "apple" ? "Apple" : provider === "google" ? "Google" : "Patternly").join(", "),
        status: "busy",
      };
    case "deletionPending":
      return { accountDataStatus: state.status, canOpenAccount: true, canSignOut: false, email: state.user.email, status: "unavailable" };
    case "verificationPending":
      return { accountDataStatus: null, canOpenAccount: true, canSignOut: false, email: state.user.email, status: "verificationPending" };
    case "guestAccessBlocked":
      return { accountDataStatus: null, canOpenAccount: true, canSignOut: false, email: null, status: "guestAccessBlocked" };
    case "backendUnavailable":
    case "revokedSession":
      return { accountDataStatus: null, canOpenAccount: true, canSignOut: false, email: state.user.email, status: "unavailable" };
    case "loading":
    case "unavailable":
      return { accountDataStatus: null, canOpenAccount: false, canSignOut: false, email: null, status: "unavailable" };
  }
}
