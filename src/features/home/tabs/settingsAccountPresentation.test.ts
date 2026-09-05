import assert from "node:assert/strict";
import test from "node:test";

import type { AccountState } from "../../../application/account/AccountSessionProvider";
import { getSettingsAccountPresentation } from "./settingsAccountPresentation";

function authenticated(status: string, email: string | null = "learner@example.com", metadata: Readonly<{ blockingConflictCode?: string | null; lastFailureCode?: string | null; pendingMutationCount?: number }> = {}): AccountState {
  return {
    kind: "authenticated",
    accountData: {
      blockingConflictCode: null,
      lastFailureCode: null,
      pendingMutationCount: 0,
      status,
      ...metadata,
    },
    backendUser: { id: "backend-user" },
    user: { email, emailVerified: true, provider: "password", uid: "firebase-user" },
  } as unknown as AccountState;
}

test("Settings names guest and signed-out entry honestly and never offers guest sign-out", () => {
  assert.deepEqual(getSettingsAccountPresentation({ kind: "guest" }), {
    accountDataStatus: null,
    canOpenAccount: true,
    canSignOut: false,
    email: null,
    status: "guest",
  });
  assert.deepEqual(getSettingsAccountPresentation({ kind: "signedOut" }), {
    accountDataStatus: null,
    canOpenAccount: true,
    canSignOut: false,
    email: null,
    status: "signedOut",
  });
});

test("Settings preserves authenticated identity and distinguishes synchronized from repair states", () => {
  const synced = getSettingsAccountPresentation(authenticated("synced"));
  assert.equal(synced.status, "authenticated");
  assert.equal(synced.accountDataStatus, "synced");
  assert.equal(synced.email, "learner@example.com");
  assert.equal(synced.canSignOut, true);

  const pending = getSettingsAccountPresentation(authenticated("offlinePending"));
  assert.equal(pending.status, "attention");
  assert.equal(pending.accountDataStatus, "offlinePending");
  assert.equal(pending.canSignOut, true);

  const resumeRequired = getSettingsAccountPresentation(authenticated("resumeRequired", null));
  assert.equal(resumeRequired.status, "attention");
  assert.equal(resumeRequired.email, null);
  assert.equal(resumeRequired.canSignOut, true);
});

test("Settings treats synced account data with durable warnings as needing attention", () => {
  for (const metadata of [
    { lastFailureCode: "localDeletionFailure" },
    { pendingMutationCount: 1 },
    { blockingConflictCode: "account_revision_conflict" },
  ]) {
    const presentation = getSettingsAccountPresentation(authenticated("synced", "learner@example.com", metadata));
    assert.equal(presentation.status, "attention");
    assert.equal(presentation.canSignOut, true);
  }
  assert.equal(getSettingsAccountPresentation(authenticated("synced")).status, "authenticated");
});

test("Settings blocks invalid actions while account lifecycle work is busy and keeps recovery states available", () => {
  const signingOut = getSettingsAccountPresentation({
    accountData: { status: "synced" },
    backendUser: { id: "backend-user" },
    kind: "signingOut",
    user: { email: "learner@example.com", emailVerified: true, provider: "google", uid: "firebase-user" },
  } as unknown as AccountState);
  assert.equal(signingOut.status, "busy");
  assert.equal(signingOut.canOpenAccount, false);
  assert.equal(signingOut.canSignOut, false);

  const verification = getSettingsAccountPresentation({
    kind: "verificationPending",
    user: { email: "learner@example.com", emailVerified: false, provider: "password", uid: "firebase-user" },
  });
  assert.equal(verification.status, "verificationPending");
  assert.equal(verification.canOpenAccount, true);
  assert.equal(verification.canSignOut, false);

  const guestAccessBlocked = getSettingsAccountPresentation({ kind: "guestAccessBlocked" });
  assert.equal(guestAccessBlocked.status, "guestAccessBlocked");
  assert.equal(guestAccessBlocked.canOpenAccount, true);
  assert.equal(guestAccessBlocked.canSignOut, false);

  const unavailable = getSettingsAccountPresentation({ kind: "unavailable", reason: "public_environment_invalid" });
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.canOpenAccount, false);
});
