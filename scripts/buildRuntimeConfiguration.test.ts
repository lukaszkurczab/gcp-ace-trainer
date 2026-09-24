import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createExpoConfig } = require("../app.config.js") as { createExpoConfig: (environment: Record<string, string>) => { expo: { android: { googleServicesFile: string }; extra: { patternlyRuntime: string }; ios: { googleServicesFile: string }; plugins: unknown[] } } };

const base = {
  EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "key", EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:1:android:test", EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "patternly-app-sandbox.firebaseapp.com", EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "patternly-app-sandbox",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID: "android-client", EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID: "ios-client", EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID: "web-client",
  EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "appl_test_public_key",
  GOOGLE_SERVICE_INFO_PLIST: "/private/GoogleService-Info.plist", GOOGLE_SERVICES_JSON: "/private/google-services.json",
};
const publicEnvironment = (environment: "sandbox" | "production") => JSON.stringify({ apiOrigin: `https://api.${environment}.patternly.test`, androidAppLinkHost: `${environment}.patternly.test`, authActionOrigin: `https://${environment}.patternly.test`, authRedirectDomain: `${environment}.patternly.test`, environment, iosAssociatedDomain: `applinks:${environment}.patternly.test`, privacyUrl: `https://${environment}.patternly.test/privacy`, publicWebOrigin: `https://${environment}.patternly.test`, supportUrl: `https://${environment}.patternly.test/support`, termsUrl: `https://${environment}.patternly.test/terms`, transactionalSenderDomain: `${environment}.patternly.test` });
const smoke = {
  ...base,
  PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
  EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true",
  EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:9099",
};

test("runtime mode is explicit and persists in public Expo config", () => {
  const config = createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck" });
  assert.equal(config.expo.extra.patternlyRuntime, "sandbox");
  assert.ok(!config.expo.plugins.includes("./plugins/withAndroidSandboxVariant"));
  assert.ok(!config.expo.plugins.includes("./plugins/withAndroidReleaseSigningBoundary"));
  assert.ok(!config.expo.plugins.includes("./plugins/withAndroidNdkVersion"));
});

test("sandbox and release reject mode/configuration mismatches", () => {
  assert.throws(() => createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production") }), /must equal sandbox/);
  assert.throws(() => createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production") }), /must equal EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE/);
  assert.throws(() => createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "debug", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "debug" }), /playIntegrity/);
});

test("release app config always rejects the checked-in public legal payload", () => {
  const releaseEnvironment = { ...base, PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck" };
  assert.throws(() => createExpoConfig(releaseEnvironment), /Release legal variables are invalid:[\s\S]*terms\.operatorLegalName\.en: Unresolved legal placeholder/);
});

test("smoke is explicit, locally bound, and permits debug App Check", () => {
  const config = createExpoConfig({ ...smoke, EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "debug", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "debug" });
  assert.equal(config.expo.extra.patternlyRuntime, "smoke");
  assert.equal(createExpoConfig({ ...smoke, EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox") }).expo.extra.patternlyRuntime, "smoke");
  assert.throws(() => createExpoConfig({}), /requires PATTERNLY_RUNTIME_MODE/);
  assert.throws(() => createExpoConfig({ ...smoke, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox" }), /must equal/);
  assert.throws(() => createExpoConfig({ ...smoke, EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "https:\/\/sandbox.patternly.test" }), /127\.0\.0\.1/);
});

test("remote artifacts require their public Firebase configuration before prebuild", () => {
  assert.throws(
    () => createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox"), EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "" }),
    /requires EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY/,
  );
});

test("only iOS remote artifacts require the public RevenueCat Apple SDK key before prebuild", () => {
  const environment = { ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox"), EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "", EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck" };
  assert.equal(createExpoConfig({ ...environment, EAS_BUILD_PLATFORM: "android" }).expo.extra.patternlyRuntime, "sandbox");
  assert.throws(
    () => createExpoConfig({ ...environment, EAS_BUILD_PLATFORM: "ios" }),
    /requires EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY/,
  );
  assert.throws(
    () => createExpoConfig(environment),
    /requires EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY/,
  );
});

test("remote artifacts require production App Check providers before prebuild", () => {
  assert.throws(
    () => createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox") }),
    /sandbox builds require EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER=playIntegrity/,
  );
});

test("sandbox and release accept only production App Check provider pairs", () => {
  for (const mode of ["sandbox", "release"] as const) {
    const environment = { ...base, PATTERNLY_RUNTIME_MODE: mode, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: mode, EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment(mode === "release" ? "production" : "sandbox"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity" };
    for (const appleProvider of ["deviceCheck", "appAttest", "appAttestWithDeviceCheckFallback"]) {
      if (mode === "release") {
        assert.throws(() => createExpoConfig({ ...environment, EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: appleProvider }), /Release legal variables are invalid/);
      } else {
        assert.equal(createExpoConfig({ ...environment, EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: appleProvider }).expo.extra.patternlyRuntime, mode);
      }
    }
    for (const appleProvider of [undefined, "debug", "unsupported"]) {
      assert.throws(() => createExpoConfig({ ...environment, EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: appleProvider } as Record<string, string>), /Apple release App Check provider/);
    }
    for (const androidProvider of [undefined, "debug", "unsupported"]) {
      assert.throws(() => createExpoConfig({ ...environment, EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: androidProvider, EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "appAttest" } as Record<string, string>), /APPCHECK_ANDROID_PROVIDER=playIntegrity/);
    }
  }
});

test("sandbox uses the one tracked native Firebase registration while release requires production file variables", () => {
  const { GOOGLE_SERVICE_INFO_PLIST: _ios, GOOGLE_SERVICES_JSON: _android, ...withoutRemoteFiles } = base;
  const sandbox = createExpoConfig({ ...withoutRemoteFiles, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck" });
  assert.equal(sandbox.expo.android.googleServicesFile, "./google-services.json");
  assert.equal(sandbox.expo.ios.googleServicesFile, "./GoogleService-Info.plist");
  assert.throws(
    () => createExpoConfig({ ...withoutRemoteFiles, PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck" }),
    /requires GOOGLE_SERVICES_JSON/,
  );
});

test("explicit iOS sandbox and release require iOS configuration and ignore Android-only configuration", () => {
  for (const mode of ["sandbox", "release"] as const) {
    const environment = { ...base, PATTERNLY_RUNTIME_MODE: mode, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: mode, EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment(mode === "release" ? "production" : "sandbox"), EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck", EAS_BUILD_PLATFORM: "ios" };
    delete (environment as Record<string, string | undefined>).EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID;
    delete (environment as Record<string, string | undefined>).EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER;
    if (mode === "release") delete (environment as Record<string, string | undefined>).GOOGLE_SERVICES_JSON;
    if (mode === "release") {
      assert.throws(() => createExpoConfig(environment), /Release legal variables are invalid/);
    } else {
      const config = createExpoConfig(environment);
      assert.equal(config.expo.extra.patternlyRuntime, mode);
    }
    for (const [key, pattern] of [
      ["EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID", /requires EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID/],
      ["EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER", /Apple release App Check provider/],
      ...(mode === "release" ? [["GOOGLE_SERVICE_INFO_PLIST", /requires GOOGLE_SERVICE_INFO_PLIST/] as const] : []),
    ] as const) {
      const missing = { ...environment } as Record<string, string>;
      delete missing[key];
      assert.throws(() => createExpoConfig(missing), pattern);
    }
    const missingRevenueCat = { ...environment, EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "" };
    assert.throws(() => createExpoConfig(missingRevenueCat), /requires EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY/);
  }
});

test("explicit Android sandbox and release require Android configuration and ignore iOS-only configuration", () => {
  for (const mode of ["sandbox", "release"] as const) {
    const environment = { ...base, PATTERNLY_RUNTIME_MODE: mode, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: mode, EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment(mode === "release" ? "production" : "sandbox"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EAS_BUILD_PLATFORM: "android" };
    delete (environment as Record<string, string | undefined>).EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID;
    delete (environment as Record<string, string | undefined>).EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER;
    if (mode === "release") delete (environment as Record<string, string | undefined>).GOOGLE_SERVICE_INFO_PLIST;
    if (mode === "release") {
      assert.throws(() => createExpoConfig(environment), /Release legal variables are invalid/);
    } else {
      const config = createExpoConfig(environment);
      assert.equal(config.expo.extra.patternlyRuntime, mode);
    }
    if (mode === "sandbox") assert.equal(createExpoConfig({ ...environment, EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: "" }).expo.extra.patternlyRuntime, mode);
    for (const [key, pattern] of [
      ["EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID", /requires EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID/],
      ["EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER", /APPCHECK_ANDROID_PROVIDER=playIntegrity/],
      ...(mode === "release" ? [["GOOGLE_SERVICES_JSON", /requires GOOGLE_SERVICES_JSON/] as const] : []),
    ] as const) {
      const missing = { ...environment } as Record<string, string>;
      delete missing[key];
      assert.throws(() => createExpoConfig(missing), pattern);
    }
  }
});

test("without an explicit native target, sandbox and release require both platform configurations", () => {
  for (const mode of ["sandbox", "release"] as const) {
    const environment = { ...base, PATTERNLY_RUNTIME_MODE: mode, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: mode, EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment(mode === "release" ? "production" : "sandbox"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck" };
    for (const [key, pattern] of [
      ["EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID", /requires EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID/],
      ["EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID", /requires EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID/],
      ["EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER", /APPCHECK_ANDROID_PROVIDER=playIntegrity/],
      ["EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER", /Apple release App Check provider/],
      ...(mode === "release" ? [
        ["GOOGLE_SERVICES_JSON", /requires GOOGLE_SERVICES_JSON/],
        ["GOOGLE_SERVICE_INFO_PLIST", /requires GOOGLE_SERVICE_INFO_PLIST/],
      ] as const : []),
    ] as const) {
      const missing = { ...environment } as Record<string, string>;
      delete missing[key];
      assert.throws(() => createExpoConfig(missing), pattern, `${mode} without target must require ${key}`);
    }
  }
});

test("explicit iOS and Android builds always require shared Firebase public configuration", () => {
  for (const platform of ["ios", "android"] as const) {
    const environment = { ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck", EAS_BUILD_PLATFORM: platform };
    const missing = { ...environment, EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "" };
    assert.throws(() => createExpoConfig(missing), /requires EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY/, `${platform} must require the shared Firebase API key`);
  }
});
