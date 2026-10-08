import assert from "node:assert/strict";
import test from "node:test";
import { captureExactMissingActorAnchor, captureExactMissingActorFence, captureExactMissingActorFenceAtConfirmation } from "./exactMissingActorFence";
import type { StorageProfile } from "../infrastructure/storage/profileStorageRouter";
import type { GuestInstallation } from "../storage/repositories/guestInstallationRepository";

const installation = Object.freeze({
  installationId: "11111111-1111-4111-8111-111111111111",
  localDatasetId: "22222222-2222-4222-8222-222222222222",
  bindingState: "guest" as const,
  accountId: null,
});

for (const kind of ["guest", "legacy_guest"] as const) {
  test(`captures a current ${kind} exact-missing confirmation without requiring account auth`, async () => {
    const profile = Object.freeze({ id: installation.localDatasetId, kind, accountId: null });
    const storage = {};
    let actorKind: "guest" | "authenticated" | "other" = "guest";
    let currentProfile: StorageProfile = profile;
    let currentStorage = storage;
    let currentInstallation: GuestInstallation = installation;
    let access = true;
    const fence = await captureExactMissingActorFence({
      actorKind,
      currentActorKind: () => actorKind,
      profile,
      currentProfile: () => currentProfile,
      storage,
      currentStorage: () => currentStorage,
      readGuestInstallation: async () => currentInstallation,
      hasGuestAccess: () => access,
    });
    assert.ok(fence);
    assert.equal(await fence.isCurrent(), true);

    actorKind = "authenticated";
    assert.equal(await fence.isCurrent(), false);
    actorKind = "guest";
    currentProfile = { ...profile };
    assert.equal(await fence.isCurrent(), true, "a fresh profile value with the same identity remains the anchored profile");
    currentProfile = { ...profile, id: "33333333-3333-4333-8333-333333333333" };
    assert.equal(await fence.isCurrent(), false);
    currentProfile = profile;
    currentInstallation = { ...installation, installationId: "33333333-3333-4333-8333-333333333333" };
    assert.equal(await fence.isCurrent(), false);
    currentInstallation = installation;
    currentStorage = {};
    assert.equal(await fence.isCurrent(), false);
    currentStorage = storage;
    access = false;
    assert.equal(await fence.isCurrent(), false);
  });
}

test("authenticated exact-missing confirmation keeps its SDK/session and exact profile/storage fences", async () => {
  const profile = Object.freeze({ id: "account-profile", kind: "account" as const, accountId: "account-id" });
  const storage = {};
  let actorKind: "guest" | "authenticated" | "other" = "authenticated";
  let currentProfile: StorageProfile = profile;
  let currentStorage = storage;
  let sdkGenerationCurrent = true;
  const fence = await captureExactMissingActorFence({
    actorKind,
    currentActorKind: () => actorKind,
    profile,
    currentProfile: () => currentProfile,
    storage,
    currentStorage: () => currentStorage,
    isCurrentAccountActor: () => sdkGenerationCurrent,
  });
  assert.ok(fence);
  assert.equal(fence.isCurrent(), true);
  sdkGenerationCurrent = false;
  assert.equal(fence.isCurrent(), false);
  sdkGenerationCurrent = true;
  actorKind = "guest";
  assert.equal(fence.isCurrent(), false);
  actorKind = "authenticated";
  currentProfile = { ...profile };
  assert.equal(fence.isCurrent(), true, "same profile identity survives a fresh profile value");
  currentProfile = { ...profile, id: "other-profile" };
  assert.equal(fence.isCurrent(), false);
  currentProfile = profile;
  currentStorage = {};
  assert.equal(fence.isCurrent(), false);
});

test("unavailable, signed-out, or mismatched local profiles cannot capture an abandonment fence", async () => {
  const storage = {};
  const guestProfile = { id: installation.localDatasetId, kind: "guest" as const, accountId: null };
  const common = {
    currentActorKind: () => "guest" as const,
    profile: guestProfile,
    currentProfile: () => guestProfile,
    storage,
    currentStorage: () => storage,
    readGuestInstallation: async () => installation,
    hasGuestAccess: () => true,
  };
  assert.equal(await captureExactMissingActorFence({ ...common, actorKind: "other" }), null);
  assert.equal(await captureExactMissingActorFence({ ...common, actorKind: "guest", profile: { ...guestProfile, accountId: "bound-account" } }), null);
  assert.equal(await captureExactMissingActorFence({ ...common, actorKind: "guest", readGuestInstallation: async () => ({ ...installation, bindingState: "adoption_pending" }) }), null);
});

test("account confirmation captures a fresh actor after bootstrap without depending on the earlier React state", async () => {
  const profile = Object.freeze({ id: "account-profile", kind: "account" as const, accountId: "account-id" });
  const storage = {};
  const anchor = await captureExactMissingActorAnchor({ profile, storage, readGuestInstallation: async () => null, hasGuestAccess: () => false });
  assert.ok(anchor);

  let accountIdentityCurrent = true;
  const fresh = await captureExactMissingActorFenceAtConfirmation({
    anchor,
    actorKind: "authenticated",
    currentActorKind: () => "authenticated",
    currentProfile: () => ({ ...profile }),
    currentStorage: () => storage,
    captureCurrentAuthenticatedActorFence: () => ({ isCurrent: () => accountIdentityCurrent }),
    readGuestInstallation: async () => null,
    hasGuestAccess: () => false,
  });
  assert.ok(fresh, "a previously transitional AccountState does not poison later explicit confirmation");
  assert.equal(fresh.isCurrent(), true);
  accountIdentityCurrent = false;
  assert.equal(fresh.isCurrent(), false, "the provider identity/generation fence remains live through journal preflight");
});

test("fresh account confirmation rejects a changed actor, profile, or storage anchor", async () => {
  const profile = Object.freeze({ id: "account-profile", kind: "account" as const, accountId: "account-id" });
  const storage = {};
  const anchor = await captureExactMissingActorAnchor({ profile, storage, readGuestInstallation: async () => null, hasGuestAccess: () => false });
  assert.ok(anchor);
  const common = {
    anchor,
    currentActorKind: () => "authenticated" as const,
    currentProfile: () => profile,
    currentStorage: () => storage,
    captureCurrentAuthenticatedActorFence: () => ({ isCurrent: () => true }),
    readGuestInstallation: async () => null,
    hasGuestAccess: () => false,
  };
  assert.equal(await captureExactMissingActorFenceAtConfirmation({ ...common, actorKind: "guest" }), null);
  assert.equal(await captureExactMissingActorFenceAtConfirmation({ ...common, actorKind: "authenticated", currentProfile: () => ({ ...profile, id: "other-profile" }) }), null);
  assert.equal(await captureExactMissingActorFenceAtConfirmation({ ...common, actorKind: "authenticated", currentProfile: () => ({ ...profile, accountId: "other-account" }) }), null);
  assert.equal(await captureExactMissingActorFenceAtConfirmation({ ...common, actorKind: "authenticated", currentStorage: () => ({}) }), null);
});

test("Guest confirmation remains anchored to the bootstrap installation, dataset, binding, and access", async () => {
  for (const kind of ["guest", "legacy_guest"] as const) {
    const profile = Object.freeze({ id: installation.localDatasetId, kind, accountId: null });
    const storage = {};
    const anchor = await captureExactMissingActorAnchor({ profile, storage, readGuestInstallation: async () => installation, hasGuestAccess: () => true });
    assert.ok(anchor);
    let current: GuestInstallation = installation;
    let access = true;
    const common = {
      anchor,
      actorKind: "guest" as const,
      currentActorKind: () => "guest" as const,
      currentProfile: () => profile,
      currentStorage: () => storage,
      readGuestInstallation: async () => current,
      hasGuestAccess: () => access,
    };
    const fence = await captureExactMissingActorFenceAtConfirmation(common);
    assert.ok(fence);
    assert.equal(await fence.isCurrent(), true);
    const transitions: readonly GuestInstallation[] = [
      { ...installation, installationId: "33333333-3333-4333-8333-333333333333" },
      { ...installation, localDatasetId: "44444444-4444-4444-8444-444444444444" },
      { ...installation, bindingState: "adoption_pending" },
      { ...installation, accountId: "bound-account" },
    ];
    for (const transition of transitions) {
      current = transition;
      assert.equal(await fence.isCurrent(), false);
    }
    current = installation;
    access = false;
    assert.equal(await fence.isCurrent(), false);
  }
});

test("Guest fence rechecks actor, profile, storage, and access after its asynchronous installation read", async () => {
  const transitions = ["actor", "profile", "storage", "access"] as const;
  for (const transition of transitions) {
    const profile: StorageProfile = { id: installation.localDatasetId, kind: "guest", accountId: null };
    let currentProfile: StorageProfile = profile;
    const storage = {};
    let currentStorage: object = storage;
    let actorKind: "guest" | "authenticated" | "other" = "guest";
    let access = true;
    const anchor = await captureExactMissingActorAnchor({ profile, storage, readGuestInstallation: async () => installation, hasGuestAccess: () => access });
    assert.ok(anchor);
    let finishRead!: (value: GuestInstallation) => void;
    const fence = await captureExactMissingActorFenceAtConfirmation({
      anchor,
      actorKind,
      currentActorKind: () => actorKind,
      currentProfile: () => currentProfile,
      currentStorage: () => currentStorage,
      readGuestInstallation: () => new Promise((resolve) => { finishRead = resolve; }),
      hasGuestAccess: () => access,
    });
    assert.ok(fence);
    const check = fence.isCurrent();
    if (transition === "actor") actorKind = "authenticated";
    if (transition === "profile") currentProfile = { ...profile, id: "44444444-4444-4444-8444-444444444444" };
    if (transition === "storage") currentStorage = {};
    if (transition === "access") access = false;
    finishRead(installation);
    assert.equal(await check, false, `a ${transition} change while reading Guest installation must invalidate confirmation`);
  }
});
