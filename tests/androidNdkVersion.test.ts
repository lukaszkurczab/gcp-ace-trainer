import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  ANDROID_NDK_VERSION,
  injectAndroidNdkConfiguration,
  applyAndroidNdkVersion,
} = require("../plugins/withAndroidNdkVersion.js") as {
  ANDROID_NDK_VERSION: string;
  injectAndroidNdkConfiguration: (source: string) => string;
  applyAndroidNdkVersion: (properties: readonly Record<string, string>[]) => readonly Record<string, string>[];
};

test("Android prebuild pins the React Native NDK version and replaces a stale pin", () => {
  const properties = applyAndroidNdkVersion([
    { type: "comment", value: "existing" },
    { type: "property", key: "ndkVersion", value: "27.0.12077973" },
  ]);

  assert.equal(ANDROID_NDK_VERSION, "27.1.12297006");
  assert.deepEqual(properties, [
    { type: "comment", value: "existing" },
    { type: "property", key: "ndkVersion", value: ANDROID_NDK_VERSION },
  ]);
  assert.deepEqual(applyAndroidNdkVersion(properties), properties);
});

test("Android prebuild applies the pinned NDK to application and library modules", () => {
  const source = 'apply plugin: "expo-root-project"\napply plugin: "com.facebook.react.rootproject"\n';
  const transformed = injectAndroidNdkConfiguration(source);

  assert.match(transformed, /PATTERNLY_ANDROID_NDK_BOUNDARY/u);
  assert.match(transformed, /plugins\.withId\("com\.android\.application"\)/u);
  assert.match(transformed, /plugins\.withId\("com\.android\.library"\)/u);
  assert.match(transformed, /ndkVersion = "27\.1\.12297006"/gu);
  assert.equal(injectAndroidNdkConfiguration(transformed), transformed);
});
