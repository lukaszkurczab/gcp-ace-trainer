import assert from "node:assert/strict";
import test from "node:test";
import type { NavigationProp } from "@react-navigation/native";

import { ROUTES } from "../../constants/routes";
import type { RootStackParamList } from "../../navigation";
import { buildActivityResultRoute, navigateToActivityResult } from "./activityNavigation";

const algorithms = { interaction: { destination: "algorithms_practice_summary", kind: "open_result" } as const, sessionId: "practice-1" };
const canonical = { interaction: { destination: "canonical_result", kind: "open_result" } as const, sessionId: "certification-1" };

test("Activity opens only resolver-owned result destinations", () => {
  assert.deepEqual(buildActivityResultRoute(algorithms), { name: ROUTES.ALGORITHMS_PRACTICE_SUMMARY, params: { sessionId: "practice-1" } });
  assert.deepEqual(buildActivityResultRoute(canonical), { name: ROUTES.RESULT, params: { sessionId: "certification-1" } });
});

test("Activity result routing fails closed for inline-only records", () => {
  assert.throws(() => buildActivityResultRoute({ interaction: { kind: "toggle_session_details" }, sessionId: "ended" }), /no available result route/);
  assert.throws(() => buildActivityResultRoute({ interaction: { kind: "toggle_unavailable_details" }, sessionId: "archived" }), /no available result route/);
});

test("Activity navigation preserves the original session identity", () => {
  const calls: unknown[][] = [];
  const navigation = { navigate: (...args: unknown[]) => calls.push(args) } as unknown as NavigationProp<RootStackParamList>;
  navigateToActivityResult(navigation, algorithms);
  navigateToActivityResult(navigation, canonical);
  assert.deepEqual(calls, [
    [ROUTES.ALGORITHMS_PRACTICE_SUMMARY, { sessionId: "practice-1" }],
    [ROUTES.RESULT, { sessionId: "certification-1" }],
  ]);
});
