import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createExpoConfig } = require("../app.config.js") as { createExpoConfig: (environment: Record<string, string>) => { expo: Record<string, any> } };
const app = createExpoConfig({
  EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "playIntegrity", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "appAttest",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "key", EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:1:android:test", EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "patternly-app-production.firebaseapp.com", EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "patternly-app-production",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID: "android-client", EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID: "ios-client", EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID: "web-client",
  EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: JSON.stringify({ apiOrigin: "https://api.patternly.com", androidAppLinkHost: "patternly.com", authActionOrigin: "https://patternly.com", authRedirectDomain: "patternly.com", environment: "production", iosAssociatedDomain: "applinks:patternly.com", privacyUrl: "https://patternly.com/privacy", publicDeletionUrl: "https://patternly.com/delete", publicWebOrigin: "https://patternly.com", supportUrl: "https://patternly.com/support", termsUrl: "https://patternly.com/terms", transactionalSenderDomain: "patternly.com" }),
  GOOGLE_SERVICE_INFO_PLIST: "/private/GoogleService-Info.plist", GOOGLE_SERVICES_JSON: "/private/google-services.json", PATTERNLY_RUNTIME_MODE: "release",
}).expo as {
  version: string;
  runtimeVersion?: { policy?: string };
  ios?: { buildNumber?: string };
  android?: { versionCode?: number };
};
const eas = JSON.parse(readFileSync("eas.json", "utf8")) as {
  cli: { version: string; appVersionSource: string; requireCommit: boolean };
  build: Record<string, { distribution: string; environment: string; env: { PATTERNLY_RUNTIME_MODE: string; EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: string }; android?: { buildType?: string }; channel: string; autoIncrement?: boolean }>;
};
const easIgnore = readFileSync(".easignore", "utf8");

test("EAS release configuration has explicit version, runtime, and channel policy", () => {
  assert.equal(app.version, "0.1.0");
  assert.deepEqual(app.runtimeVersion, { policy: "appVersion" });
  assert.equal(app.ios?.buildNumber, "1");
  assert.equal(app.android?.versionCode, 1);
  assert.equal(eas.cli.appVersionSource, "local");
  assert.equal(eas.cli.requireCommit, true);
  assert.match(eas.cli.version, /^>= /u);

  assert.deepEqual(eas.build, {
    sandbox: { distribution: "internal", android: { buildType: "apk" }, channel: "sandbox", environment: "preview", env: { PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox" } },
    release: { distribution: "store", channel: "production", autoIncrement: true, environment: "production", env: { PATTERNLY_RUNTIME_MODE: "release", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "release" } },
  });
});

test("EAS source archives exclude generated native output, artifacts, and credentials", () => {
  for (const entry of ["node_modules/", ".expo/", "dist/", "web-build/", "android/", "ios/", "artifacts/"]) {
    assert.match(easIgnore, new RegExp(`^${entry.replace(/[./]/g, "\\$&")}$`, "mu"));
  }
  for (const pattern of ["*.jks", "*.p8", "*.p12", "*.key", "*.mobileprovision", "credentials.json", ".env", ".env.*"]) {
    assert.match(easIgnore, new RegExp(`^${pattern.replace(/[.*]/g, "\\$&")}$`, "mu"));
  }
  assert.doesNotMatch(easIgnore, /PATTERNLY_[A-Z0-9_]+=|BEGIN (?:PRIVATE|OPENSSH) KEY/u);
});
