import assert from "node:assert/strict";
import test from "node:test";
import { selectRequiredCoverageAction } from "./homePlanSnapshotReader";
import { createClaudeCoverageFixtureCompletion } from "../testing/claudeCoverageFixture";

test("Home prioritizes an accessible required V3 unit when coverage is incomplete", () => {
  const completion = createClaudeCoverageFixtureCompletion(false);
  assert.equal(completion.kind, "in_progress");
  if (completion.kind !== "in_progress") return;
  const expected = completion.chapters.flatMap((chapter) => chapter.coverage.filter((unit) => unit.deficit > 0).map((unit) => ({ nodeId: chapter.nodeId, mentalUnitId: unit.mentalUnitId })))[0]!;
  const access = completion.chapters.map((chapter) => ({ nodeId: chapter.nodeId, access: "available" as const }));
  assert.deepEqual(selectRequiredCoverageAction(completion, access, false), { kind: "practice_required_unit", target: expected });
  assert.deepEqual(selectRequiredCoverageAction(completion, access, true), { kind: "no_required_target" }, "an active session keeps its current resume action");
});

test("Home offers Premium access instead of looping on the covered free chapter when every deficit is Premium-only", () => {
  const completion = createClaudeCoverageFixtureCompletion(false);
  assert.equal(completion.kind, "in_progress");
  if (completion.kind !== "in_progress") return;
  const freeNodeId = completion.chapters[0]!.nodeId;
  assert.notEqual(completion.chapters.find((chapter) => chapter.coverageDeficit > 0)?.nodeId, freeNodeId);
  const access = completion.chapters.map((chapter, index) => ({ nodeId: chapter.nodeId, access: index === 0 ? "free" as const : "locked" as const }));
  assert.deepEqual(selectRequiredCoverageAction(completion, access, false), { kind: "premium_access_required" });
});

test("Home routes a V3 volume-only deficit to a required unit even after all unit coverage is satisfied", () => {
  const base = createClaudeCoverageFixtureCompletion(false);
  assert.equal(base.kind, "in_progress");
  if (base.kind !== "in_progress") return;
  const target = base.chapters[0]!;
  const completion = volumeOnlyCompletionForNode(base, target.nodeId);
  const access = completion.chapters.map((chapter) => ({ nodeId: chapter.nodeId, access: chapter.nodeId === target.nodeId ? "free" as const : "available" as const }));
  assert.equal(completion.chapters.find((chapter) => chapter.nodeId === target.nodeId)?.coverageDeficit, 0);
  assert.ok(completion.chapters.find((chapter) => chapter.nodeId === target.nodeId)!.remainingAttemptCount > 0);
  assert.deepEqual(selectRequiredCoverageAction(completion, access, false), {
    kind: "practice_required_unit", target: { nodeId: target.nodeId, mentalUnitId: target.coverage[0]!.mentalUnitId },
  });
});

test("Home requests Premium access for a locked V3 volume-only deficit", () => {
  const base = createClaudeCoverageFixtureCompletion(false);
  assert.equal(base.kind, "in_progress");
  if (base.kind !== "in_progress") return;
  const target = base.chapters.find((chapter) => chapter.nodeId !== base.chapters[0]!.nodeId)!;
  const completion = volumeOnlyCompletionForNode(base, target.nodeId);
  const access = completion.chapters.map((chapter) => ({ nodeId: chapter.nodeId, access: chapter.nodeId === target.nodeId ? "locked" as const : "free" as const }));
  assert.deepEqual(selectRequiredCoverageAction(completion, access, false), { kind: "premium_access_required" });
});

function volumeOnlyCompletionForNode(base: Extract<ReturnType<typeof createClaudeCoverageFixtureCompletion>, { kind: "in_progress" }>, targetNodeId: string) {
  const chapters = base.chapters.map((chapter) => {
    const isTarget = chapter.nodeId === targetNodeId;
    const qualifyingAttemptCount = chapter.requiredAttemptCount - (isTarget ? 1 : 0);
    const remainingAttemptCount = isTarget ? 1 : 0;
    const coverage = chapter.coverage.map((unit) => ({ ...unit, latestCorrectQuestionCount: unit.requiredCorrectQuestionCount, deficit: 0 }));
    return Object.freeze({ ...chapter, qualifyingAttemptCount, remainingAttemptCount, coverage, coverageDeficit: 0,
      minimumAdditionalAttemptCount: remainingAttemptCount, quality: 1, qualityRequirementUnmet: false,
      status: isTarget ? "in_progress" as const : "completed" as const, reason: isTarget ? "minimum_attempts_unmet" as const : null });
  });
  const requiredAttemptCount = chapters.reduce((sum, chapter) => sum + chapter.requiredAttemptCount, 0);
  const qualifyingAttemptCount = chapters.reduce((sum, chapter) => sum + chapter.qualifyingAttemptCount, 0);
  return Object.freeze({ kind: "in_progress" as const, chapters: Object.freeze(chapters), completedChapterCount: chapters.length - 1,
    requiredChapterCount: chapters.length, requiredAttemptCount, qualifyingAttemptCount, coverageDeficit: 0,
    minimumAdditionalAttemptCount: 1, remainingAttemptCount: 1 });
}
