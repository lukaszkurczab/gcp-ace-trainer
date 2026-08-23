import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/NotificationSettingsScreen.tsx", "utf8");
const listRow = readFileSync("src/components/ListRow.tsx", "utf8");
const sheet = readFileSync("src/components/SettingsBottomSheet.tsx", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");

test("notification settings owns the Figma granted and blocked states in one local screen header", () => {
  assert.match(navigator, /name=\{ROUTES\.NOTIFICATION_SETTINGS\}[\s\S]*?headerShown:\s*false/);
  assert.match(screen, /<ScreenHeader[\s\S]*context=\{text\.settings\}[\s\S]*contextTone="primary"[\s\S]*title=\{text\.notifications\}/);
  assert.match(screen, /permissionSection: "Permission"/);
  assert.match(screen, /permissionCard:[\s\S]*?borderRadius:\s*radius\.button[\s\S]*?padding:\s*spacing\.lg/);
  assert.match(screen, /permissionWarning:[\s\S]*?backgroundColor:\s*palette\.warningSoft/);
  assert.match(screen, /permissionAction:[\s\S]*?minHeight:\s*44/);
  assert.match(screen, /onOpenSettings=\{notifications\.permission === "denied"/);
  assert.doesNotMatch(screen, /SettingsDialog/);
});

test("notification reminder row and editor use the Figma-specific row and sheet geometry", () => {
  assert.match(screen, /<IconTile iconSize=\{20\} name="bell" size=\{32\} tone="settings" \/>/);
  assert.match(screen, /disabled=\{reminderBlocked\}/);
  assert.match(screen, /detail=\{reminderBlocked \? text\.reminderBlocked/);
  assert.match(screen, /trailing=\{reminderBlocked \? undefined/);
  assert.match(screen, /name="chevron-right" size=\{16\}/);
  assert.match(screen, /variant="settings"/);
  assert.match(screen, /variant="reminder"/);
  assert.match(screen, /variant="ghost"/);
  assert.match(screen, /reminderTimeInput:[\s\S]*?fontSize:\s*28[\s\S]*?height:\s*66/);
  assert.match(listRow, /settingsRow:[\s\S]*?borderRadius:\s*radius\.button,[\s\S]*?minHeight:\s*63/);
  assert.match(listRow, /settingsDetail:[\s\S]*?fontSize:\s*13/);
  assert.match(listRow, /disabledDetail:[\s\S]*?color:\s*palette\.textMuted/);
  assert.match(sheet, /variant\?: "default" \| "reminder"/);
  assert.match(sheet, /reminderSheet:[\s\S]*?minHeight:\s*432/);
  assert.match(sheet, /reminderTitle:[\s\S]*?fontSize:\s*22[\s\S]*?lineHeight:\s*28/);
});
