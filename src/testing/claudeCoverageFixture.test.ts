import assert from "node:assert/strict";
import test from "node:test";
import { createClaudeCoverageFixtureCompletion } from "./claudeCoverageFixture";

test("CC04 readonly native fixture keeps a green-volume/quality path incomplete for one missing exam unit", () => {
  const state = createClaudeCoverageFixtureCompletion(false);
  assert.equal(state.kind, "in_progress");
  assert.equal(state.remainingAttemptCount, 0);
  assert.equal(state.coverageDeficit, 1);
  assert.equal(state.minimumAdditionalAttemptCount, 1);
  assert.equal(state.chapters.flatMap((chapter) => chapter.coverage ?? []).length, 53);
  assert.ok(state.chapters.every((chapter) => chapter.quality !== null && chapter.quality >= 0.8));
  assert.equal(state.chapters.flatMap((chapter) => chapter.coverage ?? []).filter((unit) => unit.deficit > 0).length, 1);
});

test("CC04 readonly native fixture completes only after all exam-unit evidence is met", () => {
  const state = createClaudeCoverageFixtureCompletion(true);
  assert.equal(state.kind, "completed");
  assert.equal(state.coverageDeficit, 0);
  assert.equal(state.minimumAdditionalAttemptCount, 0);
  assert.equal(state.completedChapterCount, state.requiredChapterCount);
});
