import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

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


test("both Custom Practice hub entries open setup before a session configuration is built", () => {
  const hub = readFileSync("src/features/practice/PracticeHubScreen.tsx", "utf8");
  const customStart = hub.slice(hub.indexOf("if (isCodingInterviewTrack && resolvedMode === ALGORITHM_MODE_IDS.customPractice)"), hub.indexOf("if (isDesignInterviewTrack)"));
  assert.match(customStart, /navigation\.navigate\(ROUTES\.PRACTICE_SETUP/);
  assert.match(customStart, /mode: resolvedMode/);
  assert.match(customStart, /topicId: topic\.id/);
  assert.match(customStart, /trackId: activeTrack\.id/);
  assert.match(customStart, /return;/);
  assert.doesNotMatch(customStart, /buildPracticeSessionConfig|PRACTICE_SESSION|feedbackMode/);
  assert.match(hub, /onPress=\{\(\) => \{\s*if \(isCodingInterviewTrack\) \{\s*startSession\(ALGORITHM_MODE_IDS\.customPractice, "practiceHub"\)/);
  const setup = readFileSync("src/features/practice/PracticeSetupScreen.tsx", "utf8");
  assert.match(setup, /buildPracticeSessionConfig\(\{[\s\S]*?feedbackMode,/);
});
