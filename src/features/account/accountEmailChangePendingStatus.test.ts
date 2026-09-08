import assert from "node:assert/strict";
import test from "node:test";

import type { AccountState } from "../../application/account/AccountSessionProvider";
import { getAccountEmailChangePendingStatus } from "./accountEmailChangePendingStatus";

function authenticated(input: Readonly<{
  backendEmail: string | null;
  backendEmailVerified?: boolean;
  firebaseEmail: string | null;
  firebaseEmailVerified?: boolean;
  uid?: string;
}>): AccountState {
  return {
    kind: "authenticated",
    backendUser: {
      acceptedTermsVersion: null,
      createdAt: "2026-09-08T00:00:00.000Z",
      id: "account-a",
      identity: {
        email: input.backendEmail,
        emailVerified: input.backendEmailVerified ?? true,
        provider: "password",
        subject: "subject-a",
      },
    },
    accountData: {} as never,
    user: {
      email: input.firebaseEmail,
      emailVerified: input.firebaseEmailVerified ?? true,
      providers: ["password"],
      uid: input.uid ?? "uid-a",
    },
  } as unknown as AccountState;
}

test("pending status waits while the target is not reflected by both identity sources", () => {
  assert.equal(getAccountEmailChangePendingStatus({
    currentState: authenticated({ backendEmail: "old@example.com", firebaseEmail: "old@example.com" }),
    expectedUid: "uid-a",
    refreshFailure: null,
    requestedEmail: "  New@Example.com ",
  }), "waiting");
});

test("pending status confirms only matching verified Firebase and backend identities", () => {
  assert.equal(getAccountEmailChangePendingStatus({
    currentState: authenticated({ backendEmail: "NEW@example.com", firebaseEmail: "new@example.com" }),
    expectedUid: "uid-a",
    refreshFailure: null,
    requestedEmail: " New@Example.com ",
  }), "confirmed");
});

test("one-sided email or verification agreement remains waiting", () => {
  const cases = [
    authenticated({ backendEmail: "old@example.com", firebaseEmail: "new@example.com" }),
    authenticated({ backendEmail: "new@example.com", firebaseEmail: "new@example.com", firebaseEmailVerified: false }),
    authenticated({ backendEmail: "new@example.com", backendEmailVerified: false, firebaseEmail: "new@example.com" }),
    authenticated({ backendEmail: "new@example.com", firebaseEmail: "old@example.com" }),
  ];
  for (const currentState of cases) {
    assert.equal(getAccountEmailChangePendingStatus({ currentState, expectedUid: "uid-a", refreshFailure: null, requestedEmail: "new@example.com" }), "waiting");
  }
});

test("a different authenticated UID is unavailable and does not expose the old request as success", () => {
  assert.equal(getAccountEmailChangePendingStatus({
    currentState: authenticated({ backendEmail: "new@example.com", firebaseEmail: "new@example.com", uid: "uid-b" }),
    expectedUid: "uid-a",
    refreshFailure: null,
    requestedEmail: "new@example.com",
  }), "unavailable");
});

test("refresh failure takes priority over matching cached identity data", () => {
  assert.equal(getAccountEmailChangePendingStatus({
    currentState: authenticated({ backendEmail: "new@example.com", firebaseEmail: "new@example.com" }),
    expectedUid: "uid-a",
    refreshFailure: "offline",
    requestedEmail: "new@example.com",
  }), "refreshError");
});
