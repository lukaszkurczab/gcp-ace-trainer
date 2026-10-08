import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { AccountState } from "../../application/account/AccountSessionProvider";
import { getYourDataPresentation } from "./yourDataPresentation";

const user = { email: "learner@example.com", emailVerified: true, providers: ["password"] as const, uid: "firebase-user" };
const accountData = { blockingConflictCode: null, lastFailureCode: null, pendingMutationCount: 0, status: "synced" };

function state(kind: AccountState["kind"]): AccountState {
  switch (kind) {
    case "authenticated":
      return { accountData, backendUser: { id: "backend-user" }, kind, user } as unknown as AccountState;
    case "localOffline":
      return { accountData: { ...accountData, status: "offlinePending" }, accountId: "account-id", bindingRevision: 1, generation: { generation: 1, uid: user.uid }, kind, profile: { id: "profile-id", kind: "account", accountId: "account-id" }, profileLease: { generation: 1, profile: { id: "profile-id", kind: "account", accountId: "account-id" } }, user } as unknown as AccountState;
    case "guest":
    case "guestAccessBlocked":
    case "loading":
    case "profilePreparing":
      return kind === "profilePreparing" ? { kind, profile: { id: "guest-id", kind: "guest", accountId: null } } : { kind };
    case "signedOut":
    case "signingOut":
    case "deleting":
      return { kind } as AccountState;
    case "recoveryPending":
      return { kind };
    case "verificationPending":
    case "signOutPending":
      return { kind, user };
    case "providerRegistrationRequired":
      return { kind, user, generation: { generation: 1, uid: user.uid }, documents: { kind: "unavailable", reason: "locale" } };
    case "deletionPending":
      return { accountId: "account-id", failure: "remoteDeletionPending", kind, status: "remoteDeletionPending", user } as unknown as AccountState;
    case "backendUnavailable":
    case "reauthenticationRequired":
    case "revokedSession":
      return { kind, user };
    case "unavailable":
      return { kind, reason: "firebase_unconfigured" };
  }
}

test("Your data presents an explicit action/details/privacy matrix for every account state", () => {
  const expected: Readonly<Record<string, Readonly<{ action: string; icon: string; testID?: string; details: string; privacyRequests: boolean; reset: boolean; stateCopy: string }>>> = {
    authenticated: { action: "export", details: "account", icon: "database", privacyRequests: true, reset: true, stateCopy: "authenticated", testID: "account-data-export" },
    localOffline: { action: "none", details: "none", icon: "info-circle", privacyRequests: false, reset: false, stateCopy: "localOffline" },
    guest: { action: "guestPrivacy", details: "guest", icon: "mail", privacyRequests: false, reset: true, stateCopy: "guest", testID: "data-privacy-request" },
    signedOut: { action: "openAccount", details: "none", icon: "user", privacyRequests: false, reset: false, stateCopy: "signedOut", testID: "data-open-account" },
    guestAccessBlocked: { action: "openAccount", details: "none", icon: "user", privacyRequests: false, reset: false, stateCopy: "guestAccessBlocked", testID: "data-open-account" },
    recoveryPending: { action: "openAccount", details: "none", icon: "user", privacyRequests: false, reset: false, stateCopy: "recoveryPending", testID: "data-open-account" },
    verificationPending: { action: "openAccount", details: "none", icon: "user", privacyRequests: false, reset: false, stateCopy: "verificationPending", testID: "data-open-account" },
    providerRegistrationRequired: { action: "none", details: "none", icon: "info-circle", privacyRequests: false, reset: false, stateCopy: "providerRegistrationRequired" },
    loading: { action: "none", details: "none", icon: "info-circle", privacyRequests: false, reset: false, stateCopy: "loading" },
    profilePreparing: { action: "none", details: "none", icon: "info-circle", privacyRequests: false, reset: false, stateCopy: "loading" },
    deletionPending: { action: "retryDeletion", details: "none", icon: "trash", privacyRequests: false, reset: false, stateCopy: "deletionPending", testID: "data-retry-deletion" },
    signingOut: { action: "none", details: "none", icon: "info-circle", privacyRequests: false, reset: false, stateCopy: "signingOut" },
    deleting: { action: "none", details: "none", icon: "info-circle", privacyRequests: false, reset: false, stateCopy: "deleting" },
    backendUnavailable: { action: "retryIdentity", details: "none", icon: "rotate-ccw", privacyRequests: false, reset: false, stateCopy: "backendUnavailable", testID: "data-retry-identity" },
    reauthenticationRequired: { action: "signOut", details: "none", icon: "user", privacyRequests: false, reset: false, stateCopy: "reauthenticationRequired", testID: "data-sign-out" },
    revokedSession: { action: "signOut", details: "none", icon: "user", privacyRequests: false, reset: false, stateCopy: "revokedSession", testID: "data-sign-out" },
    signOutPending: { action: "signOut", details: "none", icon: "user", privacyRequests: false, reset: false, stateCopy: "signOutPending", testID: "data-sign-out" },
  };

  for (const [kind, expectation] of Object.entries(expected)) {
    const actual = getYourDataPresentation(state(kind as AccountState["kind"]));
    assert.deepEqual(actual, {
      action: { kind: expectation.action, icon: expectation.icon, ...(expectation.testID === undefined ? {} : { testID: expectation.testID }) },
      details: expectation.details,
      privacyRequests: expectation.privacyRequests,
      reset: expectation.reset ? { kind: "localReset", icon: "trash", testID: "data-local-reset" } : null,
      stateCopy: expectation.stateCopy,
    }, kind);
  }
});

test("Your data distinguishes the timeout recovery action from other unavailable reasons", () => {
  assert.deepEqual(getYourDataPresentation({ kind: "unavailable", reason: "auth_restore_timeout" }), {
    action: { kind: "retryRestore", icon: "rotate-ccw", testID: "data-retry-restore" },
    details: "none",
    privacyRequests: false,
    reset: null,
    stateCopy: "authRestoreTimeout",
  });

  for (const reason of ["firebase_unconfigured", "public_environment_unconfigured", "public_environment_invalid"] as const) {
    const presentation = getYourDataPresentation({ kind: "unavailable", reason });
    assert.equal(presentation.action.kind, "none", reason);
    assert.equal(presentation.action.testID, undefined, reason);
    assert.equal(presentation.details, "none", reason);
    assert.equal(presentation.privacyRequests, false, reason);
  }
});

test("Your data keeps details and privacy access exclusive to authenticated and exact guest states", () => {
  assert.deepEqual(getYourDataPresentation(state("authenticated")), {
    action: { kind: "export", icon: "database", testID: "account-data-export" },
    details: "account",
    privacyRequests: true,
    reset: { kind: "localReset", icon: "trash", testID: "data-local-reset" },
    stateCopy: "authenticated",
  });
  assert.deepEqual(getYourDataPresentation(state("guest")), {
    action: { kind: "guestPrivacy", icon: "mail", testID: "data-privacy-request" },
    details: "guest",
    privacyRequests: false,
    reset: { kind: "localReset", icon: "trash", testID: "data-local-reset" },
    stateCopy: "guest",
  });

  for (const kind of ["signedOut", "guestAccessBlocked", "recoveryPending", "verificationPending", "providerRegistrationRequired", "loading", "deletionPending", "signingOut", "deleting", "backendUnavailable", "revokedSession", "signOutPending"] as const) {
    const presentation = getYourDataPresentation(state(kind));
    assert.equal(presentation.details, "none", kind);
    assert.equal(presentation.privacyRequests, false, kind);
    assert.equal(presentation.reset, null, kind);
  }
});

test("recovery-pending and local-offline copy exist in every supported data locale", () => {
  const locales = ["en", "pl", "de", "es", "fr", "it", "et"] as const;
  const entries = locales.map((locale) => {
    const data = JSON.parse(readFileSync(`src/locales/${locale}/data.json`, "utf8")) as {
      state: Record<string, { title: string; body: string }> & {
        localOffline: { title: string; body: string };
        recoveryPending: { title: string; body: string };
      };
    };
    return { locale, state: data.state };
  });
  const english = entries[0];
  assert.ok(english);
  const englishStateKeys = Object.keys(english.state).sort();

  assert.deepEqual(english.state.recoveryPending, {
    title: "Finish account recovery",
    body: "A saved recovery step needs your attention before we open your data.",
  });
  assert.deepEqual(english.state.localOffline, {
    title: "Account data on this device",
    body: "Your saved learning stays on this device. Reconnect to check your account before syncing changes or using account data actions.",
  });
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry.state).sort(), englishStateKeys, entry.locale);
    assert.ok(entry.state.recoveryPending.title.trim().length > 0, entry.locale);
    assert.ok(entry.state.recoveryPending.body.trim().length > 0, entry.locale);
    assert.ok(entry.state.localOffline.title.trim().length > 0, entry.locale);
    assert.ok(entry.state.localOffline.body.trim().length > 0, entry.locale);
  }
});
