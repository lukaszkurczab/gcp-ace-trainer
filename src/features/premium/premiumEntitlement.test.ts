import assert from "node:assert/strict";
import test from "node:test";
import { PREMIUM_ENTITLEMENT, evaluateOfflinePremiumAccess, isPremiumAccessConfirmedOnline, isPremiumSnapshot, premiumCacheFromFreshResponse } from "../../domain/entitlements";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { clearPremiumCache, clearPremiumCacheUnlessBoundTo, hasOfflinePremiumAccess, replacePremiumCacheFromFreshResponse } from "../../storage/repositories/premiumEntitlementCacheRepository";

const observed = "2026-09-22T12:00:00.000Z";
const expiry = "2026-09-23T12:00:00.000Z";
const grace = "2026-09-24T12:00:00.000Z";
const identity = { accountId: "account-1", entitlement: PREMIUM_ENTITLEMENT, productId: "monthly" } as const;
const item = { ...identity, state: "active" as const, source: "revenuecat" as const, providerExpiresAt: expiry, providerGraceExpiresAt: null, providerObservedAt: observed };
const response = (replacement: Record<string, unknown> = {}) => ({ serverObservedAt: observed, entitlements: [{ ...item, ...replacement }] });
const now = Date.parse(observed);

test("fresh response requires exactly one matching provider-backed item with strict UTC dates", () => {
  assert.ok(premiumCacheFromFreshResponse(response(), identity, now, null));
  for (const invalid of [
    { ...response(), entitlements: [] },
    { ...response(), entitlements: [item, item] },
    response({ accountId: "account-2" }),
    response({ productId: "annual" }),
    response({ entitlement: "other" }),
    response({ source: "webhook" }),
    response({ providerExpiresAt: "2026-09-23T12:00:00+00:00" }),
    response({ providerExpiresAt: null }),
    response({ state: "grace", providerGraceExpiresAt: null }),
    response({ state: "unknown" }),
    response({ extra: true }),
  ]) assert.equal(premiumCacheFromFreshResponse(invalid, identity, now, null), null);
  assert.equal(isPremiumSnapshot({ ...item, serverObservedAt: "2026-02-30T12:00:00.000Z" }), false);
});

test("confirmed account change removes the previous account cache and fails closed if removal fails", () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  assert.equal(replacePremiumCacheFromFreshResponse(response(), identity, now), true);
  assert.equal(clearPremiumCacheUnlessBoundTo(identity.accountId), true);
  assert.equal(hasOfflinePremiumAccess(identity, now + 1000), true);

  storage.setFailurePlan({ kind: "fail_on_key_remove", key: "patternly:premium-cache:v1" });
  assert.equal(clearPremiumCacheUnlessBoundTo("account-2"), false);
  assert.equal(storage.contains("patternly:premium-cache:v1"), true);
  storage.setFailurePlan(null);
  assert.equal(clearPremiumCacheUnlessBoundTo("account-2"), true);
  assert.equal(storage.contains("patternly:premium-cache:v1"), false);
  assert.equal(hasOfflinePremiumAccess(identity, now + 1000), false);
});

test("active and grace expire exactly at their provider dates; negative states deny", () => {
  const active = premiumCacheFromFreshResponse(response(), identity, now, null)!;
  assert.equal(isPremiumAccessConfirmedOnline(active.snapshot), true);
  assert.equal(evaluateOfflinePremiumAccess(active, identity, Date.parse(expiry) - 1).allowed, true);
  assert.equal(evaluateOfflinePremiumAccess(active, identity, Date.parse(expiry)).allowed, false);
  assert.equal(isPremiumAccessConfirmedOnline({ ...active.snapshot, serverObservedAt: expiry }), false);
  const graceRecord = premiumCacheFromFreshResponse(response({ state: "grace", providerGraceExpiresAt: grace }), identity, now, null)!;
  assert.equal(isPremiumAccessConfirmedOnline(graceRecord.snapshot), true);
  assert.equal(evaluateOfflinePremiumAccess(graceRecord, identity, Date.parse(grace) - 1).allowed, true);
  assert.equal(evaluateOfflinePremiumAccess(graceRecord, identity, Date.parse(grace)).allowed, false);
  for (const state of ["hold", "expired", "refunded"]) {
    const negative = premiumCacheFromFreshResponse(response({ state }), identity, now, active)!;
    assert.equal(isPremiumAccessConfirmedOnline(negative.snapshot), false);
    assert.equal(evaluateOfflinePremiumAccess(negative, identity, now).allowed, false);
  }
});

test("clock rollback and account switch deny, and a fresh response cannot reduce observed wall time", () => {
  const first = premiumCacheFromFreshResponse(response(), identity, now + 1000, null)!;
  const future = evaluateOfflinePremiumAccess(first, identity, now + 5000).nextRecord!;
  assert.equal(evaluateOfflinePremiumAccess(future, identity, now + 4000).allowed, false);
  const refreshed = premiumCacheFromFreshResponse(response(), identity, now + 2000, future)!;
  assert.equal(refreshed.maxObservedWallTime, now + 5000);
  assert.equal(evaluateOfflinePremiumAccess(refreshed, identity, now + 2000).allowed, false);
  assert.equal(evaluateOfflinePremiumAccess(refreshed, { ...identity, accountId: "account-2" }, now + 5000).allowed, false);
});

test("cache writes before offline authorization; failed writes, invalid refresh and account change fail closed", () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  assert.equal(replacePremiumCacheFromFreshResponse(response(), identity, now), true);
  const before = storage.snapshot();
  assert.equal(replacePremiumCacheFromFreshResponse(response({ productId: "annual" }), identity, now), false);
  assert.deepEqual(storage.snapshot(), before);
  storage.setFailurePlan({ kind: "fail_on_key_read", key: "patternly:premium-cache:v1" });
  assert.equal(replacePremiumCacheFromFreshResponse(response(), identity, now + 1000), false);
  assert.deepEqual(storage.snapshot(), before);
  storage.setFailurePlan(null);
  storage.setFailurePlan({ kind: "fail_on_write_number", writeNumber: 2 });
  assert.equal(hasOfflinePremiumAccess(identity, now + 1000), false);
  assert.deepEqual(storage.snapshot(), before);
  storage.setFailurePlan(null);
  assert.equal(hasOfflinePremiumAccess(identity, now + 1000), true);
  assert.equal(replacePremiumCacheFromFreshResponse(response({ state: "refunded" }), identity, now + 2000), true);
  assert.equal(hasOfflinePremiumAccess(identity, now + 2000), false);
  assert.equal(replacePremiumCacheFromFreshResponse(response({ accountId: "account-2" }), { ...identity, accountId: "account-2" }, now + 3000), true);
  assert.equal(hasOfflinePremiumAccess(identity, now + 3000), false);
  clearPremiumCache();
  assert.equal(hasOfflinePremiumAccess({ ...identity, accountId: "account-2" }, now + 3000), false);
});
