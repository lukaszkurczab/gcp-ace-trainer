import assert from "node:assert/strict";
import test from "node:test";
import { createPurchasesAdapter, readPurchaseConfig, type RevenueCatGateway, type RevenueCatPackage, type StoreBinding } from "./index";

const IOS: StoreBinding = { platform: "ios", store: "APP_STORE", appId: "fixture-ios", rcProductId: "fixture-rc-ios", storeProductId: "com.lkurczab.patternly.premium.monthly", basePlanId: null };
const PLAY: StoreBinding = { platform: "android", store: "PLAY_STORE", appId: "fixture-play", rcProductId: "fixture-rc-play", storeProductId: "fixture_play_monthly", basePlanId: "monthly" };
const pkg = (overrides: Record<string, unknown> = {}) => ({ identifier: "monthly", store: "APP_STORE" as const, purchaseProductIdentifier: "com.lkurczab.patternly.premium.monthly", product: { identifier: "com.lkurczab.patternly.premium.monthly", priceString: "€9.99", introPrice: null, discounts: [], productType: "AUTO_RENEWABLE_SUBSCRIPTION", subscriptionPeriod: "P1M", ...overrides } });
const options = { config: { apiKey: "key", accountId: "account", binding: IOS }, checkoutEnabled: true };
function gateway(overrides: Partial<RevenueCatGateway> = {}): RevenueCatGateway {
  return { configure: async () => {}, getOfferings: async () => ({ current: { monthly: pkg() } }), purchasePackage: async () => ({ productIdentifier: pkg().product.identifier, transaction: { productIdentifier: pkg().product.identifier, transactionIdentifier: "exact-T" } }), restorePurchases: async () => ({ activeSubscriptions: [] }), getCustomerInfo: async () => ({ activeSubscriptions: [] }), managementURL: async () => "https://apps.apple.com/account/subscriptions", ...overrides };
}

test("SDK config requires a key/account, independently of checkout", () => {
  assert.equal(readPurchaseConfig({}, "account"), null);
  assert.equal(readPurchaseConfig({ EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "key" }, "account")?.apiKey, "key");
  assert.equal(readPurchaseConfig({ EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "key" }, ""), null);
  assert.equal(readPurchaseConfig({ EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "key" }, "account", "android"), null);
  const publicEnvironment = JSON.stringify({ apiOrigin: "https://api.patternly.test", androidAppLinkHost: "api.patternly.test", authActionOrigin: "https://auth.patternly.test", authRedirectDomain: "auth.patternly.test", environment: "sandbox", iosAssociatedDomain: "applinks:api.patternly.test", privacyUrl: "https://api.patternly.test/privacy", publicWebOrigin: "https://www.patternly.test", supportUrl: "https://api.patternly.test/support", termsUrl: "https://api.patternly.test/terms", transactionalSenderDomain: "mail.patternly.test" });
  const testMap = JSON.stringify({ version: "premium-map-fixture-v1", projectId: "fixture-project", entitlementId: "premium", environment: "SANDBOX", fixture: true, bindings: [
    { platform: "ios", store: "APP_STORE", appId: "fixture-ios", rcProductId: "fixture-rc-ios", storeProductId: "fixture.ios.monthly", basePlanId: null },
    { platform: "android", store: "PLAY_STORE", appId: "fixture-play", rcProductId: "fixture-rc-play", storeProductId: "fixture_play_monthly", basePlanId: "monthly" },
  ] });
  const androidEnv = { EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment, EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP: testMap, EXPO_PUBLIC_PATTERNLY_REVENUECAT_ANDROID_API_KEY: "fixture-key" };
  assert.equal(readPurchaseConfig(androidEnv, "account", "android"), null, "fixture map is rejected on production config path");
  assert.equal(readPurchaseConfig(androidEnv, "account", "android", true)?.binding.appId, "fixture-play", "tests can opt into only the exact fixture map");
  assert.equal(readPurchaseConfig({ ...androidEnv, EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP: JSON.stringify({ projectId: "other", mapVersion: "premium-map-v1", environment: "SANDBOX", bindings: [] }) }, "account", "android", true), null);
});

test("iOS offering validates product, monthly period and no introductory offers", async () => {
  assert.equal((await createPurchasesAdapter(gateway(), { ...options, platform: "android" }).configure()).status, "unavailable");
  assert.equal((await createPurchasesAdapter(gateway(), options).getMonthlyPackage()).status, "success");
  for (const change of [{ introPrice: { price: 0 } }, { subscriptionPeriod: "P1Y" }, { productType: "CONSUMABLE" }, { identifier: "annual" }, { priceString: "" }, { discounts: [{}] }]) {
    assert.equal((await createPurchasesAdapter(gateway({ getOfferings: async () => ({ current: { monthly: pkg(change) } }) }), options).getMonthlyPackage()).status, "unavailable");
  }
});

test("Play selects only the exact monthly base plan and purchases that SDK option", async () => {
  const option = { id: "monthly", productId: PLAY.storeProductId, storeProductId: `${PLAY.storeProductId}:monthly`, isBasePlan: true, isPrepaid: false, billingPeriod: { iso8601: "P1M" }, pricingPhases: [{ price: { amountMicros: 9_990_000 } }] } as const;
  const playPackage = { identifier: "monthly", product: { identifier: PLAY.storeProductId, priceString: "€9.99", introPrice: null, discounts: null, productType: "AUTO_RENEWABLE_SUBSCRIPTION", subscriptionPeriod: "P1M", subscriptionOptions: [option] } } as unknown as RevenueCatPackage;
  let selected: unknown = null;
  const adapter = createPurchasesAdapter(gateway({ getOfferings: async () => ({ current: { monthly: playPackage } }), purchaseSubscriptionOption: async (chosen) => {
    selected = chosen;
    return { productIdentifier: PLAY.storeProductId, transaction: { productIdentifier: PLAY.storeProductId, transactionIdentifier: "play-exact-T" } };
  } }), { ...options, platform: "android", binding: PLAY });
  const offer = await adapter.getMonthlyPackage();
  assert.equal(offer.status, "success");
  assert.equal(offer.package?.purchaseProductIdentifier, `${PLAY.storeProductId}:monthly`);
  assert.deepEqual(await adapter.purchasePackage(offer.package!), { status: "success", transactionId: "play-exact-T" });
  assert.equal(selected, option);
  for (const invalid of [
    { ...option, id: "monthly:free", isBasePlan: false },
    { ...option, storeProductId: PLAY.storeProductId },
    { ...option, isPrepaid: true },
    { ...option, billingPeriod: { iso8601: "P1Y" } },
    { ...option, pricingPhases: [{ price: { amountMicros: 0 } }] },
  ]) {
    const result = await createPurchasesAdapter(gateway({ getOfferings: async () => ({ current: { monthly: { ...playPackage, product: { ...playPackage.product, subscriptionOptions: [invalid] } } as unknown as RevenueCatPackage } }) }), { ...options, platform: "android", binding: PLAY }).getMonthlyPackage();
    assert.equal(result.status, "unavailable");
  }
});

test("binding platform/store/base-plan mismatches and cross-store management URLs fail closed", async () => {
  const mismatched = { ...PLAY, store: "APP_STORE" as const, basePlanId: null };
  assert.equal((await createPurchasesAdapter(gateway(), { ...options, platform: "android", binding: mismatched }).configure()).status, "unavailable");
  assert.equal((await createPurchasesAdapter(gateway({ managementURL: async () => "https://play.google.com/store/account/subscriptions" }), options).managementURL()).status, "unavailable");
  assert.equal((await createPurchasesAdapter(gateway({ managementURL: async () => "https://apps.apple.com/account/subscriptions" }), { ...options, platform: "android", binding: PLAY }).managementURL()).status, "unavailable");
});

test("original purchase result supplies exact candidate; CustomerInfo history cannot substitute", async () => {
  assert.deepEqual(await createPurchasesAdapter(gateway(), options).purchasePackage(pkg()), { status: "success", transactionId: "exact-T" });
  for (const result of [{ customerInfo: { activeSubscriptions: [pkg().product.identifier] } }, { productIdentifier: pkg().product.identifier, transaction: { productIdentifier: "other", transactionIdentifier: "T" } }]) {
    assert.deepEqual(await createPurchasesAdapter(gateway({ purchasePackage: async () => result }), options).purchasePackage(pkg()), { status: "unknown" });
  }
});

test("pending, cancel, ambiguous store error and failed restore remain distinct", async () => {
  for (const [error, status] of [[{ code: "20" }, "pending"], [{ code: 20 }, "pending"], [{ code: "1", userCancelled: true }, "cancelled"], [{ code: "2" }, "unknown"], [new Error("timeout"), "unknown"]] as const) {
    assert.equal((await createPurchasesAdapter(gateway({ purchasePackage: async () => { throw error; } }), options).purchasePackage(pkg())).status, status);
  }
  assert.equal((await createPurchasesAdapter(gateway({ restorePurchases: async () => { throw Error("offline"); } }), options).restorePurchases()).status, "failure");
});

test("checkout false blocks the effect and offerings, preserves restore and manage without an offering", async () => {
  let buys = 0, offers = 0, restores = 0;
  const adapter = createPurchasesAdapter(gateway({ purchasePackage: async () => { buys++; }, getOfferings: async () => { offers++; throw Error("unavailable"); }, restorePurchases: async () => { restores++; return { activeSubscriptions: ["monthly"] }; } }), { ...options, checkoutEnabled: false });
  assert.equal((await adapter.purchasePackage(pkg())).status, "unavailable");
  assert.equal((await adapter.getMonthlyPackage()).status, "unavailable");
  assert.equal((await adapter.restorePurchases()).status, "success");
  assert.equal((await adapter.managementURL()).status, "success");
  assert.deepEqual([buys, offers, restores], [0, 0, 1]);
  assert.equal((await createPurchasesAdapter(gateway({ managementURL: async () => null }), options).managementURL()).status, "unavailable");
});

test("shared lane prevents a new account configuration during an old store sheet", async () => {
  const events: string[] = [];
  let release!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  const shared = gateway({ configure: async ({ appUserID }) => { events.push(`config:${appUserID}`); }, purchasePackage: async () => { events.push("buy:A"); await paused; events.push("done:A"); return { productIdentifier: pkg().product.identifier, transaction: { productIdentifier: pkg().product.identifier, transactionIdentifier: "T" } }; } });
  const a = createPurchasesAdapter(shared, { ...options, config: { ...options.config, accountId: "A" } });
  const b = createPurchasesAdapter(shared, { ...options, config: { ...options.config, accountId: "B" } });
  const buying = a.purchasePackage(pkg());
  const restoring = b.restorePurchases();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ["config:A", "buy:A"]);
  release(); await buying; await restoring;
  assert.deepEqual(events, ["config:A", "buy:A", "done:A", "config:B"]);
});

test("actor and deadline are checked after asynchronous configure, before store effect", async () => {
  let current = true, buys = 0;
  const adapter = createPurchasesAdapter(gateway({ configure: async () => { current = false; }, purchasePackage: async () => { buys++; } }), { ...options, isCurrent: () => current });
  assert.equal((await adapter.purchasePackage(pkg())).status, "unavailable");
  current = true;
  const deadline = createPurchasesAdapter(gateway({ purchasePackage: async () => { buys++; } }), options);
  assert.equal((await deadline.purchasePackage(pkg(), () => false)).status, "unavailable");
  assert.equal(buys, 0);
});

test("provider subscription is an invalidation and is removed on cleanup", () => {
  let listener: (() => void) | undefined, removed = false, reads = 0, current = true;
  const adapter = createPurchasesAdapter(gateway({ subscribe: (callback) => { listener = callback; return () => { removed = true; }; } }), { ...options, isCurrent: () => current });
  const unsubscribe = adapter.subscribe(() => { reads++; });
  listener?.(); current = false; listener?.(); unsubscribe();
  assert.equal(reads, 1); assert.equal(removed, true);
});
