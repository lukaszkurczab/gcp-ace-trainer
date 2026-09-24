import assert from "node:assert/strict";
import test from "node:test";

import {
  AccountSessionGenerationStaleError,
  findMatchingLocalLogoutBlock,
  finishLocalSignOutSetupFailure,
  guardAuthenticatedScopeAgainstIncompleteSignOut,
  isPreparedGuestChoiceRequired,
  lockAndCloseProfileAfterAuthLoss,
  performLocalAccountSignOut,
  prepareAuthenticatedProfileScope,
  prepareGuestProfileScope,
  recoverAfterGuestPreparationFailure,
  shouldLockForIncompleteScopedSignOut,
  shouldRejectPersistedAuthRestore,
  shouldShowGuestSelectionLoading,
} from "./profileStartupCoordination";
import type { MeResponseDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { ProfileStorageError, type StorageProfile } from "../../infrastructure/storage/profileStorageRouter";

const accountProfile: StorageProfile = Object.freeze({ id: "account-profile", kind: "account", accountId: "backend-account" });
const guestProfile: StorageProfile = Object.freeze({ id: "guest-profile", kind: "guest", accountId: null });

test("restored Auth resolves /me before selecting and activating its exact account scope", async () => {
  const operations: string[] = [];
  const profile = await prepareAuthenticatedProfileScope({
    canContinue: () => true,
    prepareStorage: async () => { operations.push("prepare"); },
    getMe: async () => {
      operations.push("me");
      return { user: { id: "backend-account" } } as MeResponseDto;
    },
    selectAccount: async (accountId, canContinue) => {
      operations.push(`select:${accountId}:${canContinue()}`);
      return { profile: accountProfile };
    },
    activate: (selected) => { operations.push(`activate:${selected.id}`); },
  });

  assert.equal(profile.id, accountProfile.id);
  assert.deepEqual(operations, ["prepare", "me", "select:backend-account:true", "activate:account-profile"]);
});

test("UID change while /me is pending prevents account selection and activation", async () => {
  const operations: string[] = [];
  let current = true;
  await assert.rejects(() => prepareAuthenticatedProfileScope({
    canContinue: () => current,
    prepareStorage: async () => { operations.push("prepare"); },
    getMe: async () => {
      operations.push("me");
      current = false;
      return { user: { id: "stale-account" } } as MeResponseDto;
    },
    selectAccount: async () => { operations.push("select"); return { profile: accountProfile }; },
    activate: () => { operations.push("activate"); },
  }), AccountSessionGenerationStaleError);

  assert.deepEqual(operations, ["prepare", "me"]);
});

test("/me failure leaves prepared storage closed without selecting a profile", async () => {
  const operations: string[] = [];
  await assert.rejects(() => prepareAuthenticatedProfileScope({
    canContinue: () => true,
    prepareStorage: async () => { operations.push("prepare"); },
    getMe: async () => { operations.push("me"); throw new Error("backend_unavailable"); },
    selectAccount: async () => { operations.push("select"); return { profile: accountProfile }; },
    activate: () => { operations.push("activate"); },
  }), /backend_unavailable/u);

  assert.deepEqual(operations, ["prepare", "me"]);
});

test("only a current restored account_not_found signs out persisted Auth", () => {
  assert.equal(shouldRejectPersistedAuthRestore({ failure: "accountNotFound", isRestoredAuthEvent: true, isCurrentGeneration: true }), true);
  assert.equal(shouldRejectPersistedAuthRestore({ failure: "accountNotFound", isRestoredAuthEvent: false, isCurrentGeneration: true }), false);
  assert.equal(shouldRejectPersistedAuthRestore({ failure: "accountNotFound", isRestoredAuthEvent: true, isCurrentGeneration: false }), false);
  assert.equal(shouldRejectPersistedAuthRestore({ failure: "backendUnavailable", isRestoredAuthEvent: true, isCurrentGeneration: true }), false);
});

test("Auth loss locks the rendered account state before closing its profile scope", () => {
  const operations: string[] = [];
  lockAndCloseProfileAfterAuthLoss({
    publishLockedState: () => { operations.push("publish:signedOut"); },
    closeProfileStorage: () => { operations.push("close:profile"); },
  });

  assert.deepEqual(operations, ["publish:signedOut", "close:profile"]);
});

test("local account sign-out verifies the durable block before locking, closing, and calling Firebase", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    persistBlock: async () => {
      operations.push("persist:verified");
      return { blocked: { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, pending: [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }], version: 1 };
    },
    publishLockedState: () => { operations.push("publish:locked"); },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "signedOut");
  assert.deepEqual(operations, ["persist:verified", "publish:locked", "close:scope", "firebase:signOut"]);
});

test("failed local control write closes access and attempts Firebase sign-out but stays a failure", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    persistBlock: async () => { operations.push("persist:uncertain"); throw new Error("write_failed"); },
    publishLockedState: () => { operations.push("publish:locked"); },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "localLogoutControlFailure");
  assert.deepEqual(operations, ["persist:uncertain", "publish:locked", "close:scope", "firebase:signOut"]);
});

test("unverified local control read-back attempts Firebase sign-out only when no scoped marker is recoverable", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    persistBlock: async () => ({ blocked: { uid: "uid-B", operationId: "00000000-0000-4000-8000-000000000002" }, pending: [], version: 1 }),
    publishLockedState: () => { operations.push("publish:locked"); },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => true,
  });
  assert.equal(outcome, "localLogoutControlFailure");
  assert.deepEqual(operations, ["publish:locked", "close:scope", "firebase:signOut"]);
});

test("when a scoped operation is durable, control-write failure retains Auth for a recoverable retry", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    retainAuthOnControlFailure: true,
    persistBlock: async () => { operations.push("persist:uncertain"); throw new Error("write_failed"); },
    publishLockedState: () => { operations.push("publish:locked"); },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "localLogoutControlFailure");
  assert.deepEqual(operations, ["persist:uncertain", "publish:locked", "close:scope"]);
});

test("restore locks only for a matching scoped logout marker missing from the control journal", () => {
  const marker = { accountId: "account-A", operationId: "00000000-0000-4000-8000-000000000001", status: "pending", lastFailureCode: null } as const;
  assert.equal(shouldLockForIncompleteScopedSignOut({ marker, authenticatedAccountId: "account-A", authUid: "uid-A", pending: [] }), true);
  assert.equal(shouldLockForIncompleteScopedSignOut({ marker, authenticatedAccountId: "account-A", authUid: "uid-A", pending: [{ uid: "uid-A", operationId: marker.operationId }] }), false);
  assert.equal(shouldLockForIncompleteScopedSignOut({ marker, authenticatedAccountId: "account-B", authUid: "uid-A", pending: [] }), false);
});

test("authenticated scope checks and repairs incomplete logout before publishing profile preparation", async () => {
  const operations: string[] = [];
  const marker = { accountId: "account-A", operationId: "00000000-0000-4000-8000-000000000001", status: "pending", lastFailureCode: null } as const;
  const result = await guardAuthenticatedScopeAgainstIncompleteSignOut({
    accountId: "account-A",
    authUid: "uid-A",
    canContinue: () => true,
    pending: [],
    readScopedSignOut: () => { operations.push("read:scoped-marker"); return marker; },
    persistControlPair: async (operationId) => { operations.push(`persist:${operationId}`); },
    closeProfileStorage: () => { operations.push("close:scope"); },
    blockAuthObserver: (uid) => { operations.push(`block:${uid}`); },
    publishPending: (operationId) => { operations.push(`publish:pending:${operationId}`); },
  });

  assert.equal(result, "blocked");
  assert.deepEqual(operations, [
    "read:scoped-marker",
    "persist:00000000-0000-4000-8000-000000000001",
    "block:uid-A",
    "close:scope",
    "publish:pending:00000000-0000-4000-8000-000000000001",
  ]);
});

test("scope guard rechecks Auth generation after reading an absent marker", async () => {
  let checks = 0;
  const result = await guardAuthenticatedScopeAgainstIncompleteSignOut({
    accountId: "account-A",
    authUid: "uid-A",
    canContinue: () => ++checks === 1,
    pending: [],
    readScopedSignOut: () => null,
    persistControlPair: async () => assert.fail("no marker should be repaired"),
    closeProfileStorage: () => assert.fail("the provider handles stale closure"),
    blockAuthObserver: () => assert.fail("stale Auth must not be blocked"),
    publishPending: () => assert.fail("stale Auth must not be published"),
  });
  assert.equal(result, "stale");
});

test("a UID switch while fallback control persistence is pending closes only the captured scope", async () => {
  let current = true;
  const operations: string[] = [];
  const result = await finishLocalSignOutSetupFailure({
    isCurrent: () => current,
    persistFallbackControlPair: async () => {
      current = false;
      throw new Error("write_failed_after_uid_switch");
    },
    publishLockedState: () => { operations.push("publish:A"); },
    closeProfileStorage: () => { operations.push("close:A"); },
    signOutFirebase: async () => { operations.push("signOut:current-auth"); },
  });
  assert.equal(result, "stale");
  assert.deepEqual(operations, ["close:A"]);
});

test("stale sign-out completion closes its scope without publishing over the newer identity", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    persistBlock: async () => ({ blocked: { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, pending: [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }], version: 1 }),
    publishLockedState: () => { operations.push("publish:stale"); },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => false,
  });

  assert.equal(outcome, "stale");
  assert.deepEqual(operations, ["close:scope"]);
});

test("Firebase sign-out failure retains the matching block for manual retry", async () => {
  const blocked = { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" };
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    persistBlock: async () => ({ blocked, pending: [blocked], version: 1 }),
    publishLockedState: () => { operations.push("publish:locked"); },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); throw new Error("offline"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "signOutPending");
  assert.equal(findMatchingLocalLogoutBlock({ blocked, pending: [blocked], version: 1 }, "uid-A")?.operationId, blocked.operationId);
  assert.equal(findMatchingLocalLogoutBlock({ blocked, pending: [blocked], version: 1 }, "uid-B"), null);
  assert.deepEqual(operations, ["publish:locked", "close:scope", "firebase:signOut"]);
});

test("ambiguous saved Guest profiles are reported as a choice requirement", () => {
  assert.equal(isPreparedGuestChoiceRequired(new ProfileStorageError("prepared_guest_choice_required")), true);
  assert.equal(isPreparedGuestChoiceRequired(new Error("prepared_guest_choice_required")), false);
  assert.equal(isPreparedGuestChoiceRequired(new Error("provider_unavailable")), false);
  assert.equal(isPreparedGuestChoiceRequired("prepared_guest_choice_required"), false);
});

test("guest preparation failure closes the scope and returns to signed-out login", () => {
  const operations: string[] = [];
  recoverAfterGuestPreparationFailure({
    closeProfileStorage: () => { operations.push("close:profile"); },
    setAccountEntryMode: () => { operations.push("entry:login"); },
    publishSignedOut: () => { operations.push("state:signedOut"); },
  });

  assert.deepEqual(operations, ["close:profile", "entry:login", "state:signedOut"]);
});

test("Guest selection keeps the signed-out account entry mounted when no scope is active", () => {
  assert.equal(shouldShowGuestSelectionLoading(null), false);
  assert.equal(shouldShowGuestSelectionLoading(accountProfile), true);
});

test("restored Guest validates persisted access before selecting or activating its scope", async () => {
  const operations: string[] = [];
  const profile = await prepareGuestProfileScope({
    allowNewSelection: false,
    canContinue: () => true,
    isFreshInstallation: false,
    validatePersistedAccess: async () => { operations.push("validate"); return true; },
    selectGuest: async () => { operations.push("select"); return { profile: guestProfile }; },
    activate: (selected) => { operations.push(`activate:${selected.id}`); },
  });

  assert.equal(profile?.id, guestProfile.id);
  assert.deepEqual(operations, ["validate", "select", "activate:guest-profile"]);
});

test("invalid restored Guest access stays closed", async () => {
  const operations: string[] = [];
  const profile = await prepareGuestProfileScope({
    allowNewSelection: false,
    canContinue: () => true,
    isFreshInstallation: false,
    validatePersistedAccess: async () => { operations.push("validate"); return false; },
    selectGuest: async () => { operations.push("select"); return { profile: guestProfile }; },
    activate: () => { operations.push("activate"); },
  });

  assert.equal(profile, null);
  assert.deepEqual(operations, ["validate"]);
});

test("fresh installation opens Guest only after explicit choice", async () => {
  const operations: string[] = [];
  const profile = await prepareGuestProfileScope({
    allowNewSelection: true,
    canContinue: () => true,
    isFreshInstallation: true,
    validatePersistedAccess: async () => { operations.push("validate"); return false; },
    selectGuest: async () => { operations.push("explicit-select"); return { profile: guestProfile }; },
    activate: (selected) => { operations.push(`activate:${selected.id}`); },
  });

  assert.equal(profile?.id, guestProfile.id);
  assert.deepEqual(operations, ["explicit-select", "activate:guest-profile"]);
});
