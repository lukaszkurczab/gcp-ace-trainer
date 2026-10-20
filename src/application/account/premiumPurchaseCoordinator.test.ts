import assert from "node:assert/strict";
import test from "node:test";
import { createPremiumPurchaseCoordinator, type PremiumPurchaseActor, type PremiumVerification } from "./premiumPurchaseCoordinator";
import type { LocalPurchaseAttempt } from "../../storage/repositories/premiumPurchaseAttemptRepository";
import { createPurchasesAdapter, type PurchaseResult, type RevenueCatGateway } from "../../infrastructure/purchases";
import type { PremiumSnapshot } from "../../domain/entitlements";
import type { PurchaseAttemptDto } from "../../infrastructure/clients/PatternlyApiClientAdapter";

const pkg = { identifier: "$rc_monthly", store: "APP_STORE" as const, purchaseProductIdentifier: "com.lkurczab.patternly.premium.monthly", product: { identifier: "com.lkurczab.patternly.premium.monthly", priceString: "49,99 zł" } };
const confirmation = { confirmationId: "00000000-0000-4000-8000-000000000018", termsVersion: "v1", productIdentifier: pkg.purchaseProductIdentifier, store: "APP_STORE" as const, storefrontPrice: pkg.product.priceString, locale: "pl", immediateStartRequested: true } as const;
const base: PurchaseAttemptDto = { attemptId: confirmation.confirmationId, outcome: "initiated", acceptedAt: "2026-10-15T00:00:00.000Z", startExpiresAt: "2026-10-15T00:15:00.000Z", initiatedAt: "2026-10-15T00:01:00.000Z", transactionKey: null, resolutionReason: null, dispatchAllowed: true };
function fixture() {
  let marker: LocalPurchaseAttempt | null = null, current = true, clock = 0, epoch: number | null = 1;
  let access: PremiumVerification = "denied", activeSubscriptions: string[] = [], attempt = base;
  let premiumSnapshot: PremiumSnapshot | null = null;
  let storeOutcome: PurchaseResult = { status: "success", transactionId: "exact-T" };
  let fault: string | null = null;
  const events: string[] = [];
  const journal = {
    read: () => { if (fault === "read") throw Error("storage"); return marker; },
    save: (value: LocalPurchaseAttempt) => { if (fault === `save:${value.phase}`) throw Error("storage"); marker = structuredClone(value); events.push(`save:${value.phase}`); },
    clear: () => { marker = null; events.push("clear"); },
  };
  const actor: PremiumPurchaseActor = {
    accountId: "A", isCurrent: () => current,
    record: async () => { events.push("record"); if (fault === "record") throw Error("lost_ack"); },
    attempt: async () => { events.push("status"); return { attempt }; },
    command: async (_id, command) => {
      events.push(command.action);
      if (fault === command.action) throw Error("lost_ack");
      if (command.action === "claim" && fault === "expired") clock = 14 * 60_000;
      if (command.action === "claim" && fault === "background") epoch = 2;
      if (command.action === "candidate") attempt = { ...attempt, outcome: "bound", transactionKey: "a".repeat(64) };
      if (command.action === "cancelled") attempt = { ...attempt, outcome: "cancelled" };
      if (command.action === "pending") attempt = { ...attempt, outcome: "pending" };
      return { attempt };
    },
    cases: async () => ({ items: [], truncated: false }),
    refresh: async () => { events.push("backend"); return access; },
    readPremiumSnapshot: () => premiumSnapshot,
  };
  const gateway: RevenueCatGateway = {
    isConfigured: async () => false, getAppUserID: async () => "", logOut: async () => ({}),
    configure: async () => {}, getOfferings: async () => ({ current: null }), managementURL: async () => null,
    getCustomerInfo: async () => ({ activeSubscriptions }), restorePurchases: async () => { events.push("restore"); return { activeSubscriptions }; },
    purchasePackage: async () => {
      events.push("SDK");
      if (fault === "switch") current = false;
      if (storeOutcome.status === "pending") throw { code: "20" };
      if (storeOutcome.status === "cancelled") throw { code: "1" };
      if (storeOutcome.status === "unknown") throw { code: "2" };
    return { productIdentifier: pkg.product.identifier, transaction: { productIdentifier: pkg.product.identifier, transactionIdentifier: storeOutcome.transactionId } };
    },
  };
  const adapter = createPurchasesAdapter(gateway, { config: { apiKey: "key", accountId: "A", binding: { platform: "ios", store: "APP_STORE", appId: "fixture-ios", rcProductId: "fixture-rc-ios", storeProductId: "com.lkurczab.patternly.premium.monthly", basePlanId: null } }, checkoutEnabled: true, isCurrent: () => current });
  const create = () => createPremiumPurchaseCoordinator({ actor, adapter, journal, monotonicNow: () => clock, dispatchEpoch: () => epoch });
  return { create, events, journal, actor, adapter, marker: () => marker, setAccess: (v: PremiumVerification) => { access = v; }, setSnapshot: (v: PremiumSnapshot | null) => { premiumSnapshot = v; }, setStore: (v: string[]) => { activeSubscriptions = v; }, setOutcome: (v: PurchaseResult) => { storeOutcome = v; }, setFault: (v: string | null) => { fault = v; }, setAttempt: (v: PurchaseAttemptDto) => { attempt = v; }, switchActor: () => { current = false; } };
}

test("intent→claim→one SDK effect→durable exact candidate precedes submit; backend alone grants", async () => {
  const f = fixture(), c = f.create(); await c.reload();
  await c.purchase(pkg, confirmation);
  assert.ok(f.events.indexOf("save:intent") < f.events.indexOf("record"));
  assert.ok(f.events.indexOf("save:dispatch") < f.events.indexOf("claim"));
  assert.ok(f.events.indexOf("claim") < f.events.indexOf("SDK"));
  assert.ok(f.events.indexOf("save:candidate") < f.events.indexOf("candidate"));
  assert.equal(c.getState().access, "denied"); // SDK success cannot grant.
  f.setAccess("verified"); await c.reload();
  assert.equal(c.getState().notice, "active"); assert.equal(c.getState().blocked, true);
});

test("pending survives restart, blocks a second purchase, then foreground/provider refresh uses backend", async () => {
  const f = fixture(); f.setOutcome({ status: "pending" });
  const c = f.create(); await c.reload(); await c.purchase(pkg, confirmation);
  assert.equal(c.getState().notice, "pending"); assert.equal(c.getState().access, "denied");
  const resumed = f.create(); await resumed.reload(); await resumed.purchase(pkg, confirmation);
  assert.equal(f.events.filter((x) => x === "SDK").length, 1);
  f.setAccess("verified"); await resumed.reload();
  assert.equal(resumed.getState().notice, "active");
  assert.equal(f.events.filter((x) => x === "SDK").length, 1);
});

test("original cancel closes attempt without claiming access; unknown store error stays blocked", async () => {
  for (const status of ["cancelled", "unknown"] as const) {
    const f = fixture(); f.setOutcome({ status }); const c = f.create(); await c.reload(); await c.purchase(pkg, confirmation);
    assert.equal(c.getState().notice, status);
    assert.equal(c.getState().access, "denied");
    assert.equal(c.getState().blocked, status === "unknown");
    assert.equal(f.marker() === null, status === "cancelled");
  }
});

for (const stage of ["record", "claim", "candidate"] as const) test(`lost ${stage} ACK/restart never replays SDK, replays only original evidence`, async () => {
  const f = fixture(); const c = f.create(); await c.reload(); f.setFault(stage); await c.purchase(pkg, confirmation);
  const count = f.events.filter((x) => x === "SDK").length;
  f.setFault(null); const resumed = f.create(); await resumed.reload();
  assert.equal(f.events.filter((x) => x === "SDK").length, count);
  if (stage === "candidate") { assert.equal(count, 1); assert.equal(f.marker()?.phase, "candidate"); assert.equal(resumed.getState().blocked, true); f.setAccess("verified"); await resumed.reload(); assert.equal(f.marker(), null); }
  else { assert.equal(count, 0); assert.equal(resumed.getState().blocked, true); }
});

for (const stage of ["save:intent", "save:dispatch", "expired", "background"] as const) test(`${stage} prevents the store effect`, async () => {
  const f = fixture(), c = f.create(); await c.reload(); f.setFault(stage); await c.purchase(pkg, confirmation);
  assert.equal(f.events.includes("SDK"), false);
});

test("identity invalidation during SDK drops old result; retained dispatch marker requires reconciliation", async () => {
  const f = fixture(), c = f.create(); await c.reload(); f.setFault("switch"); await c.purchase(pkg, confirmation);
  assert.equal(f.events.includes("candidate"), false);
  assert.equal(f.marker()?.phase, "dispatch");
  assert.equal(c.getState().access, "denied");
});

test("an active server or store subscriber cannot buy; store signal cannot grant access", async () => {
  for (const source of ["server", "store"] as const) {
    const f = fixture(); if (source === "server") f.setAccess("verified"); else f.setStore([pkg.product.identifier]);
    const c = f.create(); await c.reload(); await c.purchase(pkg, confirmation);
    assert.equal(f.events.includes("SDK"), false); assert.equal(f.events.includes("record"), false);
    assert.equal(c.getState().access, source === "server" ? "verified" : "denied");
  }
});

test("Premium confirmed from Play on an iOS device blocks a second checkout and exposes the source store", async () => {
  const f = fixture();
  f.setAccess("verified");
  f.setSnapshot({ accountId: "A", entitlement: "premium", productId: "com.lkurczab.patternly.premium.monthly", state: "active", source: "revenuecat",
    projectId: "fixture-project", mapVersion: "premium-map-fixture-v1", environment: "SANDBOX", reason: null,
    sources: [{ platform: "android", store: "PLAY_STORE", appId: "fixture-play", rcProductId: "fixture-rc-play", storeProductId: "fixture_play_monthly", basePlanId: "monthly", state: "active", reason: null, managementURL: "https://play.google.com/store/account/subscriptions", providerExpiresAt: "2026-11-01T00:00:00.000Z", providerGraceExpiresAt: null }],
    providerExpiresAt: "2026-11-01T00:00:00.000Z", providerGraceExpiresAt: null, providerObservedAt: "2026-10-15T00:00:00.000Z", serverObservedAt: "2026-10-15T00:00:00.000Z" });
  const c = f.create(); await c.reload(); await c.purchase(pkg, confirmation);
  assert.equal(c.getState().access, "verified");
  assert.equal(c.getState().blocked, true);
  assert.equal(c.getState().sources[0]?.store, "PLAY_STORE");
  assert.equal(f.events.includes("SDK"), false);
  assert.equal(f.events.includes("record"), false);
});

test("unknown status/expiry/closed unresolved cannot release the marker", async () => {
  for (const outcome of ["reconciliation_required", "closed_unresolved", "expired_unresolved"] as const) {
    const f = fixture(); f.journal.save({ accountId: "A", attemptId: confirmation.confirmationId, phase: "unknown", transactionId: null, confirmation: null });
    f.setAttempt({ ...base, outcome }); const c = f.create(); await c.reload(); await c.purchase(pkg, confirmation);
    assert.equal(c.getState().blocked, true); assert.ok(f.marker()); assert.equal(f.events.includes("SDK"), false);
  }
});

test("invalidation/unmount while claim is pending refuses dispatch; restore never becomes a candidate", async () => {
  const f = fixture(); const c = f.create(); await c.reload(); c.invalidateDispatch(); await c.purchase(pkg, confirmation);
  assert.equal(f.events.includes("SDK"), false);
  const g = fixture(); g.setAccess("verified"); const restored = g.create(); await restored.restore();
  assert.equal(restored.getState().notice, "active"); assert.equal(g.events.includes("candidate"), false); assert.equal(g.events.includes("SDK"), false);
});

test("journal read failure fails closed", async () => {
  const f = fixture(); f.setFault("read"); const c = f.create(); await c.reload(); await c.purchase(pkg, confirmation);
  assert.equal(c.getState().blocked, true); assert.equal(f.events.includes("SDK"), false);
});

test("restart after record did not commit retries identical consent only, never claim or SDK", async () => {
  const f = fixture(); let committed = false; const payloads: unknown[] = [];
  const actor = { ...f.actor,
    record: async (input: unknown) => { payloads.push(structuredClone(input)); if (payloads.length === 1) throw Error("offline_before_commit"); committed = true; },
    attempt: async () => { assert.equal(committed, true); return { attempt: { ...base, outcome: "accepted" as const, dispatchAllowed: false, initiatedAt: null } }; },
  };
  const create = () => createPremiumPurchaseCoordinator({ actor, adapter: f.adapter, journal: f.journal, monotonicNow: () => 0, dispatchEpoch: () => 1 });
  const c = create(); await c.reload(); await c.purchase(pkg, confirmation);
  assert.equal(c.getState().notice, "notStarted");
  assert.equal(f.marker()?.phase, "intent");
  const resumed = create(); await resumed.reload();
  assert.deepEqual(payloads, [confirmation, confirmation]);
  assert.equal(resumed.getState().notice, "notStarted"); assert.equal(resumed.getState().blocked, true);
  assert.equal(f.events.includes("claim"), false); assert.equal(f.events.includes("SDK"), false);
});

test("restart after committed confirmation before dispatch marker retries exact record, no claim", async () => {
  const f = fixture(), c = f.create(); await c.reload(); f.setFault("save:dispatch"); await c.purchase(pkg, confirmation);
  f.setFault(null); const resumed = f.create(); await resumed.reload();
  assert.equal(f.events.filter((x) => x === "record").length, 2);
  assert.equal(f.events.includes("claim"), false); assert.equal(f.events.includes("SDK"), false);
  assert.equal(resumed.getState().notice, "notStarted");
});

test("truncated cases fail closed even if shown cases, server and store look clear", async () => {
  const f = fixture(); const actor = { ...f.actor, cases: async () => ({ items: [], truncated: true }) };
  const c = createPremiumPurchaseCoordinator({ actor, adapter: f.adapter, journal: f.journal, monotonicNow: () => 0, dispatchEpoch: () => 1 });
  await c.reload(); await c.purchase(pkg, confirmation);
  assert.equal(c.getState().blocked, true); assert.equal(c.getState().receiptIssue, true); assert.equal(f.events.includes("record"), false);
});

test("interruption after SDK before candidate persistence leaves reconciliation, never a guessed candidate", async () => {
  const f = fixture(), c = f.create(); await c.reload(); f.setFault("save:candidate"); await c.purchase(pkg, confirmation);
  assert.equal(f.events.filter((x) => x === "SDK").length, 1);
  assert.equal(f.marker()?.phase, "dispatch"); assert.equal(f.events.includes("candidate"), false);
  f.setFault(null); const resumed = f.create(); await resumed.reload();
  assert.equal(resumed.getState().blocked, true); assert.equal(resumed.getState().notice, "unknown");
  assert.equal(f.events.filter((x) => x === "SDK").length, 1);
});

test("a provider/foreground refresh arriving during an existing read is coalesced and not lost", async () => {
  const f = fixture(); let reads = 0, release!: () => void;
  const adapter = { ...f.adapter, getCustomerInfo: async () => {
    reads++;
    if (reads === 1) await new Promise<void>((resolve) => { release = resolve; });
    return { status: "success" as const, hasActiveSubscription: false };
  } };
  const c = createPremiumPurchaseCoordinator({ actor: f.actor, adapter, journal: f.journal, monotonicNow: () => 0, dispatchEpoch: () => 1 });
  const original = c.reload();
  await new Promise((resolve) => setImmediate(resolve));
  f.setAccess("verified"); await c.reload(); // Invalidation arrives after the earlier backend read.
  release(); await original; await new Promise((resolve) => setImmediate(resolve));
  assert.equal(c.getState().access, "verified"); assert.equal(reads, 2);
  assert.equal(f.events.includes("SDK"), false);
});

test("bound candidate plus denied backend/empty store cannot invite a second subscription", async () => {
  const f = fixture(), c = f.create(); await c.reload(); await c.purchase(pkg, confirmation);
  assert.equal(c.getState().access, "denied"); assert.equal(c.getState().blocked, true);
  assert.equal(f.marker()?.phase, "candidate");
  const resumed = f.create(); await resumed.reload(); await resumed.purchase(pkg, confirmation);
  assert.equal(f.events.filter((x) => x === "SDK").length, 1);
  f.setAccess("verified"); await resumed.reload();
  assert.equal(f.marker(), null); assert.equal(resumed.getState().notice, "active");
});

test("restore cancellation does not cancel an original pending purchase or show a failure", async () => {
  const f = fixture(); f.journal.save({ accountId: "A", attemptId: confirmation.confirmationId, phase: "pending", transactionId: null, confirmation: null });
  const adapter = { ...f.adapter, restorePurchases: async () => ({ status: "cancelled" as const }) };
  const c = createPremiumPurchaseCoordinator({ actor: f.actor, adapter, journal: f.journal, monotonicNow: () => 0, dispatchEpoch: () => 1 });
  await c.reload(); await c.restore();
  assert.equal(c.getState().notice, "restoreCancelled"); assert.equal(c.getState().blocked, true);
  assert.equal(f.marker()?.phase, "pending"); assert.equal(f.events.includes("cancelled"), false);
});
