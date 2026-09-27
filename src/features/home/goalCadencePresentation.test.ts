import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/GoalCadenceScreen.tsx", "utf8");
const calendar = readFileSync("src/features/home/GoalTargetDateCalendar.tsx", "utf8");
const progress = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");
const home = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
const settings = readFileSync("src/features/home/tabs/SettingsTab.tsx", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
const navigationTypes = readFileSync("src/navigation/types.ts", "utf8");
const repositoryIndex = readFileSync("src/storage/repositories/index.ts", "utf8");
const enCommon = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")) as Record<string, string>;
const plCommon = JSON.parse(readFileSync("src/locales/pl/common.json", "utf8")) as Record<string, string>;
const targetDateLocaleCopy = ["en", "pl", "de", "fr", "es", "it", "et"].map((locale) =>
  JSON.parse(readFileSync(`src/locales/${locale}/common.json`, "utf8")) as Record<string, string>,
);

test("goal cadence is a reachable root route backed by the canonical repository", () => {
  assert.match(navigator, /name=\{ROUTES\.GOAL_CADENCE\}[\s\S]*?component=\{GoalCadenceScreen\}/);
  assert.match(repositoryIndex, /export \* from "\.\/goalRepository"/);
  assert.match(screen, /loadGoal\(savedTrackId\)/);
  assert.match(screen, /persistGoal\(nextGoal\)/);
  assert.match(screen, /style=\{styles\.title\}[^>]*>\{t\("Set learning rhythm for this track"\)\}/);
  assert.match(navigator, /title: t\("Goal"\)/);
  assert.doesNotMatch(screen + navigator, /Goal & cadence|Goal and cadence/);
  assert.match(screen, /normalizeGoalRecord\(normalizeGoalForExplicitSave\(\{/);
  assert.match(screen, /selectedGoalType === "learn_at_own_pace"/);
  assert.match(screen, /This goal type does not use a target date\./);
  assert.match(screen, /projectGoalTargetDate\(goal\)/);
  assert.match(screen, /ignored_legacy/);
  assert.match(screen, /<ChoiceRow|accessibilityRole="radio"/);
  assert.match(screen, /Preferred days/);
  assert.match(screen, /Choose at least one practice day\./);
  assert.match(screen, /weeklySessionTarget: preferredDays\.length/);
  assert.doesNotMatch(screen, /No preferred days/);
  assert.doesNotMatch(screen, /stepper|onSetWeeklyTarget|Weekly cadence|Sessions per week|Decrease sessions per week|Increase sessions per week/);
  assert.match(screen, /<ReminderDraft preferredDays=\{selectedDays\} t=\{t\} \/>/);
  assert.match(screen, /<ReminderDraft preferredDays=\{goal\.preferredDays\} t=\{t\} \/>/);
  assert.match(screen, /testID="goal-reminder-draft"/);
  assert.match(screen, /Exact reminder times and activation are available only after you accept a learning plan\./);
  assert.doesNotMatch(screen, /onOpenNotifications|ROUTES\.NOTIFICATION_SETTINGS|goal-summary-reminders/);
  assert.doesNotMatch(screen, /Managed in notification settings|Notification settings/);
  assert.match(screen, /status === "paused"/);
  assert.match(screen, /header: \{ gap: spacing\.sm \}/);
  assert.match(screen, /trackContext[\s\S]*?trackAccent[\s\S]*?trackLabel/);
  assert.match(screen, /title: \{[^}]*fontSize: 28[^}]*fontWeight: "600"[^}]*lineHeight: 34/);
  assert.match(screen, /trackContext: \{[^}]*backgroundColor: palette\.surface[^}]*borderRadius: radius\.lg[^}]*padding: spacing\.lg/);
  assert.match(screen, /trackAccent: \{[^}]*backgroundColor: palette\.primary[^}]*width: 3/);
  assert.match(screen, /trackLabel: \{[^}]*flexShrink: 1[^}]*fontSize: 20[^}]*lineHeight: 28/);
  assert.match(screen, /editing \? null : \([\s\S]*?statusRow/);
  assert.doesNotMatch(screen, /styles\.trackDot|styles\.description/);
  assert.match(screen, /summaryCard:[\s\S]*?gap: 14[\s\S]*?padding: spacing\.lg/);
  assert.match(screen, /summaryDivider:[\s\S]*?height: StyleSheet\.hairlineWidth/);
  assert.match(screen, /dayBadges:[\s\S]*?gap: 6/);
  assert.match(screen, /dayBadge:[\s\S]*?backgroundColor: colorWithOpacity\(palette\.primary, 0\.12\)/);
  assert.doesNotMatch(screen, /getKeyValueStorage|MMKV/);
});

test("Progress owns the goal entry point for the active track", () => {
  assert.match(progress, /onOpenGoal\?: \(\) => void/);
  assert.match(progress, /testID=\{runtimeSelectors\.progress\.goal\(\)\}/);
  assert.match(progress, /goal \? "Manage goal" : "Set a goal"/);
  assert.match(home, /onOpenGoal=\{\(\) => navigation\.navigate\(ROUTES\.GOAL_CADENCE, \{ returnTo: "progress", trackId: activeTrack\.id \}\)\}/);
});

test("Settings opens the shared goal screen with its return context", () => {
  assert.match(navigationTypes, /GOAL_CADENCE\]: \{ trackId\?: TrackId; returnTo\?: GoalCadenceReturnTo \}/);
  assert.match(settings, /onOpenGoal: \(\) => void/);
  assert.match(settings, /onPress=\{onOpenGoal\}/);
  assert.match(settings, /testID="settings-goal"/);
  assert.match(home, /onOpenGoal=\{\(\) => navigation\.navigate\(ROUTES\.GOAL_CADENCE, \{ returnTo: "settings", trackId: activeTrack\.id \}\)\}/);
  assert.match(navigationTypes, /export type GoalCadenceReturnTo = "home" \| "progress" \| "settings"/);
  assert.match(screen, /const returnTo: GoalCadenceReturnTo = route\.params\?\.returnTo \?\? "progress"/);
  assert.match(screen, /returnTo === "home" \? "Home" : "Progress"/);
  assert.match(screen, /navigation\.canGoBack\(\)/);
  assert.match(screen, /navigation\.navigate\(ROUTES\.HOME, \{ initialTab: returnTo \}\)/);
  assert.match(screen, /<GoalLoadingSkeleton context=\{context\} onBack=\{handleBack\} \/>/);
  assert.match(screen, /style=\{styles\.context\}\>\{context\}</);
  assert.match(screen, /await createAndOpenPlan\(track\.id\)/);
  assert.match(screen, /navigation\.navigate\(ROUTES\.LEARNING_PLAN_PROPOSAL, \{ proposalId: result\.proposal\.proposalId, trackId: selectedTrackId \}\)/);
});

test("active goal summary only exposes Save while editing", () => {
  assert.match(screen, /footer=\{editing \? \([\s\S]*?\) : null\}/);
  assert.match(screen, /\{t\(goal \? "Save changes" : "Save goal"\)\}/);
  assert.match(screen, /onEdit=\{\(\) => \{ setDraft/);
  assert.match(screen, /onTogglePause=\{\(\) => \{ void togglePause\(\); \}\}/);
});

test("active goal summary keeps the reminder draft noninteractive", () => {
  const summary = screen.slice(screen.indexOf("function ActiveGoalSummary"), screen.indexOf("function isCreatedProposal"));
  assert.match(summary, /<ReminderDraft preferredDays=\{goal\.preferredDays\} t=\{t\} \/>/);
  assert.doesNotMatch(summary, /onOpenNotifications|goal-summary-reminders/);
  assert.doesNotMatch(screen, /summaryReminderRowLarge|summaryReminderLabelLarge|summaryReminderActionLarge|summaryLink/);
});

test("goal status and selected day labels use onPrimary on filled backgrounds", () => {
  assert.match(screen, /statusBadge: \{ backgroundColor: palette\.success,/);
  assert.match(screen, /pausedBadge: \{ backgroundColor: palette\.warning \}/);
  assert.match(screen, /statusBadgeLabel: \{ color: palette\.onPrimary,/);
  assert.match(screen, /dayButtonSelected: \{ backgroundColor: palette\.success,/);
  assert.match(screen, /dayLabelSelected: \{ color: palette\.onPrimary \}/);
});

test("preferred-day shortcuts preserve domain ids and translate every EN/PL label", () => {
  const expected = {
    mon: ["Mon", "Pon."],
    tue: ["Tue", "Wt."],
    wed: ["Wed", "Śr."],
    thu: ["Thu", "Czw."],
    fri: ["Fri", "Pt."],
    sat: ["Sat", "Sob."],
    sun: ["Sun", "Niedz."],
  } as const;

  for (const [day, [english, polish]] of Object.entries(expected)) {
    assert.equal(enCommon[english], english);
    assert.equal(plCommon[english], polish);
    assert.match(screen, new RegExp(`\\b${day}: "${english}"`));
  }

  const goalForm = screen.slice(screen.indexOf("function CreateGoalForm"), screen.indexOf("function ActiveGoalSummary"));
  const activeGoalSummary = screen.slice(screen.indexOf("function ActiveGoalSummary"));
  assert.match(goalForm, /selectedDays\.includes\(day\)/);
  assert.match(goalForm, /\{t\(DAY_SHORT_LABELS\[day\]\)\}/);
  assert.match(activeGoalSummary, /\{t\(DAY_SHORT_LABELS\[day\]\)\}/);
  assert.match(screen, /preferredDays\.filter\(\(candidate\) => candidate !== day\)/);
  assert.match(screen, /preferredDays, weeklySessionTarget: preferredDays\.length/);
  assert.match(screen, /persistGoal\(nextGoal\)/);
});

test("goal reminders are a read-only preferred-day draft in both create and active summary", () => {
  const required = [
    "Reminder draft",
    "Exact reminder times and activation are available only after you accept a learning plan.",
  ];
  for (const [index, locale] of targetDateLocaleCopy.entries()) {
    for (const key of required) {
      assert.equal(typeof locale[key], "string", `locale index ${index} missing ${key}`);
      assert.ok(locale[key]!.trim().length > 0);
      if (index > 0) assert.notEqual(locale[key], targetDateLocaleCopy[0]![key], `locale index ${index} must translate ${key}`);
    }
  }
  assert.match(screen, /function ReminderDraft\(\{ preferredDays, t \}: Readonly/);
  assert.match(screen, /const days = preferredDays\.map\(\(day\) => t\(DAY_SHORT_LABELS\[day\]\)\)\.join\(", "\)/);
  assert.doesNotMatch(screen, /onOpenNotifications|ROUTES\.NOTIFICATION_SETTINGS/, "goal screen must not navigate to global notification settings");
});

test("target dates use the shared localized calendar with cancellable drafts and an explicit ISO commit", () => {
  const saveStart = screen.indexOf("async function save()");
  const saveEnd = screen.indexOf("async function createAndOpenPlan", saveStart);
  const save = screen.slice(saveStart, saveEnd);
  const form = screen.slice(screen.indexOf("function CreateGoalForm"), screen.indexOf("function ActiveGoalSummary"));
  assert.match(form, /t\(dateInput \? "Change target date" : "Add target date"\)/);
  assert.match(form, /testID="goal-target-date-open"/);
  assert.match(form, /formatGoalDate\(dateInput, locale\)/);
  assert.match(form, /onPress=\{clearTargetDate\} testID="goal-target-date-clear"[\s\S]*?t\("Clear date"\)/);
  assert.match(form, /function openDatePicker\(\): void \{\s*setPendingDate\(targetDatePickerValue\(dateInput, new Date\(\)\)\);\s*setDatePickerVisible\(true\);/);
  assert.match(form, /function cancelTargetDate\(\): void \{\s*setDatePickerVisible\(false\);\s*\}/);
  assert.match(form, /<SettingsBottomSheet[\s\S]*?closeLabel=\{t\("Cancel"\)\}[\s\S]*?onClose=\{cancelTargetDate\}[\s\S]*?visible=\{datePickerVisible\}/);
  assert.match(form, /<GoalTargetDateCalendar\s+locale=\{locale\}\s+onChange=\{setPendingDate\}\s+value=\{pendingDate\}\s+\/>/);
  assert.match(calendar, /formatGoalCalendarMonth\(visibleMonth, locale\)/);
  assert.match(calendar, /formatGoalCalendarWeekdayLabels\(locale\)/);
  assert.match(calendar, /accessibilityLabel=\{formatGoalCalendarAccessibleDate\(date, locale\)\}/);
  assert.match(calendar, /accessibilityState=\{\{ selected \}\}/);
  assert.match(calendar, /onChange\(date\)/);
  assert.doesNotMatch(screen + calendar, /DateTimePicker|@expo\/ui|timeZoneName/);
  assert.match(form, /function applyTargetDate\(\): void \{\s*onChangeDate\(targetDateToLocalIso\(pendingDate\)\);\s*setDatePickerVisible\(false\);/);
  assert.match(form, /testID="goal-target-date-set"\s*>\{t\("Set date"\)\}/);
  assert.match(form, /function clearTargetDate\(\): void \{\s*onChangeDate\(""\);/);
  assert.doesNotMatch(screen, /TextInput|Keyboard\.dismiss|isIsoDate|dateError|YYYY-MM-DD \(optional\)|Use a valid date in YYYY-MM-DD format\./);
  assert.match(screen, /onChangeDate=\{setDateInput\}/);
  assert.match(save, /targetDate: dateInput\.length > 0 \? dateInput : undefined/);
  assert.match(save, /await persistGoal\(nextGoal\)/);
  assert.match(screen, /selectedGoalType === "learn_at_own_pace"[\s\S]*?This goal type does not use a target date\./);
  for (const key of ["Add target date", "Change target date", "Clear date", "Choose an optional target date.", "Previous month", "Next month", "Set date"]) {
    const translations = targetDateLocaleCopy.map((copy) => copy[key]);
    assert.ok(translations.every((value) => value?.trim()), `${key} must be translated in all locales`);
    assert.equal(new Set(translations).size, targetDateLocaleCopy.length, `${key} must be translated, not copied from EN`);
  }
  for (const copy of targetDateLocaleCopy) {
    assert.equal("YYYY-MM-DD (optional)" in copy, false);
    assert.equal("Use a valid date in YYYY-MM-DD format." in copy, false);
  }
});

test("goal editing uses local keyboard avoidance while preserving the shared sticky footer", () => {
  assert.match(screen, /import \{ KeyboardAvoidingView, Platform,[^}]+\} from "react-native"/);
  assert.match(screen, /<KeyboardAvoidingView behavior=\{Platform\.OS === "ios" \? "padding" : "height"\} style=\{styles\.keyboardAvoiding\}>[\s\S]*?<Screen[\s\S]*?footerVariant="sticky"/);
  assert.match(screen, /keyboardAvoiding: \{ flex: 1 \}/);
});

test("goal loading keeps its back action separate from the busy content announcement", () => {
  assert.match(screen, /export function GoalLoadingSkeleton\(\{ context, onBack \}/);
  assert.match(screen, /header=\{\(/);
  assert.match(screen, /<IconButton/);
  assert.match(screen, /onPress=\{onBack\}/);
  assert.match(screen, /accessibilityRole="progressbar"[\s\S]*?accessibilityState=\{\{ busy: true \}\}/);
  assert.match(screen, /<View accessible=\{false\} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style=\{styles\.loadingShapes\}>/);
  assert.match(screen, /loadingTrackContext[\s\S]*?loadingTrackAccent[\s\S]*?loadingTrack/);
  assert.match(screen, /if \(loading\) return <GoalLoadingSkeleton context=\{context\} onBack=\{handleBack\} \/>/);
  assert.match(screen, /useEffect\(\(\) => \{[\s\S]*?\}, \[route\.params\?\.trackId\]\);/);
  assert.doesNotMatch(screen, /useFocusEffect/);
  const pendingBranch = screen.slice(screen.indexOf("if (loading)"), screen.indexOf("if (loadError"));
  assert.doesNotMatch(pendingBranch, /scroll=\{false\}/);
});
