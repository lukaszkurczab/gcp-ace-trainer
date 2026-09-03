import assert from "node:assert/strict";
import test from "node:test";
import { getDesignModeTitle } from "./designModes";
import { formatSessionTopic } from "../../features/exam/sessionResultPresentation";

test("Design session mode titles match the learner-facing journey", () => {
  assert.equal(getDesignModeTitle("design-interview-learn-framework"), "Learn the framework");
  assert.equal(getDesignModeTitle("design-interview-tradeoff-practice"), "Tradeoff practice");
  assert.equal(getDesignModeTitle("design-interview-weak-area-review"), "Weak Area Review");
  assert.throws(() => getDesignModeTitle("unrecognized-mode"), /Unknown Design Interview mode/);
});

test("Design result names its exact package topic and exposes missing mapping", () => {
  const t = (value: string) => value;
  assert.equal(formatSessionTopic("backend-system-design-interview", "requirements_capacity_and_architecture_decomposition", t), "Requirements Capacity And Architecture Decomposition");
  assert.equal(formatSessionTopic("backend-system-design-interview", undefined, t), "Unavailable");
  assert.equal(formatSessionTopic("backend-system-design-interview", "BESD-C01", t), "Unavailable");
});
