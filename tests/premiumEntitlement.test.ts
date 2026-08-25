import assert from "node:assert/strict";
import test from "node:test";

import {
  PREMIUM_ENTITLEMENT,
  PREMIUM_ENTITLEMENT_STATES,
  PREMIUM_OFFER_KINDS,
  PREMIUM_OFFLINE_VERIFICATION_GRACE_DAYS,
  createPremiumProjection,
  isPremiumAccessAllowed,
  isPremiumEntitlementState,
  isPremiumOfferKind,
  isPremiumProjection,
} from "../src/domain";

const NOW = new Date("2026-08-25T12:00:00.000Z");

const baseProjection = {
  accountId: "account-opaque-1",
  entitlement: PREMIUM_ENTITLEMENT,
  state: "active" as const,
  verifiedAt: "2026-08-25T12:00:00.000Z",
  sourceRevision: "revision-7",
};

test("Premium is one SKU-neutral entitlement with exactly the canonical offer kinds", () => {
  assert.equal(PREMIUM_ENTITLEMENT, "premium");
  assert.equal(PREMIUM_OFFLINE_VERIFICATION_GRACE_DAYS, 7);
  assert.deepEqual(PREMIUM_OFFER_KINDS, ["fixedDuration30Day", "fixedDuration90Day", "recurring"]);
  for (const kind of PREMIUM_OFFER_KINDS) assert.equal(isPremiumOfferKind(kind), true);
  assert.equal(isPremiumOfferKind("monthly"), false);
  assert.equal(isPremiumOfferKind("annual"), false);
  assert.equal(isPremiumOfferKind("store-product-id"), false);
});

test("projection construction keeps one account-bound Premium record independent of tracks, tiers, and slots", () => {
  const projection = createPremiumProjection(baseProjection);

  assert.deepEqual(projection, baseProjection);
  assert.equal("trackId" in projection, false);
  assert.equal("trackSlots" in projection, false);
  assert.equal("tier" in projection, false);
  assert.equal(Object.isFrozen(projection), true);

  assert.equal(isPremiumProjection({ ...baseProjection, trackId: "coding-interview" }), false);
  assert.equal(isPremiumProjection({ ...baseProjection, trackSlots: 1 }), false);
  assert.equal(isPremiumProjection({ ...baseProjection, tier: "premium" }), false);
  assert.throws(() => createPremiumProjection({ ...baseProjection, offerKind: "recurring" }), /Invalid Premium entitlement projection/u);
});

test("projection validation accepts every documented state and rejects unknown state values", () => {
  assert.deepEqual(PREMIUM_ENTITLEMENT_STATES, ["active", "grace", "expired", "revoked", "refunded"]);
  for (const state of PREMIUM_ENTITLEMENT_STATES) {
    const projection = { ...baseProjection, state };
    assert.equal(isPremiumEntitlementState(state), true);
    assert.equal(isPremiumProjection(projection), true);
    assert.equal(createPremiumProjection(projection).state, state);
  }
  assert.equal(isPremiumEntitlementState("unknown"), false);
  assert.equal(isPremiumProjection({ ...baseProjection, state: "unknown" }), false);
});

test("malformed, incomplete, and extra-field payloads fail closed", () => {
  const invalidValues: readonly unknown[] = [
    null,
    [],
    "premium",
    { ...baseProjection, accountId: " " },
    { ...baseProjection, accountId: 42 },
    { ...baseProjection, accountId: "learner@example.com" },
    { ...baseProjection, entitlement: "free" },
    { ...baseProjection, verifiedAt: "not-a-timestamp" },
    { ...baseProjection, verifiedAt: "2026-02-30T12:00:00.000Z" },
    { ...baseProjection, sourceRevision: null },
    { ...baseProjection, sourceRevision: " \t " },
    { ...baseProjection, missing: undefined },
    { ...baseProjection, state: "active", unsupported: true },
  ];

  for (const value of invalidValues) {
    assert.equal(isPremiumProjection(value), false);
    assert.throws(() => createPremiumProjection(value), /Invalid Premium entitlement projection/u);
  }
});

test("omitted required projection fields fail closed", () => {
  for (const omittedKey of ["accountId", "entitlement", "state", "verifiedAt", "sourceRevision"] as const) {
    const value = Object.fromEntries(Object.entries(baseProjection).filter(([key]) => key !== omittedKey));
    assert.equal(isPremiumProjection(value), false, `omitted ${omittedKey} must be rejected`);
    assert.throws(() => createPremiumProjection(value), /Invalid Premium entitlement projection/u);
  }
});

test("account IDs reject whitespace and email-shaped values without requiring a provider format", () => {
  assert.equal(isPremiumProjection({ ...baseProjection, accountId: "   " }), false);
  assert.equal(isPremiumProjection({ ...baseProjection, accountId: " learner-account-1 " }), false);
  assert.equal(isPremiumProjection({ ...baseProjection, accountId: "learner@example.com" }), false);
  assert.equal(isPremiumProjection({ ...baseProjection, accountId: "provider|opaque-account-1" }), true);
});

test("projection timestamps are strict ISO values and access fails closed for malformed or future timestamps", () => {
  const malformedValues = [
    "not-a-timestamp",
    "2026-02-30T12:00:00.000Z",
    "2026-08-25T12:00:00+00:00",
  ];

  for (const verifiedAt of malformedValues) {
    const projection = { ...baseProjection, verifiedAt };
    assert.equal(isPremiumProjection(projection), false);
    assert.equal(isPremiumAccessAllowed(projection, NOW), false);
  }

  const futureProjection = createPremiumProjection({
    ...baseProjection,
    verifiedAt: "2026-08-25T12:00:00.001Z",
  });
  assert.equal(isPremiumAccessAllowed(futureProjection, NOW), false);
});

test("active and grace access expires after the inclusive seven-day verification boundary", () => {
  const exactBoundary = new Date(NOW.getTime() - PREMIUM_OFFLINE_VERIFICATION_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const justOlder = new Date(NOW.getTime() - (PREMIUM_OFFLINE_VERIFICATION_GRACE_DAYS * 24 * 60 * 60 * 1000 + 1)).toISOString();

  for (const state of ["active", "grace"] as const) {
    assert.equal(isPremiumAccessAllowed(createPremiumProjection({ ...baseProjection, state, verifiedAt: exactBoundary }), NOW), true);
    assert.equal(isPremiumAccessAllowed(createPremiumProjection({ ...baseProjection, state, verifiedAt: justOlder }), NOW), false);
  }
});

test("only active and grace projections allow new Premium access", () => {
  for (const state of PREMIUM_ENTITLEMENT_STATES) {
    const projection = createPremiumProjection({ ...baseProjection, state });
    const before = { ...projection };
    assert.equal(isPremiumAccessAllowed(projection, NOW), state === "active" || state === "grace");
    assert.deepEqual(projection, before);
  }

  assert.equal(isPremiumAccessAllowed({ ...baseProjection, state: "unknown" }, NOW), false);
  assert.equal(isPremiumAccessAllowed({ ...baseProjection, unsupported: true }, NOW), false);
  assert.equal(isPremiumAccessAllowed(null, NOW), false);
});
