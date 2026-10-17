import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseDotenv, validateLocalProfile } from "../runLocalProfile.mjs";

// Native source check only. Does not build/sign/install, contact providers, or
// establish OEM backup behavior. Input and generated config stay outside Git.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const source = process.env.PATTERNLY_ANDROID_ENV_FILE;
assert(source, "Set PATTERNLY_ANDROID_ENV_FILE to a private sandbox env file.");
const environment = { ...process.env, ...parseDotenv(readFileSync(source, "utf8")),
  PATTERNLY_RUNTIME_MODE: "sandbox", EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "sandbox",
  EXPO_NO_DOTENV: "1", EAS_BUILD_PLATFORM: "android" };
for (const key of ["EXPO_PUBLIC_PATTERNLY_BACKEND_E2E", "EXPO_PUBLIC_PATTERNLY_API_ORIGIN",
  "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN", "EXPO_PUBLIC_PATTERNLY_E2E_EMAIL",
  "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD", "EXPO_PUBLIC_PATTERNLY_LOCAL_APPCHECK_TOKEN"]) delete environment[key];
validateLocalProfile("sandbox", environment);
const { createExpoConfig } = require("../../app.config.js");
const baselineConfig = createExpoConfig(environment);
const isolationProbe = process.argv.includes("--isolation-probe");
if (isolationProbe) {
  const baseline = JSON.parse(readFileSync(join(root, "scripts/fixtures/androidIsolationPublicEnvironment.json"), "utf8"));
  assert.deepEqual(JSON.parse(environment.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT), baseline,
    "isolation_probe_baseline_drift: review the sandbox baseline before building B");
  const eas = JSON.parse(readFileSync(join(root, "eas.json"), "utf8"));
  const probe = eas.build["android-isolation-probe"];
  assert.equal(probe.extends, "sandbox");
  assert.deepEqual(JSON.parse(probe.env.EXPO_PUBLIC_PATTERNLY_PUBLIC_ENVIRONMENT),
    { ...baseline, apiOrigin: "https://environment-isolation.invalid" });
  Object.assign(environment, eas.build.sandbox.env, probe.env);
  validateLocalProfile("sandbox", environment);
}
const config = createExpoConfig(environment);
if (isolationProbe) {
  assert.notEqual(config.expo.extra.patternlyEnvironmentFingerprint, baselineConfig.expo.extra.patternlyEnvironmentFingerprint);
  assert.equal(config.expo.android.package, baselineConfig.expo.android.package);
  assert.equal(config.expo.version, baselineConfig.expo.version);
  assert.equal(config.expo.android.versionCode, baselineConfig.expo.android.versionCode);
}
const directory = mkdtempSync(join(tmpdir(), "patternly-android-privacy-"));
for (const path of ["package.json", "package-lock.json", "plugins", "assets"]) {
  cpSync(join(root, path), join(directory, path), { recursive: true });
}
config.expo.android.googleServicesFile = resolve(root, config.expo.android.googleServicesFile);
symlinkSync(join(root, "node_modules"), join(directory, "node_modules"), "dir");
writeFileSync(join(directory, "app.json"), JSON.stringify(config), { mode: 0o600 });
const result = spawnSync(process.execPath, [join(root, "node_modules/expo/bin/cli"), "prebuild", "--no-install", "--clean", "--platform", "android"], {
  cwd: directory, env: { ...environment, CI: "1" }, encoding: "utf8", timeout: 180_000,
});
writeFileSync(join(directory, "prebuild.log"), `${result.stdout ?? ""}\n${result.stderr ?? ""}`, { mode: 0o600 });
assert.equal(result.status, 0, `android_privacy_prebuild_failed: inspect ${join(directory, "prebuild.log")}`);
const { parseStringPromise } = require("xml2js");
const base = join(directory, "android/app/src/main");
const manifest = await parseStringPromise(readFileSync(join(base, "AndroidManifest.xml"), "utf8"));
const app = manifest.manifest.application[0];
assert.equal(app.$["android:allowBackup"], "false");
assert.equal(app.$["android:fullBackupContent"], "@xml/backup_rules");
assert.equal(app.$["android:dataExtractionRules"], "@xml/data_extraction_rules");
const fingerprintMetadata = app["meta-data"].filter((entry) => entry.$["android:name"] === "com.patternly.environmentFingerprint");
assert.equal(fingerprintMetadata.length, 1);
assert.equal(fingerprintMetadata[0].$["android:value"], config.expo.extra.patternlyEnvironmentFingerprint);
const { androidBackupRules } = require("../../plugins/withPrivacyBoundary.js");
assert.equal(readFileSync(join(base, "res/xml/backup_rules.xml"), "utf8"), androidBackupRules().legacy);
assert.equal(readFileSync(join(base, "res/xml/data_extraction_rules.xml"), "utf8"), androidBackupRules().extraction);
const schemes = app.activity.flatMap((activity) => (activity["intent-filter"] ?? []).flatMap((filter) => filter.data ?? [])).map((data) => data.$["android:scheme"]);
assert.ok(schemes.includes(config.expo.scheme));
console.log(JSON.stringify({ result: "PASS", scope: "generated-native-source-only", isolationProbe, directory,
  fingerprint: config.expo.extra.patternlyEnvironmentFingerprint, callbackScheme: config.expo.scheme,
  domainsPerMode: 9, built: false, signed: false, installed: false }));
