import assert from "node:assert/strict";
import test from "node:test";

import { ROUTES } from "../../constants/routes";
import { buildPracticeHubResetRoutes } from "./practiceNavigation";

test("practice session exit resets navigation above the closed session", () => {
  assert.deepEqual(buildPracticeHubResetRoutes("two_pointers"), [
    { name: ROUTES.HOME },
    { name: ROUTES.PRACTICE_HUB, params: { topicId: "two_pointers" } },
  ]);
});

test("practice session exit can return to the hub without a topic override", () => {
  assert.deepEqual(buildPracticeHubResetRoutes(), [
    { name: ROUTES.HOME },
    { name: ROUTES.PRACTICE_HUB },
  ]);
});
