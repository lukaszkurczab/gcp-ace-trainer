import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("ODK-E2E-041 keeps a runnable guest goal to account restart journey", () => {
  const flow = source(".maestro/odk-e2e-041-guest-account-goal.yaml");
  for (const required of [
    "clearState: true",
    "patternly:home:guest-goal-onboarding:set-goal",
    "patternly:learning-plan:accept",
    "settings-account-entry",
    "account-register-submit",
    "account-entry-choice",
    "account-keep-progress-toggle",
    "account-entry-continue",
    "account-open-settings",
    "settings-goal",
    "stopApp",
    "patternly:progress:root",
  ]) assert.match(flow, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"), required);

  assert.match(flow, /ODK_E2E_041_EMAIL/u);
  assert.match(flow, /ODK_E2E_041_PASSWORD/u);
  assert.match(flow, /assertNotVisible:[\s\S]*patternly:home:guest-goal-onboarding:root/u);
});

test("ODK-E2E-041 preserves the per-track dismissal and restart proof", () => {
  const flow = source(".maestro/guest-goal-onboarding.yaml");
  const preferences = source("src/storage/repositories/goalOnboardingPreferenceRepository.test.ts");
  assert.match(flow, /guest-goal-onboarding:not-now[\s\S]*stopApp[\s\S]*launchApp[\s\S]*assertNotVisible:[\s\S]*guest-goal-onboarding:root/u);
  assert.match(flow, /track-card:coding-interview-dsa-problem-solving[\s\S]*change-track[\s\S]*select-track:backend-system-design-interview[\s\S]*guest-goal-onboarding:root/u);
  assert.match(preferences, /durable, idempotent, and scoped per track/u);
});

test("ODK-E2E-041 covers an existing goal on a clean device and an account without a goal", () => {
  const existingGoal = source(".maestro/odk-e2e-041-existing-goal-new-device.yaml");
  const withoutGoal = source(".maestro/odk-e2e-041-account-without-goal.yaml");

  assert.match(existingGoal, /account-sign-in-submit[\s\S]*account-entry-continue[\s\S]*settings-goal[\s\S]*patternly:goal:root[\s\S]*stopApp[\s\S]*launchApp/u);
  assert.match(existingGoal, /track-card:backend-system-design-interview[\s\S]*assertNotVisible:[\s\S]*guest-goal-onboarding:root/u);
  assert.match(withoutGoal, /select-track:backend-system-design-interview[\s\S]*guest-goal-onboarding:not-now[\s\S]*account-register-submit/u);
  assert.match(withoutGoal, /account-entry-choice[\s\S]*patternly:progress:goal[\s\S]*Set goal/u);
});

test("ODK-E2E-041 data evidence covers identity, atomic goal-plan validation, recovery, and explicit UI states", () => {
  const sync = source("src/storage/repositories/accountDataSync.test.ts");
  const lifecycle = source("src/application/account/accountLifecycle.test.ts");
  const screen = source("src/features/account/AccountEntryScreen.tsx");

  for (const evidence of [
    "preserve one exact goal-plan bundle",
    "contentPackagePin: TEST_CONTENT_PACKAGE_PIN",
    "goalRevision: 1",
    "creates an explicit tombstone",
    "pending mutation IDs stay stable across an uncertain retry",
  ]) assert.match(sync, new RegExp(evidence.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"), evidence);

  for (const evidence of [
    "discard restores existing account records unchanged",
    "failed account fetch keeps guest data",
    "stale adoption confirmation is cleared",
    "pending materialization blocks lifecycle",
    "malformed remote records are rejected",
  ]) assert.match(lifecycle, new RegExp(evidence, "u"), evidence);

  for (const testID of ["account-sync-pending", "account-sync-conflict", "account-sync-failed", "account-sync-retry"]) {
    assert.match(screen, new RegExp(`testID: "${testID}"|testID="${testID}"`, "u"), testID);
  }
  assert.match(screen, /accountData\.status === "synced"/u);
  assert.match(screen, /accountData\.status === "previewReady"/u);
});

test("ODK-E2E-041 visual matrix maps every required journey to executable evidence", () => {
  const matrix = JSON.parse(source(".maestro/odk-e2e-041-visual-matrix.json")) as {
    cases: Array<{ flow: string; screenshots: string[]; state: string }>;
  };
  assert.equal(matrix.cases.length, 4);
  assert.deepEqual(new Set(matrix.cases.map((entry) => entry.state)), new Set([
    "guest_goal_and_account_adoption", "guest_skip_scoped_per_track", "existing_account_goal_on_clean_device", "account_without_goal",
  ]));
  for (const entry of matrix.cases) {
    assert.ok(entry.screenshots.length > 0, entry.state);
    assert.match(source(entry.flow), new RegExp(entry.screenshots.at(-1)!, "u"), entry.flow);
  }
});
