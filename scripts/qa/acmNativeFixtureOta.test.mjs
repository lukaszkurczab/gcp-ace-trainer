import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { assertNoExpoUpdatesInApp, assertNoExpoUpdatesPods } from "./acmNativeFixtureOta.mjs";

test("Podfile.lock with expo-updates pods is rejected", () => {
  assert.doesNotThrow(() => assertNoExpoUpdatesPods("PODS:\n  - EXConstants (57.0.15):\n  - ExpoModulesCore (57.0.14)\n"));
  for (const pod of ["EXUpdates (57.0.18):", "EXUpdatesInterface (2.0.0)", "EASClient (1.0.0)", "\"EXUpdates/Core (57.0.18)\""]) {
    assert.throws(() => assertNoExpoUpdatesPods(`PODS:\n  - ${pod}\n`), /expo-updates pods/u);
  }
});

test("an app bundle with expo-updates code is rejected", () => {
  const root = mkdtempSync(path.join(tmpdir(), "acm-ota-"));
  try {
    const app = path.join(root, "Patternly.app");
    mkdirSync(app);
    writeFileSync(path.join(app, "Patternly"), "binary without OTA");
    assert.doesNotThrow(() => assertNoExpoUpdatesInApp(app));
    writeFileSync(path.join(app, "Patternly"), "...EXUpdatesAppController...");
    assert.throws(() => assertNoExpoUpdatesInApp(app), /expo-updates code/u);
    writeFileSync(path.join(app, "Patternly"), "binary without OTA");
    mkdirSync(path.join(app, "Frameworks", "EXUpdates.framework"), { recursive: true });
    assert.throws(() => assertNoExpoUpdatesInApp(app), /expo-updates code/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
