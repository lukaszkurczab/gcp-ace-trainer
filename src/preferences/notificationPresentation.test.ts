import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getNotificationSettingsPresentation } from "./notificationSettingsPresentation";

const screen = readFileSync("src/features/home/NotificationSettingsScreen.tsx", "utf8");
const hook = readFileSync("src/preferences/useNotificationSettings.ts", "utf8");
const guard = readFileSync("src/preferences/notificationSettingsState.ts", "utf8");
const navigation = readFileSync("src/navigation/types.ts", "utf8");
const locales = ["en", "pl", "de", "fr", "es", "it", "et"] as const;
const notificationCopies = Object.fromEntries(locales.map((locale) => [
  locale,
  JSON.parse(readFileSync(`src/locales/${locale}/notifications.json`, "utf8")) as Record<string, string>,
])) as Record<(typeof locales)[number], Record<string, string>>;

test("notification settings renders only the accepted plan slots and follows the stored settings entry", () => {
  assert.match(screen, /useNotificationSettings\(copy\)/);
  assert.match(screen, /notifications\.planSlots\.map/);
  assert.match(screen, /runtimeSelectors\.notifications\.slot\(slot\.slotId\)/);
  assert.match(screen, /planSchedule/);
  assert.match(screen, /backToSettings/);
  assert.doesNotMatch(screen, /source === "goal"|returnToGoal|ROUTES\.GOAL_CADENCE|TextInput|SettingsBottomSheet|separateTimes|commonTime|dayTimes|saveReminder/);
  assert.match(navigation, /NotificationSettingsRouteParams = \{ source: "settings" \}/);
  assert.doesNotMatch(navigation, /returnToGoal|source: "goal"/);
  assert.doesNotMatch(hook, /savePracticeReminder|disablePracticeReminder|reconcilePracticeReminder|PracticeReminderDraft/);
});

test("hook proves readiness only from accepted plan and at least one slot", () => {
  assert.match(hook, /snapshot\.plan\.status !== "accepted"/);
  assert.match(hook, /planReady: slots\.length > 0/);
  assert.match(hook, /planReady: boolean/);
  assert.match(hook, /setPlanReady\(next\.planReady\)/);
  assert.match(hook, /const pending = result\.status === "pending"/);
  assert.doesNotMatch(hook, /pending\s*\?\s*true\s*:/);
});

test("structural failures and absent plans expose no permission or activation controls", () => {
  for (const reason of ["missing_track", "missing_goal", "missing_plan", "identity_mismatch", "goal_paused", "plan_paused", "plan_completed", "no_slots", "timezone_mismatch"] as const) {
    const presentation = getNotificationSettingsPresentation({ error: reason, loading: false, pending: false, planReady: true, status: reason });
    assert.deepEqual(presentation, {
      showPermission: false,
      showPlanSchedule: false,
      showEnable: false,
      showDisable: false,
      showRetry: false,
      showCancelRequest: false,
      showPending: false,
    }, reason);
  }
  const noPlan = getNotificationSettingsPresentation({ error: null, loading: false, pending: false, planReady: false, status: "disabled" });
  assert.equal(noPlan.showPermission, false);
  assert.equal(noPlan.showEnable, false);
  assert.equal(noPlan.showRetry, false);
});

test("accepted disabled plan may show permission and enable action", () => {
  assert.deepEqual(getNotificationSettingsPresentation({ error: null, loading: false, pending: false, planReady: true, status: "disabled" }), {
    showPermission: true,
    showPlanSchedule: true,
    showEnable: true,
    showDisable: false,
    showRetry: false,
    showCancelRequest: false,
    showPending: false,
  });
});

test("only a synced result is presented as active with a turn-off action", () => {
  const presentation = getNotificationSettingsPresentation({ error: null, loading: false, pending: false, planReady: true, status: "synced" });
  assert.equal(presentation.showPermission, true);
  assert.equal(presentation.showDisable, true);
  assert.equal(presentation.showEnable, false);
  assert.equal(presentation.showCancelRequest, false);
});

test("durable pending failures expose retry and neutral cancel, never active wording", () => {
  for (const reason of ["permission_denied", "scheduler_failure", "concurrent_change"] as const) {
    const presentation = getNotificationSettingsPresentation({ error: reason, loading: false, pending: true, planReady: true, status: reason });
    assert.equal(presentation.showPermission, true, reason);
    assert.equal(presentation.showRetry, true, reason);
    assert.equal(presentation.showCancelRequest, true, reason);
    assert.equal(presentation.showPending, true, reason);
    assert.equal(presentation.showEnable, false, reason);
    assert.equal(presentation.showDisable, false, reason);
  }
  const withoutPlan = getNotificationSettingsPresentation({ error: "scheduler_failure", loading: false, pending: true, planReady: false, status: "scheduler_failure" });
  assert.equal(withoutPlan.showPermission, false);
  assert.equal(withoutPlan.showRetry, false);
  assert.equal(withoutPlan.showCancelRequest, true);
});

test("pending retry and cancel actions call the existing retry and disable paths", () => {
  assert.match(screen, /presentation\.showRetry[\s\S]*?notifications\.retryReminders\(\)/);
  assert.match(screen, /presentation\.showCancelRequest[\s\S]*?notifications\.disableReminders\(\)/);
  assert.match(screen, /runtimeSelectors\.notifications\.cancelRequest\(\)/);
  assert.match(screen, /t\("cancelReminderRequest"\)/);
});

test("seven locales have distinct reminder-draft and cancellation copy with no goal return copy", () => {
  for (const locale of locales) {
    const copy = notificationCopies[locale];
    for (const key of ["cancelReminderRequest", "pendingTitle", "pendingDetail", "retry", "enableReminder", "disableReminder", "backToSettings"]) {
      assert.equal(typeof copy[key], "string", `${locale} missing ${key}`);
      assert.ok(copy[key]!.trim().length > 0, `${locale} empty ${key}`);
    }
    assert.equal("backToGoal" in copy, false, `${locale} retained dead goal return copy`);
    assert.equal("goal" in copy, false, `${locale} retained dead goal context copy`);
    if (locale !== "en") assert.notEqual(copy.cancelReminderRequest, notificationCopies.en.cancelReminderRequest, `${locale} must have translated cancellation copy`);
  }
  assert.deepEqual(Object.keys(notificationCopies.en).sort(), Object.keys(notificationCopies.pl).sort());
});

test("notification settings keeps lifecycle-safe request coordination", () => {
  assert.match(hook, /if \(token\.startedWhileBusy\) return/);
  assert.match(hook, /guard\.canCommitRead\(token\)/);
  assert.match(hook, /guard\.beginMutation\(\)/);
  assert.match(guard, /mutationRevision/);
  assert.match(guard, /startedWhileBusy/);
});
