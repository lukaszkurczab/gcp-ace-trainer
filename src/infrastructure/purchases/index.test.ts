import assert from "node:assert/strict";
import test from "node:test";
import { createPurchasesAdapter, readPurchaseConfig, type RevenueCatGateway } from "./index";

const pkg = (overrides: Record<string, unknown> = {}) => ({ identifier: "monthly", product: { identifier: "com.lkurczab.patternly.premium.monthly", priceString: "€9.99", introPrice: null, discounts: [], productType: "AUTO_RENEWABLE_SUBSCRIPTION", subscriptionPeriod: "P1M", ...overrides } });
function gateway(overrides: Partial<RevenueCatGateway> = {}): RevenueCatGateway {
  return { configure: async () => {}, getOfferings: async () => ({ current: { monthly: pkg() } }), purchasePackage: async () => {}, restorePurchases: async () => {}, getCustomerInfo: async () => ({}), managementURL: async () => "https://apple.test", ...overrides };
}

test("config requires non-empty key and authenticated account", () => {
  assert.equal(readPurchaseConfig({}, "account", true), null);
  assert.equal(readPurchaseConfig({ EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: " key " }, "account", true)?.apiKey, " key ");
  assert.equal(readPurchaseConfig({ EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "key" }, "", true), null);
  assert.equal(readPurchaseConfig({ EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "key" }, "account"), null);
});

test("adapter is iOS-only and validates monthly product terms", async () => {
  const adapter = createPurchasesAdapter(gateway(), { platform: "android", config: { apiKey: "key", accountId: "account" } });
  assert.equal((await adapter.configure()).status, "unavailable");
  const ios = createPurchasesAdapter(gateway(), { platform: "ios", config: { apiKey: "key", accountId: "account" } });
  assert.equal((await ios.getMonthlyPackage()).status, "success");
  const trial = createPurchasesAdapter(gateway({ getOfferings: async () => ({ current: { monthly: pkg({ introPrice: { price: 0 } }) } }) }), { platform: "ios", config: { apiKey: "key", accountId: "account" } });
  assert.equal((await trial.getMonthlyPackage()).status, "unavailable");
});

test("purchase cancellation and failures are explicit", async () => {
  const cancelled = createPurchasesAdapter(gateway({ purchasePackage: async () => { throw { code: "1", userCancelled: true }; } }), { platform: "ios", config: { apiKey: "key", accountId: "account" } });
  assert.equal((await cancelled.purchasePackage(pkg())).status, "cancelled");
  const failed = createPurchasesAdapter(gateway({ restorePurchases: async () => { throw new Error("offline"); } }), { platform: "ios", config: { apiKey: "key", accountId: "account" } });
  assert.equal((await failed.restorePurchases()).status, "failure");
});

test("configuration is single-flight across concurrent actions", async () => {
  let configureCalls = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const adapter = createPurchasesAdapter(gateway({ configure: async () => { configureCalls++; await pending; } }), { platform: "ios", config: { apiKey: "key", accountId: "account" } });
  const offer = adapter.getMonthlyPackage();
  const restore = adapter.restorePurchases();
  await Promise.resolve();
  assert.equal(configureCalls, 1);
  release();
  assert.equal((await offer).status, "success");
  assert.equal((await restore).status, "success");
});
