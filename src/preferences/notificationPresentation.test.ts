import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/NotificationSettingsScreen.tsx", "utf8");
const hook = readFileSync("src/preferences/useNotificationSettings.ts", "utf8");
const guard = readFileSync("src/preferences/notificationSettingsState.ts", "utf8");
const listRow = readFileSync("src/components/ListRow.tsx", "utf8");
const sheet = readFileSync("src/components/SettingsBottomSheet.tsx", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");

test("notification settings owns the Figma granted and blocked states in one local screen header", () => {
  const notifications = readFileSync("src/locales/en/notifications.json", "utf8");
  assert.match(navigator, /name=\{ROUTES\.NOTIFICATION_SETTINGS\}[\s\S]*?headerShown:\s*false/);
  assert.match(screen, /<ScreenHeader[\s\S]*context=\{text\.settings\}[\s\S]*contextTone="primary"[\s\S]*title=\{text\.notifications\}/);
  assert.match(notifications, /"permissionSection": "Permission"/);
  assert.match(screen, /content:\s*\{\s*gap:\s*spacing\.xxl\s*\}/);
  assert.match(screen, /permissionCard:[\s\S]*?borderRadius:\s*radius\.button[\s\S]*?paddingHorizontal:\s*spacing\.lg[\s\S]*?paddingVertical:\s*spacing\.lg/);
  assert.match(screen, /permissionGranted:[\s\S]*?paddingVertical:\s*14/);
  assert.match(screen, /permissionWarning:[\s\S]*?backgroundColor:\s*palette\.warningSoft/);
  assert.match(screen, /permissionWarningHeader:[\s\S]*?gap:\s*10/);
  assert.match(screen, /permissionAction:[\s\S]*?minHeight:\s*44/);
  assert.match(screen, /permissionActionText:[\s\S]*?lineHeight:\s*18/);
  assert.match(screen, /onOpenSettings=\{notifications\.permission === "denied"/);
  assert.match(screen, /permissionChecking/);
  assert.match(screen, /permission === null/);
  assert.match(screen, /openDeviceSettings[\s\S]*?Linking\.openSettings\(\)[\s\S]*?catch/);
  assert.match(screen, /notification-settings-open-settings-error/);
  assert.doesNotMatch(screen, /SettingsDialog/);
});

test("notification reminder row and editor use the Figma-specific row and sheet geometry", () => {
  assert.match(screen, /<IconTile iconSize=\{20\} name="bell" size=\{32\} tone=\{reminderBlocked \? "muted" : "settings"\} \/>/);
  assert.match(screen, /disabled=\{reminderDisabled\}/);
  assert.match(screen, /detail=\{notifications\.loading \|\| notifications\.permission === null \? text\.reminderUnavailable[\s\S]*?reminderBlocked \? text\.reminderBlocked/);
  assert.match(screen, /onPress=\{openReminderSheet\}/);
  assert.match(screen, /trailing=\{reminderDisabled \? undefined/);
  assert.match(screen, /<InfoBlock accessibilityAlert[\s\S]*notification-settings-error-/);
  assert.match(screen, /<InfoBlock accessibilityAlert[\s\S]*notification-settings-open-settings-error/);
  assert.match(screen, /name="chevron-right" size=\{16\}/);
  assert.match(screen, /variant="settings"/);
  assert.match(screen, /variant="reminder"/);
  assert.match(screen, /variant="ghost"/);
  assert.match(screen, /reminderTimeInput:[\s\S]*?fontSize:\s*28[\s\S]*?minHeight:\s*66/);
  assert.match(listRow, /settingsRow:[\s\S]*?borderRadius:\s*radius\.button,[\s\S]*?minHeight:\s*63/);
  assert.match(listRow, /settingsDetail:[\s\S]*?fontSize:\s*13/);
  assert.match(listRow, /disabled:\s*\{[\s\S]*?backgroundColor:\s*palette\.surfaceInput/);
  assert.match(listRow, /disabledDetail:[\s\S]*?color:\s*palette\.textSecondary/);
  assert.match(listRow, /accessibilityState=\{\{ disabled \}\}/);
  assert.match(sheet, /variant\?: "default" \| "reminder"/);
  assert.match(sheet, /reminderSheet:[\s\S]*?minHeight:\s*432/);
  assert.match(sheet, /reminderContent:[\s\S]*?gap:\s*spacing\.lg[\s\S]*?paddingTop:\s*spacing\.md/);
  assert.match(sheet, /reminderHandle:[\s\S]*?marginBottom:\s*0/);
  assert.match(sheet, /reminderTitle:[\s\S]*?fontSize:\s*22[\s\S]*?lineHeight:\s*28/);
  assert.match(sheet, /reminderIntro:[\s\S]*?fontSize:\s*14[\s\S]*?lineHeight:\s*22/);
  assert.match(screen, /reminderTimeInput:[\s\S]*?paddingVertical:\s*spacing\.lg/);
  assert.match(screen, /sheetActions:[\s\S]*?gap:\s*spacing\.lg/);
  assert.match(screen, /notifications\.busyOperation === "save"/);
  assert.match(screen, /notifications\.busyOperation === "disable"/);
  assert.match(screen, /editable=\{!notifications\.loading && !notifications\.busy\}/);
  assert.match(sheet, /KeyboardAvoidingView behavior=\{Platform\.OS === "ios" \? "padding" : "height"\}/);
  assert.match(sheet, /testID="settings-bottom-sheet-close"/);
});

test("notification settings exposes lifecycle-safe load and mutation state", () => {
  assert.match(hook, /AppState\.addEventListener\("change"/);
  assert.match(hook, /state === "active"/);
  assert.match(hook, /if \(token\.startedWhileBusy\) return/);
  assert.match(hook, /mountedRef\.current = true/);
  assert.match(hook, /setLoading\(true\)/);
  assert.match(hook, /setError\("load"\)/);
  assert.match(hook, /setBusyOperation\("save"\)/);
  assert.match(hook, /setBusyOperation\("disable"\)/);
  assert.match(hook, /guard\.beginMutation\(\)/);
  assert.match(hook, /if \(revision === null\) return/);
  assert.match(hook, /guard\.canCommitRead\(token\)/);
  assert.match(guard, /startedWhileBusy/);
  assert.match(guard, /mutationRevision/);
});
