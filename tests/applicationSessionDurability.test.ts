import assert from "node:assert/strict";
import test from "node:test";

import {
  InvalidTrainingSessionError,
  createTrainingSession,
  type TrainingSession,
} from "../src/domain";
import {
  TrainingSessionStartError,
  TrainingSessionOptionPlanError,
  advanceTrainingSessionDurably,
  assertTrainingSessionOptionPlan,
  getTrainingSessionProgress,
  persistTrainingSessionForegroundTime,
  startOrResumeTrainingSession,
  type TrainingSessionPersistenceBoundary,
} from "../src/application/trainingSessions";

function session(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return createTrainingSession({
    id: "session-1",
    trackId: "algorithms",
    modeId: "algorithms-learn",
    configurationSnapshot: { feedbackMode: "afterEachAnswer", kind: "practice", mode: "learn", timer: "elapsedForeground", topicId: "arrays" },
    requestedLength: 2,
    actualLength: 2,
    currentItemIndex: 0,
    itemOrder: ["one", "two"].map((itemId) => ({ trackId: "algorithms", itemId, contentVersion: "v1" })),
    optionOrderByItem: { one: ["b", "a"], two: ["d", "c"] },
    activeForegroundMs: 100,
    contentVersion: "v1",
    status: "active",
    startedAt: "2026-07-15T10:00:00.000Z",
    ...overrides,
  });
}

function boundary(input: { active?: TrainingSession | null; save?: (value: TrainingSession) => Promise<void> } = {}): TrainingSessionPersistenceBoundary {
  return { getActive: async () => input.active ?? null, save: input.save ?? (async () => undefined) };
}

test("configuration snapshot is validated, frozen, and preserved for deterministic resume", async () => {
  const active = session({ currentItemIndex: 1 });
  const resumed = await startOrResumeTrainingSession(session(), boundary({ active }));
  assert.equal(resumed, active);
  assert.deepEqual(resumed.configurationSnapshot, active.configurationSnapshot);
  assert.ok(Object.isFrozen(resumed.configurationSnapshot));
  assert.throws(() => createTrainingSession({ ...session(), configurationSnapshot: {} }), InvalidTrainingSessionError);
  await assert.rejects(
    startOrResumeTrainingSession(session({ configurationSnapshot: { kind: "practice", mode: "drill" } }), boundary({ active })),
    TrainingSessionStartError,
  );
});

test("resume rejects a different mode or durable item and option plan", async () => {
  const active = session();
  await assert.rejects(startOrResumeTrainingSession(session({ modeId: "algorithms-review" }), boundary({ active })), /mode/);
  await assert.rejects(startOrResumeTrainingSession(session({ itemOrder: [...active.itemOrder].reverse() }), boundary({ active })), /item and option plan/);
  await assert.rejects(startOrResumeTrainingSession(session({ optionOrderByItem: { ...active.optionOrderByItem, one: ["a", "b"] } }), boundary({ active })), /item and option plan/);
});

test("content validation rejects missing, duplicate, and unknown durable option IDs", () => {
  const expected = { one: ["a", "b"], two: ["c", "d"] };
  assert.doesNotThrow(() => assertTrainingSessionOptionPlan(session(), expected));
  assert.throws(() => assertTrainingSessionOptionPlan(session({ optionOrderByItem: { one: ["a"], two: ["c", "d"] } }), expected), TrainingSessionOptionPlanError);
  assert.throws(() => assertTrainingSessionOptionPlan(session({ optionOrderByItem: { one: ["a", "x"], two: ["c", "d"] } }), expected), TrainingSessionOptionPlanError);
  assert.throws(() => assertTrainingSessionOptionPlan({ ...session(), optionOrderByItem: { one: ["a", "a"], two: ["c", "d"] } }, expected), TrainingSessionOptionPlanError);
});

test("durable progress hydrates prior attempts and the answered current item in plan order", () => {
  const active = session({ currentItemIndex: 1 });
  const makeAttempt = (id: string, itemId: string) => ({
    id, sessionId: active.id, trackId: active.trackId, modeId: active.modeId,
    item: active.itemOrder.find((item) => item.itemId === itemId)!, response: { selectedOptionIds: ["a"] },
    result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: active.itemOrder.find((item) => item.itemId === itemId)!, taxonomyOrSkillRefs: [] },
    answeredAt: active.startedAt, committedAt: active.startedAt,
  });
  const prior = makeAttempt("a1", "one");
  const current = makeAttempt("a2", "two");
  const other = { ...prior, id: "other", sessionId: "another-session" };
  const progress = getTrainingSessionProgress(active, [current, other, prior]);
  assert.deepEqual(progress.attempts.map((attempt) => attempt.id), ["a1", "a2"]);
  assert.equal(progress.currentAttempt?.id, "a2");
  assert.throws(() => getTrainingSessionProgress(active, [current, { ...current, id: "duplicate" }]), /multiple committed attempts/);
  assert.throws(() => getTrainingSessionProgress(active, [{ ...current, item: { ...current.item, itemId: "outside-plan" } }]), /does not belong/);
});

test("foreground accumulation persists only the supplied active interval", async () => {
  const saved: TrainingSession[] = [];
  const updated = await persistTrainingSessionForegroundTime(session(), 750, boundary({ save: async (value) => { saved.push(value); } }));
  assert.equal(updated.activeForegroundMs, 850);
  assert.equal(saved[0]?.activeForegroundMs, 850);
});

test("start failure rejects without exposing a session", async () => {
  await assert.rejects(startOrResumeTrainingSession(session(), boundary({ save: async () => { throw new Error("disk full"); } })), /disk full/);
});

test("a new session is not returned before its durable write resolves", async () => {
  let release!: () => void;
  let exposed = false;
  const pending = startOrResumeTrainingSession(session(), boundary({ save: () => new Promise<void>((resolve) => { release = resolve; }) })).then(() => { exposed = true; });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(exposed, false);
  release();
  await pending;
  assert.equal(exposed, true);
});

test("advance failure rejects and cannot expose the next position", async () => {
  const current = session();
  await assert.rejects(advanceTrainingSessionDurably(current, 250, boundary({ save: async () => { throw new Error("write failed"); } })), /write failed/);
  assert.equal(current.currentItemIndex, 0);
  assert.equal(current.activeForegroundMs, 100);
});
