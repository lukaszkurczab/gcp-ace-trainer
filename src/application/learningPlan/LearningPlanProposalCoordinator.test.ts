import assert from "node:assert/strict";
import test from "node:test";
import { LearningPlanProposalCoordinator } from "./LearningPlanProposalCoordinator";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { createDefaultGoal, createTrainingAttempt, type ReviewQueueEntry, type TrainingAttempt } from "../../domain";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { saveGoalSnapshot } from "../../storage/repositories/goalRepository";
import { readLearningPlanInputSnapshot } from "../../storage/repositories/learningPlanInputSnapshot";
import { addReviewQueueItems } from "../../storage/repositories/reviewQueueRepository";
import { addTrainingAttempt } from "../../storage/repositories/trainingAttemptRepository";
import { STORAGE_KEYS } from "../../storage/keys";
import { persistMutationJournal } from "../../storage/repositories/mutationJournalRepository";
import { journal } from "../../testing/journalTestSupport";

const TRACK = "google-cloud-associate-cloud-engineer" as const;

async function fixture() {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  await saveGoalSnapshot(createDefaultGoal(TRACK), null);
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, "certification");
  let now = "2026-10-02T12:00:00.000Z";
  let timezone = "Europe/Warsaw";
  let afterPackage: (() => void) | null = null;
  let sequence = 0;
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => `clock-test:${++sequence}`,
    getTimezone: () => timezone,
    readInputs: readLearningPlanInputSnapshot,
    peekPackage: () => resolved,
    now: () => now,
    resolvePackage: async () => {
      const hook = afterPackage;
      afterPackage = null;
      hook?.();
      return resolved;
    },
    resolveTrackFamily: () => "certification",
  });
  return {
    coordinator,
    resolved,
    storage,
    setNow(value: string) { now = value; },
    setTimezone(value: string) { timezone = value; },
    setAfterPackage(hook: () => void) { afterPackage = hook; },
  };
}

function attempt(f: Awaited<ReturnType<typeof fixture>>, id: string): TrainingAttempt {
  const item = {
    trackId: TRACK,
    questionId: f.resolved.track.questions[0]!.questionId,
    contentVersion: f.resolved.track.contentVersion,
    artifactSha256: f.resolved.track.artifactSha256,
  };
  return createTrainingAttempt({
    id, sessionId: `session:${id}`, trackId: TRACK, modeId: f.resolved.track.modes[0]!.modeId,
    occurrenceId: `occurrence:${id}`, item, response: {},
    result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt: "2026-10-02T11:00:00.000Z", committedAt: "2026-10-02T11:00:00.000Z",
  });
}

function review(f: Awaited<ReturnType<typeof fixture>>, source: TrainingAttempt, dueAt: string, id = `review:${source.id}`): ReviewQueueEntry {
  return {
    id, trackId: TRACK, sourceAttemptId: source.id, sourceSessionId: source.sessionId,
    sourceItem: source.item, taxonomyOrSkillRefs: [], reasons: ["incorrect"], dueAt,
    createdAt: "2026-10-02T11:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true,
  };
}

test("proposal creation rejects a local-day change during package resolution", async () => {
  const f = await fixture();
  f.setAfterPackage(() => f.setNow("2026-10-03T12:00:00.000Z"));
  assert.deepEqual(await f.coordinator.create(TRACK), { kind: "stale" });
});

test("proposal resolution rejects a timezone change during package resolution", async () => {
  const f = await fixture();
  const created = await f.coordinator.create(TRACK);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");

  f.setAfterPackage(() => f.setTimezone("America/Los_Angeles"));
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("unchanged persisted GCP inputs stay ready through the synchronous commit guard", async () => {
  const f = await fixture();
  const created = await f.coordinator.create(TRACK);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  assert.equal(f.coordinator.resolveForCommit(created.proposal.proposalId, TRACK).kind, "ready");
});

test("a newly persisted exact-package attempt stales the proposal; immutable replay adds no evidence", async () => {
  const f = await fixture();
  const created = await f.coordinator.create(TRACK);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  const record = attempt(f, "gcp-attempt-one");
  await addTrainingAttempt(record);
  const replay = await addTrainingAttempt(record);
  assert.deepEqual(replay.value, record);
  assert.equal(readLearningPlanInputSnapshot(TRACK).attempts.length, 1);
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("a persisted review becoming due within the same local day stales its proposal", async () => {
  const f = await fixture();
  const source = attempt(f, "gcp-review-source");
  await addTrainingAttempt(source);
  await addReviewQueueItems([review(f, source, "2026-10-02T17:00:00.000Z")]);
  const created = await f.coordinator.create(TRACK);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  f.setNow("2026-10-02T18:00:00.000Z"); // Still 2026-10-02 in Europe/Warsaw.
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("a persisted goal revision change stales its proposal", async () => {
  const f = await fixture();
  const created = await f.coordinator.create(TRACK);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  const before = readLearningPlanInputSnapshot(TRACK).goal!;
  await saveGoalSnapshot({ ...before.record, weeklySessionTarget: before.record.weeklySessionTarget + 1 }, before.revision);
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("corrupt, dangling, and journaled evidence reads are errors, never empty histories", async (t) => {
  const cases = ["corrupt-index", "dangling-attempt", "active-journal"] as const;
  for (const scenario of cases) await t.test(scenario, async () => {
    const f = await fixture();
    if (scenario === "corrupt-index") f.storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, "not-json");
    if (scenario === "dangling-attempt") f.storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: ["missing-attempt"] }));
    if (scenario === "active-journal") await persistMutationJournal(journal([{ kind: "clear_learning_state" }], "reset_learning_state"));
    assert.deepEqual(await f.coordinator.create(TRACK), { kind: "generator_error", classification: "retryable" });
  });
});

test("storage profile replacement during package resolution stales creation", async () => {
  const f = await fixture();
  f.setAfterPackage(() => {
    installKeyValueStorageForTests(new MemoryKeyValueStorage());
  });
  assert.deepEqual(await f.coordinator.create(TRACK), { kind: "stale" });
});

test("an injected canonical-package artifact change stales the synchronous guard", async () => {
  const f = await fixture();
  let current = f.resolved;
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "artifact-change-proposal", getTimezone: () => "Europe/Warsaw",
    readInputs: readLearningPlanInputSnapshot, peekPackage: () => current,
    now: () => "2026-10-02T12:00:00.000Z", resolvePackage: async () => current,
    resolveTrackFamily: () => "certification",
  });
  const created = await coordinator.create(TRACK);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  current = { ...f.resolved, track: { ...f.resolved.track, artifactSha256: "f".repeat(64) } };
  assert.deepEqual(coordinator.resolveForCommit(created.proposal.proposalId, TRACK), { kind: "stale" });
});

test("exact duplicate evidence preserves order and conflicting duplicate IDs fail closed", async () => {
  const f = await fixture();
  const first = attempt(f, "ordered-one");
  const second = attempt(f, "ordered-two");
  let records: readonly TrainingAttempt[] = [first, second, first];
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "ordered-evidence-proposal", getTimezone: () => "Europe/Warsaw",
    readInputs: (trackId) => ({ ...readLearningPlanInputSnapshot(trackId), attempts: records }),
    peekPackage: () => f.resolved, now: () => "2026-10-02T12:00:00.000Z",
    resolvePackage: async () => f.resolved, resolveTrackFamily: () => "certification",
  });
  const created = await coordinator.create(TRACK);
  assert.equal(created.kind, "ready");
  if (!("proposal" in created)) throw new Error("Expected a proposal.");
  records = [first, second];
  assert.equal(coordinator.resolveForCommit(created.proposal.proposalId, TRACK).kind, "ready");

  records = [second, first];
  assert.deepEqual(coordinator.resolveForCommit(created.proposal.proposalId, TRACK), { kind: "stale" });

  const conflicting = new LearningPlanProposalCoordinator({
    createProposalId: () => "conflicting-evidence-proposal", getTimezone: () => "Europe/Warsaw",
    readInputs: (trackId) => ({ ...readLearningPlanInputSnapshot(trackId), attempts: [first, { ...first, committedAt: "2026-10-02T11:01:00.000Z" }] }),
    peekPackage: () => f.resolved, now: () => "2026-10-02T12:00:00.000Z",
    resolvePackage: async () => f.resolved, resolveTrackFamily: () => "certification",
  });
  assert.deepEqual(await conflicting.create(TRACK), { kind: "generator_error", classification: "unclassified" });
});


test("a repository read failure after package await remains retryable", async () => {
  const f = await fixture(); let reads = 0;
  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "read-failure", getTimezone: () => "Europe/Warsaw",
    readInputs: (trackId) => { reads++; if (reads === 2) throw new Error("read unavailable"); return readLearningPlanInputSnapshot(trackId); },
    peekPackage: () => f.resolved, now: () => "2026-10-02T12:00:00.000Z",
    resolvePackage: async () => f.resolved, resolveTrackFamily: () => "certification",
  });
  assert.deepEqual(await coordinator.create(TRACK), { kind: "generator_error", classification: "retryable" });
});
