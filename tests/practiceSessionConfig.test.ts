import assert from "node:assert/strict";
import test from "node:test";

import { buildPracticeSessionConfig } from "../src/features/practice/sessionConfig";

test("Custom Practice accepts every declared length and persists its selected feedback timing", () => {
  for (const sessionLength of [10, 20, 40] as const) {
    for (const feedbackMode of ["afterEachAnswer", "atSessionEnd"] as const) {
      const config = buildPracticeSessionConfig({
        feedbackMode,
        mode: "algorithms-custom-practice",
        sessionLength,
        source: "practiceSetup",
        topicId: "binary_search",
        trackId: "algorithms",
      });
      assert.equal(config.mode, "algorithms-custom-practice");
      assert.equal(config.sessionLength, sessionLength);
      assert.equal(config.feedbackMode, feedbackMode);
      assert.equal(config.reviewBehaviorEnabled, true);
    }
  }
});

test("Custom Practice setup rejects every unsupported session length", () => {
  for (const sessionLength of [0, 1, 9, 11, 15, 21, 39, 41] as const) {
    assert.throws(
      () => buildPracticeSessionConfig({
        feedbackMode: "afterEachAnswer",
        mode: "algorithms-custom-practice",
        sessionLength: sessionLength as never,
        source: "practiceSetup",
        topicId: "binary_search",
        trackId: "algorithms",
      }),
      /does not support session length/,
    );
  }
});

test("Custom Practice requires a selected timing while predefined Algorithms modes retain fixed timings", () => {
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "algorithms-custom-practice",
      sessionLength: 20,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /Custom Practice requires an explicit feedback mode/,
  );
  assert.throws(
    () => buildPracticeSessionConfig({
      feedbackMode: "atSessionEnd",
      mode: "algorithms-guided-practice",
      sessionLength: 40,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /does not support feedback mode atSessionEnd/,
  );
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "algorithms-custom-practice",
      reviewBehaviorEnabled: false,
      feedbackMode: "afterEachAnswer",
      sessionLength: 20,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /owns reinsert setting true/,
  );
});

test("rejects an Algorithms session length that the selected mode does not declare", () => {
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "algorithms-weak-area-review",
      reviewSource: "due_queue",
      sessionLength: 40,
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /does not support session length 40/,
  );
});
