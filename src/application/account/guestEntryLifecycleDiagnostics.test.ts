import assert from "node:assert/strict";
import test from "node:test";

import { PREMIUM_ENTITLEMENT } from "../../domain/entitlements";
import { closeActiveProfileStorage, getActiveStorageProfileOrNull, getKeyValueStorage, MemoryKeyValueStorage, prepareProfileStorage, activatePreparedProfile, selectPreparedGuestProfile, setProfileStoragePreparationFactoryForTests } from "../../infrastructure/storage/mmkvClient";
import { openProfileStorageRouter, type ProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { STORAGE_KEYS } from "../../storage/keys";
import { clearPremiumCacheForAccountInProfile, hasOfflinePremiumAccess, replacePremiumCacheFromFreshResponse } from "../../storage/repositories/premiumEntitlementCacheRepository";
import { getGuestInstallation, markGuestInstallationAdoptionPending, provisionGuestInstallation } from "../../storage/repositories/guestInstallationRepository";
import { saveActiveTrackId } from "../../storage/repositories/activeTrackRepository";
import { createLocalLogoutControl } from "../../infrastructure/storage/localLogoutControl";
import { performLocalAccountSignOut } from "./profileStartupCoordination";

const ACCOUNT_ID = "diagnostic-account";
const AUTH_UID = "diagnostic-auth-uid";
const OPERATION_ID = "00000000-0000-4000-8000-000000000091";
const PREMIUM_PRODUCT = "patternly.premium.month";
const PREMIUM_CACHE_KEY = "patternly:premium-cache:v1";
const ACTIVE_TRACK = "coding-interview-dsa-problem-solving" as const;
const NOW = Date.parse("2026-10-01T12:00:00.000Z");
const ACCOUNT_IDENTITY = { accountId: ACCOUNT_ID, entitlement: PREMIUM_ENTITLEMENT, productId: PREMIUM_PRODUCT } as const;
const PREMIUM_RESPONSE = {
  serverObservedAt: "2026-10-01T11:59:00.000Z",
  entitlements: [{
    accountId: ACCOUNT_ID,
    entitlement: PREMIUM_ENTITLEMENT,
    productId: PREMIUM_PRODUCT,
    state: "active",
    source: "revenuecat",
    providerExpiresAt: "2026-11-01T00:00:00.000Z",
    providerGraceExpiresAt: null,
    providerObservedAt: "2026-10-01T11:58:00.000Z",
  }],
};

class MemoryControlStore implements StorageManifestStore {
  private readonly values = new Map<string, string>();
  async get(key: string): Promise<string | null> { return this.values.get(key) ?? null; }
  async set(key: string, value: string): Promise<void> { this.values.set(key, value); }
  async remove(key: string): Promise<void> { this.values.delete(key); }
}

async function makeScope(kind: "account" | "guest"): Promise<Readonly<{
  base: MemoryKeyValueStorage;
  control: MemoryControlStore;
  profileId: string;
  profileKind: "account" | "guest";
}>> {
  const base = new MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  let identityIndex = 0;
  const identities = [
    { installationId: "11111111-1111-4111-8111-111111111101", localDatasetId: "22222222-2222-4222-8222-222222222201" },
    { installationId: "33333333-3333-4333-8333-333333333301", localDatasetId: "44444444-4444-4444-8444-444444444401" },
    { installationId: "55555555-5555-4555-8555-555555555501", localDatasetId: "66666666-6666-4666-8666-666666666601" },
  ];
  const identity = { async create() { return identities[identityIndex++]!; } };
  let router: ProfileStorageRouter = await openProfileStorageRouter(base, control, { identity });
  let profileId: string;
  let profileKind: "account" | "guest";
  if (kind === "account") {
    const account = await router.selectAccount(ACCOUNT_ID);
    profileId = account.id;
    profileKind = "account";
    router = await openProfileStorageRouter(base, control, { identity });
  } else {
    profileId = router.profile.id;
    profileKind = "guest";
  }
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  await prepareProfileStorage();
  activatePreparedProfile(profileId, profileKind);
  if (kind === "guest") {
    await provisionGuestInstallation(identity);
    await markGuestInstallationAdoptionPending();
  }
  return { base, control, profileId, profileKind };
}

function scopedKey(profileId: string, logicalKey: string): string {
  return `patternly:profile:v1:${profileId}:${encodeURIComponent(logicalKey)}`;
}

async function cacheAccountEntitlement(): Promise<void> {
  assert.equal(replacePremiumCacheFromFreshResponse(PREMIUM_RESPONSE, ACCOUNT_IDENTITY, NOW), true);
}

async function teardownScope(): Promise<void> {
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
}

test("account-bound Premium cache stays scoped away from a retained guest profile", async () => {
  const scope = await makeScope("account");
  try {
    await cacheAccountEntitlement();
    assert.ok(scope.base.getString(scopedKey(scope.profileId, PREMIUM_CACHE_KEY)));
    closeActiveProfileStorage();

    await prepareProfileStorage();
    const guest = await selectPreparedGuestProfile();
    activatePreparedProfile(guest.profile.id, guest.profile.kind);

    assert.equal(getKeyValueStorage().getString(PREMIUM_CACHE_KEY), undefined);
    assert.equal(hasOfflinePremiumAccess(ACCOUNT_IDENTITY, NOW), false);
    assert.ok(scope.base.getString(scopedKey(scope.profileId, PREMIUM_CACHE_KEY)), "the account snapshot remains under its owning profile key");
  } finally {
    await teardownScope();
  }
});

async function reproducePostCloseCacheCleanup(kind: "account" | "guest"): Promise<void> {
  const scope = await makeScope(kind);
  try {
    await saveActiveTrackId(ACTIVE_TRACK);
    const learningKey = scopedKey(scope.profileId, STORAGE_KEYS.ACTIVE_TRACK);
    const learningBefore = scope.base.getString(learningKey);
    assert.ok(learningBefore);
    let guestInstallationBefore: string | undefined;
    if (kind === "guest") {
      const installation = await getGuestInstallation();
      assert.equal(installation?.bindingState, "adoption_pending");
      assert.equal(installation?.accountId, null);
      guestInstallationBefore = scope.base.getString(scopedKey(scope.profileId, STORAGE_KEYS.GUEST_INSTALLATION));
      assert.ok(guestInstallationBefore);
    }
    await cacheAccountEntitlement();
    const cacheKey = scopedKey(scope.profileId, PREMIUM_CACHE_KEY);
    const cachedBefore = scope.base.getString(cacheKey);
    assert.ok(cachedBefore);
    assert.equal(hasOfflinePremiumAccess(ACCOUNT_IDENTITY, NOW), true);

    const operations: string[] = [];
    let authUid: string | null = AUTH_UID;
    const signOutProfile = getActiveStorageProfileOrNull();
    const closeSignOutProfileStorage = () => {
      const activeProfile = getActiveStorageProfileOrNull();
      if (signOutProfile && activeProfile?.id === signOutProfile.id
        && activeProfile.kind === signOutProfile.kind && activeProfile.accountId === signOutProfile.accountId) {
        operations.push("profile:close");
        closeActiveProfileStorage();
      }
    };
    const logoutControl = createLocalLogoutControl(scope.control);
    const outcome = await performLocalAccountSignOut({
      uid: AUTH_UID,
      operationId: OPERATION_ID,
      persistBlock: async () => {
        operations.push("control:persist");
        return logoutControl.blockAndQueueRevoke(AUTH_UID, OPERATION_ID);
      },
      publishLockedState: () => { operations.push("state:locked"); },
      clearOwnedPremiumCache: () => {
        operations.push("cache:clear");
        return signOutProfile !== null
          && clearPremiumCacheForAccountInProfile(ACCOUNT_ID, signOutProfile) !== "unavailable";
      },
      closeProfileStorage: closeSignOutProfileStorage,
      signOutFirebase: async () => { operations.push("auth:signOut"); authUid = null; },
      isCurrent: () => true,
    });
    assert.equal(outcome, "signedOut");
    assert.equal(authUid, null);
    assert.deepEqual(operations, ["control:persist", "state:locked", "cache:clear", "profile:close", "auth:signOut"]);
    assert.deepEqual(await logoutControl.read(), {
      blocked: { uid: AUTH_UID, operationId: OPERATION_ID },
      completed: [],
      pending: [{ uid: AUTH_UID, operationId: OPERATION_ID }],
      version: 2,
    });
    assert.equal(scope.base.getString(learningKey), learningBefore, "sign-out leaves the selected scope's learning entry unchanged");
    assert.equal(scope.base.getString(cacheKey), undefined, "only the signing-out account's cache is removed before profile closure");
    if (kind === "guest") {
      assert.equal(scope.base.getString(scopedKey(scope.profileId, STORAGE_KEYS.GUEST_INSTALLATION)),
        guestInstallationBefore,
        "guest installation identity remains in the retained guest scope");
    }
  } finally {
    await teardownScope();
  }
}

test("sign-out clears only the authenticated account Premium cache before closing its account profile", async () => {
  await reproducePostCloseCacheCleanup("account");
});

test("sign-out clears the authenticated account cache from a retained adoption-pending guest profile", async () => {
  await reproducePostCloseCacheCleanup("guest");
});

test("sign-out preserves a foreign-account cache instead of deleting it", async () => {
  const scope = await makeScope("guest");
  try {
    const foreignIdentity = { ...ACCOUNT_IDENTITY, accountId: "other-diagnostic-account" };
    const foreignResponse = {
      ...PREMIUM_RESPONSE,
      entitlements: PREMIUM_RESPONSE.entitlements.map((item) => ({ ...item, accountId: foreignIdentity.accountId })),
    };
    assert.equal(replacePremiumCacheFromFreshResponse(foreignResponse, foreignIdentity, NOW), true);
    const cacheKey = scopedKey(scope.profileId, PREMIUM_CACHE_KEY);
    const foreignCacheBefore = scope.base.getString(cacheKey);
    assert.ok(foreignCacheBefore);
    const profile = getActiveStorageProfileOrNull();
    assert.ok(profile);
    const operations: string[] = [];
    const logoutControl = createLocalLogoutControl(scope.control);
    const outcome = await performLocalAccountSignOut({
      uid: AUTH_UID,
      operationId: OPERATION_ID,
      persistBlock: async () => {
        operations.push("control:persist");
        return logoutControl.blockAndQueueRevoke(AUTH_UID, OPERATION_ID);
      },
      publishLockedState: () => { operations.push("state:locked"); },
      clearOwnedPremiumCache: () => {
        operations.push("cache:clear");
        return clearPremiumCacheForAccountInProfile(ACCOUNT_ID, profile) !== "unavailable";
      },
      closeProfileStorage: () => {
        operations.push("profile:close");
        closeActiveProfileStorage();
      },
      signOutFirebase: async () => { operations.push("auth:signOut"); },
      isCurrent: () => true,
    });

    assert.equal(outcome, "signedOut");
    assert.deepEqual(operations, ["control:persist", "state:locked", "cache:clear", "profile:close", "auth:signOut"]);
    assert.equal(scope.base.getString(cacheKey), foreignCacheBefore);
  } finally {
    await teardownScope();
  }
});

async function runOwnedCacheCleanupFailure(mode: "missing-owner" | "invalid-cache" | "remove-failure" | "sdk-failure"): Promise<void> {
  const scope = await makeScope("guest");
  try {
    await saveActiveTrackId(ACTIVE_TRACK);
    const learningKey = scopedKey(scope.profileId, STORAGE_KEYS.ACTIVE_TRACK);
    const learningBefore = scope.base.getString(learningKey);
    const installationKey = scopedKey(scope.profileId, STORAGE_KEYS.GUEST_INSTALLATION);
    const installationBefore = scope.base.getString(installationKey);
    assert.ok(learningBefore);
    assert.ok(installationBefore);
    await cacheAccountEntitlement();
    const cacheKey = scopedKey(scope.profileId, PREMIUM_CACHE_KEY);
    if (mode === "invalid-cache") getKeyValueStorage().setString(PREMIUM_CACHE_KEY, "not-json");
    if (mode === "remove-failure" || mode === "sdk-failure") scope.base.setFailurePlan({ kind: "fail_on_key_remove", key: cacheKey });
    const cacheBefore = scope.base.getString(cacheKey);
    assert.ok(cacheBefore);
    const capturedProfile = getActiveStorageProfileOrNull();
    assert.ok(capturedProfile);
    const operations: string[] = [];
    let authUid: string | null = AUTH_UID;
    const logoutControl = createLocalLogoutControl(scope.control);
    const outcome = await performLocalAccountSignOut({
      uid: AUTH_UID,
      operationId: OPERATION_ID,
      persistBlock: async () => {
        operations.push("control:persist");
        return logoutControl.blockAndQueueRevoke(AUTH_UID, OPERATION_ID);
      },
      publishLockedState: () => { operations.push("state:locked"); },
      clearOwnedPremiumCache: () => {
        operations.push("cache:clear");
        return clearPremiumCacheForAccountInProfile(mode === "missing-owner" ? "" : ACCOUNT_ID, capturedProfile) !== "unavailable";
      },
      closeProfileStorage: () => {
        const active = getActiveStorageProfileOrNull();
        if (active?.id === capturedProfile.id && active.kind === capturedProfile.kind && active.accountId === capturedProfile.accountId) {
          operations.push("profile:close");
          closeActiveProfileStorage();
        }
      },
      signOutFirebase: async () => {
        operations.push("auth:signOut");
        if (mode === "sdk-failure") throw new Error("sdk_unavailable");
        authUid = null;
      },
      isCurrent: () => true,
    });

    assert.equal(outcome, mode === "sdk-failure" ? "signOutPending" : "localCleanupFailure");
    assert.equal(authUid, mode === "sdk-failure" ? AUTH_UID : null);
    assert.deepEqual(operations, ["control:persist", "state:locked", "cache:clear", "profile:close", "auth:signOut"]);
    assert.equal(scope.base.getString(cacheKey), cacheBefore, "unknown or failed cleanup preserves the cache bytes");
    assert.equal(scope.base.getString(learningKey), learningBefore);
    assert.equal(scope.base.getString(installationKey), installationBefore);
    assert.deepEqual(await logoutControl.read(), {
      blocked: { uid: AUTH_UID, operationId: OPERATION_ID },
      completed: [],
      pending: [{ uid: AUTH_UID, operationId: OPERATION_ID }],
      version: 2,
    });
  } finally {
    await teardownScope();
  }
}

test("unknown ownership and invalid cache records return localCleanupFailure without deleting data", async () => {
  await runOwnedCacheCleanupFailure("missing-owner");
  await runOwnedCacheCleanupFailure("invalid-cache");
});

test("a profile switch invalidates cleanup against the previous captured scope", async () => {
  const scope = await makeScope("account");
  try {
    await cacheAccountEntitlement();
    const accountProfile = getActiveStorageProfileOrNull();
    assert.ok(accountProfile);
    const accountCache = scope.base.getString(scopedKey(scope.profileId, PREMIUM_CACHE_KEY));
    assert.ok(accountCache);
    closeActiveProfileStorage();
    await prepareProfileStorage();
    const guest = await selectPreparedGuestProfile();
    activatePreparedProfile(guest.profile.id, guest.profile.kind);

    assert.equal(clearPremiumCacheForAccountInProfile(ACCOUNT_ID, accountProfile), "unavailable");
    assert.ok(getKeyValueStorage().getString(PREMIUM_CACHE_KEY) === undefined);
    assert.equal(scope.base.getString(scopedKey(scope.profileId, PREMIUM_CACHE_KEY)), accountCache);
  } finally {
    await teardownScope();
  }
});

test("sign-out returns stale and preserves a new active guest profile", async () => {
  const scope = await makeScope("account");
  try {
    await cacheAccountEntitlement();
    const capturedProfile = getActiveStorageProfileOrNull();
    assert.ok(capturedProfile);
    const accountCacheKey = scopedKey(scope.profileId, PREMIUM_CACHE_KEY);
    const accountCache = scope.base.getString(accountCacheKey);
    assert.ok(accountCache);

    closeActiveProfileStorage();
    await prepareProfileStorage();
    const guest = await selectPreparedGuestProfile();
    activatePreparedProfile(guest.profile.id, guest.profile.kind);

    const operations: string[] = [];
    let authUid: string | null = AUTH_UID;
    const logoutControl = createLocalLogoutControl(scope.control);
    const outcome = await performLocalAccountSignOut({
      uid: AUTH_UID,
      operationId: OPERATION_ID,
      persistBlock: async () => {
        operations.push("control:persist");
        return logoutControl.blockAndQueueRevoke(AUTH_UID, OPERATION_ID);
      },
      publishLockedState: () => { operations.push("state:locked"); },
      clearOwnedPremiumCache: () => {
        operations.push("cache:clear");
        const active = getActiveStorageProfileOrNull();
        if (active?.id !== capturedProfile.id || active.kind !== capturedProfile.kind || active.accountId !== capturedProfile.accountId) return "stale";
        return clearPremiumCacheForAccountInProfile(ACCOUNT_ID, capturedProfile) !== "unavailable";
      },
      closeProfileStorage: () => {
        const active = getActiveStorageProfileOrNull();
        if (active?.id === capturedProfile.id && active.kind === capturedProfile.kind && active.accountId === capturedProfile.accountId) {
          operations.push("profile:close");
          closeActiveProfileStorage();
        }
      },
      signOutFirebase: async () => { operations.push("auth:signOut"); authUid = null; },
      isCurrent: () => true,
    });

    assert.equal(outcome, "stale");
    assert.equal(authUid, AUTH_UID);
    assert.deepEqual(operations, ["control:persist", "state:locked", "cache:clear"]);
    assert.equal(getActiveStorageProfileOrNull()?.id, guest.profile.id);
    assert.equal(scope.base.getString(accountCacheKey), accountCache);
  } finally {
    await teardownScope();
  }
});

test("a cache remove failure stays explicit while sign-out still clears Auth", async () => {
  await runOwnedCacheCleanupFailure("remove-failure");
});

test("an SDK failure remains signOutPending when owned-cache cleanup also fails", async () => {
  await runOwnedCacheCleanupFailure("sdk-failure");
});
