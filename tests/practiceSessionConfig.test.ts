import assert from "node:assert/strict";
import test from "node:test";

import { getTrackDisplay } from "../src/domain";
import { buildPracticeModes } from "../src/features/practice/practiceFlowModel";
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

test("preserves fully configured Algorithms feedback and reinsert choices", () => {
  const config = buildPracticeSessionConfig({
    feedbackMode: "atSessionEnd",
    mode: "algorithms-guided-practice",
    reviewBehaviorEnabled: false,
    sessionLength: 40,
    source: "practiceSetup",
    topicId: "binary_search",
    trackId: "algorithms",
  });

  assert.equal(config.sessionLength, 40);
  assert.equal(config.feedbackMode, "atSessionEnd");
  assert.equal(config.reviewBehaviorEnabled, false);
});

test("offers a default Algorithms practice option alongside configurable setup", () => {
  const defaultPractice = buildPracticeModes(getTrackDisplay("algorithms"))
    .find((mode) => mode.title === "Default Practice");

  assert.deepEqual(defaultPractice, {
    detail: "Start Guided Practice with the recommended session settings.",
    enabled: true,
    icon: "practice",
    mode: "algorithms-guided-practice",
    title: "Default Practice",
    tone: "primary",
  });
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
