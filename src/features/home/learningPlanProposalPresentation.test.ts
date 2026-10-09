import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/LearningPlanProposalScreen.tsx", "utf8");
const runtime = readFileSync("src/features/home/learningPlanProposalRuntime.ts", "utf8");
const goal = readFileSync("src/features/home/GoalCadenceScreen.tsx", "utf8");
const routes = readFileSync("src/navigation/types.ts", "utf8");
const navigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
const home = readFileSync("src/features/home/HomeScreen.tsx", "utf8");
const learningPlanLocales = ["de", "en", "es", "et", "fr", "it", "pl"].map((locale) => ({
  locale,
  copy: JSON.parse(readFileSync(`src/locales/${locale}/learningPlan.json`, "utf8")) as Record<string, string>,
}));

test("proposal route carries only identity and resolves the in-memory proposal", () => {
  assert.match(routes, /LEARNING_PLAN_PROPOSAL\]: \{ proposalId: string; trackId: TrackId \}/);
  assert.match(navigator, /name=\{ROUTES\.LEARNING_PLAN_PROPOSAL\}[\s\S]*?component=\{LearningPlanProposalScreen\}/);
  assert.match(screen, /runtime\.resolve\(proposalId, trackId\)/);
  assert.match(screen, /runtime = productionLearningPlanProposalRuntime/);
  assert.match(runtime, /resolve: \(proposalId, trackId\) => learningPlanProposalCoordinator\.resolve\(proposalId, trackId\)/);
  assert.match(screen, /navigation\.replace\(ROUTES\.LEARNING_PLAN_PROPOSAL, \{ proposalId: result\.proposal\.proposalId, trackId \}\)/);
  assert.doesNotMatch(routes, /LEARNING_PLAN_PROPOSAL\]:[^\n]*(outcome|goalRevision|contentVersion|packagePin|timezone)/);
});

test("proposal accepts through the plan/reminder runtime and preserves pending saves", () => {
  assert.match(screen, /runtime\.accept\(proposalId, trackId, notification\)/);
  assert.match(runtime, /accept: \(proposalId, trackId, copy\) => acceptPlanWithReminders\(proposalId, trackId, copy\)/);
  assert.doesNotMatch(screen, /learningPlanEditorCoordinator\.acceptProposal/);
  assert.match(screen, /plan_saved_reminders_synced/);
  assert.match(screen, /plan_saved_reminders_pending/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.retryReminders\(\)/);
  assert.match(screen, /runtime\.retryReminders\(notification\)/);
  assert.match(runtime, /retryReminders: \(copy\) => retryPlanReminders\(copy\)/);
  assert.match(screen, /setState\(\{ kind: "stale" \}\)/);
});

test("proposal keeps explicit states, edit actions and localized copy", () => {
  for (const state of ["loading", "stale", "no_goal", "goal_paused", "package_error", "package_unavailable", "generator_error", "shortfall", "shortened", "ready"]) assert.match(screen, new RegExp(state));
  assert.match(screen, /runtime\.startProposalEdit\(proposalId, trackId\)/);
  assert.match(screen, /runtime\.startExistingEdit\(trackId\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.actionError\(kind\)/);
  assert.match(screen, /useTranslation\("learningPlan"\)/);
  assert.match(screen, /footerVariant="sticky"/);
  assert.doesNotMatch(screen, /numberOfLines=/);
});

test("every proposal screen branch leaves the top safe area to its stack header", () => {
  const screenEdges = [...screen.matchAll(/<Screen\b[\s\S]*?\bedges=\{\[([^\]]+)\]\}/g)];
  assert.equal(screenEdges.length, 6);
  for (const match of screenEdges) assert.equal(match[1]?.trim(), '"bottom"');
  assert.match(screen, /placement="stack"/);
});

test("ready and shortened proposals use the review title and a two-action footer", () => {
  assert.match(screen, /<PlanHeader testID=\{__DEV__ && isPatternlySmokeRuntime\(\) \? runtimeSelectors\.learningPlan\.proposalIdentity\(proposalId\) : undefined\} title=\{t\("Review your learning plan"\)\} track=\{tCommon\(track\.shortTitle\)\} \/>/);
  assert.match(screen, /function PlanHeader\([\s\S]*?<Text[^>]*style=\{styles\.title\} testID=\{testID\}>\{title\}<\/Text>/);
  assert.doesNotMatch(screen, /accessible=\{false\} testID=\{runtimeSelectors\.learningPlan\.proposalIdentity/u);
  assert.doesNotMatch(screen, /title=\{t\("Your proposed rhythm"\)\}/);
  const proposalFooter = screen.match(/<Screen edges=\{\["bottom"\]\} footer=\{<View style=\{styles\.footerActions\}>[\s\S]*?footerVariant="sticky" header=\{header\}>/);
  const proposalFooterMarkup = proposalFooter?.[0] ?? "";
  assert.ok(proposalFooterMarkup.length > 0);
  assert.match(proposalFooterMarkup, /onPress=\{\(\) => \{ void editProposal\(\); \}\} testID=\{runtimeSelectors\.learningPlan\.editSchedule\(\)\} variant="secondary">\{t\("Edit schedule"\)\}/);
  assert.match(proposalFooterMarkup, /onPress=\{\(\) => \{ void acceptProposal\(\); \}\} testID=\{runtimeSelectors\.learningPlan\.accept\(\)\}>\{t\("Accept plan"\)\}/);
  assert.doesNotMatch(proposalFooterMarkup, /Go back|onPress=\{goBack\}/);
  assert.match(screen, /state\.kind === "shortened"[\s\S]*?A shorter path is available/);
});

test("goal type is the card heading while target and selected days remain visible", () => {
  assert.match(screen, /const GOAL_LABELS: Readonly<Record<ProposalOutcome\["goal"\]\["goalType"\], string>>/);
  assert.match(screen, /style=\{styles\.cardTitle\}>\{tCommon\(GOAL_LABELS\[outcome\.goal\.goalType\]\)\}/);
  assert.match(screen, /t\("Target: \{\{target\}\}"/);
  assert.match(screen, /t\("Days: \{\{days\}\}"/);
  assert.doesNotMatch(screen, /Goal context/);
  for (const goalType of ["prepare_for_an_interview", "prepare_for_a_certification", "build_foundations", "refresh_and_maintain_skills", "learn_at_own_pace"]) {
    assert.match(screen, new RegExp(`${goalType}:`));
  }
});

test("review title is localized in all seven locales and removed goal-context copy is dead", () => {
  for (const { locale, copy } of learningPlanLocales) {
    const localizedTitle = copy["Review your learning plan"];
    assert.ok(typeof localizedTitle === "string" && localizedTitle.length > 0, `${locale} review title is non-empty`);
    assert.equal(Object.hasOwn(copy, "Goal context"), false, `${locale} obsolete card label`);
    assert.equal(Object.hasOwn(copy, "Your proposed rhythm"), false, `${locale} obsolete proposal title`);
    for (const key of ["The first session is a one-time diagnostic with {{count}} questions.", "Next session: {{count}} due-review questions.", "Next session: {{count}} practice questions.", "Recurring practice: {{count}} questions in each scheduled session.", "Your diagnostic stopped before completion. It will not restart automatically; you can start it manually."]) {
      assert.ok(typeof copy[key] === "string" && copy[key]!.length > 0, `${locale} execution policy copy: ${key}`);
    }
    for (const key of ["Estimated time: {{min}}–{{max}} min. {{source}}.", "Based on an authored estimate", "Based on your completed sessions", "Combines authored and observed estimates", "Time estimate unavailable because no eligible material was selected.", "Time estimate unavailable because no authored estimate covers this session."]) {
      assert.ok(typeof copy[key] === "string" && copy[key]!.length > 0, `${locale} session estimate copy: ${key}`);
    }
    for (const key of ["Next legal session: {{date}} at {{time}}; estimated {{min}}–{{max}} min.", "No legal session fits before this goal’s target.", "Today’s remaining time is unknown because an active session spans a local-day boundary.", "No authored time estimate is available for a legal session.", "Full path time is unavailable because {{count}} required learning units have no authored cost.", "Full path time is unavailable because {{count}} required chapters have no canonical unit inventory.", "All required unit costs are present, but future quality work remains uncertain.", "Required completion is already recorded; this forecast excludes optional practice.", "The package’s full completion contract is unavailable.", "No legal session fits this track’s daily time budget.", "{{count}} required session(s) cannot fit in the known calendar windows.", "Capacity for {{count}} required session(s) is unknown today.", "{{count}} real due review(s) have no legal window before the target."]) {
      assert.ok(typeof copy[key] === "string" && copy[key]!.length > 0, `${locale} next-session/calendar forecast copy: ${key}`);
    }
    assert.equal(Object.hasOwn(copy, "C3 minimum: {{due}} due-review responses credited and {{new}} new responses, {{total}} total minimum responses."), false, `${locale} technical C3 label removed`);
    for (const key of ["Full required workload", "Full required workload is unavailable because the completion contract or planning policy could not be verified.", "Full required work estimate: {{min}}–{{max}} min; central estimate {{typical}} min.", "Known work starts at {{min}} min; time for all required chapters is not available.", "{{count}} required chapters still need a complete scope or time estimate.", "Chapter name unavailable for canonical ID {{id}}.", "Required work remains in this chapter", "A legal request exists, but at least one required unit has no time estimate.", "No legal request covers this required Premium chapter; Premium availability is not checked here.", "No legal request covers this required chapter.", "Future quality-repair time depends on later answers and cannot be estimated yet.", "This required chapter is Premium; this estimate does not verify access.", "Responses remaining: {{count}} ({{due}} eligible due reviews and {{new}} new practice responses).", "Chapter time estimate: at least {{min}} min; typical {{typical}} min; upper estimate {{max}} min.", "Chapter time estimate: at least {{min}} min; typical {{typical}} min; future work has no finite upper estimate.", "Due review", "Due {{date}}", "Review time estimate: {{min}}–{{max}} min.", "No legal review time estimate is available for this due item.", "This due review is credited once toward required work.", "Time for {{count}} active due reviews is unavailable; their real due dates remain in the queue.", "Full-work estimate source: {{source}} ({{count}} observations).", "Calendar horizon: {{from}} through {{through}}.", "Authored initial estimates", "Completed session observations", "Authored and observed estimates", "No verified time estimate", "Known minimum work exceeds this goal’s available study time: {{min}} min required versus {{available}} min available.", "Estimated work crosses the {{available}}-minute study budget; full fit is uncertain.", "Available time is {{available}} min; full fit is uncertain because some required work or today’s capacity is unknown.", "The estimate range fits within {{available}} available clock minutes; this does not guarantee completion.", "The time estimate range crosses the {{available}}-minute study budget; the result is uncertain.", "Available time is {{available}} min, but unknown scope, quality or today’s capacity prevents a full-fit conclusion.", "This open-ended goal shows a {{available}}-minute calendar preview, not a completion deadline.", "Full time-capacity comparison is unavailable.", "Clock-time capacity is a horizon comparison; legal session availability is shown separately."]) {
      assert.ok(typeof copy[key] === "string" && copy[key]!.length > 0, `${locale} full-work forecast copy: ${key}`);
    }
  }
  assert.ok(learningPlanLocales.some(({ locale }) => locale === "pl"));
  assert.match(screen, /subtitle=\{t\("A proposal based on your current goal"\)\}/);
  assert.match(screen, /title=\{t\("Not enough material for this plan"\)\}/);
  assert.match(screen, /title=\{t\("Saved learning plan"\)\}/);
  assert.match(screen, /function ExecutionSummary\(/);
  assert.match(screen, /outcome\.nextSession\.kind/);
  assert.match(screen, /outcome\.executionPolicy\.practice\.requestedLength/);
  assert.match(screen, /state\.proposal\.nextSessionTimeEstimate/);
  assert.match(screen, /CalendarAndScopeSummary calendar=\{state\.proposal\.nextSessionCalendar\}/);
  assert.match(screen, /calendar\.calendar\.unknownRequiredSessionCount/);
  assert.match(screen, /calendar\.calendar\.unscheduledSessionCount/);
  assert.match(screen, /FullGoalWorkloadSummary trackId=\{trackId\} workload=\{state\.proposal\.fullGoalWorkload\}/);
  assert.match(screen, /calendar=\{state\.proposal\.fullGoalCalendar\}/);
  assert.match(screen, /trackId === CODING_INTERVIEW_TRACK_ID \? getTrackRoadmapCatalog\(trackId\) : \[\]/);
  assert.match(screen, /accessibilityState=\{\{ expanded \}\}/);
  assert.match(screen, /expanded \? <View accessibilityLabel=\{tCommon\("Details"\)\}/);
  assert.match(screen, /selectedDay\.selectedSession\.minMinutes/);
});

test("shortfall and saved-plan actions retain their existing semantics", () => {
  assert.match(screen, /<PlanHeader subtitle=\{t\("A proposal based on your current goal"\)\} title=\{t\("Not enough material for this plan"\)\}/);
  assert.match(screen, /<Card variant="warning"><Text[^>]*>{t\("The package needs/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.adjustGoal\(\)/);
  assert.match(screen, /runtimeSelectors\.learningPlan\.backToPractice\(\)/);
  assert.match(screen, /title=\{t\("Saved learning plan"\)\}/);
  assert.match(screen, /testID=\{runtimeSelectors\.learningPlan\.retryReminders\(\)\}/);
  assert.match(screen, /testID=\{runtimeSelectors\.learningPlan\.persisted\(\)\}/);
  assert.match(screen, /loading=\{updating\} onPress=\{\(\) => \{ void acceptProposal\(\); \}\}/);
  assert.match(screen, /runtime\.create\(trackId\)/);
  assert.match(screen, /setUpdating\(true\);[\s\S]*?runtime\.accept\(proposalId, trackId, notification\)/);
  assert.match(screen, /backAction=\{\{ onPress: goBack \}\}/);
});

test("persisted rhythm does not present the saved initial-diagnosis policy as the upcoming session", () => {
  const start = screen.indexOf("function PersistedPlanView(");
  const end = screen.indexOf("function PlanActionError(", start);
  assert.ok(start >= 0 && end > start);
  const persistedView = screen.slice(start, end);
  assert.match(persistedView, /t\("Weekly schedule"\)/);
  assert.match(persistedView, /Recurring practice: \{\{count\}\} questions in each scheduled session\./);
  assert.doesNotMatch(persistedView, /The first session is a one-time diagnostic/);
  // The same copy remains valid for a not-yet-accepted proposal's next-session summary.
  assert.match(screen, /outcome\.nextSession\.kind === "diagnosis"[\s\S]*?The first session is a one-time diagnostic/);
});

test("goal and time remain staged until the accepted plan; reminders reconcile after acceptance", () => {
  const saveStart = goal.indexOf("async function save()");
  const proposalStart = goal.indexOf("async function createAndOpenPlan", saveStart);
  const save = goal.slice(saveStart, proposalStart);
  assert.match(save, /await createAndOpenPlan\(track\.id, nextGoal, minutesPerStudyDay\)/);
  assert.doesNotMatch(save, /persistGoal|reconcileDeviceReminder/);
  assert.match(goal, /learningPlanProposalCoordinator\.create\(selectedTrackId, \{ goal: goalToPropose, minutesPerStudyDay: availableMinutes \}\)/);
  assert.doesNotMatch(goal, /proposalFailureDiagnostic|goal-proposal-diagnostic|observeDevelopmentFailure/);
  const acceptance = runtime.indexOf("acceptPlanWithReminders");
  assert.ok(acceptance >= 0);
  assert.match(runtime, /acceptPlanWithReminders\(proposalId, trackId, copy\)/);
});

test("target guidance retry performs a real canonical snapshot reload", () => {
  assert.match(home, /if \(action\.kind === "try_again"\) \{\s*setShellReload\(\(reload\) => reload \+ 1\);\s*return;\s*\}/);
});
