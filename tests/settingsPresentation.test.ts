import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const settingsTab = readFileSync("src/features/home/tabs/SettingsTab.tsx", "utf8");

test("Settings exposes only its five working navigation actions", () => {
  const navigationRows = settingsTab.match(/<SettingsNavigationRow\b/g) ?? [];
  assert.equal(navigationRows.length, 5);

  for (const callback of [
    "onOpenAppearance",
    "onOpenLanguage",
    "onOpenLegalInformation",
    "onOpenNotifications",
    "onOpenYourData",
  ]) {
    assert.match(settingsTab, new RegExp(`onPress=\\{${callback}\\}`));
  }
});

test("Settings has no additional participant-facing action group", () => {
  const groups = settingsTab.match(/<SettingsGroup\b/g) ?? [];
  assert.equal(groups.length, 4);
});
