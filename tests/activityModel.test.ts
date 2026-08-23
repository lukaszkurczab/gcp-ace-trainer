import assert from "node:assert/strict";
import test from "node:test";

import type { ActivitySessionRecord } from "../src/application/activityReadModels";
import { ALL_ACTIVITY_TRACKS, buildActivityModel } from "../src/features/home/tabs/activityModel";

const codingTrack = "coding-interview-dsa-problem-solving";
const cloudTrack = "google-cloud-associate-cloud-engineer";
const now = new Date("2026-08-23T12:00:00.000Z");

test("Activity groups durable terminal sessions and keeps the row projection truthful", () => {
  const model = buildActivityModel([
    record({ id: "today", modeId: "coding-interview-guided-practice", trackId: codingTrack, status: "completed", completedAt: "2026-08-23T11:42:00.000Z", totalOccurrences: 20, answered: 20 }),
    record({ id: "yesterday", modeId: "certification-focus-practice", trackId: cloudTrack, status: "abandoned", completedAt: "2026-08-22T09:00:00.000Z", totalOccurrences: 10, answered: 3 }),
    record({ id: "week", modeId: "coding-interview-simulation", trackId: codingTrack, status: "completed", completedAt: "2026-08-19T09:00:00.000Z", totalOccurrences: 40, answered: 38 }),
    record({ id: "older", modeId: "coding-interview-learn-approach", trackId: codingTrack, status: "completed", completedAt: "2026-08-01T09:00:00.000Z", totalOccurrences: 5, answered: 5 }),
  ], ALL_ACTIVITY_TRACKS, now);

  assert.deepEqual(model.groups.map((group) => group.label), ["Today", "Yesterday", "This week", "Earlier"]);
  assert.deepEqual(model.groups.map((group) => group.items[0]?.id), ["today", "yesterday", "week", "older"]);
  assert.equal(model.items[0]?.totalCount, 20);
  assert.equal(model.items[1]?.statusLabel, "Ended early");
  assert.equal(model.items[2]?.icon, "clock-check");
  assert.equal(model.items[0]?.duration, "01:00");
});

test("Activity track filter returns only records for the selected canonical track", () => {
  const model = buildActivityModel([
    record({ id: "coding", modeId: "coding-interview-guided-practice", trackId: codingTrack, status: "completed", completedAt: "2026-08-23T11:00:00.000Z", totalOccurrences: 1, answered: 1 }),
    record({ id: "cloud", modeId: "certification-focus-practice", trackId: cloudTrack, status: "completed", completedAt: "2026-08-23T10:00:00.000Z", totalOccurrences: 1, answered: 1 }),
  ], cloudTrack, now);

  assert.deepEqual(model.items.map((item) => item.id), ["cloud"]);
});

function record(input: Readonly<{
  answered: number;
  completedAt: string;
  id: string;
  modeId: string;
  status: "completed" | "abandoned";
  totalOccurrences: number;
  trackId: string;
}>): ActivitySessionRecord {
  return {
    attemptCount: input.answered,
    latestAttemptAt: input.completedAt,
    result: {
      answeredOccurrenceIds: Array.from({ length: input.answered }, (_, index) => `answered-${index}`),
      completedAt: input.completedAt,
      evidence: {},
      id: `result-${input.id}`,
      sessionId: input.id,
      totalOccurrences: input.totalOccurrences,
      trackId: input.trackId,
      unansweredOccurrenceIds: Array.from({ length: input.totalOccurrences - input.answered }, (_, index) => `unanswered-${index}`),
    },
    session: {
      activeForegroundMs: 60_000,
      actualLength: input.totalOccurrences,
      configurationSnapshot: { feedbackMode: "atSessionEnd" },
      contentVersion: "test",
      currentItemIndex: input.totalOccurrences - 1,
      id: input.id,
      itemOrder: [],
      modeId: input.modeId,
      optionOrderByOccurrence: {},
      packagePin: { contentHash: "test", packageId: "test", releaseId: "test" },
      requestedLength: input.totalOccurrences,
      startedAt: input.completedAt,
      status: input.status,
      trackId: input.trackId,
      completedAt: input.completedAt,
    },
  } as unknown as ActivitySessionRecord;
}
