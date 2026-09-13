import type { AccountState } from "../../application/account/AccountSessionProvider";
import type { IconName } from "../../components/Icon";

export type YourDataActionKind = "export" | "guestSupport" | "openAccount" | "retryRestore" | "retryDeletion" | "retryIdentity" | "signOut" | "none";
export type YourDataDetailsAudience = "account" | "guest" | "none";
export type YourDataStateCopy =
  | "authenticated"
  | "guest"
  | "signedOut"
  | "guestAccessBlocked"
  | "verificationPending"
  | "loading"
  | "authRestoreTimeout"
  | "firebaseUnconfigured"
  | "publicEnvironmentUnconfigured"
  | "publicEnvironmentInvalid"
  | "deletionPending"
  | "signingOut"
  | "deleting"
  | "backendUnavailable"
  | "revokedSession";

export type YourDataAction = Readonly<{
  kind: YourDataActionKind;
  icon: IconName;
  testID?: string;
}>;

export type YourDataResetAction = Readonly<{
  kind: "localReset";
  icon: IconName;
  testID: "data-local-reset";
}>;

export type YourDataPresentation = Readonly<{
  action: YourDataAction;
  details: YourDataDetailsAudience;
  privacyRequests: boolean;
  reset: YourDataResetAction | null;
  stateCopy: YourDataStateCopy;
}>;

export function getYourDataPresentation(state: AccountState): YourDataPresentation {
  switch (state.kind) {
    case "authenticated":
      return presentation("authenticated", "export", "database", "account-data-export", "account", true);
    case "guest":
      return presentation("guest", "guestSupport", "mail", "data-privacy-support", "guest", false);
    case "signedOut":
      return presentation("signedOut", "openAccount", "user", "data-open-account", "none", false);
    case "guestAccessBlocked":
      return presentation("guestAccessBlocked", "openAccount", "user", "data-open-account", "none", false);
    case "verificationPending":
      return presentation("verificationPending", "openAccount", "user", "data-open-account", "none", false);
    case "loading":
      return presentation("loading", "none", "info-circle", undefined, "none", false);
    case "unavailable":
      return unavailablePresentation(state.reason);
    case "deletionPending":
      return presentation("deletionPending", "retryDeletion", "trash", "data-retry-deletion", "none", false);
    case "signingOut":
      return presentation("signingOut", "none", "info-circle", undefined, "none", false);
    case "deleting":
      return presentation("deleting", "none", "info-circle", undefined, "none", false);
    case "backendUnavailable":
      return presentation("backendUnavailable", "retryIdentity", "rotate-ccw", "data-retry-identity", "none", false);
    case "revokedSession":
      return presentation("revokedSession", "signOut", "user", "data-sign-out", "none", false);
    case "signOutPending":
      return presentation("revokedSession", "signOut", "user", "data-sign-out", "none", false);
  }
  return assertNever(state);
}

function unavailablePresentation(reason: Extract<AccountState, { kind: "unavailable" }>["reason"]): YourDataPresentation {
  switch (reason) {
    case "auth_restore_timeout":
      return presentation("authRestoreTimeout", "retryRestore", "rotate-ccw", "data-retry-restore", "none", false);
    case "firebase_unconfigured":
      return presentation("firebaseUnconfigured", "none", "info-circle", undefined, "none", false);
    case "public_environment_unconfigured":
      return presentation("publicEnvironmentUnconfigured", "none", "info-circle", undefined, "none", false);
    case "public_environment_invalid":
      return presentation("publicEnvironmentInvalid", "none", "info-circle", undefined, "none", false);
  }
  return assertNever(reason);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Your data account state: ${String(value)}`);
}

function presentation(stateCopy: YourDataStateCopy, action: YourDataActionKind, icon: IconName, testID: string | undefined, details: YourDataDetailsAudience, privacyRequests: boolean): YourDataPresentation {
  return Object.freeze({
    action: Object.freeze({ kind: action, icon, ...(testID === undefined ? {} : { testID }) }),
    details,
    privacyRequests,
    reset: stateCopy === "authenticated" || stateCopy === "guest" ? Object.freeze({ kind: "localReset" as const, icon: "trash" as const, testID: "data-local-reset" as const }) : null,
    stateCopy,
  });
}
