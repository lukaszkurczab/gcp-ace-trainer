import assert from "node:assert/strict";
import test from "node:test";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import {
  acceptedTargetFromGoal, createDefaultGoal, evaluatePackageCompletion,
  generateLearningPlanProposal, normalizeLearningPlan, type TrainingAttempt, type PackageCompletionState,
} from "../../domain";
import { calculatePaceForecast } from "../../domain/learning/paceForecast";
import { createLearningPlanSlotId } from "../../domain/learning/slotIdentity";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { addTrainingAttempt, saveGoalSnapshot, saveLearningPlanAtomically } from "../../storage/repositories";
import i18n from "../../i18n";
import { completionCopy, targetCopy } from "../../features/home/homePlanUiContract";
import { projectTargetDateGuidance } from "./targetDateGuidance";
import { presentTargetDateGuidance } from "./targetDateGuidancePresentation";
import { readLearningPlanInputSnapshot } from "../../storage/repositories/learningPlanInputSnapshot";

const TRACK = "google-cloud-associate-cloud-engineer";
const TODAY = "2026-03-01";
const TIMEZONE = "Europe/Warsaw";

// Focused evaluator fixture; canonical artifact admission is covered separately.
async function qualityFixture(attemptCount = 25) {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, "certification");
  const goal = await saveGoalSnapshot({ ...createDefaultGoal(TRACK), targetDate: "2026-04-01" }, null);
  const focusQuestion = resolved.track.questions[0]!;
  const profile = {
    trackId: TRACK, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256,
    completionRule: { ruleVersion: 2 as const, chapters: [{ nodeId: focusQuestion.nodeId, mentalUnitCount: 1, minimumAttemptCount: 20, rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const }] },
  };
  const item = { trackId: TRACK, contentVersion: profile.contentVersion, artifactSha256: profile.artifactSha256, questionId: focusQuestion.questionId };
  for (let index = 0; index < attemptCount; index++) {
    const answeredAt = `2026-02-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`;
    const attempt: TrainingAttempt = {
      id: `quality-${index}`, sessionId: "quality-session", occurrenceId: `quality-occurrence-${index}`,
      trackId: TRACK, modeId: resolved.track.modes[0]!.modeId, item, response: {},
      result: index < attemptCount - 5 ? { kind: "correct", earnedPoints: 1, maxPoints: 1 } : { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
      reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt, committedAt: answeredAt,
    };
    await addTrainingAttempt(attempt);
  }
  const plan = normalizeLearningPlan({
    schemaVersion: 1, planId: "quality-plan", trackId: TRACK, goalRevision: goal.revision, status: "accepted",
    timezone: TIMEZONE, contentVersion: profile.contentVersion, artifactSha256: profile.artifactSha256,
    acceptedTarget: acceptedTargetFromGoal(goal.record), createdAt: "2026-02-01T12:00:00.000Z", updatedAt: "2026-02-01T12:00:00.000Z",
    planRevision: 1, commandId: "quality-command",
    slots: [{ slotId: createLearningPlanSlotId("quality-slot"), day: "mon", localTime: "18:00", sessionLength: 40 }],
  });
  saveLearningPlanAtomically({ plan, expectedGoalRevision: goal.revision, expectedPlanStorageRevision: null });
  const inputs = readLearningPlanInputSnapshot(TRACK);
  const completion = evaluatePackageCompletion(profile, inputs.attempts, resolved.track.getQuestion);
  assert.equal(completion.kind, "in_progress");
  if (completion.kind === "in_progress") {
    assert.equal(completion.qualifyingAttemptCount, attemptCount);
    assert.equal(completion.remainingAttemptCount, 0);
    assert.equal(completion.chapters[0]?.reason, "quality_unmet");
  }
  return { resolved, inputs, plan, completion, profile };
}

test("P05 persisted 25 attempts / 5 correct in latest 10 cannot predict completion today", async () => {
  const f = await qualityFixture();
  const result = calculatePaceForecast({
    acceptedPlan: f.plan, c3Result: f.completion.kind, remainingAttemptCount: f.completion.kind === "in_progress" ? f.completion.remainingAttemptCount : 0,
    today: TODAY, timezone: TIMEZONE,
    completedFacts: { sessions: [], attempts: f.inputs.attempts.map((attempt) => ({ answeredAt: attempt.answeredAt, countsTowardCompletion: true })) },
  });
  assert.deepEqual(result, { kind: "unavailable", reason: "quality_requirement_unmet" });
});

test("P05 evaluator result cannot become an achievable target merely because volume is met", async () => {
  const f = await qualityFixture();
  const primary = f.resolved.track.modes[0]!;
  const proposal = generateLearningPlanProposal({
    goalSnapshot: f.inputs.goal!, artifactSha256: f.profile.artifactSha256, contentVersion: f.profile.contentVersion,
    primaryModeId: primary.modeId, requestedLength: primary.defaultRequestedLength,
    sessionCapacity: { kind: "exact", actualLength: primary.defaultRequestedLength },
    completionState: f.completion, dueReviewCount: 0, primaryScopeLabel: "Track", localToday: TODAY, timezone: TIMEZONE,
  });
  assert.deepEqual(proposal.targetAssessment, { kind: "quality_requirement_unmet" });
  assert.equal(proposal.completionState.kind, "in_progress");
  assert.equal(proposal.slots.length, f.inputs.goal!.record.preferredDays.length);
});

function completedFacts(f: Awaited<ReturnType<typeof qualityFixture>>) {
  return { sessions: [], attempts: f.inputs.attempts.map((attempt) => ({ answeredAt: attempt.answeredAt, countsTowardCompletion: true })) };
}
function proposalFor(f: Awaited<ReturnType<typeof qualityFixture>>, completion: PackageCompletionState = f.completion, goal = f.inputs.goal!, shortfall = false) {
  const primary = f.resolved.track.modes[0]!;
  return generateLearningPlanProposal({
    goalSnapshot: goal, artifactSha256: f.profile.artifactSha256, contentVersion: f.profile.contentVersion,
    primaryModeId: primary.modeId, requestedLength: primary.defaultRequestedLength,
    sessionCapacity: shortfall ? { kind: "shortfall", requestedLength: primary.defaultRequestedLength, eligibleItemCount: 0, missingItemCount: primary.defaultRequestedLength } : { kind: "exact", actualLength: primary.defaultRequestedLength },
    completionState: completion, dueReviewCount: 0, primaryScopeLabel: "Track", localToday: TODAY, timezone: TIMEZONE,
  });
}

const QUALITY_MESSAGE = "All chapter attempt minimums are met, but recent accuracy in at least one chapter is below the required level. Keep practising; completion timing is not predictable yet.";

test("P05 evaluator, proposal copy and canonical guidance presentation agree in all seven locales", async () => {
  const f = await qualityFixture();
  const facts = completedFacts(f);
  const forecast = calculatePaceForecast({ acceptedPlan: f.plan, c3Result: f.completion.kind, remainingAttemptCount: f.completion.kind === "in_progress" ? f.completion.remainingAttemptCount : 0, today: TODAY, timezone: TIMEZONE, completedFacts: facts });
  const guidance = projectTargetDateGuidance({ currentGoal: f.inputs.goal, acceptedPlan: f.plan, currentVerifiedArtifactSha256: f.profile.artifactSha256, c3Result: f.completion.kind, today: TODAY, completedFacts: facts, paceForecast: forecast });
  assert.equal(guidance.state, "unavailable");
  assert.equal(guidance.reason, "quality_requirement_unmet");
  assert.equal(guidance.tone, "neutral");
  assert.deepEqual(guidance.home.primary, { kind: "continue_plan", destination: "Practice" });
  assert.deepEqual(guidance.facts.forecast, { kind: "unavailable", reason: "quality_requirement_unmet" });
  const proposal = proposalFor(f);
  for (const locale of ["en", "pl", "de", "fr", "es", "it", "et"] as const) {
    const t = (key: string, options?: Record<string, unknown>) => String(i18n.t(key, { ...options, lng: locale, ns: "learningPlan" }));
    const presented = presentTargetDateGuidance(guidance, locale, TIMEZONE);
    assert.equal(presented.message, t(QUALITY_MESSAGE));
    assert.equal(presented.primaryLabel, t("targetDateGuidance.action.workOnResults"));
    assert.equal(presented.facts[2].value, t("targetDateGuidance.fact.unavailable.qualityRequirementUnmet"));
    assert.equal(targetCopy(proposal.targetAssessment, t), presented.message);
    assert.equal(completionCopy(proposal, t), presented.message);
    assert.doesNotMatch(presented.message, /\{\{|targetDateGuidance\./u);
  }
});

test("missing actual rule stays unknown before quality guard even when there are many persisted attempts", async () => {
  const f = await qualityFixture();
  const completion = evaluatePackageCompletion({ ...f.profile, completionRule: undefined }, f.inputs.attempts, f.resolved.track.getQuestion);
  const forecast = calculatePaceForecast({ acceptedPlan: f.plan, c3Result: completion.kind, remainingAttemptCount: 0, today: TODAY, timezone: TIMEZONE, completedFacts: completedFacts(f) });
  assert.deepEqual(forecast, { kind: "unavailable", reason: "unknown_completion_rule" });
  const proposal = proposalFor(f, completion);
  assert.deepEqual(proposal.completionState, { kind: "unknown" });
  assert.deepEqual(proposal.targetAssessment, { kind: "unknown_completion_rule" });
  const t = (key: string) => key;
  assert.equal(completionCopy(proposal, t), "The package does not define a completion rule.");
  assert.notEqual(targetCopy(proposal.targetAssessment, t), QUALITY_MESSAGE);
});

test("minimum exactly met still needs quality, while own pace and shortfall keep their target semantics", async () => {
  const f = await qualityFixture(20);
  assert.deepEqual(proposalFor(f).targetAssessment, { kind: "quality_requirement_unmet" });
  const { targetDate: _target, ...record } = f.inputs.goal!.record;
  const ownPace = proposalFor(f, f.completion, { ...f.inputs.goal!, record: { ...record, goalType: "learn_at_own_pace" } });
  assert.deepEqual(ownPace.targetAssessment, { kind: "open_ended" });
  assert.equal(completionCopy(ownPace, (key) => key), QUALITY_MESSAGE);
  const openPlan = normalizeLearningPlan({ ...f.plan, acceptedTarget: { meaning: "none", targetDate: null } });
  assert.deepEqual(calculatePaceForecast({ acceptedPlan: openPlan, c3Result: f.completion.kind, remainingAttemptCount: f.completion.kind === "in_progress" ? f.completion.remainingAttemptCount : 0, today: TODAY, timezone: TIMEZONE, completedFacts: completedFacts(f) }), { kind: "unavailable", reason: "no_target" });
  const shortfall = proposalFor(f, f.completion, f.inputs.goal!, true);
  assert.deepEqual(shortfall.targetAssessment, { kind: "unavailable_due_to_shortfall" });
  assert.equal(shortfall.slots.length, 0);
});

test("current completed window permits zero-work; later incorrect durable attempts restore the quality limit", async () => {
  const f = await qualityFixture();
  const base = f.inputs.attempts[0]!;
  for (let index = 0; index < 20; index++) {
    const answeredAt = `2026-03-01T12:00:${String(index).padStart(2, "0")}.000Z`;
    await addTrainingAttempt({ ...base, id: `quality-later-${index}`, occurrenceId: `quality-later-occurrence-${index}`, answeredAt, committedAt: answeredAt,
      result: index < 16 ? { kind: "correct", earnedPoints: 1, maxPoints: 1 } : { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } });
    if (index === 19) {
      const inputs = readLearningPlanInputSnapshot(TRACK);
      const completion = evaluatePackageCompletion(f.profile, inputs.attempts, f.resolved.track.getQuestion);
      assert.equal(completion.kind, "completed");
      const proposal = proposalFor(f, completion);
      assert.equal(proposal.targetAssessment.kind, "achievable");
      const forecast = calculatePaceForecast({ acceptedPlan: f.plan, c3Result: completion.kind, remainingAttemptCount: completion.remainingAttemptCount, today: TODAY, timezone: TIMEZONE, completedFacts: completedFacts({ ...f, inputs }) });
      assert.equal(forecast.kind, "available");
      if (forecast.kind === "available") { assert.equal(forecast.projectedCompletionDate, TODAY); assert.equal(forecast.status, "on_track"); }
    }
  }
  for (let index = 0; index < 5; index++) {
    const answeredAt = `2026-03-01T12:01:${String(index).padStart(2, "0")}.000Z`;
    await addTrainingAttempt({ ...base, id: `quality-regression-${index}`, occurrenceId: `quality-regression-occurrence-${index}`, answeredAt, committedAt: answeredAt,
      result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } });
  }
  const inputs = readLearningPlanInputSnapshot(TRACK);
  const completion = evaluatePackageCompletion(f.profile, inputs.attempts, f.resolved.track.getQuestion);
  assert.equal(completion.kind, "in_progress");
  assert.deepEqual(proposalFor(f, completion).targetAssessment, { kind: "quality_requirement_unmet" });
  assert.deepEqual(calculatePaceForecast({ acceptedPlan: f.plan, c3Result: completion.kind, remainingAttemptCount: completion.kind === "in_progress" ? completion.remainingAttemptCount : 0, today: TODAY, timezone: TIMEZONE, completedFacts: completedFacts({ ...f, inputs }) }), { kind: "unavailable", reason: "quality_requirement_unmet" });
});
