import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseDotenv, validateLocalProfile } from "../runLocalProfile.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const bundleId = "com.lkurczab.patternly.sec03";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Preparation only: never installs, launches, assigns a marker, creates a user,
 * contacts RevenueCat, starts services, or writes to the primary native tree. */
export function prepareEnvironmentIsolationIos(privateRoot, keyFile) {
  assert.equal(realpathSync(privateRoot), privateRoot, "private_root_rejected");
  const stat = lstatSync(privateRoot);
  assert.ok(privateRoot.startsWith("/private/tmp/") && stat.isDirectory() && stat.uid === process.getuid() && (stat.mode & 0o077) === 0, "private_root_rejected");
  assert.equal(realpathSync(keyFile), keyFile, "key_file_rejected");
  const keyStat = lstatSync(keyFile);
  assert.ok(keyStat.isFile() && keyStat.uid === process.getuid() && (keyStat.mode & 0o077) === 0, "key_file_rejected");
  const key = readFileSync(keyFile, "utf8").trim();
  assert.match(key, /^test_[A-Za-z0-9]+$/u, "test_store_key_required");
  const profile = validateLocalProfile("smoke", parseDotenv(readFileSync(join(root, ".env.smoke.local"), "utf8")));
  for (const name of ["EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE", "EXPO_PUBLIC_PATTERNLY_PERF06_FIXTURE", "EXPO_PUBLIC_PATTERNLY_AUTH_PROVIDER_FIXTURE"]) {
    assert.ok(!profile[name], "isolated_entry_override_rejected");
  }
  const environmentA = Object.freeze({ ...profile, EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY: key, EAS_BUILD_PLATFORM: "ios" });
  const environmentB = Object.freeze({ ...environmentA, EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:18080" });
  const { createExpoConfig } = require("../../app.config.js");
  const configurations = [environmentA, environmentB].map((environment) => {
    const { expo } = createExpoConfig(environment);
    // withPrivacyBoundary currently owns ios/Patternly/AppDelegate.swift.
    // Keep the native project name; distinguish the test app by ID and display name.
    return { expo: { ...expo, slug: "patternly-sec03", scheme: bundleId,
      ios: { ...expo.ios, bundleIdentifier: bundleId, infoPlist: { ...expo.ios.infoPlist, CFBundleDisplayName: "Patternly SEC03" } },
      plugins: [...expo.plugins, "./sec03.config-plugin.cjs"],
      updates: { ...expo.updates, enabled: false, checkAutomatically: "NEVER" } } };
  });
  assert.notEqual(configurations[0].expo.extra.patternlyEnvironmentFingerprint, configurations[1].expo.extra.patternlyEnvironmentFingerprint);
  const project = join(privateRoot, "project");
  assert.equal(existsSync(project), false, "project_already_exists");
  mkdirSync(project, { mode: 0o700 });
  for (const path of ["App.tsx", "src", "assets", "config", "native", "plugins", "metro.config.js", "tsconfig.json", "package.json", "package-lock.json", "GoogleService-Info.plist", "google-services.json"]) {
    cpSync(join(root, path), join(project, path), { recursive: true, errorOnExist: true, force: false });
  }
  symlinkSync(join(root, "node_modules"), join(project, "node_modules"), "dir");
  cpSync(join(root, "scripts/qa/sec03IsolatedIosPlugin.cjs"), join(project, "sec03.config-plugin.cjs"), { errorOnExist: true, force: false });
  // expo/AppEntry resolves ../../App through the shared node_modules symlink.
  // Use the documented local entry so every application module belongs to this snapshot.
  const entry = readFileSync(join(root, "node_modules/expo/AppEntry.js"), "utf8");
  assert.equal(entry.split("../../App").length, 2, "sdk_entry_unexpected");
  writeFileSync(join(project, "sec03.entry.js"), entry.replace("../../App", "./App"), { mode: 0o600, flag: "wx" });
  const pkg = JSON.parse(readFileSync(join(project, "package.json"), "utf8"));
  pkg.main = "./sec03.entry.js";
  writeFileSync(join(project, "package.json"), JSON.stringify(pkg, null, 2) + "\n", { mode: 0o600 });
  for (const [index, variant] of ["A", "B"].entries()) {
    writeFileSync(join(privateRoot, `environment-${variant}.json`), JSON.stringify(index === 0 ? environmentA : environmentB), { mode: 0o600, flag: "wx" });
    writeFileSync(join(privateRoot, `config-${variant}.json`), JSON.stringify(configurations[index], null, 2) + "\n", { mode: 0o600, flag: "wx" });
  }
  writeFileSync(join(project, "app.json"), JSON.stringify(configurations[0], null, 2) + "\n", { mode: 0o600, flag: "wx" });
  const sourceFiles = ["App.tsx", "src/infrastructure/runtime/environmentIdentity.ts", "src/infrastructure/runtime/environmentGuard.ts", "src/infrastructure/runtime/EnvironmentGate.tsx", "src/infrastructure/firebase/secureAuthPersistence.ts", "src/content/runtime/nodePackageStorage.ts", "src/infrastructure/purchases/index.ts", "package-lock.json", "GoogleService-Info.plist"];
  const receipt = { schema: "patternly.sec03-isolated-preparation.v1", project, bundleId,
    originalBundleId: "com.lkurczab.patternly", originalInstallationTouched: false, installedOrLaunched: false,
    firebaseScope: "unchanged-native-plist; JS Auth Emulator/local App Check only; no provider/native attestation claim",
    revenueCatScope: "existing Test Store SDK identity/customer-info cache; no purchase or service configuration",
    variants: configurations.map(({ expo }, index) => ({ variant: index === 0 ? "A" : "B", fingerprint: expo.extra.patternlyEnvironmentFingerprint, apiOrigin: (index === 0 ? environmentA : environmentB).EXPO_PUBLIC_PATTERNLY_API_ORIGIN })),
    sourceSha256: Object.fromEntries(sourceFiles.map((path) => [path, hash(readFileSync(join(project, path)))])),
    productionConfigSha256: hash(readFileSync(join(root, "app.config.js"))),
    isolatedNativeConfigPluginSha256: hash(readFileSync(join(project, "sec03.config-plugin.cjs"))), sdkEntrySha256: hash(entry) };
  writeFileSync(join(privateRoot, "preparation.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  return receipt;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [privateRoot, keyFile, ...extra] = process.argv.slice(2);
  try {
    assert.ok(privateRoot && keyFile && extra.length === 0, "arguments_rejected");
    const receipt = prepareEnvironmentIsolationIos(privateRoot, keyFile);
    const environment = JSON.parse(readFileSync(join(privateRoot, "environment-A.json"), "utf8"));
    const result = spawnSync(process.execPath, [join(root, "node_modules/expo/bin/cli"), "prebuild", "--no-install", "--clean", "--platform", "ios"], {
      cwd: receipt.project, env: { ...process.env, ...environment, EXPO_NO_DOTENV: "1", CI: "1" }, encoding: "utf8", timeout: 180_000,
    });
    writeFileSync(join(privateRoot, "prebuild.log"), `${result.stdout ?? ""}\n${result.stderr ?? ""}`, { mode: 0o600 });
    if (result.status !== 0) throw Error("isolated_prebuild_failed");
    console.log(JSON.stringify({ ...receipt, prebuild: "PASS" }));
  } catch {
    console.error(JSON.stringify({ stage: "sec03_preparation", category: "preparation_rejected_or_failed", remediation: "inspect private inputs/prebuild.log; no app was installed" }));
    process.exitCode = 1;
  }
}
