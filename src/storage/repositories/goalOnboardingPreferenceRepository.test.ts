import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { getKeyValueStorage, installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { dismissGoalOnboarding, isGoalOnboardingDismissed } from "./goalOnboardingPreferenceRepository";

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("goal onboarding dismissal is durable, idempotent, and scoped per track", () => {
  const coding = "coding-interview-dsa-problem-solving";
  const design = "backend-system-design-interview";

  assert.equal(isGoalOnboardingDismissed(coding), false);
  assert.equal(isGoalOnboardingDismissed(design), false);

  dismissGoalOnboarding(coding);
  dismissGoalOnboarding(coding);

  assert.equal(isGoalOnboardingDismissed(coding), true);
  assert.equal(isGoalOnboardingDismissed(design), false);

  dismissGoalOnboarding(design);
  assert.equal(isGoalOnboardingDismissed(coding), true);
  assert.equal(isGoalOnboardingDismissed(design), true);
});

test("goal onboarding dismissal rejects unsupported stored records", () => {
  getKeyValueStorage().setString(STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES, JSON.stringify({
    schemaIdentity: "patternly:canonical:v1",
    revision: 1,
    payload: { dismissedTrackIds: ["unknown-track"] },
  }));

  assert.throws(() => isGoalOnboardingDismissed("coding-interview-dsa-problem-solving"), /unsupported/i);
});
