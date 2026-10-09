import assert from "node:assert/strict";
import test from "node:test";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { LearningPlanProposalCoordinator } from "./LearningPlanProposalCoordinator";
import { createDefaultGoal, createResolvedContentRef, createTrainingAttempt, createTrainingSession } from "../../domain";
import { installKeyValueStorageForTests, MemoryKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { saveGoalSnapshot } from "../../storage/repositories/goalRepository";
import { addTrainingAttempt } from "../../storage/repositories/trainingAttemptRepository";
import { saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { readLearningPlanInputSnapshot } from "../../storage/repositories/learningPlanInputSnapshot";

const TRACK = "coding-interview-dsa-problem-solving" as const;
const MODE = "coding-interview-guided-practice";

test("proposal projection carries observed method metadata from persisted canonical sessions and attempts", async () => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  await saveGoalSnapshot(createDefaultGoal(TRACK), null);
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(TRACK, "coding_interview");
  const track = resolved.track;
  const mode = track.getMode(MODE);
  const policy = resolved.planningPolicy;
  const planningPolicyIdentity = resolved.planningPolicyIdentity;
  assert.ok(policy);
  assert.ok(planningPolicyIdentity);
  const estimates = policy.workEstimates.filter((estimate) => estimate.modeId === MODE);
  assert.ok(estimates.length > 0);

  let sequence = 0;
  const persistCompleted = async (input: Readonly<{
    modeId: string;
    questions: readonly (typeof track.questions)[number][];
    completedAt: string;
    activeForegroundMs: number;
    sessionId: string;
    answers: number;
  }>) => {
    const itemOrder = input.questions.slice(0, input.answers).map((question, index) => {
      const occurrenceId = `${input.sessionId}:occ:${index}`;
      return Object.freeze({ occurrenceId, item: createResolvedContentRef({
        trackId: TRACK,
        questionId: question.questionId,
        contentVersion: track.contentVersion,
        artifactSha256: track.artifactSha256,
      }) });
    });
    await saveTrainingSession(createTrainingSession({
      id: input.sessionId,
      trackId: TRACK,
      modeId: input.modeId,
      configurationSnapshot: { kind: "practice" },
      requestedLength: input.answers,
      actualLength: input.answers,
      currentItemIndex: input.answers - 1,
      itemOrder,
      optionOrderByOccurrence: {},
      activeForegroundMs: input.activeForegroundMs,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
      status: "completed",
      startedAt: input.completedAt,
      completedAt: input.completedAt,
    }));
    for (let index = 0; index < itemOrder.length; index += 1) {
      const occurrence = itemOrder[index]!;
      const question = input.questions[index]!;
      await addTrainingAttempt(createTrainingAttempt({
        id: `${input.sessionId}:answer:${index}`,
        sessionId: input.sessionId,
        trackId: TRACK,
        modeId: input.modeId,
        occurrenceId: occurrence.occurrenceId,
        item: occurrence.item,
        response: { answer: index },
        result: index === 0 ? { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } : { kind: "correct", earnedPoints: 1, maxPoints: 1 },
        reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [] },
        answeredAt: input.completedAt,
        committedAt: input.completedAt,
      }));
    }
  };

  for (const estimate of estimates) {
    const scopeSet = new Set(estimate.scopeRefs.map((scope) => `${scope.nodeId}\0${scope.mentalUnitId}`));
    const scopedQuestions = track.getPool(MODE).filter((question) => scopeSet.has(`${question.nodeId}\0${question.mentalUnitId}`));
    assert.ok(scopedQuestions.length >= 10, `estimate ${estimate.estimateId} has too few canonical questions`);
    for (let sessionIndex = 0; sessionIndex < 5; sessionIndex += 1) {
      sequence += 1;
      await persistCompleted({
        modeId: MODE,
        questions: scopedQuestions,
        completedAt: `2026-10-0${sessionIndex + 2}T10:00:00.000Z`,
        activeForegroundMs: 10 * 4 * 60_000,
        sessionId: `integration-${sequence}`,
        answers: 10,
      });
    }
  }

  const coordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => "persisted-calibration-integration",
    getTimezone: () => "Europe/Warsaw",
    readInputs: readLearningPlanInputSnapshot,
    peekPackage: () => resolved,
    now: () => "2026-10-09T12:00:00.000Z",
    resolvePackage: async () => resolved,
    resolveTrackFamily: () => "coding_interview",
  });
  const result = await coordinator.create(TRACK, { goal: createDefaultGoal(TRACK), minutesPerStudyDay: 180 });
  assert.equal(result.kind, "ready");
  if (!("proposal" in result)) throw new Error("Expected a ready proposal.");
  assert.equal(result.proposal.outcome.nextSession.modeId, MODE);
  assert.equal(result.proposal.nextSessionCalendar.kind, "available");
  if (result.proposal.nextSessionCalendar.kind === "available") {
    assert.ok(result.proposal.nextSessionCalendar.calendar.availableDays.some((day) => day.selectedSession !== null));
    assert.ok(result.proposal.nextSessionCalendar.calendar.availableDays.every((day) => day.selectedSession === null || mode.requestedLengths.includes(day.selectedSession.sessionLength)));
  }
  assert.equal(result.proposal.fullGoalScopeAvailability.kind, "scope_costs_incomplete");
  assert.ok(result.proposal.fullGoalScopeAvailability.unavailableScopeRefs.length > 0);
  assert.equal(result.proposal.fullGoalWorkload.kind, "incomplete");
  assert.ok((result.proposal.fullGoalWorkload.requiredResponses ?? 0) > 0);
  const completion = result.proposal.outcome.completionState;
  assert.notEqual(completion.kind, "unknown");
  if (completion.kind !== "unknown") assert.equal(result.proposal.fullGoalWorkload.chapters.length, completion.requiredChapterCount);
  assert.ok(result.proposal.fullGoalWorkload.unknownChapterIds.length > 0, "required chapters without a canonical practice mode remain explicit");
  assert.equal(result.proposal.fullGoalWorkload.distribution, "median_scope_typical_with_conservative_extremes");
  assert.equal(result.proposal.nextSessionTimeEstimate.kind, "estimated");
  if (result.proposal.nextSessionTimeEstimate.kind !== "estimated") return;
  const observed = result.proposal.nextSessionTimeEstimate.estimateSources.filter((source) => source.provenance === "observed");
  assert.ok(observed.length > 0);
  assert.ok(observed.every((source) => source.observationCount >= 20 && source.methodVersion === "patternly-time-calibration-median-v1"));

  let horizonProposalId = 0;
  const horizonCoordinator = new LearningPlanProposalCoordinator({
    createProposalId: () => `horizon-${++horizonProposalId}`,
    getTimezone: () => "Europe/Warsaw",
    readInputs: readLearningPlanInputSnapshot,
    peekPackage: () => resolved,
    now: () => "2026-10-09T12:00:00.000Z",
    resolvePackage: async () => resolved,
    resolveTrackFamily: () => "coding_interview",
  });
  const shortHorizon = await horizonCoordinator.create(TRACK, { goal: { ...createDefaultGoal(TRACK), targetDate: "2026-10-16" }, minutesPerStudyDay: 240 });
  const longHorizon = await horizonCoordinator.create(TRACK, { goal: { ...createDefaultGoal(TRACK), targetDate: "2026-12-08" }, minutesPerStudyDay: 240 });
  assert.ok("proposal" in shortHorizon && "proposal" in longHorizon);
  if (!("proposal" in shortHorizon) || !("proposal" in longHorizon)) throw new Error("Expected horizon proposals.");
  assert.equal(shortHorizon.proposal.fullGoalWorkload.requiredResponses, longHorizon.proposal.fullGoalWorkload.requiredResponses);
  assert.equal(shortHorizon.proposal.fullGoalWorkload.knownMinMinutes, longHorizon.proposal.fullGoalWorkload.knownMinMinutes);
  assert.ok((longHorizon.proposal.fullGoalTimeCapacity.availableMinutes ?? 0) > (shortHorizon.proposal.fullGoalTimeCapacity.availableMinutes ?? 0));
});
