import assert from "node:assert/strict";
import test from "node:test";

import { ContentError } from "../../content/errors";
import { contentPackageRuntimeOwner, type ResolvedPackageRuntime } from "../contentPackageRuntimeOwner";
import { createDefaultGoal, type GoalSnapshot, type ReviewQueueEntry } from "../../domain";
import {
  LearningPlanProposalCoordinator,
  proposalIdentitiesEqual,
  type LearningPlanProposalDependencies,
} from "./LearningPlanProposalCoordinator";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const NOW = "2026-03-02T12:00:00.000Z";

async function fixture() {
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK_ID, "coding_interview");
  let snapshot: GoalSnapshot | null = Object.freeze({ record: createDefaultGoal(TRACK_ID), revision: 3 });
  let timezone = "Europe/Warsaw";
  let packageResult: ResolvedPackageRuntime | Error = resolved;
  let goalError: Error | null = null;
  let nowCalls = 0;
  let reviews: readonly ReviewQueueEntry[] = [];
  let proposalSequence = 0;
  const dependencies: LearningPlanProposalDependencies = {
    createProposalId: () => `opaque-${++proposalSequence}`,
    getTimezone: () => timezone,
    loadAttempts: async () => [],
    loadGoalSnapshot: async () => { if (goalError) throw goalError; return snapshot; },
    loadReviews: async () => reviews,
    now: () => { nowCalls += 1; return NOW; },
    resolvePackage: async () => { if (packageResult instanceof Error) throw packageResult; return packageResult; },
    resolveTrackFamily: (trackId) => { if (trackId !== TRACK_ID) throw new Error("unknown track"); return "coding_interview"; },
  };
  return {
    coordinator: new LearningPlanProposalCoordinator(dependencies),
    dependencies,
    resolved,
    getNowCalls: () => nowCalls,
    setGoalError: (value: Error | null) => { goalError = value; },
    setPackageResult: (value: ResolvedPackageRuntime | Error) => { packageResult = value; },
    setReviews: (value: readonly ReviewQueueEntry[]) => { reviews = value; },
    setSnapshot: (value: GoalSnapshot | null) => { snapshot = value; },
    setTimezone: (value: string) => { timezone = value; },
  };
}

test("creates and stores one immutable proposal from verified package S12 and C3 facts", async () => {
  const f = await fixture();
  const result = await f.coordinator.create(TRACK_ID);
  assert.ok(result.kind === "ready" || result.kind === "shortened" || result.kind === "shortfall");
  if (result.kind !== "ready" && result.kind !== "shortened" && result.kind !== "shortfall") return;
  assert.equal(result.proposal.proposalId, "opaque-1");
  assert.equal(result.proposal.outcome.kind, result.kind);
  assert.equal(result.proposal.outcome.identity.packagePin.packageIdentity, f.resolved.package.packagePin.packageIdentity);
  assert.equal(result.proposal.outcome.completionState.kind, f.resolved.package.profile.completionRule ? "in_progress" : "unknown");
  assert.equal(f.getNowCalls(), 1);
  assert.ok(Object.isFrozen(result.proposal));
  assert.ok(Object.isFrozen(result.proposal.outcome));
  assert.ok(Object.isFrozen(result.proposal.outcome.slots));
  assert.deepEqual(await f.coordinator.resolve("opaque-1", TRACK_ID), result);
  f.coordinator.remove("opaque-1");
  assert.deepEqual(await f.coordinator.resolve("opaque-1", TRACK_ID), { kind: "stale" });
});

test("returns no-goal and paused before package work, and unknown tracks fail explicitly", async () => {
  const f = await fixture();
  f.setSnapshot(null);
  assert.deepEqual(await f.coordinator.create(TRACK_ID), { kind: "no_goal" });
  f.setSnapshot({ record: { ...createDefaultGoal(TRACK_ID), status: "paused" }, revision: 4 });
  assert.deepEqual(await f.coordinator.create(TRACK_ID), { kind: "goal_paused" });
  f.setSnapshot({ record: createDefaultGoal(TRACK_ID), revision: 4 });
  assert.deepEqual(await f.coordinator.create("unknown-track"), { kind: "generator_error", classification: "terminal" });
});

test("filters due review by exact track, version, pin, and the operation's single now", async () => {
  const f = await fixture();
  const sourceItem = { trackId: TRACK_ID, itemId: "item", contentVersion: f.resolved.package.contentVersion, packagePin: f.resolved.package.packagePin };
  const review = { id: "review", trackId: TRACK_ID, sourceAttemptId: "attempt", sourceSessionId: "session", sourceItem, taxonomyOrSkillRefs: [], reasons: ["incorrect"], dueAt: NOW, createdAt: NOW, consecutiveAfterDueSuccesses: 0, persistent: true } as ReviewQueueEntry;
  f.setReviews([review, { ...review, id: "future", dueAt: "2026-03-03T12:00:00.000Z" }, { ...review, id: "foreign", sourceItem: { ...sourceItem, contentVersion: "old" } }]);
  const result = await f.coordinator.create(TRACK_ID);
  assert.ok(result.kind === "ready" || result.kind === "shortened");
  if (result.kind === "ready" || result.kind === "shortened") assert.deepEqual(result.proposal.outcome.materialPriority, { kind: "due_review" });
  assert.equal(f.getNowCalls(), 1);
});

test("resolve reports identity changes as stale without regeneration", async () => {
  const f = await fixture();
  const created = await f.coordinator.create(TRACK_ID);
  assert.ok(created.kind === "ready" || created.kind === "shortened");
  if (created.kind !== "ready" && created.kind !== "shortened") return;
  const id = created.proposal.proposalId;
  f.setSnapshot({ record: createDefaultGoal(TRACK_ID), revision: 99 });
  assert.deepEqual(await f.coordinator.resolve(id, TRACK_ID), { kind: "stale" });
  f.setSnapshot({ record: createDefaultGoal(TRACK_ID), revision: 3 });
  f.setTimezone("America/New_York");
  assert.deepEqual(await f.coordinator.resolve(id, TRACK_ID), { kind: "stale" });
  f.setTimezone("Europe/Warsaw");
  const changedPin = { ...f.resolved.package.packagePin, contentReleaseId: "changed" };
  f.setPackageResult({ ...f.resolved, package: { ...f.resolved.package, packagePin: changedPin } });
  assert.deepEqual(await f.coordinator.resolve(id, TRACK_ID), { kind: "stale" });
  assert.deepEqual(await f.coordinator.resolve("missing", TRACK_ID), { kind: "stale" });
  assert.deepEqual(await f.coordinator.resolve(id, "other-track"), { kind: "stale" });
});

test("classifies create and resolve failures without turning read errors into stale", async () => {
  const f = await fixture();
  f.setPackageResult(new ContentError("bad package", "package_payload_invalid"));
  assert.deepEqual(await f.coordinator.create(TRACK_ID), { kind: "package_unavailable" });
  f.setPackageResult(new Error("offline"));
  assert.deepEqual(await f.coordinator.create(TRACK_ID), { kind: "package_error" });
  f.setPackageResult(f.resolved);
  f.setTimezone("Mars/Olympus");
  assert.deepEqual(await f.coordinator.create(TRACK_ID), { kind: "generator_error", classification: "terminal" });
  f.setTimezone("Europe/Warsaw");
  const created = await f.coordinator.create(TRACK_ID);
  assert.ok(created.kind === "ready" || created.kind === "shortened");
  if (created.kind !== "ready" && created.kind !== "shortened") return;
  f.setGoalError(new Error("read failed"));
  assert.deepEqual(await f.coordinator.resolve(created.proposal.proposalId, TRACK_ID), { kind: "generator_error", classification: "retryable" });
});

test("proposal identity equality compares every freshness field", async () => {
  const f = await fixture();
  const created = await f.coordinator.create(TRACK_ID);
  assert.ok(created.kind === "ready" || created.kind === "shortened");
  if (created.kind !== "ready" && created.kind !== "shortened") return;
  const identity = created.proposal.outcome.identity;
  assert.equal(proposalIdentitiesEqual(identity, { ...identity }), true);
  assert.equal(proposalIdentitiesEqual(identity, { ...identity, contentVersion: "changed" }), false);
  assert.equal(proposalIdentitiesEqual(identity, { ...identity, packagePin: { ...identity.packagePin, packageVersion: "changed" } }), false);
});
