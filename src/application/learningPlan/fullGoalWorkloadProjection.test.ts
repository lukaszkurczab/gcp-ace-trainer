import assert from "node:assert/strict";
import test from "node:test";
import type { CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import type { LearningPlanningPolicy } from "../../content/canonical/planningPolicy";
import type { ProductModeConfig } from "../../content/canonical/productModeConfig";
import { createResolvedContentRef, createTrainingAttempt, createTrainingSession, type ReviewQueueEntry, type TrainingAttempt } from "../../domain";
import type { PackageCompletionState } from "../../domain/learning/packageCompletionRule";
import { createPackageCompletionRuleV3, evaluatePackageCompletion } from "../../domain/learning/packageCompletionRule";
import { buildPlanningCalendar } from "../../domain/learning/planningCalendar";
import { projectFullGoalWorkload } from "./fullGoalWorkloadProjection";
import { assessFullGoalTimeCapacity } from "./fullGoalTimeCapacity";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { createCanonicalTrainingFamilyRuntime } from "../canonicalTrainingFamilyComposition";
import { recommendLearningPlanMode } from "./learningPlanModeRecommendation";

const TRACK = "track-a";
const SHA = "a".repeat(64);
const practice = { trackId: TRACK, modeId: "practice-a", selection: { kind: "node", nodeId: "chapter-a" }, requestedLengths: [2], defaultRequestedLength: 2, minimumActualLength: 1, timer: { kind: "elapsed_foreground" } } as unknown as ProductModeConfig;
const review = { trackId: TRACK, modeId: "review-a", selection: { kind: "evidence_conditioned", nodeId: "chapter-a", evidenceSources: ["due_queue"] } } as unknown as ProductModeConfig;
const questions = [question("q1", "chapter-a", "unit-a"), question("q2", "chapter-a", "unit-b"), question("q3", "chapter-premium", "unit-c")];
const track = {
  trackId: TRACK, contentVersion: "v2", artifactSha256: SHA, questions, modes: [practice, review],
  getPool: (modeId: string) => modeId === "practice-a" || modeId === "review-a" ? questions.filter((entry) => entry.nodeId === "chapter-a") : [],
  getMode: (modeId: string) => modeId === "practice-a" ? practice : review,
  getQuestion: (id: string) => questions.find((entry) => entry.questionId === id),
} as unknown as CanonicalTrackRuntime;
const policy: LearningPlanningPolicy = {
  schemaVersion: "patternly-learning-planning-policy-v1", policyVersion: "policy-v3", unavailableScopes: [],
  workEstimates: [
    estimate("practice-a-unit-a", "practice-a", "chapter-a", "unit-a", 1, 2, 3, 0.5, 1, 2),
    estimate("practice-a-unit-b", "practice-a", "chapter-a", "unit-b", 3, 4, 6, 0, 0, 0),
    estimate("review-a-unit-a", "review-a", "chapter-a", "unit-a", 2, 4, 7, 0, 0, 0),
    estimate("review-a-unit-b", "review-a", "chapter-a", "unit-b", 4, 6, 9, 0, 0, 0),
  ],
};
const planningPolicyIdentity = { contentVersion: "v2", artifactSha256: SHA, policyVersion: "policy-v3" } as const;

test("per-chapter workload credits eligible due responses once and keeps due/new costs distinct", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([
    chapter("chapter-a", 100, 80, "minimum_attempts_unmet"), chapter("chapter-premium", 80, 0, "minimum_attempts_unmet"),
  ]), sessions: [], attempts: [], reviews: [reviewEntry("due-1", "q1"), reviewEntry("due-2", "q2")], practiceMode: practice, reviewMode: review });
  const free = result.chapters.find((entry) => entry.nodeId === "chapter-a")!;
  const premium = result.chapters.find((entry) => entry.nodeId === "chapter-premium")!;
  assert.equal(free.requiredResponses, 20);
  assert.equal(free.dueReviewResponses, 2);
  assert.equal(free.newResponses, 18);
  assert.equal(free.unavailableReason, null);
  assert.ok(free.minMinutes !== null && free.maxMinutes !== null && free.minMinutes < free.typicalMinutes! && free.typicalMinutes! < free.maxMinutes);
  assert.deepEqual(result.dueReviews.map(({ id, creditsTowardMinimum }) => [id, creditsTowardMinimum]), [["due-1", true], ["due-2", true]]);
  assert.equal(premium.newResponses, 80);
  assert.equal(premium.unavailableReason, "no_canonical_request");
  assert.deepEqual(result.unknownChapterIds, ["chapter-premium"]);
  assert.equal(result.kind, "incomplete");
  assert.equal(result.dueReviewResponses, 2);
});

test("due review outside the existing review profile does not earn C3 credit or a fabricated cost", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([chapter("chapter-a", 20, 10, "minimum_attempts_unmet")]), sessions: [], attempts: [], reviews: [reviewEntry("wrong-chapter", "q3")], practiceMode: practice, reviewMode: review });
  const row = result.chapters[0]!;
  assert.equal(row.dueReviewResponses, 0);
  assert.equal(row.newResponses, 10);
  assert.equal(row.unavailableReason, null);
  assert.equal(result.dueReviews[0]?.minMinutes, null);
  assert.deepEqual(result.uncostedDueReviewIds, ["wrong-chapter"]);
  assert.equal(result.kind, "incomplete");
});

test("quality-unmet chapter estimates one real legal practice block and leaves future repair unbounded", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([{
    ...chapter("chapter-a", 20, 24, "quality_unmet"), quality: 0.75,
  }]), sessions: [], attempts: [], reviews: [], practiceMode: practice, reviewMode: review });
  const row = result.chapters[0]!;
  assert.equal(row.requiredResponses, 0);
  assert.deepEqual(row.qualityRepair, { nextLegalBlockResponses: 2, minMinutes: 4, typicalMinutes: 6, maxMinutes: 9, futureResponses: null, futureMaxMinutes: null });
  assert.equal(row.maxMinutes, null);
  assert.equal(row.unavailableReason, "quality_outcome_unbounded");
  assert.deepEqual(result.qualityUncertainChapterIds, ["chapter-a"]);
  assert.equal(result.knownMaxMinutes, null);
  assert.equal(result.kind, "incomplete");
});

test("V3 quality-only repair uses a required unit scope and preserves unbounded future outcomes", () => {
  const focus = { ...practice, modeId: "certification-focus-practice", requestedLengths: [10, 20, 40], defaultRequestedLength: 10,
    minimumActualLength: 10, selection: { kind: "node", nodeId: "chapter-a" } } as unknown as ProductModeConfig;
  const targetQuestions = ["q1", "q2", "q3", "q4"].map((id) => question(id, "chapter-a", "required-unit"));
  const completionRule = { ruleVersion: 3 as const, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 1, minimumAttemptCount: 20,
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, units: [{ mentalUnitId: "required-unit", requiredCorrectQuestionCount: 4 as const }] }] };
  const v3Track = { ...track, completionRule, questions: targetQuestions, modes: [focus, review],
    getPool: (modeId: string) => modeId === focus.modeId ? targetQuestions : [], getMode: (modeId: string) => modeId === focus.modeId ? focus : review } as unknown as CanonicalTrackRuntime;
  const focusPolicy = { ...policy, workEstimates: [...policy.workEstimates, estimate("focus-required-unit", focus.modeId, "chapter-a", "required-unit", 2, 3, 5, 0, 0, 0)] };
  const state = { kind: "in_progress" as const, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 1, qualifyingAttemptCount: 20,
    requiredAttemptCount: 20, remainingAttemptCount: 0, coverageDeficit: 0, minimumAdditionalAttemptCount: 0,
    coverage: [{ mentalUnitId: "required-unit", requiredCorrectQuestionCount: 4, latestCorrectQuestionCount: 4, deficit: 0 }],
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, quality: 0.75, qualityRequirementUnmet: true,
    status: "in_progress" as const, reason: "quality_unmet" as const }], completedChapterCount: 0, requiredChapterCount: 1,
    qualifyingAttemptCount: 20, requiredAttemptCount: 20, coverageDeficit: 0, minimumAdditionalAttemptCount: 0, remainingAttemptCount: 0 } as PackageCompletionState;
  const result = projectFullGoalWorkload({ track: v3Track, policy: focusPolicy, planningPolicyIdentity, completion: state,
    sessions: [], attempts: [], reviews: [], practiceMode: focus, reviewMode: review });
  assert.equal(result.chapters[0]?.requiredResponses, 0);
  assert.deepEqual(result.sessionDemands.map(({ id, responseCount, scopeRefs }) => [id, responseCount, scopeRefs]), [
    ["quality-repair:chapter-a", 4, [{ nodeId: "chapter-a", mentalUnitId: "required-unit" }]],
  ]);
  assert.equal(result.chapters[0]?.qualityRepair?.futureResponses, null);
  assert.equal(result.chapters[0]?.unavailableReason, "quality_outcome_unbounded");
});

test("a legal due-pool response is costed even when it cannot credit a minimum that is already met", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([{
    ...chapter("chapter-a", 20, 20, "quality_unmet"), quality: 0.75,
  }]), sessions: [], attempts: [], reviews: [reviewEntry("due-no-credit", "q1")], practiceMode: practice, reviewMode: review });
  assert.equal(result.dueReviewResponses, 0);
  assert.equal(result.dueReviews[0]?.creditsTowardMinimum, false);
  assert.equal(result.dueReviews[0]?.minMinutes, 2);
  assert.equal(result.uncostedDueReviewIds.length, 0);
});

test("exact duplicate review records are counted once and conflicting ids fail closed", () => {
  const reviewRecord = reviewEntry("same-review", "q1");
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([chapter("chapter-a", 20, 10, "minimum_attempts_unmet")]),
    sessions: [], attempts: [], reviews: [reviewRecord, reviewRecord], practiceMode: practice, reviewMode: review });
  assert.equal(result.dueReviews.length, 1);
  assert.throws(() => projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([chapter("chapter-a", 20, 10, "minimum_attempts_unmet")]),
    sessions: [], attempts: [], reviews: [reviewRecord, { ...reviewRecord, dueAt: "2026-10-06T00:00:00.000Z" }], practiceMode: practice, reviewMode: review }));
});

test("completed chapters add no new work or quality repair", () => {
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity, completion: completion([chapter("chapter-a", 20, 20, null, "completed")]), sessions: [], attempts: [], reviews: [], practiceMode: practice, reviewMode: review });
  assert.equal(result.kind, "complete");
  assert.equal(result.requiredResponses, 0);
  assert.equal(result.newResponses, 0);
  assert.equal(result.chapters[0]?.minMinutes, 0);
  assert.equal(result.chapters[0]?.qualityRepair, null);
});

test("V3 coverage-only work costs the required scope and respects four-question scoped capacity", () => {
  const focus = { ...practice, modeId: "certification-focus-practice", requestedLengths: [10, 20, 40], defaultRequestedLength: 10,
    minimumActualLength: 10, selection: { kind: "node", nodeId: "chapter-a" } } as unknown as ProductModeConfig;
  const targetQuestions = ["q1", "q2", "q3", "q4"].map((id) => question(id, "chapter-a", "unit-a"));
  const completionRule = { ruleVersion: 3 as const, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 1, minimumAttemptCount: 20,
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, units: [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4 as const }] }] };
  const v3Track = { ...track, completionRule, questions: targetQuestions, modes: [focus, review],
    getPool: (modeId: string) => modeId === focus.modeId ? targetQuestions : [] } as unknown as CanonicalTrackRuntime;
  const focusPolicy = { ...policy, workEstimates: [...policy.workEstimates, estimate("focus-unit-a", focus.modeId, "chapter-a", "unit-a", 2, 3, 5, 0, 0, 0)] };
  const requiredChapter = { nodeId: "chapter-a", mentalUnitCount: 1, qualifyingAttemptCount: 20, requiredAttemptCount: 20, remainingAttemptCount: 0,
    coverageDeficit: 1, minimumAdditionalAttemptCount: 1, coverage: [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4, latestCorrectQuestionCount: 3, deficit: 1 }],
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, quality: null, qualityRequirementUnmet: null, status: "in_progress" as const, reason: "coverage_unmet" as const };
  const v3Completion = { kind: "in_progress" as const, chapters: [requiredChapter], completedChapterCount: 0, requiredChapterCount: 1,
    qualifyingAttemptCount: 20, requiredAttemptCount: 20, coverageDeficit: 1, minimumAdditionalAttemptCount: 1, remainingAttemptCount: 0 } as PackageCompletionState;
  const result = projectFullGoalWorkload({ track: v3Track, policy: focusPolicy, planningPolicyIdentity, completion: v3Completion,
    sessions: [], attempts: [], reviews: [], practiceMode: focus, reviewMode: review });
  assert.equal(result.requiredResponses, 1);
  assert.equal(result.newResponses, 4, "the lower-bound deficit is one, but the only legal session has four questions");
  assert.equal(result.chapters[0]?.completion, "coverage_incomplete");
  assert.deepEqual(result.chapters[0]?.scopeRefs, [{ nodeId: "chapter-a", mentalUnitId: "unit-a" }]);
  assert.ok(result.chapters[0]?.minMinutes !== null);
  assert.equal(result.sessionDemands[0]?.responseCount, 4);
  assert.deepEqual(result.sessionDemands[0]?.legalOptions.map((option) => option.sessionLength), [4], "requested 10 is truthfully shortened to this unit's four-question source pool");
  const demand = result.sessionDemands[0]!;
  const calendar = buildPlanningCalendar({ localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu"], weeklySessionTarget: 1,
    dueObligations: [], sessionDemands: [demand], targetDate: "2026-10-08", targetMeaning: "deadline", availableMinutesPerStudyDay: 60,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00",
    legalSessions: demand.legalOptions });
  assert.equal(calendar.kind, "scheduled");
  assert.equal(calendar.availableDays[0]?.selectedWork?.responsesRemaining, 4);
  assert.equal(calendar.availableDays[0]?.selectedSession?.sessionLength, 4);
  assert.deepEqual(calendar.availableDays[0]?.selectedWork?.scopeRefs, [{ nodeId: "chapter-a", mentalUnitId: "unit-a" }]);
});

test("V3 volume-only estimate includes scoped session padding in its chapter and aggregate work", () => {
  const focus = { ...practice, modeId: "certification-focus-practice", requestedLengths: [10, 20, 40], defaultRequestedLength: 10,
    minimumActualLength: 10, selection: { kind: "node", nodeId: "chapter-a" } } as unknown as ProductModeConfig;
  const targetQuestions = ["q1", "q2", "q3", "q4"].map((id) => question(id, "chapter-a", "unit-a"));
  const completionRule = { ruleVersion: 3 as const, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 1, minimumAttemptCount: 20,
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, units: [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4 as const }] }] };
  const v3Track = { ...track, completionRule, questions: targetQuestions, modes: [focus, review],
    getPool: (modeId: string) => modeId === focus.modeId ? targetQuestions : [] } as unknown as CanonicalTrackRuntime;
  const focusPolicy = { ...policy, workEstimates: [estimate("focus-unit-a-cheap", focus.modeId, "chapter-a", "unit-a", 2, 3, 5, 0, 0, 0)] };
  const coverage = [{ mentalUnitId: "unit-a", requiredCorrectQuestionCount: 4, latestCorrectQuestionCount: 4, deficit: 0 }];
  const state = { kind: "in_progress" as const, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 1, qualifyingAttemptCount: 19,
    requiredAttemptCount: 20, remainingAttemptCount: 1, coverageDeficit: 0, minimumAdditionalAttemptCount: 1, coverage,
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, quality: 0.9, qualityRequirementUnmet: false,
    status: "in_progress" as const, reason: "minimum_attempts_unmet" as const }], completedChapterCount: 0, requiredChapterCount: 1,
    qualifyingAttemptCount: 19, requiredAttemptCount: 20, coverageDeficit: 0, minimumAdditionalAttemptCount: 1, remainingAttemptCount: 1 } as PackageCompletionState;
  const result = projectFullGoalWorkload({ track: v3Track, policy: focusPolicy, planningPolicyIdentity, completion: state,
    sessions: [], attempts: [], reviews: [], practiceMode: focus, reviewMode: review });
  assert.equal(result.requiredResponses, 1);
  assert.equal(result.newResponses, 4);
  assert.equal(result.chapters[0]?.newResponses, 4, "the visible chapter row reports the actual padded session length");
  assert.equal(result.sessionDemands.find((demand) => demand.id === "practice:chapter-a")?.responseCount, 4);
  assert.equal(result.chapters[0]?.minMinutes, 8);
  assert.equal(result.knownMinMinutes, 8, "padding cost is charged once and uses this unit's rate");
});

test("V3 coverage in two units creates two separately scoped legal sessions", () => {
  const focus = { ...practice, modeId: "certification-focus-practice", requestedLengths: [10, 20, 40], defaultRequestedLength: 10,
    minimumActualLength: 10, selection: { kind: "node", nodeId: "chapter-a" } } as unknown as ProductModeConfig;
  const unitIds = ["unit-a", "unit-b"];
  const targetQuestions = unitIds.flatMap((unitId, unitIndex) => Array.from({ length: 4 }, (_, index) => question(`multi-${unitIndex + 1}-${index + 1}`, "chapter-a", unitId)));
  const completionRule = { ruleVersion: 3 as const, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 2, minimumAttemptCount: 20,
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, units: unitIds.map((mentalUnitId) => ({ mentalUnitId, requiredCorrectQuestionCount: 4 as const })) }] };
  const v3Track = { ...track, completionRule, questions: targetQuestions, modes: [focus, review],
    getPool: (modeId: string) => modeId === focus.modeId ? targetQuestions : [] } as unknown as CanonicalTrackRuntime;
  const focusPolicy = { ...policy, workEstimates: [...policy.workEstimates, ...unitIds.map((unitId) => estimate(`multi-focus-${unitId}`, focus.modeId, "chapter-a", unitId, 2, 3, 5, 0, 0, 0))] };
  const coverage = unitIds.map((mentalUnitId) => ({ mentalUnitId, requiredCorrectQuestionCount: 4, latestCorrectQuestionCount: 3, deficit: 1 }));
  const state = { kind: "in_progress" as const, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 2, qualifyingAttemptCount: 20,
    requiredAttemptCount: 20, remainingAttemptCount: 0, coverageDeficit: 2, minimumAdditionalAttemptCount: 2, coverage,
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, quality: null, qualityRequirementUnmet: null, status: "in_progress" as const, reason: "coverage_unmet" as const }],
    completedChapterCount: 0, requiredChapterCount: 1, qualifyingAttemptCount: 20, requiredAttemptCount: 20, coverageDeficit: 2,
    minimumAdditionalAttemptCount: 2, remainingAttemptCount: 0 } as PackageCompletionState;
  const result = projectFullGoalWorkload({ track: v3Track, policy: focusPolicy, planningPolicyIdentity, completion: state,
    sessions: [], attempts: [], reviews: [], practiceMode: focus, reviewMode: review });
  assert.equal(result.requiredResponses, 2);
  assert.equal(result.newResponses, 8, "each one-answer deficit needs its own truthful four-question scoped session");
  assert.deepEqual(result.sessionDemands.map(({ id, responseCount, scopeRefs }) => [id, responseCount, scopeRefs]), [
    ["coverage:chapter-a:unit-a", 4, [{ nodeId: "chapter-a", mentalUnitId: "unit-a" }]],
    ["coverage:chapter-a:unit-b", 4, [{ nodeId: "chapter-a", mentalUnitId: "unit-b" }]],
  ]);
});

test("active Premium V3 unit continuation is validated and costed in its exact source scope", () => {
  const focus = { ...practice, modeId: "certification-focus-practice", requestedLengths: [10, 20, 40], defaultRequestedLength: 10,
    minimumActualLength: 10, selection: { kind: "node", nodeId: "chapter-a" } } as unknown as ProductModeConfig;
  const targetQuestions = ["q1", "q2", "q3", "q4"].map((id) => question(id, "chapter-premium", "premium-unit"));
  const completionRule = { ruleVersion: 3 as const, chapters: [{ nodeId: "chapter-premium", mentalUnitCount: 1, minimumAttemptCount: 20,
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, units: [{ mentalUnitId: "premium-unit", requiredCorrectQuestionCount: 4 as const }] }] };
  const v3Track = { ...track, completionRule, questions: targetQuestions, modes: [focus, review],
    getPool: (modeId: string) => modeId === focus.modeId ? [] : [], getQuestion: (id: string) => targetQuestions.find((entry) => entry.questionId === id),
    getMode: (modeId: string) => modeId === focus.modeId ? focus : review } as unknown as CanonicalTrackRuntime;
  const focusPolicy = { ...policy, workEstimates: [...policy.workEstimates, estimate("focus-premium-unit", focus.modeId, "chapter-premium", "premium-unit", 2, 3, 5, 0, 0, 0)] };
  const state = { kind: "in_progress" as const, chapters: [{ nodeId: "chapter-premium", mentalUnitCount: 1, qualifyingAttemptCount: 20,
    requiredAttemptCount: 20, remainingAttemptCount: 0, coverageDeficit: 1, minimumAdditionalAttemptCount: 1,
    coverage: [{ mentalUnitId: "premium-unit", requiredCorrectQuestionCount: 4, latestCorrectQuestionCount: 3, deficit: 1 }],
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, quality: null, qualityRequirementUnmet: null,
    status: "in_progress" as const, reason: "coverage_unmet" as const }], completedChapterCount: 0, requiredChapterCount: 1,
    qualifyingAttemptCount: 20, requiredAttemptCount: 20, coverageDeficit: 1, minimumAdditionalAttemptCount: 1, remainingAttemptCount: 0 } as PackageCompletionState;
  const activeSession = createTrainingSession({ id: "premium-unit-resume", trackId: TRACK, modeId: focus.modeId,
    configurationSnapshot: { kind: "practice", mentalUnitId: "premium-unit" }, requestedLength: 10, actualLength: 4, currentItemIndex: 0,
    itemOrder: targetQuestions.map((item, index) => ({ occurrenceId: `premium-occ-${index}`, item: createResolvedContentRef({ trackId: TRACK, questionId: item.questionId, contentVersion: "v2", artifactSha256: SHA }) })),
    optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "v2", artifactSha256: SHA, status: "active", startedAt: "2026-10-01T00:00:00.000Z" });
  const result = projectFullGoalWorkload({ track: v3Track, policy: focusPolicy, planningPolicyIdentity, completion: state,
    sessions: [activeSession], activeSession, attempts: [], reviews: [], practiceMode: focus, reviewMode: review });
  assert.deepEqual(result.activeContinuation && result.activeContinuation.kind === "continue_existing" ? result.activeContinuation : null,
    { kind: "continue_existing", sessionId: "premium-unit-resume", modeId: focus.modeId, requestedLength: 10, responseCount: 4, phase: "practice", reviewEntryIds: [] });
  assert.deepEqual(result.sessionDemands[0]?.scopeRefs, [{ nodeId: "chapter-premium", mentalUnitId: "premium-unit" }]);
  assert.equal(result.sessionDemands[0]?.responseCount, 4);
  assert.equal(result.sessionDemands.some((demand) => demand.id.startsWith("coverage:")), false, "the exact current session already targets the missing unit question pool");
});

test("a committed wrong answer is not treated as an active coverage target or completion credit", () => {
  for (const fromHistory of [false, true]) {
  const focus = { ...practice, modeId: "certification-focus-practice", requestedLengths: [10, 20, 40], defaultRequestedLength: 10,
    minimumActualLength: 10, selection: { kind: "node", nodeId: "chapter-a" } } as unknown as ProductModeConfig;
  const targetQuestions = ["q1", "q2", "q3", "q4"].map((id) => question(id, "chapter-premium", "premium-unit"));
  const completionRule = createPackageCompletionRuleV3({ ruleVersion: 3, chapters: [{ nodeId: "chapter-premium", mentalUnitCount: 1, minimumAttemptCount: 20,
    rollingWindowSize: 20, qualityThreshold: 0.8, units: [{ mentalUnitId: "premium-unit", requiredCorrectQuestionCount: 4 }] }] });
  const v3Track = { ...track, completionRule, questions: targetQuestions, modes: [focus, review],
    getPool: (modeId: string) => modeId === focus.modeId ? [] : [], getQuestion: (id: string) => targetQuestions.find((entry) => entry.questionId === id),
    getMode: (modeId: string) => modeId === focus.modeId ? focus : review } as unknown as CanonicalTrackRuntime;
  const focusPolicy = { ...policy, workEstimates: [...policy.workEstimates, estimate("focus-premium-unit", focus.modeId, "chapter-premium", "premium-unit", 2, 3, 5, 0, 0, 0)] };
  const sessionId = "premium-wrong-answer-session";
  const questionOrder = [targetQuestions[3]!, targetQuestions[0]!, targetQuestions[1]!, targetQuestions[2]!];
  const activeSession = createTrainingSession({ id: sessionId, trackId: TRACK, modeId: focus.modeId,
    configurationSnapshot: { kind: "practice", mentalUnitId: "premium-unit" }, requestedLength: 10, actualLength: 4, currentItemIndex: 0,
    itemOrder: questionOrder.map((item, index) => ({ occurrenceId: `wrong-occ-${index}`, item: createResolvedContentRef({ trackId: TRACK, questionId: item.questionId, contentVersion: "v2", artifactSha256: SHA }) })),
    optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "v2", artifactSha256: SHA, status: "active", startedAt: "2026-10-01T00:00:00.000Z" });
  const attempts = [
    qualifiedAttempt("q1-before", "q1", "premium-unit", 0),
    qualifiedAttempt("q2-before", "q2", "premium-unit", 1),
    qualifiedAttempt("q3-before", "q3", "premium-unit", 2),
    wrongQualifiedAttempt("q4-latest-wrong", "q4", "premium-unit", 3, sessionId, "wrong-occ-0"),
    ...Array.from({ length: 16 }, (_, index) => qualifiedAttempt(`volume-${index}`, "q1", "premium-unit", index + 4)),
  ].map(attempt => {
    if (!fromHistory || attempt.sessionId === sessionId) return attempt;
    const item = { ...attempt.item, contentVersion: "retained", artifactSha256: "b".repeat(64) };
    return { ...attempt, item, reviewEvidence: { ...attempt.reviewEvidence, sourceItem: item } };
  });
  const completion = evaluatePackageCompletion({ trackId: TRACK, contentVersion: "v2", artifactSha256: SHA, completionRule }, attempts,
    (questionId) => targetQuestions.find((item) => item.questionId === questionId));
  assert.equal(completion.kind, "in_progress");
  if (completion.kind !== "in_progress") return;
  assert.equal(completion.chapters[0]?.coverageDeficit, 1, "the committed wrong result remains the latest answer and receives no coverage credit");
  const result = projectFullGoalWorkload({ track: v3Track, policy: focusPolicy, planningPolicyIdentity, completion,
    sessions: [activeSession], activeSession, attempts, reviews: [], practiceMode: focus, reviewMode: review });
  assert.equal(result.activeContinuation?.kind, "continue_existing");
  assert.equal(result.activeContinuation?.kind === "continue_existing" ? result.activeContinuation.responseCount : null, 3);
  assert.deepEqual(result.sessionDemands.filter((demand) => demand.id.startsWith("coverage:")).map((demand) => [demand.id, demand.responseCount]), [
    ["coverage:chapter-premium:premium-unit", 4],
  ], "the committed wrong question is not counted among remaining active questions; a scoped replacement block remains forecast");
  }
});

test("unrelated due and active work cannot reduce V3 coverage lower bound", () => {
  const focus = { ...practice, modeId: "certification-focus-practice", requestedLengths: [10, 20, 40], defaultRequestedLength: 10,
    minimumActualLength: 10, selection: { kind: "node", nodeId: "chapter-a" } } as unknown as ProductModeConfig;
  const unitIds = ["unit-1", "unit-2", "unit-3", "unit-4", "unit-5", "unit-6", "unit-7"];
  const allQuestions = unitIds.flatMap((unitId, unitIndex) => Array.from({ length: 4 }, (_, index) => question(`q${unitIndex + 1}-${index + 1}`, "chapter-a", unitId)));
  const completionRule = createPackageCompletionRuleV3({ ruleVersion: 3, chapters: [{ nodeId: "chapter-a", mentalUnitCount: 7, minimumAttemptCount: 40,
    rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, units: unitIds.map((mentalUnitId) => ({ mentalUnitId, requiredCorrectQuestionCount: 4 })) }] });
  const v3Track = { ...track, completionRule, questions: allQuestions, modes: [focus, review],
    getPool: (modeId: string) => modeId === focus.modeId || modeId === review.modeId ? allQuestions : [],
    getQuestion: (id: string) => allQuestions.find((entry) => entry.questionId === id),
    getMode: (modeId: string) => modeId === focus.modeId ? focus : review } as unknown as CanonicalTrackRuntime;
  const estimates = unitIds.flatMap((unitId, index) => [
    estimate(`focus-${unitId}`, focus.modeId, "chapter-a", unitId, 2, 3, 5, 0, 0, 0),
    estimate(`review-${unitId}`, review.modeId, "chapter-a", unitId, 2, 4, 7, 0, 0, 0),
  ]);
  const focusPolicy = { ...policy, workEstimates: [...policy.workEstimates, ...estimates] };
  const attempts = [
    ...unitIds.slice(0, 2).flatMap((unitId, unitIndex) => Array.from({ length: 4 }, (_, index) =>
      qualifiedAttempt(`covered-${unitIndex}-${index}`, `q${unitIndex + 1}-${index + 1}`, unitId, index))),
    ...Array.from({ length: 12 }, (_, index) => qualifiedAttempt(`repeat-${index}`, "q1-1", "unit-1", index + 8)),
  ];
  const completionState = evaluatePackageCompletion(v3Track, attempts, v3Track.getQuestion);
  assert.equal(completionState.kind, "in_progress");
  if (completionState.kind !== "in_progress") throw new Error("Expected the canonical V3 deficit.");
  assert.equal(completionState.requiredAttemptCount, 40);
  assert.equal(completionState.qualifyingAttemptCount, 20);
  assert.equal(completionState.coverageDeficit, 20);
  assert.equal(completionState.minimumAdditionalAttemptCount, 20);
  const activeSession = createTrainingSession({ id: "session:covered-unit", trackId: TRACK, modeId: focus.modeId,
    configurationSnapshot: { kind: "practice" }, requestedLength: 10, actualLength: 4, currentItemIndex: 0,
    itemOrder: allQuestions.slice(0, 4).map((item, index) => ({ occurrenceId: `occurrence:${index}`, item: createResolvedContentRef({ trackId: TRACK, questionId: item.questionId, contentVersion: "v2", artifactSha256: SHA }) })),
    optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "v2", artifactSha256: SHA, status: "active", startedAt: "2026-10-01T00:00:00.000Z" });
  const due = allQuestions.slice(0, 5).map((item, index) => reviewEntry(`due-${index}`, item.questionId));
  const result = projectFullGoalWorkload({ track: v3Track, policy: focusPolicy, planningPolicyIdentity, completion: completionState,
    sessions: [activeSession], activeSession, attempts, reviews: due, practiceMode: focus, reviewMode: review });
  assert.equal(result.requiredResponses, 20, "M remains max(V,C), never V+C");
  assert.equal(result.dueReviewResponses, 5, "due items reduce only the volume projection");
  assert.equal(result.chapters[0]?.requiredResponses, 20);
  assert.equal(result.chapters[0]?.newResponses, 20, "due and active covered-unit work reduce volume only; five exact deficient-unit sessions preserve C");
  assert.deepEqual(result.sessionDemands.filter((entry) => entry.id.startsWith("coverage:")).map((entry) => [entry.id, entry.responseCount]), [
    ["coverage:chapter-a:unit-3", 4], ["coverage:chapter-a:unit-4", 4], ["coverage:chapter-a:unit-5", 4],
    ["coverage:chapter-a:unit-6", 4], ["coverage:chapter-a:unit-7", 4],
  ]);
  assert.equal(result.sessionDemands.some((entry) => entry.id === "practice:chapter-a"), false, "scoped coverage sessions already satisfy the V lower bound without assuming correctness");
  // Five coverage blocks:40/60/100; active four:8/12/20; five due:10/20/35.
  const row = result.chapters[0]!;
  assert.deepEqual([row.minMinutes, row.typicalMinutes, row.maxMinutes], [48, 72, 120]);
  assert.deepEqual([result.knownMinMinutes, result.knownTypicalMinutes, result.knownMaxMinutes], [58, 92, 155]);
  assert.ok(row.minMinutes! <= row.typicalMinutes! && row.typicalMinutes! <= row.maxMinutes!);
  assert.ok(result.knownMinMinutes <= result.knownTypicalMinutes && result.knownTypicalMinutes <= result.knownMaxMinutes!);
  const calendar = buildPlanningCalendar({ localToday: "2026-10-08", timezone: "Europe/Warsaw", preferredDays: ["thu"], weeklySessionTarget: 1,
    dueObligations: result.dueReviews.map(review => ({ id: review.id, dueAt: review.dueAt, minMinutes: review.minMinutes!, typicalMinutes: review.typicalMinutes!, maxMinutes: review.maxMinutes! })),
    targetDate: "2026-10-08", targetMeaning: "deadline", availableMinutesPerStudyDay: 100,
    todayActiveTime: { kind: "known", minutes: 0 }, sessionLocalTime: "18:00", currentLocalTime: "12:00", legalSessions: [{ sessionLength: 4, minMinutes: 8, typicalMinutes: 12, maxMinutes: 20 }], requiredSessionCount: 0 });
  const capacity = assessFullGoalTimeCapacity({ workload: result, calendar });
  assert.equal(capacity.availableMinutes, 100);
  assert.equal(capacity.kind, "range_crosses_available_time", "the full range cannot fit using an overwritten55-minute maximum");

});

function question(questionId: string, nodeId: string, mentalUnitId: string) { return { questionId, nodeId, mentalUnitId, trackId: TRACK, contentVersion: "v2", artifactSha256: SHA } as const; }
function qualifiedAttempt(id: string, questionId: string, mentalUnitId: string, index: number): TrainingAttempt<unknown> {
  const item = createResolvedContentRef({ trackId: TRACK, questionId, contentVersion: "v2", artifactSha256: SHA });
  const answeredAt = new Date(Date.UTC(2026, 9, 1, 0, 0, index)).toISOString();
  return createTrainingAttempt({ id, sessionId: `session-${id}`, trackId: TRACK, modeId: "certification-focus-practice", occurrenceId: `occ-${id}`, item,
    response: {}, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [{axisId:"node",nodeId:mentalUnitId === "premium-unit" ? "chapter-premium" : "chapter-a"},{axisId:"mental_unit",nodeId:mentalUnitId}] }, answeredAt, committedAt: answeredAt });
}
function wrongQualifiedAttempt(id: string, questionId: string, mentalUnitId: string, index: number, sessionId: string, occurrenceId: string): TrainingAttempt<unknown> {
  const item = createResolvedContentRef({ trackId: TRACK, questionId, contentVersion: "v2", artifactSha256: SHA });
  const answeredAt = new Date(Date.UTC(2026, 9, 1, 0, 0, index)).toISOString();
  return createTrainingAttempt({ id, sessionId, trackId: TRACK, modeId: "certification-focus-practice", occurrenceId, item,
    response: {}, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [{axisId:"node",nodeId:mentalUnitId === "premium-unit" ? "chapter-premium" : "chapter-a"},{axisId:"mental_unit",nodeId:mentalUnitId}] }, answeredAt, committedAt: answeredAt });
}
function estimate(estimateId: string, modeId: string, nodeId: string, mentalUnitId: string, min: number, typical: number, max: number, reserveMin: number, reserveTypical: number, reserveMax: number): LearningPlanningPolicy["workEstimates"][number] {
  return { estimateId, modeId, scopeRefs: [{ nodeId, mentalUnitId }], minMinutesPerResponse: min, typicalMinutesPerResponse: typical, maxMinutesPerResponse: max, provenance: "authored", observationCount: 0,
    rationale: "Authored planning hypothesis", reviewReserve: { kind: "authored_estimate", minAdditionalResponsesPerNewResponse: reserveMin, typicalAdditionalResponsesPerNewResponse: reserveTypical, maxAdditionalResponsesPerNewResponse: reserveMax, provenance: "authored", observationCount: 0, rationale: "Scoped forecast reserve" } };
}
function chapter(nodeId: string, requiredAttemptCount: number, qualifyingAttemptCount: number, reason: "minimum_attempts_unmet" | "quality_unmet" | null, status: "in_progress" | "completed" = "in_progress") {
  const quality = reason === "quality_unmet" ? 0.75 : status === "completed" ? 1 : null;
  const remainingAttemptCount = Math.max(0, requiredAttemptCount - qualifyingAttemptCount);
  return { nodeId, mentalUnitCount: 1, qualifyingAttemptCount, requiredAttemptCount, remainingAttemptCount, coverageDeficit: 0, minimumAdditionalAttemptCount: remainingAttemptCount, coverage: [],
    qualityRequirementUnmet: quality === null ? null : quality < 0.8, rollingWindowSize: 20 as const, qualityThreshold: 0.8 as const, quality, status, reason };
}
function completion(chapters: ReturnType<typeof chapter>[]): PackageCompletionState {
  const completedChapterCount = chapters.filter((entry) => entry.status === "completed").length;
  const requiredAttemptCount = chapters.reduce((sum, entry) => sum + entry.requiredAttemptCount, 0);
  const qualifyingAttemptCount = chapters.reduce((sum, entry) => sum + entry.qualifyingAttemptCount, 0);
  const remainingAttemptCount = chapters.reduce((sum, entry) => sum + Math.max(0, entry.requiredAttemptCount - entry.qualifyingAttemptCount), 0);
  return { kind: completedChapterCount === chapters.length ? "completed" : "in_progress", chapters, completedChapterCount, requiredChapterCount: chapters.length, requiredAttemptCount, qualifyingAttemptCount,
    coverageDeficit: 0, minimumAdditionalAttemptCount: remainingAttemptCount, remainingAttemptCount } as PackageCompletionState;
}
function reviewEntry(id: string, questionId: string): ReviewQueueEntry {
  const sourceItem = createResolvedContentRef({ trackId: TRACK, questionId, contentVersion: "v2", artifactSha256: SHA });
  return { id, trackId: TRACK as never, sourceAttemptId: `attempt-${id}`, sourceSessionId: `session-${id}`, sourceItem, taxonomyOrSkillRefs: [], reasons: ["incorrect"], createdAt: "2026-10-01T00:00:00.000Z", dueAt: "2026-10-05T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true, status: "active", policyVersion: "bizq04-v1", stage: "retention7" };
}


test("actual GCP active practice and scheduled diagnosis both retain their maximum costs", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("google-cloud-associate-cloud-engineer");
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const practice = track.getMode("certification-focus-practice");
  const diagnostic = track.getMode("certification-diagnostic-baseline");
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: practice.modeId,
    request: { sessionId: "gcp-active-before-diagnosis", requestedLength: 10 }, attempts: [], reviews: [], now: "2026-10-08T10:00:00.000Z" });
  const activeSession = prepared.session;
  const before = JSON.stringify(activeSession);
  const recommendation = recommendLearningPlanMode({ binding: runtime.getPlanningModeBinding(), trackId: track.trackId,
    modes: track.modes, sessions: [activeSession], activeSession, dueReviewCount: 0 });
  assert.equal(recommendation.mode.modeId, practice.modeId);
  assert.equal(recommendation.diagnosis, "scheduled", "an active Focus session is reachable before the one-off diagnostic history exists");
  assert.equal(track.completionRule?.ruleVersion, 2);
  assert.equal(activeSession.actualLength, 10);
  const policy = track.planningPolicy!;
  const policyIdentity = track.planningPolicyIdentity!;
  assert.equal(diagnostic.selection.kind, "exact_ordered_questions");
  if (diagnostic.selection.kind !== "exact_ordered_questions") throw new Error("Expected the authored diagnostic order.");
  const diagnosticIds = diagnostic.selection.questionIds.slice(0, diagnostic.defaultRequestedLength);
  assert.equal(diagnosticIds.length, 40);
  const nodeId = practice.selection.kind === "node" ? practice.selection.nodeId : "";
  const selectedScopes = [
    { modeId: practice.modeId, questions: activeSession.itemOrder.map(occurrence => track.getQuestion(occurrence.item.questionId)!) },
    { modeId: diagnostic.modeId, questions: diagnosticIds.map(id => track.getQuestion(id)!) },
  ];
  for (const { modeId, questions } of selectedScopes) {
    assert.ok(questions.every(question => question && question.nodeId === nodeId));
    for (const question of questions) {
      const estimate = policy.workEstimates.find(entry => entry.modeId === modeId && entry.scopeRefs.some(scope =>
        scope.nodeId === question.nodeId && scope.mentalUnitId === question.mentalUnitId))!;
      assert.deepEqual([estimate.minMinutesPerResponse, estimate.typicalMinutesPerResponse, estimate.maxMinutesPerResponse], [1, 2, 4]);
      assert.equal(estimate.reviewReserve.kind, "authored_estimate");
      if (estimate.reviewReserve.kind !== "authored_estimate") throw new Error("Expected the authored reserve.");
      assert.deepEqual([estimate.reviewReserve.minAdditionalResponsesPerNewResponse, estimate.reviewReserve.typicalAdditionalResponsesPerNewResponse, estimate.reviewReserve.maxAdditionalResponsesPerNewResponse], [0, 1, 3]);
    }
  }
  const completion = evaluatePackageCompletion(track, [], track.getQuestion);
  const result = projectFullGoalWorkload({ track, policy, planningPolicyIdentity: policyIdentity, completion, sessions: [activeSession], activeSession,
    attempts: [], reviews: [], practiceMode: practice, diagnosisMode: diagnostic, diagnosisStatus: recommendation.diagnosis });
  const row = result.chapters.find(chapter => chapter.nodeId === nodeId)!;
  // Both full-goal blocks include the authored reserve: (active10 + diagnostic40)×[1,2,4]×(1+[0,1,3]) = [50,200,800].
  assert.deepEqual([row.minMinutes, row.typicalMinutes, row.maxMinutes], [50, 200, 800]);
  assert.deepEqual([result.knownMinMinutes, result.knownTypicalMinutes, result.knownMaxMinutes], [50, 200, 800]);
  assert.ok(row.minMinutes! <= row.typicalMinutes! && row.typicalMinutes! <= row.maxMinutes!);
  assert.equal(result.sessionDemands.find(demand => demand.kind === "continue_existing")?.responseCount, 10);
  assert.equal(result.sessionDemands.find(demand => demand.phase === "diagnosis")?.responseCount, 40);
  assert.equal(JSON.stringify(activeSession), before, "cost aggregation cannot rewrite the exact active plan");
});
