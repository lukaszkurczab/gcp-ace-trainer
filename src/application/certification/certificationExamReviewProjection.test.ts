import assert from "node:assert/strict";
import test from "node:test";

import { loadCanonicalRuntimeCatalog, scoreCanonicalQuestion } from "../../content/canonical";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createFamilyEnvelope, createTrainingAttempt, createTrainingSession, createTrainingSessionResult, type CompletedTrainingSession, type TrainingAttempt, type TrainingSessionResult } from "../../domain";
import { projectCertificationExamReview } from "./certificationExamReviewProjection";

const TRACK_ID = "google-cloud-associate-cloud-engineer";
const PROFILE_ID = "google-cloud-associate-cloud-engineer-certification-exam-v1";
const SESSION_ID = "exam-review-projection-test";
const NOW = "2026-09-27T12:00:00.000Z";

async function fixture(answeredIndices: readonly number[]) {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(TRACK_ID);
  const profile = track.simulationProfiles?.find((entry) => entry.profileId === PROFILE_ID);
  assert.ok(profile);
  const selected = profile.familyConfig.blueprint.sections.flatMap((section) => {
    const count = 50 * section.weightPercent / 100;
    return track.questions.filter((question) => question.contentDomainId === section.contentDomainId && profile.familyConfig.nodeDomainMap[question.nodeId] === section.contentDomainId && (question.sourceRefs?.length ?? 0) > 0)
      .slice().sort((left, right) => left.questionId.localeCompare(right.questionId)).slice(0, count);
  });
  assert.equal(selected.length, 50);
  const itemOrder = selected.map((question, index) => ({
    occurrenceId: `${SESSION_ID}:occurrence:${index}`,
    item: { trackId: TRACK_ID, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
  }));
  const config = profile.familyConfig;
  const base = {
    id: SESSION_ID,
    trackId: TRACK_ID,
    modeId: profile.modeId,
    configurationSnapshot: {
      kind: "certificationSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission", navigation: "free", submission: "manualOrForegroundTimeout", timer: "absoluteDeadline",
      timerDurationMs: config.durationMinutes * 60_000, timerDeadlineAt: "2026-09-27T14:00:00.000Z", simulationProfileId: profile.profileId,
      simulationProfileVersion: profile.profileVersion, simulationPolicyId: config.interactionPolicy.policyId, simulationPolicyVersion: config.interactionPolicy.policyVersion,
      flagging: "available", navigator: "available", sectionIds: config.blueprint.sections.map((section) => section.id),
    },
    requestedLength: 50,
    actualLength: 50,
    currentItemIndex: 49,
    itemOrder,
    optionOrderByOccurrence: Object.fromEntries(selected.map((question, index) => {
      if (question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") throw new Error("Certification exam fixture contains a non-choice question.");
      return [itemOrder[index]!.occurrenceId, question.interaction.options.map((option) => option.optionId)];
    })),
    conditionalReinsertSlots: [],
    activeForegroundMs: 123_000,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
    status: "completed" as const,
    startedAt: "2026-09-27T12:00:00.000Z",
    completedAt: NOW,
  };
  const fingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" });
  const session = createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: fingerprint }) as CompletedTrainingSession;
  const attempts: TrainingAttempt<unknown>[] = answeredIndices.map((index) => {
    const question = selected[index]!;
    const occurrence = itemOrder[index]!;
    const response = question.answer;
    return createTrainingAttempt({
      id: `${SESSION_ID}:attempt:${index}`,
      sessionId: SESSION_ID,
      trackId: TRACK_ID,
      modeId: profile.modeId,
      occurrenceId: occurrence.occurrenceId,
      item: occurrence.item,
      response,
      result: scoreCanonicalQuestion(question, response),
      reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }, { axisId: "mental_unit", nodeId: question.mentalUnitId, role: "primary" }] },
      answeredAt: NOW,
      committedAt: NOW,
    });
  });
  const answeredOccurrenceIds = itemOrder.filter((_, index) => answeredIndices.includes(index)).map((occurrence) => occurrence.occurrenceId);
  const unansweredOccurrenceIds = itemOrder.filter((_, index) => !answeredIndices.includes(index)).map((occurrence) => occurrence.occurrenceId);
  const result = createTrainingSessionResult({
    id: `${SESSION_ID}:result`, sessionId: SESSION_ID, trackId: TRACK_ID, totalOccurrences: 50, answeredOccurrenceIds, unansweredOccurrenceIds, completedAt: NOW,
    evidence: createFamilyEnvelope({ familyId: "certification", details: {
      activeForegroundMs: session.activeForegroundMs,
      correctCount: attempts.filter((attempt) => attempt.result.kind === "correct").length,
      incorrectCount: attempts.filter((attempt) => attempt.result.kind === "incorrect").length,
      partialCount: attempts.filter((attempt) => attempt.result.kind === "partial").length,
      maxPoints: attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0),
      pointsEarned: attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0),
      profileId: profile.profileId,
      profileVersion: profile.profileVersion,
    } }),
  });
  const project = (nextResult: TrainingSessionResult = result, nextAttempts: readonly TrainingAttempt<unknown>[] = attempts, nextSession = session) => projectCertificationExamReview({
    attempts: nextAttempts, profile, questionsById: new Map(track.questions.map((question) => [question.questionId, question])), result: nextResult, session: nextSession,
  });
  return { attempts, itemOrder, project, result, session };
}

test("completed exam review projects answered and unanswered items across the complete fixed plan", async () => {
  const { project } = await fixture([0, 7]);
  const projection = await project();
  assert.equal(projection.items.length, 50);
  assert.equal(projection.answeredCount, 2);
  assert.equal(projection.unansweredCount, 48);
  assert.equal(projection.items[0]?.answerState, "answered");
  assert.ok(projection.items[0]?.selectedOptionIds.length);
  assert.equal(projection.items[2]?.answerState, "unanswered");
  assert.deepEqual(projection.items[2]?.selectedOptionIds, []);
  assert.equal(projection.items[2]?.result, "unanswered");
  assert.ok(projection.items[2]?.correctOptionIds.length);
  assert.ok(projection.items[2]?.reason);
  assert.ok(projection.maxPoints > 0);
});

test("fully unanswered completed exam projects all 50 items without creating attempts", async () => {
  const { project, attempts } = await fixture([]);
  const projection = await project();
  assert.equal(attempts.length, 0);
  assert.equal(projection.answeredCount, 0);
  assert.equal(projection.unansweredCount, 50);
  assert.equal(projection.items.every((item) => item.answerState === "unanswered" && item.result === "unanswered" && item.selectedOptionIds.length === 0 && item.correctOptionIds.length > 0), true);
});

test("exam result rejects tampered partition, attempt scores, and profile evidence", async () => {
  const { attempts, itemOrder, project, result, session } = await fixture([0]);
  const wrongPartition = { ...result, unansweredOccurrenceIds: result.unansweredOccurrenceIds.slice(1) } as TrainingSessionResult;
  await assert.rejects(project(wrongPartition), /coverage|partition/i);
  const badAttempt = { ...attempts[0]!, result: { ...attempts[0]!.result, earnedPoints: 0, kind: "incorrect" } } as TrainingAttempt<unknown>;
  await assert.rejects(project(result, [badAttempt]), /score|totals/i);
  const details = result.evidence.details as Record<string, unknown>;
  const badProfileResult = { ...result, evidence: createFamilyEnvelope({ familyId: "certification", details: { ...details, profileVersion: "other" } }) } as TrainingSessionResult;
  await assert.rejects(project(badProfileResult), /profile evidence/i);
  const foreignResult = { ...result, sessionId: "another-session" } as TrainingSessionResult;
  await assert.rejects(project(foreignResult), /completed session and simulation profile/i);
  const tamperedSession = { ...session, itemOrder: [{ ...itemOrder[0]!, item: { ...itemOrder[0]!.item, artifactSha256: "f".repeat(64) } }, ...itemOrder.slice(1)] } as typeof session;
  await assert.rejects(project(result, attempts, tamperedSession), /fingerprint/i);
});
