import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("release-native configuration excludes canonical learning storage from backup and unneeded ingress", () => {
  const appConfig = read("app.json");
  const plugin = read("plugins/withPrivacyBoundary.js");
  const debugManifest = read("android/app/src/debug/AndroidManifest.xml");

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
  assert.match(debugManifest, /android\.permission\.INTERNET" tools:node="replace"/);
  assert.doesNotMatch(read("android/app/src/main/AndroidManifest.xml"), /android\.permission\.INTERNET"\/>/);
});
