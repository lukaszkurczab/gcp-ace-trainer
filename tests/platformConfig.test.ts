import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const app = JSON.parse(readFileSync("app.json", "utf8")).expo;
const packageManifest = JSON.parse(readFileSync("package.json", "utf8"));

test("Expo platform configuration declares the supported phone-only native matrix", () => {
  assert.equal(app.orientation, "portrait");
  assert.equal(app.userInterfaceStyle, "automatic");
  assert.equal(app.ios.supportsTablet, false);
  assert.equal(app.android.edgeToEdgeEnabled, undefined);
  assert.equal(packageManifest.dependencies["expo-system-ui"], "~57.0.2");
  assert.equal(packageManifest.engines.node, ">=22.13.0 <23");

  const buildProperties = app.plugins.find(
    (plugin: unknown): plugin is [string, Record<string, unknown>] =>
      Array.isArray(plugin) && plugin[0] === "expo-build-properties",
  );
  assert.ok(buildProperties, "Expo Build Properties must own native target levels.");

  const [_, properties] = buildProperties;
  assert.deepEqual(properties.ios, { deploymentTarget: "16.4" });
  assert.deepEqual(properties.android, {
    minSdkVersion: 28,
    targetSdkVersion: 36,
    compileSdkVersion: 36,
  });
});
