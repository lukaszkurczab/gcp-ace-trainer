import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/GoalCadenceScreen.tsx", "utf8");
const progress = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");
const home = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
const settings = readFileSync("src/features/home/tabs/SettingsTab.tsx", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
const navigationTypes = readFileSync("src/navigation/types.ts", "utf8");
const repositoryIndex = readFileSync("src/storage/repositories/index.ts", "utf8");
const enCommon = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")) as Record<string, string>;
const plCommon = JSON.parse(readFileSync("src/locales/pl/common.json", "utf8")) as Record<string, string>;

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
  assert.match(screen, /Configure your practice reminders\./);
  assert.match(screen, /summaryLink[\s\S]*?t\("Reminders"\)/);
  assert.match(screen, /testID="goal-summary-reminders"/);
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
  assert.match(screen, /source: "goal", trackId: track\.id, returnToGoal: returnTo/);
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

test("invalid target dates stay field-scoped, block persistence, and clear only on date edits", () => {
  const saveStart = screen.indexOf("async function save()");
  const saveEnd = screen.indexOf("async function createAndOpenPlan", saveStart);
  const save = screen.slice(saveStart, saveEnd);
  assert.match(save, /if \(current\.goalType !== "learn_at_own_pace" && dateInput\.length > 0 && !isIsoDate\(dateInput\)\) \{[\s\S]*?Keyboard\.dismiss\(\);[\s\S]*?setDateError\("Use a valid date in YYYY-MM-DD format\."\);[\s\S]*?return;/);
  assert.doesNotMatch(save, /setSaveError\(t\("Use a valid date in YYYY-MM-DD format\."\)\)/);
  assert.doesNotMatch(save.slice(save.indexOf("if (current.goalType"), save.indexOf("const nextGoal")), /persistGoal|createAndOpenPlan/);
  assert.match(screen, /function handleDateChange\(value: string\): void \{\s*if \(value !== dateInput\) setDateError\(null\);\s*setDateInput\(value\);/);
  assert.match(screen, /dateError=\{dateError\}[\s\S]*?onChangeDate=\{handleDateChange\}/);
  const dateSection = screen.slice(screen.indexOf('<Text maxFontSizeMultiplier=\{2\} style=\{styles\.sectionTitle\}>\{t\("Target date"\)\}</Text>'), screen.indexOf("<View style={styles.formSection}>", screen.indexOf("Preferred days")));
  assert.match(dateSection, /dateField[\s\S]*?dateError/);
  assert.match(dateSection, /accessibilityLiveRegion="polite" accessibilityRole="alert"/);
  assert.match(dateSection, /testID=\{runtimeSelectors\.goal\.dateInput\(\)\}/);
  assert.match(dateSection, /testID=\{runtimeSelectors\.goal\.dateError\(\)\}/);
  assert.match(screen, /dateFieldError: \{ borderColor: palette\.danger \}/);
  assert.match(screen, /selectedGoalType === "learn_at_own_pace"[\s\S]*?This goal type does not use a target date\./);
});

test("goal editing uses local keyboard avoidance while preserving the shared sticky footer", () => {
  assert.match(screen, /import \{ Keyboard, KeyboardAvoidingView, Platform,[^}]+\} from "react-native"/);
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
