import assert from "node:assert/strict";
import test from "node:test";
import { TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";
import { TrainingApplicationFailure, type TrainingLifecyclePorts } from "./contracts";
import { getTrackRegistration } from "../../domain";

const trackId = "claude-certified-architect-professional-certification";
const nodeId = "node-u";
const mentalUnitId = "unit-u";
const sourceIdentity = { trackId, contentVersion: "old", artifactSha256: "a".repeat(64) };
const currentIdentity = { trackId, contentVersion: "current", artifactSha256: "b".repeat(64) };
const currentQuestion = { questionId: "question-b", trackId, nodeId, mentalUnitId };

function review(id: string, questionId: string, dueAt: string, unit = mentalUnitId, ownerTrackId = trackId) {
  return {
    id, trackId: ownerTrackId, status: "active", sourceAttemptId: `attempt-${id}`, sourceSessionId: `session-${id}`,
    dueAt, reasons: ["incorrect"], createdAt: "2026-10-01T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true,
    sourceItem: { ...sourceIdentity, trackId: ownerTrackId, questionId },
    taxonomyOrSkillRefs: [{ axisId: "node", nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: unit, role: "primary" }],
  };
}

function currentCatalog(includeQuestion: boolean, ownerTrackId = trackId) {
  const question = { ...currentQuestion, trackId: ownerTrackId };
  return {
    trackId: ownerTrackId, contentVersion: currentIdentity.contentVersion, artifactSha256: currentIdentity.artifactSha256,
    questions: includeQuestion ? [question] : [],
    getQuestion: (id: string) => includeQuestion && id === question.questionId ? question : undefined,
  };
}

test("canonical due review modes use current discovery content while preserving source queue refs", async () => {
  for (const input of [
    { trackId, modeId: "certification-weak-area-review", request: {} },
    { trackId, modeId: "certification-quick-review", request: { reviewSource: "due_queue" } },
    { trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-weak-area-review", request: {} },
    { trackId: "backend-system-design-interview", modeId: "design-interview-weak-area-review", request: {} },
  ]) {
    const reviews = [review("z", "question-a-z", "2026-10-12T12:00:00.000Z", mentalUnitId, input.trackId), review("a", "question-a-a", "2026-10-12T12:00:00.000Z", mentalUnitId, input.trackId)];
    const calls: string[] = [];
    const received: unknown[] = [];
    const stop = new Error("routing-probe-stop");
    const family = getTrackRegistration(input.trackId).familyId;
    const ports = {
      clock: { now: () => "2026-10-13T12:00:00.000Z" },
      sessionIds: { async create() { return "review-routing"; } },
      tracks: { getTrackRegistration },
      premiumSessionAdmission: { async authorize() { return "allowed" as const; } },
      repositories: { async getActiveSession() { return null; }, async getAttempts() { return []; }, async getHistory() { return []; }, async getReviews() { return reviews; } },
      packages: {
        async resolveForDiscovery() {
          calls.push("current");
          return { track: currentCatalog(true, input.trackId), runtime: { familyId: family, async prepare(value: unknown) { calls.push("prepare"); received.push(value); throw stop; } } };
        },
        async resolveExactArtifact() { calls.push("exact"); throw stop; },
        async resolveForPreparation() { calls.push("preparation"); throw stop; },
      },
    } as unknown as TrainingLifecyclePorts;
    await assert.rejects(new TrainingLifecycleUseCases(ports).startSession(input));
    if (input.request.reviewSource === "manual_request") assert.deepEqual(calls, ["preparation"]);
    else {
      assert.deepEqual(calls, ["current", "prepare"]);
      const prepared = received[0] as { reviews: readonly unknown[]; request: unknown };
      assert.deepEqual(prepared.reviews, reviews);
      assert.deepEqual(prepared.request, { ...input.request, sessionId: "review-routing" });
    }
  }
});

test("current question B inherits only its due unit, while missing current material keeps every source entry", async () => {
  for (const includeQuestion of [true, false]) {
    const reviews = [
      review("other-unit", "question-a-1", "2026-10-11T12:00:00.000Z", "unit-missing"),
      review("surviving", "question-a", "2026-10-10T12:00:00.000Z"),
      review("different-unit", "question-a-2", "2026-10-12T12:00:00.000Z", "unit-other"),
    ];
    const before = structuredClone(reviews);
    const calls: string[] = [];
    const stop = new Error("insufficient eligible content");
    const ports = {
      clock: { now: () => "2026-10-13T12:00:00.000Z" }, sessionIds: { async create() { return "review-routing"; } }, tracks: { getTrackRegistration },
      premiumSessionAdmission: { async authorize() { return "allowed" as const; } },
      repositories: { async getActiveSession() { return null; }, async getAttempts() { return []; }, async getHistory() { return []; }, async getReviews() { return reviews; } },
      packages: {
        async resolveForDiscovery() {
          calls.push("current");
          return { track: currentCatalog(includeQuestion), runtime: { familyId: "certification", async prepare(input: { reviews: readonly unknown[]; request: unknown }) {
            calls.push("prepare");
            assert.deepEqual(input.reviews, includeQuestion ? [reviews[1]] : []);
            if (includeQuestion) assert.deepEqual(input.request, { reviewSource: "due_queue", sessionId: "review-routing" });
            throw stop;
          } } };
        },
        async resolveExactArtifact() { calls.push("exact"); throw new Error("old artifact lookup is not expected"); },
        async resolveForPreparation() { calls.push("preparation"); throw stop; },
      },
      mutations: { async start() { assert.fail("an unavailable preparation must not write"); } },
    } as unknown as TrainingLifecyclePorts;
    await assert.rejects(new TrainingLifecycleUseCases(ports).startSession({ trackId, modeId: "certification-weak-area-review", request: { reviewSource: "due_queue" } }),
      (error: unknown) => error instanceof TrainingApplicationFailure && error.code === (includeQuestion ? "unknown_mode" : "missing_content"));
    assert.deepEqual(calls, includeQuestion ? ["current", "prepare"] : ["current"]);
    assert.deepEqual(reviews, before);
  }
});

test("a failed current catalog lookup refuses a fresh due review without retained-artifact fallback", async () => {
  const ports = {
    clock: { now: () => "2026-10-13T12:00:00.000Z" }, sessionIds: { async create() { return "review-routing"; } }, tracks: { getTrackRegistration },
    repositories: { async getActiveSession() { return null; }, async getAttempts() { return []; }, async getHistory() { return []; }, async getReviews() { return [review("a", "question-a", "2026-10-12T12:00:00.000Z")]; } },
    packages: { async resolveForDiscovery() { throw new Error("current unavailable"); }, async resolveExactArtifact() { assert.fail("no retained fallback"); }, async resolveForPreparation() { assert.fail("no preparation after failed lookup"); } },
  } as unknown as TrainingLifecyclePorts;
  await assert.rejects(new TrainingLifecycleUseCases(ports).startSession({ trackId, modeId: "certification-weak-area-review", request: {} }),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "missing_content");
});
