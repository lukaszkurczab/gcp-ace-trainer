import assert from "node:assert/strict";
import test from "node:test";

import { buildPracticeSessionConfig } from "../src/features/practice/sessionConfig";

test("allows an Algorithms session length declared by the selected mode", () => {
  const config = buildPracticeSessionConfig({
    mode: "algorithms-guided-practice",
    sessionLength: 10,
    source: "practiceSetup",
    topicId: "binary_search",
    trackId: "algorithms",
  });

  assert.equal(config.sessionLength, 10);
  assert.equal(config.feedbackMode, "afterEachAnswer");
  assert.equal(config.reviewBehaviorEnabled, true);
});

test("rejects Algorithms feedback and reinsert overrides while retaining declared session lengths", () => {
  assert.throws(
    () => buildPracticeSessionConfig({
      feedbackMode: "atSessionEnd",
      mode: "algorithms-guided-practice",
      sessionLength: 40,
      source: "practiceSetup",
      topicId: "binary_search",
      trackId: "algorithms",
    }),
    /owns feedback mode afterEachAnswer/,
  );
  assert.throws(
    () => buildPracticeSessionConfig({
      mode: "algorithms-guided-practice",
      reviewBehaviorEnabled: false,
      sessionLength: 40,
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
