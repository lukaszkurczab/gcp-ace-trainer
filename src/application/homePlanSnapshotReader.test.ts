import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultGoal,
  createLearningPlanSlotId,
  createTrainingSession,
  normalizeLearningPlan,
  type ContentItemRef,
  type GoalDay,
  type LearningPlan,
  type LearningPlanSnapshot,
  type ReviewQueueEntry,
  type TrackId,
  type TrainingSession,
} from "../domain";
import { contentPackageRuntimeOwner, type ResolvedPackageRuntime } from "./contentPackageRuntimeOwner";
import { HomePlanSnapshotReader, type HomePlanSnapshotReaderDependencies } from "./homePlanSnapshotReader";

const TRACK_ID = "coding-interview-dsa-problem-solving" as TrackId;

function dependencies(overrides: Partial<HomePlanSnapshotReaderDependencies> = {}): HomePlanSnapshotReaderDependencies {
  return {
    getGoalSnapshot: async () => null,
    getLearningPlanSnapshot: async () => null,
    getActiveTrainingSession: async () => null,
    getTrainingSessions: async () => [],
    getTrainingAttempts: async () => [],
    getReviewQueueItems: async () => [],
    resolveExact: async () => { throw new Error("must not resolve a package without a plan"); },
    ...overrides,
  };
}

type ReadyFixtureOptions = Readonly<{
  slotDay?: GoalDay;
  sessionLength?: number;
  sessions?: readonly TrainingSession[];
  activeSession?: TrainingSession | null;
  reviews?: readonly ReviewQueueEntry[];
  getTrainingSessions?: HomePlanSnapshotReaderDependencies["getTrainingSessions"];
  resolveExact?: (pin: Readonly<{ packageIdentity: string; packageVersion: string; contentReleaseId: string }>) => Promise<ResolvedPackageRuntime>;
}>;

async function readyFixture(options: ReadyFixtureOptions = {}) {
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK_ID, "coding_interview");
  const goal = createDefaultGoal(TRACK_ID);
  const plan = normalizeLearningPlan({
    schemaVersion: 1,
    planId: "plan:home-reader-targeted",
    trackId: TRACK_ID,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: resolved.package.contentVersion,
    contentPackagePin: resolved.package.packagePin,
    acceptedTarget: { meaning: "none", targetDate: null },
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    planRevision: 1,
    commandId: "command:home-reader-targeted",
    slots: [{
      slotId: createLearningPlanSlotId(`slot:${options.slotDay ?? "wed"}`),
      day: options.slotDay ?? "wed",
      localTime: "18:00",
      sessionLength: options.sessionLength ?? 10,
    }],
  });
  const snapshot: LearningPlanSnapshot = Object.freeze({ plan, revision: 7 });
  const reader = new HomePlanSnapshotReader(dependencies({
    getGoalSnapshot: async () => ({ record: goal, revision: 1 }),
    getLearningPlanSnapshot: async () => snapshot,
    getActiveTrainingSession: async () => options.activeSession ?? null,
    getTrainingSessions: options.getTrainingSessions ?? (async () => options.sessions ?? []),
    getReviewQueueItems: async () => options.reviews ?? [],
    resolveExact: options.resolveExact ?? (async () => resolved),
  }));
  return { reader, resolved, plan, snapshot };
}

function sessionFor(
  resolved: ResolvedPackageRuntime,
  overrides: Readonly<{
    id: string;
    status: "active" | "completed" | "abandoned";
    completedAt?: string;
    trackId?: TrackId;
  }>,
): TrainingSession {
  const trackId = overrides.trackId ?? TRACK_ID;
  const item: ContentItemRef = {
    trackId,
    itemId: "home-reader-item",
    contentVersion: resolved.package.contentVersion,
    packagePin: resolved.package.packagePin,
  };
  const itemOrder = Array.from({ length: 10 }, (_, index) => ({ occurrenceId: `${overrides.id}:occurrence:${index + 1}`, item }));
  return createTrainingSession({
    id: overrides.id,
    trackId,
    modeId: resolved.package.profile.primaryEntry.modeId,
    configurationSnapshot: { modeId: resolved.package.profile.primaryEntry.modeId },
    requestedLength: 10,
    actualLength: itemOrder.length,
    currentItemIndex: itemOrder.length - 1,
    itemOrder,
    optionOrderByOccurrence: {},
    activeForegroundMs: 0,
    contentVersion: resolved.package.contentVersion,
    packagePin: resolved.package.packagePin,
    status: overrides.status,
    startedAt: "2026-09-08T10:00:00.000Z",
    ...(overrides.completedAt === undefined ? {} : { completedAt: overrides.completedAt }),
  });
}

function reviewFor(
  resolved: ResolvedPackageRuntime,
  overrides: Readonly<{
    id: string;
    dueAt: string;
    trackId?: TrackId;
    contentVersion?: string;
    packagePin?: ResolvedPackageRuntime["package"]["packagePin"];
  }>,
): ReviewQueueEntry {
  const trackId = overrides.trackId ?? TRACK_ID;
  return {
    id: overrides.id,
    trackId,
    sourceAttemptId: `${overrides.id}:attempt`,
    sourceSessionId: `${overrides.id}:session`,
    sourceItem: {
      trackId,
      itemId: "home-reader-item",
      contentVersion: overrides.contentVersion ?? resolved.package.contentVersion,
      packagePin: overrides.packagePin ?? resolved.package.packagePin,
    },
    taxonomyOrSkillRefs: [],
    reasons: ["manual_mark"],
    dueAt: overrides.dueAt,
    createdAt: "2026-09-01T10:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };
}

test("Home reader double-reads every mutable collection before publishing none", async () => {
  const reads = {
    goal: 0,
    plan: 0,
    active: 0,
    sessions: 0,
    attempts: 0,
    reviews: 0,
  };
  const reader = new HomePlanSnapshotReader(dependencies({
    getGoalSnapshot: async () => { reads.goal += 1; return null; },
    getLearningPlanSnapshot: async () => { reads.plan += 1; return null; },
    getActiveTrainingSession: async () => { reads.active += 1; return null; },
    getTrainingSessions: async () => { reads.sessions += 1; return []; },
    getTrainingAttempts: async () => { reads.attempts += 1; return []; },
    getReviewQueueItems: async () => { reads.reviews += 1; return []; },
  }));

  assert.deepEqual(await reader.read({ trackId: TRACK_ID, now: "2026-09-09T10:00:00.000Z" }), { kind: "none", trackId: TRACK_ID });
  assert.deepEqual(reads, { goal: 2, plan: 2, active: 2, sessions: 2, attempts: 2, reviews: 2 });
});

test("Home reader exposes concurrent mutation instead of publishing a mixed generation", async () => {
  let activeReads = 0;
  const reader = new HomePlanSnapshotReader(dependencies({
    getActiveTrainingSession: async () => {
      activeReads += 1;
      return activeReads === 1 ? null : ({ id: "foreign-active-session", status: "active" } as never);
    },
  }));

  assert.deepEqual(await reader.read({ trackId: TRACK_ID, now: "2026-09-09T10:00:00.000Z" }), {
    kind: "unavailable",
    trackId: TRACK_ID,
    reason: "concurrent_change",
  });
});

test("Home reader rejects an unregistered track before touching storage", async () => {
  let reads = 0;
  const reader = new HomePlanSnapshotReader(dependencies({
    getLearningPlanSnapshot: async () => { reads += 1; return null; },
  }));

  assert.deepEqual(await reader.read({ trackId: "not-a-registered-track" as TrackId }), {
    kind: "unavailable",
    trackId: "not-a-registered-track",
    reason: "invalid_request",
  });
  assert.equal(reads, 0);
});

test("Home reader publishes a ready projection with the exact package identity", async () => {
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK_ID, "coding_interview");
  const goal = createDefaultGoal(TRACK_ID);
  const plan = normalizeLearningPlan({
    schemaVersion: 1,
    planId: "plan:home-reader",
    trackId: TRACK_ID,
    goalRevision: 1,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: resolved.package.contentVersion,
    contentPackagePin: resolved.package.packagePin,
    acceptedTarget: { meaning: "none", targetDate: null },
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    planRevision: 1,
    commandId: "command:home-reader",
    slots: [{ slotId: createLearningPlanSlotId("slot:mon"), day: "mon", localTime: "18:00", sessionLength: 10 }],
  });
  const snapshot: LearningPlanSnapshot = Object.freeze({ plan, revision: 7 });
  const reader = new HomePlanSnapshotReader(dependencies({
    getGoalSnapshot: async () => ({ record: goal, revision: 1 }),
    getLearningPlanSnapshot: async () => snapshot,
    resolveExact: async () => resolved,
  }));

  const result = await reader.read({ trackId: TRACK_ID, now: "2026-09-09T10:00:00.000Z", today: "2026-09-09" });
  assert.equal(result.kind, "ready");
  if (result.kind !== "ready") return;
  assert.equal(result.identity.planStorageRevision, 7);
  assert.deepEqual(result.identity.contentPackagePin, resolved.package.packagePin);
  assert.equal(result.day.status, "rest");
  assert.equal(result.activeSession, null);
  assert.equal(result.dueReviewCount, 0);
});

test("Home reader reports a scheduled slot and exposes the canonical ready session facts", async () => {
  const fixture = await readyFixture({ slotDay: "wed" });
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T10:00:00.000Z", today: "2026-09-09" });

  assert.equal(result.kind, "ready");
  if (result.kind !== "ready") return;
  assert.equal(result.day.status, "scheduled");
  assert.equal(result.session.modeId, fixture.resolved.package.profile.primaryEntry.modeId);
  assert.equal(result.session.topicId, fixture.resolved.package.freeNodeId);
  assert.equal(result.session.sessionLength, fixture.resolved.package.profile.primaryEntry.requestedLength);
  assert.ok(result.session.areaLabel.length > 0);
});

test("Home reader gives completed precedence over a later skipped session", async () => {
  const base = await readyFixture({ slotDay: "wed" });
  const completed = sessionFor(base.resolved, { id: "completed", status: "completed", completedAt: "2026-09-09T11:00:00.000Z" });
  const skipped = sessionFor(base.resolved, { id: "skipped", status: "abandoned", completedAt: "2026-09-09T12:00:00.000Z" });
  const fixture = await readyFixture({ slotDay: "wed", sessions: [completed, skipped] });
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T13:00:00.000Z", today: "2026-09-09" });

  assert.equal(result.kind, "ready");
  if (result.kind !== "ready") return;
  assert.equal(result.day.status, "completed");
  assert.equal(result.day.terminalSessionId, "completed");
});

test("Home reader reports skipped only for an abandoned session with a completion timestamp", async () => {
  const base = await readyFixture({ slotDay: "wed" });
  const skipped = sessionFor(base.resolved, { id: "skipped", status: "abandoned", completedAt: "2026-09-09T12:00:00.000Z" });
  const fixture = await readyFixture({ slotDay: "wed", sessions: [skipped] });
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T13:00:00.000Z", today: "2026-09-09" });

  assert.equal(result.kind, "ready");
  if (result.kind !== "ready") return;
  assert.equal(result.day.status, "skipped");
  assert.equal(result.day.terminalSessionId, "skipped");
});

test("Home reader ignores an abandoned session without a timestamp and preserves scheduled/rest", async () => {
  const base = await readyFixture({ slotDay: "wed" });
  const abandonedWithoutTimestamp = sessionFor(base.resolved, { id: "abandoned-without-timestamp", status: "abandoned" });
  const scheduledFixture = await readyFixture({ slotDay: "wed", sessions: [abandonedWithoutTimestamp] });
  const scheduled = await scheduledFixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T13:00:00.000Z", today: "2026-09-09" });
  assert.equal(scheduled.kind, "ready");
  if (scheduled.kind === "ready") assert.equal(scheduled.day.status, "scheduled");

  const restFixture = await readyFixture({ slotDay: "mon" });
  const rest = await restFixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T13:00:00.000Z", today: "2026-09-09" });
  assert.equal(rest.kind, "ready");
  if (rest.kind === "ready") {
    assert.equal(rest.day.status, "rest");
    assert.equal(rest.day.terminalSessionId, null);
  }
});

test("Home reader counts only due reviews with exact identity and deduplicates equal IDs", async () => {
  const base = await readyFixture();
  const due = reviewFor(base.resolved, { id: "due", dueAt: "2026-09-09T10:00:00.000Z" });
  const future = reviewFor(base.resolved, { id: "future", dueAt: "2026-09-09T10:00:00.001Z" });
  const foreign = reviewFor(base.resolved, { id: "foreign", dueAt: "2026-09-09T09:00:00.000Z", contentVersion: "old-content" });
  const fixture = await readyFixture({ reviews: [due, { ...due }, future, foreign] });
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T10:00:00.000Z", today: "2026-09-09" });

  assert.equal(result.kind, "ready");
  if (result.kind !== "ready") return;
  assert.equal(result.dueReviewCount, 1);
  assert.deepEqual(result.dueReviewIds, ["due"]);
});

test("Home reader ignores a foreign active session instead of offering a mismatched resume", async () => {
  const base = await readyFixture();
  const foreignActive = sessionFor(base.resolved, {
    id: "foreign-active",
    status: "active",
    trackId: "backend-system-design-interview" as TrackId,
  });
  const fixture = await readyFixture({ activeSession: foreignActive });
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T10:00:00.000Z", today: "2026-09-09" });

  assert.equal(result.kind, "ready");
  if (result.kind === "ready") assert.equal(result.activeSession, null);
});

test("Home reader fails closed when an active pointer differs from its stored session record", async () => {
  const base = await readyFixture();
  const active = sessionFor(base.resolved, { id: "active", status: "active" });
  const stored = { ...active, activeForegroundMs: active.activeForegroundMs + 1 };
  const fixture = await readyFixture({ activeSession: active, sessions: [stored] });
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T10:00:00.000Z", today: "2026-09-09" });

  assert.deepEqual(result, { kind: "unavailable", trackId: TRACK_ID, reason: "corrupt_record" });
});

test("Home reader fails closed when the resolver returns a package with mismatched identity", async () => {
  const base = await readyFixture();
  const mismatched: ResolvedPackageRuntime = {
    ...base.resolved,
    package: { ...base.resolved.package, contentVersion: "foreign-content-version" },
  };
  const fixture = await readyFixture({ resolveExact: async () => mismatched });
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T10:00:00.000Z", today: "2026-09-09" });

  assert.deepEqual(result, { kind: "unavailable", trackId: TRACK_ID, reason: "identity_mismatch" });
});

test("Home reader rejects a collection mutation between the two canonical reads", async () => {
  let reads = 0;
  let changed: readonly TrainingSession[] = [];
  const fixture = await readyFixture({
    getTrainingSessions: async () => {
      reads += 1;
      return reads === 1 ? [] : changed;
    },
  });
  changed = [sessionFor(fixture.resolved, { id: "appeared-during-read", status: "completed", completedAt: "2026-09-09T11:00:00.000Z" })];
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T13:00:00.000Z", today: "2026-09-09" });

  assert.deepEqual(result, { kind: "unavailable", trackId: TRACK_ID, reason: "concurrent_change" });
});

test("Home reader derives the civil day across the Europe/Warsaw DST transition", async () => {
  const fixture = await readyFixture({ slotDay: "mon" });
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-03-29T23:30:00.000Z" });

  assert.equal(result.kind, "ready");
  if (result.kind !== "ready") return;
  assert.equal(result.today, "2026-03-30");
  assert.equal(result.day.day, "mon");
  assert.equal(result.day.status, "scheduled");
});

test("Home reader exposes an explicit unsupported_action for a slot length outside the exact package mode", async () => {
  const fixture = await readyFixture({ sessionLength: 999 });
  const result = await fixture.reader.read({ trackId: TRACK_ID, now: "2026-09-09T10:00:00.000Z", today: "2026-09-09" });

  assert.deepEqual(result, { kind: "unavailable", trackId: TRACK_ID, reason: "unsupported_action" });
});
