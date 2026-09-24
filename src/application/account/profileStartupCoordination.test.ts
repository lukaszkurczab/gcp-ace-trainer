import assert from "node:assert/strict";
import test from "node:test";

import {
  AccountSessionGenerationStaleError,
  isPreparedGuestChoiceRequired,
  lockAndCloseProfileAfterAuthLoss,
  prepareAuthenticatedProfileScope,
  prepareGuestProfileScope,
  recoverAfterGuestPreparationFailure,
  shouldRejectPersistedAuthRestore,
  shouldShowGuestSelectionLoading,
} from "./profileStartupCoordination";
import type { MeResponseDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import type { StorageProfile } from "../../infrastructure/storage/profileStorageRouter";

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

test("ambiguous saved Guest profiles are reported as a choice requirement", () => {
  assert.equal(isPreparedGuestChoiceRequired(new Error("prepared_guest_choice_required")), true);
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
