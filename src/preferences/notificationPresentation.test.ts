import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/home/NotificationSettingsScreen.tsx", "utf8");
const hook = readFileSync("src/preferences/useNotificationSettings.ts", "utf8");
const guard = readFileSync("src/preferences/notificationSettingsState.ts", "utf8");
const en = JSON.parse(readFileSync("src/locales/en/notifications.json", "utf8")) as Record<string, string>;
const pl = JSON.parse(readFileSync("src/locales/pl/notifications.json", "utf8")) as Record<string, string>;

test("notification settings renders only the accepted plan slots", () => {
  assert.match(screen, /useNotificationSettings\(copy\)/);
  assert.match(screen, /notifications\.planSlots\.map/);
  assert.match(screen, /runtimeSelectors\.notifications\.slot\(slot\.slotId\)/);
  assert.match(screen, /planSchedule/);
  assert.doesNotMatch(screen, /TextInput|SettingsBottomSheet|separateTimes|commonTime|dayTimes|saveReminder/);
  assert.doesNotMatch(hook, /savePracticeReminder|disablePracticeReminder|reconcilePracticeReminder|PracticeReminderDraft/);
});

test("notification settings exposes one enable/disable action and durable pending retry", () => {
  assert.match(screen, /runtimeSelectors\.notifications\.enable\(\)/);
  assert.match(screen, /runtimeSelectors\.notifications\.disable\(\)/);
  assert.match(screen, /runtimeSelectors\.notifications\.retry\(\)/);
  assert.match(screen, /notifications\.pending/);
  assert.match(hook, /retryLearningPlanReminders/);
  assert.match(hook, /setPending\(next\.pending\)/);
  assert.match(hook, /AppState\.addEventListener\("change"/);
});

test("notification settings maps every closed reminder failure in both locales", () => {
  const required = [
    "missingTrackTitle", "missingTrackDetail", "missingGoalTitle", "missingGoalDetail", "missingPlanTitle", "missingPlanDetail",
    "identityMismatchTitle", "identityMismatchDetail", "goalPausedTitle", "goalPausedDetail", "planPausedTitle", "planPausedDetail", "planCompletedTitle", "planCompletedDetail",
    "noSlotsTitle", "noSlotsDetail", "timezoneMismatchTitle", "timezoneMismatchDetail", "permissionDeniedTitle", "schedulerFailureTitle",
    "schedulerFailureDetail", "concurrentChangeTitle", "concurrentChangeDetail", "pendingTitle", "pendingDetail", "planSchedule", "planScheduleEmpty",
  ];
  for (const key of required) {
    assert.equal(typeof en[key], "string", `missing EN key ${key}`);
    assert.equal(typeof pl[key], "string", `missing PL key ${key}`);
  }
  assert.deepEqual(Object.keys(en).sort(), Object.keys(pl).sort());
});

test("notification settings keeps lifecycle-safe request coordination", () => {
  assert.match(hook, /if \(token\.startedWhileBusy\) return/);
  assert.match(hook, /guard\.canCommitRead\(token\)/);
  assert.match(hook, /guard\.beginMutation\(\)/);
  assert.match(guard, /mutationRevision/);
  assert.match(guard, /startedWhileBusy/);
});
