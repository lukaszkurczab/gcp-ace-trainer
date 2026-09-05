import assert from "node:assert/strict";
import test from "node:test";

import { ROUTES } from "../../constants/routes";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation";
import { buildActivityResultRoute, navigateToActivityResult } from "./activityNavigation";

test("Activity opens coding simulation sessions in their exact summary", () => {
  assert.deepEqual(
    buildActivityResultRoute({ modeId: "coding-interview-simulation", sessionId: "simulation-1", trackFamily: "coding_interview" }),
    { name: ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, params: { sessionId: "simulation-1" } },
  );
});

test("Activity opens coding practice sessions in their exact summary", () => {
  assert.deepEqual(
    buildActivityResultRoute({ modeId: "coding-interview-guided-practice", sessionId: "practice-1", trackFamily: "coding_interview" }),
    { name: ROUTES.ALGORITHMS_PRACTICE_SUMMARY, params: { sessionId: "practice-1" } },
  );
});

test("Activity opens installed non-coding sessions in the canonical result", () => {
  assert.deepEqual(
    buildActivityResultRoute({ modeId: "certification-focus-practice", sessionId: "certification-1", trackFamily: "certification" }),
    { name: ROUTES.RESULT, params: { sessionId: "certification-1" } },
  );
});

test("Activity navigation executes each destination with the original session identity", () => {
  const calls: unknown[][] = [];
  const navigation = { navigate: (...args: unknown[]) => calls.push(args) } as unknown as NavigationProp<RootStackParamList>;
  navigateToActivityResult(navigation, { modeId: "coding-interview-simulation", sessionId: "sim-exact", trackFamily: "coding_interview" });
  navigateToActivityResult(navigation, { modeId: "coding-interview-custom-practice", sessionId: "practice-exact", trackFamily: "coding_interview" });
  navigateToActivityResult(navigation, { modeId: "certification-focus-practice", sessionId: "cloud-exact", trackFamily: "certification" });
  assert.deepEqual(calls, [
    [ROUTES.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, { sessionId: "sim-exact" }],
    [ROUTES.ALGORITHMS_PRACTICE_SUMMARY, { sessionId: "practice-exact" }],
    [ROUTES.RESULT, { sessionId: "cloud-exact" }],
  ]);
});
