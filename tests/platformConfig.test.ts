import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createExpoConfig } = require("../app.config.js") as { createExpoConfig: (environment: Record<string, string>) => { expo: Record<string, any> } };
const app = createExpoConfig({
  EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "debug", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "debug",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "key", EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:1:android:test", EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "patternly-app-sandbox.firebaseapp.com", EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "patternly-app-sandbox",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID: "android-client", EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID: "ios-client", EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID: "web-client",
  GOOGLE_SERVICE_INFO_PLIST: "./GoogleService-Info.plist", GOOGLE_SERVICES_JSON: "./google-services.json", PATTERNLY_RUNTIME_MODE: "smoke",
}).expo;
const packageManifest = JSON.parse(readFileSync("package.json", "utf8"));

test("Expo platform configuration declares the supported phone-only native matrix", () => {
  assert.equal(app.orientation, "portrait");
  assert.equal(app.userInterfaceStyle, "automatic");
  assert.equal(app.ios.supportsTablet, false);
  assert.equal(app.android.edgeToEdgeEnabled, undefined);
  assert.equal(packageManifest.dependencies["expo-system-ui"], "~57.0.3");
  assert.equal(packageManifest.engines.node, ">=22.13.0 <23");

  const buildProperties = app.plugins.find(
    (plugin: unknown): plugin is [string, Record<string, unknown>] =>
      Array.isArray(plugin) && plugin[0] === "expo-build-properties",
  );
  assert.ok(buildProperties, "Expo Build Properties must own native target levels.");

  const [_, properties] = buildProperties;
  assert.deepEqual(properties.ios, {
    deploymentTarget: "16.4",
    buildReactNativeFromSource: true,
    usePrecompiledModules: false,
    extraPods: [
      { name: "GoogleUtilities", modular_headers: true },
      { name: "RecaptchaInterop", modular_headers: true },
    ],
  });
  assert.deepEqual(properties.android, {
    minSdkVersion: 28,
    targetSdkVersion: 36,
    compileSdkVersion: 36,
  });

  assert.deepEqual(
    app.plugins.find((plugin: unknown) => Array.isArray(plugin) && plugin[0] === "expo-secure-store"),
    ["expo-secure-store", { configureAndroidBackup: false }],
  );
});
