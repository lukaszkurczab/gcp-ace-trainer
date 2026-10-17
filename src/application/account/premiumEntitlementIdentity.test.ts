import assert from "node:assert/strict";
import test from "node:test";
import { PREMIUM_MAP_PROJECT_ID, PREMIUM_MAP_VERSION, premiumIdentityForAccount } from "./premiumEntitlementIdentity";

const publicEnvironment = (environment: "sandbox" | "production") => JSON.stringify({
  apiOrigin: "https://api.patternly.test", androidAppLinkHost: "api.patternly.test", authActionOrigin: "https://auth.patternly.test",
  authRedirectDomain: "auth.patternly.test", environment, iosAssociatedDomain: "applinks:api.patternly.test",
  privacyUrl: "https://api.patternly.test/privacy", publicWebOrigin: "https://www.patternly.test", supportUrl: "https://api.patternly.test/support",
  termsUrl: "https://api.patternly.test/terms", transactionalSenderDomain: "mail.patternly.test",
});

test("Premium cache identity is pinned to the configured public environment and approved reader map", () => {
  const sandbox = premiumIdentityForAccount("account", { EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox") });
  const production = premiumIdentityForAccount("account", { EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production") });
  assert.equal(sandbox?.projectId, PREMIUM_MAP_PROJECT_ID);
  assert.equal(sandbox?.mapVersion, PREMIUM_MAP_VERSION);
  assert.equal(sandbox?.environment, "SANDBOX");
  assert.equal(production?.environment, "PRODUCTION");
  assert.notDeepEqual(sandbox, production);
  const publicMap = JSON.stringify({ version: "premium-map-v2", projectId: "proj8ae78267", entitlementId: "premium", environment: "SANDBOX", bindings: [
    { platform: "ios", store: "APP_STORE", appId: "app7b06e9a4c1", rcProductId: "prod8d07384c8c", storeProductId: "com.lkurczab.patternly.premium.monthly", basePlanId: null },
  ] });
  assert.equal(premiumIdentityForAccount("account", { EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox"), EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP: publicMap })?.mapVersion, "premium-map-v2");
  assert.equal(premiumIdentityForAccount("account", { EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production"), EXPO_PUBLIC_PATTERNLY_REVENUECAT_PUBLIC_MAP: publicMap }), null);
  assert.equal(premiumIdentityForAccount("account", {})?.environment, undefined);
  assert.equal(premiumIdentityForAccount("", { EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox") }), null);
});
