import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createDefaultGoal } from "../../domain";
import { requireGoalPolicy } from "../../domain/tracks/trackGoalPolicies";
import { goalScreenPersistedState } from "./goalScreenFreshness";

const TRACK = "aws-certified-solutions-architect-associate" as const;

test("goal screen persisted state changes when a goal-plan pair is accepted elsewhere", () => {
  const goal = createDefaultGoal(requireGoalPolicy(TRACK));
  const beforeAccept = goalScreenPersistedState(null, null);
  const afterAccept = goalScreenPersistedState(goal, { revision: 1, plan: { planRevision: 1, status: "accepted" } });
  assert.notEqual(beforeAccept, afterAccept);
  assert.equal(afterAccept, goalScreenPersistedState({ ...goal }, { revision: 1, plan: { planRevision: 1, status: "accepted" } }), "equal persisted data keeps the draft");
  assert.notEqual(afterAccept, goalScreenPersistedState(goal, { revision: 2, plan: { planRevision: 2, status: "accepted" } }), "a later plan edit is a persisted change");
});

test("goal screen re-reads persisted goal and plan on refocus and reloads only on change", () => {
  const screen = readFileSync("src/features/home/GoalCadenceScreen.tsx", "utf8");
  assert.match(screen, /useFocusEffect\(useCallback\(\(\) => \{/);
  assert.match(screen, /    return \(\) => \{ active = false; \};\n  \}, \[\]\)\);/, "a stable callback runs on focus only, not on every trackId change");
  assert.match(screen, /loadedPersistedState\.current === loaded && goalScreenPersistedState\(savedGoal, savedPlan\) !== loaded\.state\) setReadRevision/);
  assert.match(screen, /loadedPersistedState\.current = \{ trackId: savedTrackId, state: goalScreenPersistedState\(savedGoal, savedPlan\) \}/);
});
