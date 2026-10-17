import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const require = createRequire(import.meta.url);
const plist = require("@expo/plist").default;
const normalized = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const {
  androidBackupRules,
  injectIosBackupPolicy,
  iosBackupPolicySwift,
  privacyInfoXcPrivacy,
  withAndroidBackupPolicy,
  withoutRemoteNotificationBackgroundMode,
  withoutRemoteNotificationEntitlement,
} = require("../plugins/withPrivacyBoundary.js");

test("release-native configuration excludes canonical learning storage from backup and unneeded ingress", () => {
  const appConfig = read("app.config.js");
  const plugin = read("plugins/withPrivacyBoundary.js");

  assert.match(appConfig, /"\.\/plugins\/withPrivacyBoundary"/);
  assert.match(appConfig, /"expo-notifications"/);
  assert.match(plugin, /"android:allowBackup": "false"/);
  assert.match(plugin, /"android:fullBackupContent": "@xml\/backup_rules"/);
  assert.match(plugin, /"android:dataExtractionRules": "@xml\/data_extraction_rules"/);
  for (const permission of [
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.VIBRATE",
    "android.permission.ACCESS_NETWORK_STATE",
    "android.permission.WAKE_LOCK",
    "com.google.android.c2dm.permission.RECEIVE",
  ]) {
    assert.match(plugin, new RegExp(`"${permission}"`));
  }
  assert.match(plugin, /manifest\.queries = \[\{ \$: \{ "tools:node": "remove" \} \}\]/);
  assert.match(plugin, /"root", "file", "database", "sharedpref", "external"/);
  assert.match(plugin, /<cloud-backup>/);
  assert.match(plugin, /<device-transfer>/);
  assert.match(plugin, /appendingPathComponent\("mmkv", isDirectory: true\)/);
  assert.match(plugin, /values\.isExcludedFromBackup = true/);
  assert.match(plugin, /fatalError\("Patternly cannot establish its local-storage backup policy\./);
  assert.match(plugin, /REQUIRED_ANDROID_PERMISSION = "android\.permission\.INTERNET"/);
});

test("Android privacy transforms are reproducible without generated native projects", () => {
  const config = {
    extra: { patternlyEnvironmentFingerprint: "a".repeat(64) },
    modResults: {
      manifest: {
        $: {},
        "uses-permission": [{ $: { "android:name": "android.permission.INTERNET" } }],
        queries: [{}],
        application: [{ $: { "android:label": "@string/app_name" } }],
      },
    },
  };

  const transformed = withAndroidBackupPolicy(config);
  const manifest = transformed.modResults.manifest;
  const permissions = manifest["uses-permission"];

  assert.equal(manifest.$["xmlns:tools"], "http://schemas.android.com/tools");
  assert.deepEqual(manifest.queries, [{ $: { "tools:node": "remove" } }]);
  assert.equal(manifest.application[0].$["android:allowBackup"], "false");
  assert.equal(manifest.application[0].$["android:fullBackupContent"], "@xml/backup_rules");
  assert.equal(manifest.application[0].$["android:dataExtractionRules"], "@xml/data_extraction_rules");
  assert.deepEqual(permissions[0]?.$, { "android:name": "android.permission.INTERNET", "tools:node": "replace" });
  assert.ok(
    permissions.slice(1).every(
      (permission: { $: Record<string, string> }) => permission.$["tools:node"] === "remove" && permission.$["android:name"] !== "android.permission.INTERNET",
    ),
  );
});

test("iOS backup transform is reproducible without a generated AppDelegate", () => {
  const appDelegate = `import Expo
import React

class AppDelegate: ExpoAppDelegate {
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
}
`;
  const transformed = injectIosBackupPolicy(appDelegate);

  assert.match(transformed, /configureCanonicalStorageBackupPolicy\(\)/);
  assert.match(transformed, /appendingPathComponent\("mmkv", isDirectory: true\)/);
  assert.match(transformed, /values\.isExcludedFromBackup = true/);
  assert.match(transformed, /fatalError\("Patternly cannot establish its local-storage backup policy\./);
  assert.equal(injectIosBackupPolicy(transformed), transformed);
  for (const directory of ["mmkv", "patternly-content-node-packages-v1", "Preferences", "Application Support", "revenuecat"]) {
    assert.ok(transformed.includes(`appendingPathComponent("${directory}", isDirectory: true)`));
  }
  assert.ok(transformed.includes('appendingPathComponent("\\(bundleIdentifier).revenuecat", isDirectory: true)'));
  assert.ok(transformed.includes(".resourceValues(forKeys: [.isExcludedFromBackupKey])"));
  assert.ok(transformed.indexOf("    configureCanonicalStorageBackupPolicy()") < transformed.indexOf("return super.application"));
  assert.ok(transformed.includes(iosBackupPolicySwift()));
  const legacy = appDelegate.replace("  // Linking API", `  private func configureCanonicalStorageBackupPolicy() {\n    // legacy MMKV-only policy\n  }\n\n  // Linking API`)
    .replace("    return super.application", "    configureCanonicalStorageBackupPolicy()\n\n    return super.application");
  assert.equal(injectIosBackupPolicy(legacy), transformed, "existing generated native projects receive the new policy");
  assert.throws(() => injectIosBackupPolicy(appDelegate.replace("  // Linking API\n", "")), /anchors were not found/);
  assert.throws(() => injectIosBackupPolicy(appDelegate.replaceAll("didFinishLaunchingWithOptions", "unexpectedLaunch")), /anchors were not found/);
  assert.throws(() => injectIosBackupPolicy(appDelegate + "configureCanonicalStorageBackupPolicy"), /unsupported backup policy/);
});

test("clean iOS output declares current data collection without tracking or remote notifications", () => {
  const privacyInfo = plist.parse(privacyInfoXcPrivacy());
  const collectedDataTypes = privacyInfo.NSPrivacyCollectedDataTypes;

  assert.equal(privacyInfo.NSPrivacyTracking, false);
  assert.deepEqual(normalized(privacyInfo.NSPrivacyAccessedAPITypes), [
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp", NSPrivacyAccessedAPITypeReasons: ["C617.1", "0A2A.1", "3B52.1"] },
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults", NSPrivacyAccessedAPITypeReasons: ["CA92.1", "1C8F.1", "C56D.1"] },
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace", NSPrivacyAccessedAPITypeReasons: ["E174.1", "85F4.1"] },
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime", NSPrivacyAccessedAPITypeReasons: ["35F9.1"] },
  ]);
  assert.deepEqual(normalized(collectedDataTypes), [
    "Name",
    "EmailAddress",
    "UserID",
    "DeviceID",
    "OtherUserContent",
    "CustomerSupport",
    "ProductInteraction",
    "OtherDiagnosticData",
  ].map((suffix) => ({
    NSPrivacyCollectedDataType: `NSPrivacyCollectedDataType${suffix}`,
    NSPrivacyCollectedDataTypeLinked: true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"],
  })).concat({
    NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePurchaseHistory",
    NSPrivacyCollectedDataTypeLinked: true,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality", "NSPrivacyCollectedDataTypePurposeAnalytics"],
  }));
  assert.equal("NSPrivacyTrackingDomains" in privacyInfo, false);
  assert.deepEqual(withoutRemoteNotificationEntitlement({ "aps-environment": "development", "com.apple.developer.applesignin": ["Default"] }), { "com.apple.developer.applesignin": ["Default"] });
  assert.deepEqual(withoutRemoteNotificationBackgroundMode({ UIBackgroundModes: ["remote-notification", "processing"] }), { UIBackgroundModes: ["processing"] });
  assert.deepEqual(withoutRemoteNotificationBackgroundMode({ UIBackgroundModes: ["remote-notification"] }), {});
});

// Parse generated XML rather than only checking the generator source: a missing
// domain in either transfer mode would silently allow that class of app data.
test("Android backup XML denies every supported storage domain in every mode", async () => {
  const { parseStringPromise } = require("xml2js");
  const rules = androidBackupRules();
  const legacy = await parseStringPromise(rules.legacy);
  const extraction = await parseStringPromise(rules.extraction);
  const expected = ["root", "file", "database", "sharedpref", "external",
    "device_root", "device_file", "device_database", "device_sharedpref"].sort();
  const assertExcluded = (section: { exclude: { $: { domain: string; path: string } }[]; include?: unknown }) => {
    assert.equal(section.include, undefined);
    assert.deepEqual(section.exclude.map((entry) => entry.$.domain).sort(), expected);
    assert.ok(section.exclude.every((entry) => entry.$.path === "."));
  };
  assertExcluded(legacy["full-backup-content"]);
  for (const mode of ["cloud-backup", "device-transfer"]) {
    assert.equal(extraction["data-extraction-rules"][mode].length, 1);
    assertExcluded(extraction["data-extraction-rules"][mode][0]);
  }
});

test("Android artifact fingerprint uses canonical config, fails closed and preserves other metadata", () => {
  const make = (fingerprint?: string) => ({ extra: { patternlyEnvironmentFingerprint: fingerprint }, modResults: {
    manifest: { application: [{ $: {}, "meta-data": [
      { $: { "android:name": "unrelated", "android:value": "keep" } },
      { $: { "android:name": "com.patternly.environmentFingerprint", "android:value": "stale" } },
    ] }] },
  } });
  for (const fingerprint of [undefined, "", "A".repeat(64), "a".repeat(63), "a".repeat(65)]) {
    assert.throws(() => withAndroidBackupPolicy(make(fingerprint)), /canonical environment fingerprint/);
  }
  const config = make("b".repeat(64));
  withAndroidBackupPolicy(config);
  withAndroidBackupPolicy(config);
  assert.deepEqual(config.modResults.manifest.application[0]!["meta-data"], [
    { $: { "android:name": "unrelated", "android:value": "keep" } },
    { $: { "android:name": "com.patternly.environmentFingerprint", "android:value": "b".repeat(64) } },
  ]);
});
