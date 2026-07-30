import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const require = createRequire(import.meta.url);
const {
  injectAndroidDebugMetroPermission,
  injectIosBackupPolicy,
  withAndroidBackupPolicy,
} = require("../plugins/withPrivacyBoundary.js");

test("release-native configuration excludes canonical learning storage from backup and unneeded ingress", () => {
  const appConfig = read("app.json");
  const plugin = read("plugins/withPrivacyBoundary.js");

  assert.match(appConfig, /"\.\/plugins\/withPrivacyBoundary"/);
  assert.match(plugin, /"android:allowBackup": "false"/);
  assert.match(plugin, /"android:fullBackupContent": "@xml\/backup_rules"/);
  assert.match(plugin, /"android:dataExtractionRules": "@xml\/data_extraction_rules"/);
  for (const permission of [
    "android.permission.INTERNET",
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
  assert.match(plugin, /<exclude domain="root" path="\."\/>/);
  assert.match(plugin, /<cloud-backup>/);
  assert.match(plugin, /<device-transfer>/);
  assert.match(plugin, /appendingPathComponent\("mmkv", isDirectory: true\)/);
  assert.match(plugin, /values\.isExcludedFromBackup = true/);
  assert.match(plugin, /fatalError\("Patternly cannot establish its local-storage backup policy\./);
  assert.match(plugin, /function injectAndroidDebugMetroPermission/);
  assert.match(plugin, /android\.permission\.INTERNET/);
});

test("Android privacy transforms are reproducible without generated native projects", () => {
  const config = {
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
  assert.ok(
    permissions.some(
      (permission: { $: Record<string, string> }) =>
        permission.$["android:name"] === "android.permission.INTERNET" &&
        permission.$["tools:node"] === "remove",
    ),
  );
  assert.ok(
    permissions.every(
      (permission: { $: Record<string, string> }) => permission.$["tools:node"] === "remove",
    ),
  );

  const debugManifest = injectAndroidDebugMetroPermission(
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n</manifest>\n',
  );
  assert.match(debugManifest, /android\.permission\.INTERNET" tools:node="replace"/);
  assert.equal(injectAndroidDebugMetroPermission(debugManifest), debugManifest);
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
});
