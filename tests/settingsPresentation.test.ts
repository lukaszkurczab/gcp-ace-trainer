import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const settingsTab = readFileSync("src/features/home/tabs/SettingsTab.tsx", "utf8");
const listRow = readFileSync("src/components/ListRow.tsx", "utf8");
const settingsGroup = readFileSync("src/components/SettingsGroup.tsx", "utf8");

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

test("grouped settings rows follow the Figma 200% text geometry", () => {
  assert.match(listRow, /groupedRow:\s*\{[\s\S]*?borderRadius:\s*radius\.lg,[\s\S]*?minHeight:\s*63,[\s\S]*?paddingHorizontal:\s*spacing\.lg,[\s\S]*?paddingVertical:\s*14,/);
  assert.match(listRow, /listRowTitle/);
  assert.match(listRow, /listRowDetail/);
  assert.match(settingsGroup, /rows:\s*\{[\s\S]*?gap:\s*spacing\.sm,/);
  assert.match(settingsTab, /IconTile name=\{icon\} size=\{32\} tone="settings"/);
  assert.match(settingsTab, /name="chevron-right" size=\{20\}/);
});
