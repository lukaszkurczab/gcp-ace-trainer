import assert from "node:assert/strict";
import test, { before } from "node:test";
import { loadCanonicalRuntimeCatalog, type CanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { recommendLearningPlanMode } from "./learningPlanModeRecommendation";
import { createResolvedContentRef, createTrainingSession, getTrackRegistration } from "../../domain";
import { createCanonicalTrainingFamilyRuntime } from "../canonicalTrainingFamilyComposition";

let catalog: CanonicalRuntimeCatalog;
before(async () => { catalog = await loadCanonicalRuntimeCatalog(); });

function runtimeFor(trackId: string) {
  return createCanonicalTrainingFamilyRuntime(catalog.getTrack(trackId));
}

function recommendation(trackId: string, dueReviewCount: number, sessions: readonly import("../../domain").TrainingSession[] = [], activeSession?: import("../../domain").TrainingSession | null) {
  const track = catalog.getTrack(trackId);
  return recommendLearningPlanMode({ binding: runtimeFor(trackId).getPlanningModeBinding(), trackId, modes: track.modes, sessions, activeSession, dueReviewCount });
}

test("certification schedules its canonical one-time diagnostic, then moves to practice", () => {
  const trackId = "google-cloud-associate-cloud-engineer";
  const modes = catalog.getTrack(trackId).modes;
  const first = recommendation(trackId, 0);
  assert.equal(first.mode.modeId, "certification-diagnostic-baseline");
  assert.equal(first.phase, "diagnosis");
  assert.deepEqual(first.executionPolicy, { policyVersion: "patternly-learning-execution-v1", initialDiagnosis: { modeId: "certification-diagnostic-baseline", requestedLength: 40 }, practice: { modeId: "certification-focus-practice", requestedLength: 10 } });
  const overdueReview = recommendation(trackId, 1);
  assert.equal(overdueReview.mode.modeId, runtimeFor(trackId).getPlanningModeBinding().dueReviewModeId,
    "an overdue review takes precedence over a newly scheduled diagnostic");
  assert.equal(overdueReview.phase, "review");
  const after = recommendation(trackId, 0, [{ trackId, modeId: first.mode.modeId, status: "completed" } as never]);
  assert.equal(after.mode.modeId, "certification-focus-practice");
  assert.equal(after.phase, "practice");
  const diagnosticPool = first.mode.selection.kind === "exact_ordered_questions" ? first.mode.selection.questionIds : [];
  const activeSession = createTrainingSession({ id: "active-diagnostic", trackId: "google-cloud-associate-cloud-engineer", modeId: first.mode.modeId,
    configurationSnapshot: { kind: "diagnosis" }, requestedLength: first.mode.defaultRequestedLength, actualLength: diagnosticPool.length,
    currentItemIndex: 0, itemOrder: diagnosticPool.map((questionId, index) => ({ occurrenceId: `active-diagnostic:${index}`, item: createResolvedContentRef({
      trackId: "google-cloud-associate-cloud-engineer", questionId, contentVersion: "test-content",
      artifactSha256: "a".repeat(64),
    }) })), optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "test-content", artifactSha256: "a".repeat(64), status: "active", startedAt: "2026-10-02T10:00:00.000Z" });
  const active = recommendation(trackId, 1, [activeSession], activeSession);
  assert.equal(active.mode.modeId, "certification-diagnostic-baseline", "an exact active one-off diagnostic resumes before another request");
  assert.equal(active.phase, "diagnosis");
  const abandoned = recommendation(trackId, 0, [{ trackId, modeId: first.mode.modeId, status: "abandoned" } as never]);
  assert.equal(abandoned.mode.modeId, "certification-focus-practice");
  assert.equal(abandoned.diagnosis, "abandoned");
});

test("coding and design bind recurring sessions to their existing canonical practice modes", () => {
  const codingId = "coding-interview-dsa-problem-solving";
  const codingPolicy = recommendation(codingId, 0);
  assert.equal(codingPolicy.mode.modeId, "coding-interview-guided-practice");
  assert.equal(codingPolicy.executionPolicy.practice.requestedLength, 10);
  assert.equal(codingPolicy.executionPolicy.initialDiagnosis, null);
  assert.equal(recommendation("backend-system-design-interview", 0).mode.modeId, "design-interview-tradeoff-practice");
});

test("due reviews use an explicitly supported family review mode, never a made-up mode", () => {
  const result = recommendation("coding-interview-dsa-problem-solving", 1);
  assert.equal(result.mode.modeId, "coding-interview-weak-area-review");
  assert.equal(result.phase, "review");
});

test("all nine production family owners provide exact lazy planning roles and preserve default recommendation states", () => {
  assert.equal(catalog.tracks.length, 9);
  for (const trackId of catalog.tracks) {
    const track = catalog.getTrack(trackId);
    const binding = runtimeFor(trackId).getPlanningModeBinding();
    assert.equal(binding.trackId, trackId);
    assert.ok(track.modes.some((mode) => mode.modeId === binding.practiceModeId));
    assert.equal(binding.diagnosticModeId, trackId === "google-cloud-associate-cloud-engineer" ? "certification-diagnostic-baseline" : null);
    assert.equal(binding.practiceModeId, getTrackRegistration(trackId).familyId === "certification" ? "certification-focus-practice"
      : getTrackRegistration(trackId).familyId === "coding_interview" ? "coding-interview-guided-practice" : "design-interview-tradeoff-practice");
    assert.ok(binding.dueReviewModeId && track.modes.some((mode) => mode.modeId === binding.dueReviewModeId));

    const fresh = recommendation(trackId, 0);
    assert.equal(fresh.mode.modeId, binding.diagnosticModeId ?? binding.practiceModeId);
    assert.equal(fresh.diagnosis, binding.diagnosticModeId === null ? "not_available" : "scheduled");
    const due = recommendation(trackId, 1);
    assert.equal(due.mode.modeId, binding.dueReviewModeId);
    assert.equal(due.phase, "review");
    const practice = track.getMode(binding.practiceModeId);
    const question = track.getPool(practice.modeId)[0];
    assert.ok(question, `expected a canonical practice question for ${trackId}`);
    const sessionId = `planning-active:${trackId}`;
    const active = createTrainingSession({ id: sessionId, trackId, modeId: practice.modeId,
      configurationSnapshot: { kind: "practice" }, requestedLength: practice.defaultRequestedLength, actualLength: 1,
      currentItemIndex: 0, itemOrder: [{ occurrenceId: `${sessionId}:0`, item: createResolvedContentRef({
        trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256,
      }) }], optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256, status: "active", startedAt: "2026-10-02T10:00:00.000Z" });
    const continuation = recommendation(trackId, 1, [active], active);
    assert.equal(continuation.mode.modeId, practice.modeId);
    assert.equal(continuation.continuation?.sessionId, active.id);
  }
});

test("planning recommendation rejects absent, malformed, extra, unknown, or cross-track family bindings without fallback", () => {
  const trackId = "coding-interview-dsa-problem-solving";
  const track = catalog.getTrack(trackId);
  const binding = runtimeFor(trackId).getPlanningModeBinding();
  const invoke = (candidate: unknown) => recommendLearningPlanMode({ binding: candidate as never, trackId, modes: track.modes, sessions: [], dueReviewCount: 0 });
  assert.throws(() => invoke(undefined), /binding is required/u);
  assert.throws(() => invoke({ ...binding, trackId: "backend-system-design-interview" }), /different track/u);
  assert.throws(() => invoke({ ...binding, practiceModeId: "unknown-mode" }), /legal recurring practice/u);
  assert.throws(() => invoke({ ...binding, diagnosticModeId: "certification-diagnostic-baseline" }), /legal diagnostic mode/u);
  assert.throws(() => invoke({ ...binding, dueReviewModeId: "design-interview-weak-area-review" }), /legal due-review mode/u);
  assert.throws(() => invoke({ ...binding, unexpected: true }), /malformed/u);
  assert.throws(() => invoke({ ...binding, dueReviewModeId: binding.practiceModeId }), /reuses a mode/u);
});
