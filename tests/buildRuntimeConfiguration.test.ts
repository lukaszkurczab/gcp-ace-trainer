import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createExpoConfig } = require("../app.config.js") as { createExpoConfig: (environment: Record<string, string>) => { expo: { android: { googleServicesFile: string }; extra: { patternlyRuntime: string }; ios: { googleServicesFile: string }; plugins: unknown[] } } };

const base = {
  EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "key", EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:1:android:test", EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "patternly-app-sandbox.firebaseapp.com", EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "patternly-app-sandbox",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID: "android-client", EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID: "ios-client", EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID: "web-client",
  GOOGLE_SERVICE_INFO_PLIST: "/private/GoogleService-Info.plist", GOOGLE_SERVICES_JSON: "/private/google-services.json",
};
const publicEnvironment = (environment: "sandbox" | "production") => JSON.stringify({ apiOrigin: `https://api.${environment}.patternly.test`, androidAppLinkHost: `${environment}.patternly.test`, authActionOrigin: `https://${environment}.patternly.test`, authRedirectDomain: `${environment}.patternly.test`, environment, iosAssociatedDomain: `applinks:${environment}.patternly.test`, privacyUrl: `https://${environment}.patternly.test/privacy`, publicDeletionUrl: `https://${environment}.patternly.test/delete`, publicWebOrigin: `https://${environment}.patternly.test`, supportUrl: `https://${environment}.patternly.test/support`, termsUrl: `https://${environment}.patternly.test/terms`, transactionalSenderDomain: `${environment}.patternly.test` });

test("runtime mode is explicit and persists in public Expo config", () => {
  const config = createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck" });
  assert.equal(config.expo.extra.patternlyRuntime, "sandbox");
  assert.ok(!config.expo.plugins.includes("./plugins/withAndroidSandboxVariant"));
  assert.ok(!config.expo.plugins.includes("./plugins/withAndroidReleaseSigningBoundary"));
  assert.ok(!config.expo.plugins.includes("./plugins/withAndroidNdkVersion"));
});

test("sandbox and release reject mode/configuration mismatches", () => {
  assert.throws(() => createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production") }), /must equal sandbox/);
  assert.throws(() => createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "debug", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "debug" }), /playIntegrity/);
});

test("smoke is the explicit local default and permits debug App Check", () => {
  const config = createExpoConfig({ ...base, EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "debug", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "debug" });
  assert.equal(config.expo.extra.patternlyRuntime, "smoke");
  assert.equal(createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "smoke", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox") }).expo.extra.patternlyRuntime, "smoke");
  assert.equal(createExpoConfig({}).expo.extra.patternlyRuntime, "smoke");
});

test("remote artifacts require their public Firebase configuration before prebuild", () => {
  assert.throws(
    () => createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox"), EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "" }),
    /requires EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY/,
  );
});

test("remote artifacts require production App Check providers before prebuild", () => {
  assert.throws(
    () => createExpoConfig({ ...base, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox") }),
    /sandbox builds require EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER=playIntegrity/,
  );
});

test("sandbox uses the one tracked native Firebase registration while release requires production file variables", () => {
  const { GOOGLE_SERVICE_INFO_PLIST: _ios, GOOGLE_SERVICES_JSON: _android, ...withoutRemoteFiles } = base;
  const sandbox = createExpoConfig({ ...withoutRemoteFiles, PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("sandbox"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck" });
  assert.equal(sandbox.expo.android.googleServicesFile, "./google-services.json");
  assert.equal(sandbox.expo.ios.googleServicesFile, "./GoogleService-Info.plist");
  assert.throws(
    () => createExpoConfig({ ...withoutRemoteFiles, PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: publicEnvironment("production"), EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "deviceCheck" }),
    /requires GOOGLE_SERVICES_JSON/,
  );
});
