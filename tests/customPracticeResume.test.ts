import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingSession } from "../src/domain";
import { feedbackTimingFromDurableSession } from "../src/features/home/resumeFeedbackTiming";
import { buildPracticeSessionConfig } from "../src/features/practice/sessionConfig";
import { ALGORITHM_MODE_IDS } from "../src/tracks/algorithms";

test("Custom Practice resume preserves the selected durable at-session-end timing", () => {
  const session = createTrainingSession({
    id: "algorithms:algorithms-custom-practice:1",
    trackId: "algorithms",
    modeId: ALGORITHM_MODE_IDS.customPractice,
    configurationSnapshot: { feedbackMode: "atSessionEnd", kind: "algorithmsPractice" },
    requestedLength: 10,
    actualLength: 10,
    currentItemIndex: 1,
    itemOrder: Array.from({ length: 10 }, (_, index) => ({ occurrenceId: `occurrence:${index}`, item: { trackId: "algorithms" as const, itemId: `item-${index}`, contentVersion: "algorithms-core-0002" } })),
    optionOrderByOccurrence: {},
    conditionalReinsertSlots: [],
    activeForegroundMs: 0,
    contentVersion: "algorithms-core-0002",
    taxonomyVersion: "algorithms-taxonomy-v2",
    planFingerprint: "a".repeat(64),
    status: "active",
    startedAt: "2026-07-22T08:00:00.000Z",
  });

  const feedbackMode = feedbackTimingFromDurableSession(session);
  assert.equal(feedbackMode, "atSessionEnd");
  assert.equal(buildPracticeSessionConfig({
    feedbackMode,
    mode: ALGORITHM_MODE_IDS.customPractice,
    topicId: "complexity_and_constraints",
    trackId: "algorithms",
  }).feedbackMode, "atSessionEnd");
});

test("resume rejects an active session that lacks a canonical feedback timing", () => {
  assert.throws(
    () => feedbackTimingFromDurableSession({ configurationSnapshot: {}, trackId: "algorithms" } as never),
    /missing its canonical feedback timing/,
  );
});
