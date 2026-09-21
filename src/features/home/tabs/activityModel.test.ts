import assert from "node:assert/strict";
import test from "node:test";

import type { ActivitySessionRecord, ActivityUnavailableSessionRecord } from "../../../application/activityReadModels";
import type { EvidenceRef } from "../../../domain";
import { createContentIdentityArchivalHistoryRecord } from "../../../storage/repositories/contentIdentityUnavailableRepository";
import { ALL_ACTIVITY_TRACKS, buildActivityModel } from "./activityModel";
import { formatActivityDateLabel, relativeDay } from "./activityPresentation";

const codingTrack = "coding-interview-dsa-problem-solving";
const cloudTrack = "google-cloud-associate-cloud-engineer";
const now = new Date("2026-08-23T12:00:00.000Z");

test("Activity groups durable terminal sessions and keeps the row projection truthful", () => {
  const model = buildActivityModel([
    record({ id: "today", modeId: "coding-interview-guided-practice", trackId: codingTrack, status: "completed", completedAt: "2026-08-23T11:42:00.000Z", totalOccurrences: 20, answered: 20, scopeRefs: [{ axisId: "roadmap_node", nodeId: "complexity_and_constraints", role: "primary" }] }),
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
  assert.equal(model.items[0]?.scopeLabel, "Complexity and constraints");
});

test("Activity identifies an absolute-deadline completion without relabeling manual abandonment", () => {
  const model = buildActivityModel([
    record({ id: "expired", modeId: "certification-exam-simulation", trackId: cloudTrack, status: "completed", completedAt: "2026-08-23T11:00:00.000Z", totalOccurrences: 10, answered: 8, deadline: "2026-08-23T10:00:00.000Z" }),
    record({ id: "ended", modeId: "certification-exam-simulation", trackId: cloudTrack, status: "abandoned", completedAt: "2026-08-23T09:00:00.000Z", totalOccurrences: 10, answered: 8, deadline: "2026-08-23T08:00:00.000Z" }),
  ], ALL_ACTIVITY_TRACKS, now);

  assert.equal(model.items[0]?.status, "time-expired");
  assert.equal(model.items[0]?.statusLabel, "Time expired");
  assert.equal(model.items[1]?.status, "ended-early");
});

test("Activity interaction matrix opens only summaries supported by durable family evidence", () => {
  const designTrack = "backend-system-design-interview";
  const model = buildActivityModel([
    record({ id: "coding-completed", modeId: "coding-interview-guided-practice", trackId: codingTrack, status: "completed", completedAt: "2026-08-23T11:00:00.000Z", totalOccurrences: 2, answered: 2, resultFamilyId: "coding_interview" }),
    record({ id: "coding-ended", modeId: "coding-interview-guided-practice", trackId: codingTrack, status: "abandoned", completedAt: "2026-08-23T10:00:00.000Z", totalOccurrences: 2, answered: 1, noResult: true }),
    record({ id: "simulation", modeId: "coding-interview-simulation", trackId: codingTrack, status: "completed", completedAt: "2026-08-23T09:00:00.000Z", totalOccurrences: 2, answered: 2, resultFamilyId: "coding_interview" }),
    record({ id: "cert-completed", modeId: "certification-focus-practice", trackId: cloudTrack, status: "completed", completedAt: "2026-08-23T08:00:00.000Z", totalOccurrences: 2, answered: 2, resultFamilyId: "certification" }),
    record({ id: "cert-ended", modeId: "certification-focus-practice", trackId: cloudTrack, status: "abandoned", completedAt: "2026-08-23T07:00:00.000Z", totalOccurrences: 2, answered: 1, noResult: true }),
    record({ id: "design-no-result", modeId: "design-interview-guided-practice", trackId: designTrack, status: "completed", completedAt: "2026-08-23T06:00:00.000Z", totalOccurrences: 2, answered: 0, noResult: true }),
    record({ id: "cert-cross-family-result", modeId: "certification-focus-practice", trackId: cloudTrack, status: "completed", completedAt: "2026-08-23T05:00:00.000Z", totalOccurrences: 2, answered: 2, resultFamilyId: "coding_interview" }),
  ], ALL_ACTIVITY_TRACKS, now);
  const interaction = (id: string) => model.items.find((item) => item.id === id)?.interaction;
  assert.deepEqual(interaction("coding-completed"), { destination: "algorithms_practice_summary", kind: "open_result" });
  assert.deepEqual(interaction("coding-ended"), { destination: "algorithms_practice_summary", kind: "open_result" });
  assert.deepEqual(interaction("simulation"), { kind: "toggle_session_details" });
  assert.deepEqual(interaction("cert-completed"), { destination: "canonical_result", kind: "open_result" });
  assert.deepEqual(interaction("cert-ended"), { kind: "toggle_session_details" });
  assert.deepEqual(interaction("design-no-result"), { kind: "toggle_session_details" });
  assert.deepEqual(interaction("cert-cross-family-result"), { kind: "toggle_session_details" });
});

test("Activity track filter returns only records for the selected canonical track", () => {
  const model = buildActivityModel([
    record({ id: "coding", modeId: "coding-interview-guided-practice", trackId: codingTrack, status: "completed", completedAt: "2026-08-23T11:00:00.000Z", totalOccurrences: 1, answered: 1 }),
    record({ id: "cloud", modeId: "certification-focus-practice", trackId: cloudTrack, status: "completed", completedAt: "2026-08-23T10:00:00.000Z", totalOccurrences: 1, answered: 1 }),
  ], cloudTrack, now);

  assert.deepEqual(model.items.map((item) => item.id), ["cloud"]);
});

test("Activity uses local calendar days and Monday-based calendar weeks", () => {
  const now = new Date(2026, 7, 23, 12, 0);
  const yesterday = new Date(2026, 7, 22, 9, 0).toISOString();
  const previousWeek = new Date(2026, 7, 16, 9, 0).toISOString();
  const model = buildActivityModel([
    record({ id: "previous-week", modeId: "coding-interview-guided-practice", trackId: codingTrack, status: "completed", completedAt: previousWeek, totalOccurrences: 1, answered: 1 }),
    record({ id: "yesterday", modeId: "coding-interview-guided-practice", trackId: codingTrack, status: "completed", completedAt: yesterday, totalOccurrences: 1, answered: 1 }),
  ], ALL_ACTIVITY_TRACKS, now);

  assert.equal(model.items.find((item) => item.id === "yesterday")?.group, "Yesterday");
  assert.equal(model.items.find((item) => item.id === "previous-week")?.group, "Earlier");
});

test("Activity keeps local midnight and relative labels correct across a DST boundary", () => {
  const now = new Date(2026, 2, 30, 0, 30);
  const beforeMidnight = new Date(2026, 2, 29, 23, 45).toISOString();
  const model = buildActivityModel([
    record({ id: "dst-boundary", modeId: "coding-interview-guided-practice", trackId: codingTrack, status: "completed", completedAt: beforeMidnight, totalOccurrences: 1, answered: 1 }),
  ], ALL_ACTIVITY_TRACKS, now);

  assert.equal(model.items[0]?.group, "Yesterday");
  assert.deepEqual(model.items[0]?.dateLabel, { kind: "relative", label: "Yesterday", timestamp: beforeMidnight });
  assert.equal(relativeDay(beforeMidnight, now), "Yesterday");
});

test("Activity date labels format relative words and month names from the selected locale", () => {
  const timestamp = new Date(2026, 8, 3, 16, 7).toISOString();
  const translate = (value: string): string => value === "Today" ? "Dzisiaj" : value === "Yesterday" ? "Wczoraj" : value;
  const expectedDate = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" }).format(new Date(timestamp));

  assert.equal(formatActivityDateLabel({ kind: "relative", label: "Today", timestamp }, "pl", translate), "Dzisiaj, 16:07");
  assert.equal(formatActivityDateLabel({ kind: "calendar", timestamp }, "pl", translate), `${expectedDate}, 16:07`);
});

test("Activity keeps unavailable archival summaries separate from runtime navigation facts", () => {
  const sessionId = "activity-unavailable";
  const model = buildActivityModel([
    unavailableRecord(sessionId),
  ], ALL_ACTIVITY_TRACKS, now);

  assert.equal(model.items.length, 1);
  assert.equal(model.items[0]?.kind, "unavailable");
  assert.equal(model.items[0]?.sessionId, sessionId);
  assert.equal(model.items[0]?.answerCount, 1);
  assert.equal(model.items[0]?.totalCount, 2);
  assert.deepEqual(model.items[0]?.unavailableReasons, ["unknown_artifact_hash"]);
  assert.equal(model.items[0]?.scopeLabel, null);
});

test("Activity never exposes an unknown archived track identity", () => {
  const model = buildActivityModel([unavailableRecord("unknown-track", "private-legacy-track-id")], ALL_ACTIVITY_TRACKS, now);

  assert.equal(model.items[0]?.trackTitle, "Unavailable track");
  assert.doesNotMatch(model.items[0]?.trackTitle ?? "", /private-legacy-track-id/);
});

function record(input: Readonly<{
  answered: number;
  completedAt: string;
  id: string;
  modeId: string;
  status: "completed" | "abandoned";
  totalOccurrences: number;
  trackId: string;
  scopeRefs?: readonly EvidenceRef[];
  deadline?: string;
  noResult?: boolean;
  resultFamilyId?: string;
}>): ActivitySessionRecord {
  return {
    attemptCount: input.answered,
    latestAttemptAt: input.completedAt,
    result: input.noResult ? null : {
      answeredOccurrenceIds: Array.from({ length: input.answered }, (_, index) => `answered-${index}`),
      completedAt: input.completedAt,
      evidence: input.resultFamilyId ? { familyId: input.resultFamilyId } : {},
      id: `result-${input.id}`,
      sessionId: input.id,
      totalOccurrences: input.totalOccurrences,
      trackId: input.trackId,
      unansweredOccurrenceIds: Array.from({ length: input.totalOccurrences - input.answered }, (_, index) => `unanswered-${index}`),
    },
    scopeRefs: input.scopeRefs ?? [],
    session: {
      activeForegroundMs: 60_000,
      actualLength: input.totalOccurrences,
      configurationSnapshot: { feedbackMode: "atSessionEnd", ...(input.deadline ? { timer: "absoluteDeadline", timerDeadlineAt: input.deadline } : {}) },
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

function unavailableRecord(sessionId: string, trackId = codingTrack): ActivityUnavailableSessionRecord {
  return {
    archive: createContentIdentityArchivalHistoryRecord({
      schemaVersion: 1,
      kind: "archival_history",
      sessionId,
      session: {
        id: sessionId,
        status: "abandoned",
        trackId,
        itemOrder: [{
          occurrenceId: `${sessionId}:0`,
          item: {
            kind: "archival_history",
            sessionId,
            trackId,
            questionId: "question-1",
            contentVersion: "content-v0",
            reason: "unknown_artifact_hash",
            migrationVersion: 1,
            legacyIdentityDigest: "a".repeat(64),
          },
        }],
      },
      attempts: [],
      results: [],
    }),
    attemptCount: 1,
    answeredCount: 1,
    completedAt: "2026-08-23T11:00:00.000Z",
    contentVersion: "content-v0",
    id: sessionId,
    kind: "unavailable",
    latestAttemptAt: "2026-08-23T10:59:00.000Z",
    modeId: "coding-interview-guided-practice",
    result: { answeredCount: 1, completedAt: "2026-08-23T11:00:00.000Z", totalCount: 2, unansweredCount: 1 },
    scopeRefs: [],
    sessionId,
    startedAt: "2026-08-23T10:50:00.000Z",
    status: "abandoned",
    totalCount: 2,
    trackId,
    unavailableReasons: ["unknown_artifact_hash"],
  };
}
