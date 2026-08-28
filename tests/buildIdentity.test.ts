import assert from "node:assert/strict";
import {
  readFileSync,
  readdirSync,
} from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createExpoConfig } = require("../app.config.js") as { createExpoConfig: (environment: Record<string, string>) => { expo: Record<string, unknown> } };

const smokeEnvironment = {
  EXPO_PUBLIC_PATTERNLY_APPCHECK_ANDROID_PROVIDER: "debug",
  EXPO_PUBLIC_PATTERNLY_APPCHECK_APPLE_PROVIDER: "debug",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_API_KEY: "key",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: "1:1:android:test",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: "patternly-app-sandbox.firebaseapp.com",
  EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: "patternly-app-sandbox",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_ANDROID_CLIENT_ID: "android-client",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_IOS_CLIENT_ID: "ios-client",
  EXPO_PUBLIC_PATTERNLY_GOOGLE_WEB_CLIENT_ID: "web-client",
  GOOGLE_SERVICE_INFO_PLIST: "./GoogleService-Info.plist",
  GOOGLE_SERVICES_JSON: "./google-services.json",
  PATTERNLY_RUNTIME_MODE: "smoke",
};

const APP_ID = "com.lkurczab.patternly";
const DEV_CLIENT_SCHEME = "exp+patternly";
const obsoleteTrackSlug = ["gcp", "ace", "trainer"].join("-");
const obsoletePackageSuffix = ["gcp", "ace", "trainer"].join("");
const OBSOLETE_IDENTITY = new RegExp(
  `${obsoleteTrackSlug}|${obsoletePackageSuffix}|com\\.lkurczab\\.${obsoletePackageSuffix}|exp\\+${obsoleteTrackSlug}`,
  "i",
);

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function filesUnder(directory: string, extension: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? filesUnder(path, extension)
      : path.endsWith(extension)
        ? [path]
        : [];
  });
}

test("Expo and npm expose one canonical Patternly identity", () => {
  const app = createExpoConfig(smokeEnvironment).expo as Record<string, any>;
  const packageManifest = JSON.parse(read("package.json"));
  const packageLock = JSON.parse(read("package-lock.json"));

  assert.equal(app.name, "Patternly");
  assert.equal(app.slug, "patternly");
  assert.equal(app.scheme, APP_ID);
  assert.equal(app.ios.bundleIdentifier, APP_ID);
  assert.equal(app.android.package, APP_ID);
  assert.equal(packageManifest.name, "patternly");
  assert.equal(packageLock.name, "patternly");
  assert.equal(packageLock.packages[""].name, "patternly");
  assert.match(read(".gitignore"), /^android\/$/m);
  assert.match(read(".gitignore"), /^ios\/$/m);
});

test("RC runners, runtime-audit URLs, and every Maestro flow share the Patternly identity", () => {
  const runnerPaths = [
    "scripts/runCertificationExamRcAndroid.mjs",
    "scripts/runCertificationExamRcIos.mjs",
    "scripts/runRcAlgorithmsAndroid.mjs",
    "scripts/runRcAlgorithmsIos.mjs",
  ];
  for (const path of runnerPaths) {
    const source = read(path);
    assert.match(source, /const APP_ID = "com\.lkurczab\.patternly";/);
    assert.match(source, /exp\+patternly:/);
    assert.doesNotMatch(source, OBSOLETE_IDENTITY);
  }

  const runtimeAudit = read(
    "src/application/runtimeAuditability/developmentResetCommand.ts",
  );
  assert.match(runtimeAudit, /com\.lkurczab\.patternly:\/\/audit\//);
  assert.doesNotMatch(runtimeAudit, OBSOLETE_IDENTITY);

  const maestroPaths = filesUnder(".maestro", ".yaml");
  assert.ok(maestroPaths.length > 0);
  for (const path of maestroPaths) {
    const flow = read(path);
    assert.match(flow, /^appId: com\.lkurczab\.patternly$/m, path);
    assert.doesNotMatch(flow, OBSOLETE_IDENTITY, path);
  }
});

test("build identity cutover leaves canonical learning-data keys unchanged", () => {
  assert.match(read("src/storage/keys.ts"), /patternly:canonical:v1:/);
  assert.match(
    read("src/storage/repositories/canonicalRecordCodec.ts"),
    /patternly:canonical:v1/,
  );
});
