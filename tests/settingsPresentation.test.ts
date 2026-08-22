import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const settingsTab = readFileSync("src/features/home/tabs/SettingsTab.tsx", "utf8");
const listRow = readFileSync("src/components/ListRow.tsx", "utf8");
const settingsGroup = readFileSync("src/components/SettingsGroup.tsx", "utf8");
const preferenceSelection = readFileSync("src/features/home/PreferenceSelectionScreen.tsx", "utf8");
const appearanceSettings = readFileSync("src/features/home/AppearanceSettingsScreen.tsx", "utf8");
const choiceRow = readFileSync("src/components/ChoiceRow.tsx", "utf8");

test("Settings exposes five participant navigation actions and one explicit backend verification action", () => {
  const navigationRows = settingsTab.match(/<SettingsNavigationRow\b/g) ?? [];
  assert.equal(navigationRows.length, 7);

  for (const callback of [
    "onOpenAppearance",
    "onOpenLanguage",
    "onOpenLegalInformation",
    "onOpenNotifications",
    "onOpenPracticeSettings",
    "onOpenYourData",
  ]) {
    assert.match(settingsTab, new RegExp(`onPress=\\{${callback}\\}`));
  }
  assert.match(settingsTab, /testID="settings-backend-diagnostics"/);
  assert.match(settingsTab, /backendDiagnosticsConfigured \? \(/);
});

test("Settings keeps the backend verification group explicitly development-only", () => {
  const groups = settingsTab.match(/<SettingsGroup\b/g) ?? [];
  assert.equal(groups.length, 5);
  assert.match(settingsTab, /title=\{text\.developerVerification\}/);
  assert.match(settingsTab, /backendDiagnosticsConfigured \? \([\s\S]*?\) : null/);
});

test("grouped settings rows follow the Figma 200% text geometry", () => {
  assert.match(listRow, /groupedRow:\s*\{[\s\S]*?borderRadius:\s*radius\.lg,[\s\S]*?minHeight:\s*63,[\s\S]*?paddingHorizontal:\s*spacing\.lg,[\s\S]*?paddingVertical:\s*14,/);
  assert.match(listRow, /listRowTitle/);
  assert.match(listRow, /listRowDetail/);
  assert.match(settingsGroup, /rows:\s*\{[\s\S]*?gap:\s*spacing\.sm,/);
  assert.match(settingsTab, /IconTile iconSize=\{24\} name=\{icon\} size=\{32\} tone="settings"/);
  assert.match(settingsTab, /name="chevron-right" size=\{20\}/);
  assert.match(settingsTab, /<ScreenHeader description=\{text\.settingsDescription\} title=\{text\.appSettings\}/);
  assert.match(settingsTab, /<SettingsGroup dividers title=\{text\.learning\}>/);
  assert.match(settingsGroup, /dividedRows:[\s\S]*?gap:\s*0/);
});

test("preference selection uses the canonical accessible radio choice row", () => {
  assert.match(preferenceSelection, /<View style=\{styles\.choiceGroup\} accessibilityRole="radiogroup"/);
  assert.match(preferenceSelection, /<ChoiceRow[\s\S]*selected=\{selected\}[\s\S]*testID=\{`preference-option-\$\{option\.value\}`\}/);
  assert.match(choiceRow, /accessibilityRole="radio"/);
  assert.match(choiceRow, /minHeight:\s*72,[\s\S]*?paddingHorizontal:\s*14,[\s\S]*?paddingVertical:\s*spacing\.md/);
  assert.match(choiceRow, /height:\s*20,[\s\S]*?width:\s*20/);
  assert.match(choiceRow, /height:\s*8,[\s\S]*?width:\s*8/);
});

test("appearance choices use the Figma preview variants without changing language choices", () => {
  assert.match(appearanceSettings, /appearancePreview: option\.value/);
  assert.match(preferenceSelection, /appearancePreview=\{option\.appearancePreview\}/);
  assert.match(choiceRow, /function AppearancePreview/);
  assert.match(choiceRow, /previewLightSurface/);
  assert.match(choiceRow, /previewDarkSurface/);
  assert.match(choiceRow, /height:\s*48,[\s\S]*?width:\s*60/);
});

test("settings bottom sheets use the Figma elevated shell and modal accessibility boundary", () => {
  const bottomSheet = readFileSync("src/components/SettingsBottomSheet.tsx", "utf8");
  const tokens = readFileSync("src/theme/tokens.ts", "utf8");
  assert.match(bottomSheet, /accessibilityViewIsModal style=\{(?:styles\.sheet|\[styles\.sheet,)/);
  assert.match(bottomSheet, /backgroundColor:\s*palette\.bottomSheet\.surface/);
  assert.match(bottomSheet, /borderTopLeftRadius:\s*radius\.sheet/);
  assert.match(bottomSheet, /shadowOffset:\s*\{ height:\s*-4, width:\s*0 \}/);
  assert.match(tokens, /bottomSheet:\s*\{[\s\S]*?surface:\s*"#F7FAF9"[\s\S]*?border:\s*"#E3EAE9"/);
  assert.match(tokens, /bottomSheet:\s*\{[\s\S]*?surface:\s*"#0F172A"[\s\S]*?border:\s*"#1E293B"/);
});
