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
  assert.match(screen, /<PlanHeader title=\{t\("Review your learning plan"\)\} track=\{tCommon\(track\.shortTitle\)\} \/>/);
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
  }
  assert.ok(learningPlanLocales.some(({ locale }) => locale === "pl"));
  assert.match(screen, /subtitle=\{t\("A proposal based on your current goal"\)\}/);
  assert.match(screen, /title=\{t\("Not enough material for this plan"\)\}/);
  assert.match(screen, /title=\{t\("Saved learning plan"\)\}/);
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

test("goal save still opens a proposal only after its existing reminder reconciliation", () => {
  const reminder = goal.indexOf("await reconcileDeviceReminder(reminderCopy)");
  const proposal = goal.indexOf("await createAndOpenPlan(track.id)");
  assert.ok(reminder >= 0 && proposal > reminder);
  assert.match(goal, /learningPlanProposalCoordinator\.create\(selectedTrackId\)/);
});

test("target guidance retry performs a real canonical snapshot reload", () => {
  assert.match(home, /if \(action\.kind === "try_again"\) \{\s*setShellReload\(\(reload\) => reload \+ 1\);\s*return;\s*\}/);
});
