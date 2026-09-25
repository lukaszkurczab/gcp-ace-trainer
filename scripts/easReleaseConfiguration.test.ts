import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createExpoConfig, updatesConfiguration } = require("../app.config.js") as { createExpoConfig: (environment: Record<string, string>) => { expo: Record<string, any> }; updatesConfiguration: (mode: string) => Record<string, unknown> };
const app = createExpoConfig({
  EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "debug", EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "debug",
  EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true", EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:8080",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:19099",
  EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT: JSON.stringify({ apiOrigin: "http://127.0.0.1:8080", environment: "local", privacyUrl: "http://127.0.0.1:4173/privacy", publicWebOrigin: "http://127.0.0.1:4173", supportUrl: "mailto:support@patternly.test", termsUrl: "http://127.0.0.1:4173/terms" }),
  GOOGLE_SERVICE_INFO_PLIST: "/private/GoogleService-Info.plist", GOOGLE_SERVICES_JSON: "/private/google-services.json", PATTERNLY_RUNTIME_MODE: "smoke", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
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
  assert.deepEqual(updatesConfiguration("release"), { url: "https://u.expo.dev/204d9769-4832-4c4a-b932-6359c4ff9dab", enabled: false, checkAutomatically: "NEVER" });
  assert.deepEqual(updatesConfiguration("sandbox"), { url: "https://u.expo.dev/204d9769-4832-4c4a-b932-6359c4ff9dab" });
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
