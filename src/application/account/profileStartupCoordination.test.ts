import assert from "node:assert/strict";
import test from "node:test";

import {
  AccountSessionGenerationStaleError,
  findMatchingLocalLogoutBlock,
  findPendingSessionRevocation,
  finishLocalSignOutSetupFailure,
  guardAuthenticatedScopeAgainstIncompleteSignOut,
  hasVerifiedLocalLogoutReceipt,
  isPreparedGuestChoiceRequired,
  lockAndCloseProfileAfterAuthLoss,
  performLocalAccountSignOut,
  prepareAuthenticatedProfileScope,
  prepareGuestProfileScope,
  providerCancellationAuthObserverDecision,
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

test("provisional provider cancellation returns to sign-in only when its blocked UID owns the null Auth event", () => {
  assert.deepEqual(providerCancellationAuthObserverDecision({ eventUid: null, authUid: null, cancellationUid: "provider-uid", ownerUid: "provider-uid" }), { action: "return_to_sign_in", cancellationUid: null });
  assert.deepEqual(providerCancellationAuthObserverDecision({ eventUid: null, authUid: null, cancellationUid: null, ownerUid: null }), { action: "restore_guest", cancellationUid: null });
  assert.deepEqual(providerCancellationAuthObserverDecision({ eventUid: null, authUid: null, cancellationUid: "other-uid", ownerUid: "provider-uid" }), { action: "restore_guest", cancellationUid: null });
  assert.deepEqual(providerCancellationAuthObserverDecision({ eventUid: null, authUid: null, cancellationUid: "provider-uid", ownerUid: null }), { action: "restore_guest", cancellationUid: null });
});

test("delayed null after sign-out promise resolution consumes the still-owned provider cancellation", () => {
  let cancellationUid: string | null = "provider-uid";
  const rejectedSignOut = providerCancellationAuthObserverDecision({ eventUid: null, authUid: cancellationUid, cancellationUid, ownerUid: cancellationUid });
  assert.equal(rejectedSignOut.action, "ignore_stale");
  assert.equal(rejectedSignOut.cancellationUid, cancellationUid);

  let authUid: string | null = "provider-uid";
  let blockedUid: string | null = "provider-uid";
  const signOutPromise = Promise.resolve().then(() => { authUid = null; });
  return signOutPromise.then(() => {
    // The callback is delivered after the SDK promise resolves, while the
    // blocked UID still owns the pending cancellation intent.
    const completedSignOut = providerCancellationAuthObserverDecision({ eventUid: null, authUid, cancellationUid, ownerUid: blockedUid });
    assert.deepEqual(completedSignOut, { action: "return_to_sign_in", cancellationUid: null });
    cancellationUid = completedSignOut.cancellationUid;
    blockedUid = null;
    assert.equal(cancellationUid, null);
    assert.equal(blockedUid, null);
  });
});

test("replacement sign-in invalidates cancellation intent before a delayed stale null callback", () => {
  const cancellationUid = "provider-uid";
  const replacementSignIn = providerCancellationAuthObserverDecision({ eventUid: "replacement-uid", authUid: "replacement-uid", cancellationUid, ownerUid: "provider-uid" });
  assert.equal(replacementSignIn.action, "handle_user");
  assert.equal(replacementSignIn.cancellationUid, null);

  const delayedNull = providerCancellationAuthObserverDecision({ eventUid: null, authUid: "replacement-uid", cancellationUid: replacementSignIn.cancellationUid, ownerUid: "replacement-uid" });
  assert.deepEqual(delayedNull, { action: "ignore_stale", cancellationUid: null });
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
    operationId: "00000000-0000-4000-8000-000000000001",
    persistBlock: async () => {
      operations.push("persist:verified");
      return { blocked: { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, completed: [], pending: [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }], version: 2 };
    },
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "signedOut");
  assert.deepEqual(operations, ["persist:verified", "publish:locked", "clear:cache", "close:scope", "firebase:signOut"]);
});

test("logout receipt validation requires the exact pending pair or completed receipt", () => {
  const pair = { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" };
  assert.equal(hasVerifiedLocalLogoutReceipt({ blocked: pair, completed: [], pending: [pair], version: 2 }, pair.uid, pair.operationId), true);
  assert.equal(hasVerifiedLocalLogoutReceipt({ blocked: null, completed: [pair], pending: [], version: 2 }, pair.uid, pair.operationId), true);
  assert.equal(hasVerifiedLocalLogoutReceipt({ blocked: pair, completed: [], pending: [], version: 2 }, pair.uid, pair.operationId), false);
  assert.equal(hasVerifiedLocalLogoutReceipt({ blocked: pair, completed: [], pending: [pair], version: 2 }, "uid-B", pair.operationId), false);
  assert.equal(hasVerifiedLocalLogoutReceipt({ blocked: pair, completed: [], pending: [pair], version: 2 }, pair.uid, "00000000-0000-4000-8000-000000000002"), false);
});

test("owned-cache cleanup failure is explicit after Firebase sign-out and never reports success", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    operationId: "00000000-0000-4000-8000-000000000001",
    persistBlock: async () => {
      operations.push("persist:verified");
      return { blocked: { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, completed: [], pending: [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }], version: 2 };
    },
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return false; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "localCleanupFailure");
  assert.deepEqual(operations, ["persist:verified", "publish:locked", "clear:cache", "close:scope", "firebase:signOut"]);
});

test("Firebase failure remains signOutPending even when owned-cache cleanup fails", async () => {
  const operations: string[] = [];
  const blocked = { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" };
  const outcome = await performLocalAccountSignOut({
    uid: blocked.uid,
    operationId: blocked.operationId,
    persistBlock: async () => ({ blocked, completed: [], pending: [blocked], version: 2 }),
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return false; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); throw new Error("offline"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "signOutPending");
  assert.deepEqual(operations, ["publish:locked", "clear:cache", "close:scope", "firebase:signOut"]);
});

test("failed local control write closes access and attempts Firebase sign-out but stays a failure", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    operationId: "00000000-0000-4000-8000-000000000001",
    persistBlock: async () => { operations.push("persist:uncertain"); throw new Error("write_failed"); },
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "localLogoutControlFailure");
  assert.deepEqual(operations, ["persist:uncertain", "publish:locked", "close:scope", "firebase:signOut"]);
});

test("SDK failure after an unverified control write remains signOutPending without cache cleanup", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    operationId: "00000000-0000-4000-8000-000000000001",
    persistBlock: async () => { operations.push("persist:uncertain"); throw new Error("write_failed"); },
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); throw new Error("offline"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "signOutPending");
  assert.deepEqual(operations, ["persist:uncertain", "publish:locked", "close:scope", "firebase:signOut"]);
});

test("retrying sign-out for the exact completed UID-operation receipt still clears local Auth", async () => {
  const pair = { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" };
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: pair.uid,
    operationId: pair.operationId,
    retainAuthOnControlFailure: true,
    // blockAndQueueRevoke returns its unchanged snapshot for an exact pair
    // already present in completed, with neither blocked nor pending set.
    persistBlock: async () => ({ blocked: null, completed: [pair], pending: [], version: 2 }),
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "signedOut");
  assert.deepEqual(operations, ["publish:locked", "clear:cache", "close:scope", "firebase:signOut"]);
});

test("a retained Auth retry rejects blocked receipts for a different UID or operation", async () => {
  const requested = { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" };
  const mismatchedSnapshots = [
    { blocked: { uid: "uid-B", operationId: requested.operationId }, completed: [], pending: [{ uid: "uid-B", operationId: requested.operationId }], version: 2 as const },
    { blocked: { uid: requested.uid, operationId: "00000000-0000-4000-8000-000000000002" }, completed: [], pending: [{ uid: requested.uid, operationId: "00000000-0000-4000-8000-000000000002" }], version: 2 as const },
    { blocked: requested, completed: [], pending: [], version: 2 as const },
    { blocked: null, completed: [{ uid: "uid-B", operationId: requested.operationId }], pending: [], version: 2 as const },
    { blocked: null, completed: [{ uid: requested.uid, operationId: "00000000-0000-4000-8000-000000000002" }], pending: [], version: 2 as const },
  ];

  for (const snapshot of mismatchedSnapshots) {
    const operations: string[] = [];
    const outcome = await performLocalAccountSignOut({
      ...requested,
      retainAuthOnControlFailure: true,
      persistBlock: async () => snapshot,
      publishLockedState: () => { operations.push("publish:locked"); },
      clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
      closeProfileStorage: () => { operations.push("close:scope"); },
      signOutFirebase: async () => { operations.push("firebase:signOut"); },
      isCurrent: () => true,
    });

    assert.equal(outcome, "localLogoutControlFailure");
    assert.deepEqual(operations, ["publish:locked", "close:scope"]);
  }
});

test("unverified local control read-back attempts Firebase sign-out only when no scoped marker is recoverable", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    operationId: "00000000-0000-4000-8000-000000000001",
    persistBlock: async () => ({ blocked: { uid: "uid-B", operationId: "00000000-0000-4000-8000-000000000002" }, completed: [], pending: [], version: 2 }),
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
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
    operationId: "00000000-0000-4000-8000-000000000001",
    retainAuthOnControlFailure: true,
    persistBlock: async () => { operations.push("persist:uncertain"); throw new Error("write_failed"); },
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "localLogoutControlFailure");
  assert.deepEqual(operations, ["persist:uncertain", "publish:locked", "close:scope"]);
});

test("restore locks only for a matching scoped logout marker missing from the control journal", () => {
  const marker = { accountId: "account-A", operationId: "00000000-0000-4000-8000-000000000001", status: "pending", lastFailureCode: null } as const;
  assert.equal(shouldLockForIncompleteScopedSignOut({ marker, authenticatedAccountId: "account-A", authUid: "uid-A", completed: [], pending: [] }), true);
  assert.equal(shouldLockForIncompleteScopedSignOut({ marker, authenticatedAccountId: "account-A", authUid: "uid-A", completed: [], pending: [{ uid: "uid-A", operationId: marker.operationId }] }), false);
  assert.equal(shouldLockForIncompleteScopedSignOut({ marker, authenticatedAccountId: "account-A", authUid: "uid-A", completed: [{ uid: "uid-A", operationId: marker.operationId }], pending: [] }), false);
  assert.equal(shouldLockForIncompleteScopedSignOut({ marker, authenticatedAccountId: "account-B", authUid: "uid-A", completed: [], pending: [] }), false);
});

test("pending remote revoke blocks profile preparation only for its matching Auth UID", () => {
  const pending = { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" };
  const snapshot = { blocked: null, completed: [], pending: [pending], version: 2 } as const;
  assert.deepEqual(findPendingSessionRevocation(snapshot, "uid-A"), pending);
  assert.equal(findPendingSessionRevocation(snapshot, "uid-B"), null);
});

test("authenticated scope checks and repairs incomplete logout before publishing profile preparation", async () => {
  const operations: string[] = [];
  const marker = { accountId: "account-A", operationId: "00000000-0000-4000-8000-000000000001", status: "pending", lastFailureCode: null } as const;
  const result = await guardAuthenticatedScopeAgainstIncompleteSignOut({
    accountId: "account-A",
    authUid: "uid-A",
    canContinue: () => true,
    completed: [],
    pending: [],
    readScopedSignOut: () => { operations.push("read:scoped-marker"); return marker; },
    clearScopedSignOut: () => { operations.push("clear:scoped-marker"); },
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
    completed: [],
    pending: [],
    readScopedSignOut: () => null,
    clearScopedSignOut: () => assert.fail("no marker should be cleared"),
    persistControlPair: async () => assert.fail("no marker should be repaired"),
    closeProfileStorage: () => assert.fail("the provider handles stale closure"),
    blockAuthObserver: () => assert.fail("stale Auth must not be blocked"),
    publishPending: () => assert.fail("stale Auth must not be published"),
  });
  assert.equal(result, "stale");
});

test("a completed revoke receipt clears the scoped marker before profile startup continues", async () => {
  const operations: string[] = [];
  const marker = { accountId: "account-A", operationId: "00000000-0000-4000-8000-000000000001", status: "pending", lastFailureCode: null } as const;
  const result = await guardAuthenticatedScopeAgainstIncompleteSignOut({
    accountId: "account-A",
    authUid: "uid-A",
    canContinue: () => true,
    completed: [{ uid: "uid-A", operationId: marker.operationId }],
    pending: [],
    readScopedSignOut: () => marker,
    clearScopedSignOut: () => { operations.push("clear:scoped-marker"); },
    persistControlPair: async () => assert.fail("completed operation must not be requeued"),
    closeProfileStorage: () => assert.fail("completed operation must not close the profile"),
    blockAuthObserver: () => assert.fail("completed operation must not block Auth"),
    publishPending: () => assert.fail("completed operation must not publish pending"),
  });

  assert.equal(result, "continue");
  assert.deepEqual(operations, ["clear:scoped-marker"]);
});

test("failed completed-marker cleanup keeps the authenticated profile closed", async () => {
  const operations: string[] = [];
  const marker = { accountId: "account-A", operationId: "00000000-0000-4000-8000-000000000001", status: "pending", lastFailureCode: null } as const;
  const result = await guardAuthenticatedScopeAgainstIncompleteSignOut({
    accountId: "account-A",
    authUid: "uid-A",
    canContinue: () => true,
    completed: [{ uid: "uid-A", operationId: marker.operationId }],
    pending: [],
    readScopedSignOut: () => marker,
    clearScopedSignOut: () => { throw new Error("remove_failed"); },
    persistControlPair: async () => assert.fail("completed operation must not be requeued"),
    closeProfileStorage: () => { operations.push("close"); },
    blockAuthObserver: () => { operations.push("block"); },
    publishPending: () => { operations.push("pending"); },
  });

  assert.equal(result, "blocked");
  assert.deepEqual(operations, ["block", "close", "pending"]);
});

test("a UID switch while fallback control persistence is pending closes only the captured scope", async () => {
  let current = true;
  const operations: string[] = [];
  const result = await finishLocalSignOutSetupFailure({
    uid: "uid-A",
    getOperationId: () => "00000000-0000-4000-8000-000000000001",
    isCurrent: () => current,
    persistFallbackControlPair: async () => {
      current = false;
      throw new Error("write_failed_after_uid_switch");
    },
    publishLockedState: () => { operations.push("publish:A"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
    closeProfileStorage: () => { operations.push("close:A"); },
    signOutFirebase: async () => { operations.push("signOut:current-auth"); },
  });
  assert.equal(result, "stale");
  assert.deepEqual(operations, ["close:A"]);
});

test("fallback setup failure never cleans cache from a blocked-only receipt", async () => {
  const operations: string[] = [];
  const pair = { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" };
  const result = await finishLocalSignOutSetupFailure({
    uid: pair.uid,
    getOperationId: () => pair.operationId,
    isCurrent: () => true,
    persistFallbackControlPair: async () => ({ blocked: pair, completed: [], pending: [], version: 2 }),
    retainAuthOnFailedControlWrite: true,
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); },
  });

  assert.equal(result, "localLogoutControlFailure");
  assert.deepEqual(operations, ["publish:locked", "close:scope"]);
});

test("stale sign-out completion closes its scope without publishing over the newer identity", async () => {
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    operationId: "00000000-0000-4000-8000-000000000001",
    persistBlock: async () => ({ blocked: { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }, completed: [], pending: [{ uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" }], version: 2 }),
    publishLockedState: () => { operations.push("publish:stale"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
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
    operationId: "00000000-0000-4000-8000-000000000001",
    persistBlock: async () => ({ blocked, completed: [], pending: [blocked], version: 2 }),
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => { operations.push("firebase:signOut"); throw new Error("offline"); },
    isCurrent: () => true,
  });

  assert.equal(outcome, "signOutPending");
  assert.equal(findMatchingLocalLogoutBlock({ blocked, completed: [], pending: [blocked], version: 2 }, "uid-A")?.operationId, blocked.operationId);
  assert.equal(findMatchingLocalLogoutBlock({ blocked, completed: [], pending: [blocked], version: 2 }, "uid-B"), null);
  assert.deepEqual(operations, ["publish:locked", "clear:cache", "close:scope", "firebase:signOut"]);
});

test("Auth rejection remains pending until durable local sign-out reports success", async () => {
  const blocked = { uid: "uid-A", operationId: "00000000-0000-4000-8000-000000000001" };
  const operations: string[] = [];
  const outcome = await performLocalAccountSignOut({
    uid: "uid-A",
    operationId: "00000000-0000-4000-8000-000000000001",
    persistBlock: async () => ({ blocked, completed: [], pending: [blocked], version: 2 }),
    publishLockedState: () => { operations.push("publish:locked"); },
    clearOwnedPremiumCache: () => { operations.push("clear:cache"); return true; },
    closeProfileStorage: () => { operations.push("close:scope"); },
    signOutFirebase: async () => {
      operations.push("firebase:signOut");
      throw new Error("observer_already_cleared_local_auth");
    },
    isCurrent: () => true,
  });

  assert.equal(outcome, "signOutPending");
  assert.deepEqual(operations, ["publish:locked", "clear:cache", "close:scope", "firebase:signOut"]);
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
