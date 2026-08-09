import { TEST_CONTENT_PACKAGE_PIN } from "./contentPackagePinFixture";
import assert from "node:assert/strict";
import test, { before } from "node:test";

import { createTrainingSession } from "../src/domain";
import { feedbackTimingFromDurableSession } from "../src/features/home/resumeFeedbackTiming";
import { buildPracticeSessionConfig } from "../src/features/practice/sessionConfig";
import { ALGORITHM_MODE_IDS } from "../src/tracks/coding-interview";
import { contentPackageRuntimeOwner } from "../src/application/contentPackageRuntimeOwner";

before(async () => { await contentPackageRuntimeOwner.verifyBundledPackages(); });

test("Custom Practice resume preserves the selected durable at-session-end timing", () => {
  const session = createTrainingSession({
    id: "coding-interview-dsa-problem-solving:coding-interview-custom-practice:1",
    trackId: "coding-interview-dsa-problem-solving",
    modeId: ALGORITHM_MODE_IDS.customPractice,
    configurationSnapshot: { feedbackMode: "atSessionEnd", kind: "algorithmsPractice" },
    requestedLength: 10,
    actualLength: 10,
    currentItemIndex: 1,
    itemOrder: Array.from({ length: 10 }, (_, index) => ({ occurrenceId: `occurrence:${index}`, item: { trackId: "coding-interview-dsa-problem-solving" as const, itemId: `item-${index}`, contentVersion: "algorithms-core-0002" , packagePin: TEST_CONTENT_PACKAGE_PIN} })),
    optionOrderByOccurrence: {},
    conditionalReinsertSlots: [],
    activeForegroundMs: 0,
    contentVersion: "algorithms-core-0002", packagePin: TEST_CONTENT_PACKAGE_PIN,
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
    trackId: "coding-interview-dsa-problem-solving",
  }).feedbackMode, "atSessionEnd");
});

test("resume rejects an active session that lacks a canonical feedback timing", () => {
  assert.throws(
    () => feedbackTimingFromDurableSession({ configurationSnapshot: {}, trackId: "coding-interview-dsa-problem-solving" } as never),
    /missing its canonical feedback timing/,
  );
});
