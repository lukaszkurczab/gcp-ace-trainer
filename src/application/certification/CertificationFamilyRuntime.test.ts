import assert from "node:assert/strict";
import test from "node:test";

import { CertificationFamilyRuntime } from "./CertificationFamilyRuntime";
import { createTrainingAttempt, createTrainingSession, createTrainingSessionDraft, type TrainingSession } from "../../domain";
import { getCertificationQuestionMaxPoints, scoreCertificationQuestion, type CertificationQuestion } from "../../tracks/certification";
import { getCertificationPackageTestCatalog, prepareBundledTestPackages } from "../../testing/contentPackageRuntimeTestSupport";
import { makeQuestion } from "../../testing/fixtures";
import type { CertificationRuntimeCatalog } from "../../tracks/certification";

const TRACK_ID = "google-cloud-associate-cloud-engineer" as const;
const TIMESTAMP = "2026-09-03T10:00:00.000Z";

function testCatalog(): Readonly<{ catalog: CertificationRuntimeCatalog; questions: readonly CertificationQuestion[] }> {
  const base = getCertificationPackageTestCatalog();
  const questions = Object.freeze([
    makeQuestion({ id: "runtime-multi", type: "multiple", correctOptionIds: ["a", "c"], domain: "setup_environment" }),
    makeQuestion({ id: "runtime-single", correctOptionIds: ["a"], domain: "setup_environment" }),
  ]);
  const byId = new Map(questions.map((question) => [question.id, question]));
  const catalog: CertificationRuntimeCatalog = Object.freeze({
    ...base,
    getFocusPractice: () => ({ blueprintId: "test-focus", blueprintVersion: "1", modeId: "certification-focus-practice" as const, requestedLengths: [2], shortening: "allowed_within_topic" as const, selectionScope: "cloud_domain" as const, topicIds: ["setup_environment"] }),
    getItemById: (id: string) => byId.get(id) ?? base.getItemById(id),
  });
  return { catalog, questions };
}

function sessionFor(catalog: CertificationRuntimeCatalog, questions: readonly CertificationQuestion[], modeId: "certification-focus-practice" | "certification-exam-simulation", id: string): TrainingSession {
  const simulation = modeId === "certification-exam-simulation";
  return createTrainingSession({
    id,
    trackId: TRACK_ID,
    modeId,
    configurationSnapshot: simulation
      ? { kind: "certificationSimulation", navigation: "free", submission: "manualOrForegroundTimeout", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission", timer: "absoluteDeadline", timerDeadlineAt: "2026-09-03T12:00:00.000Z", timerDurationMs: 7_200_000, simulationPolicyId: "patternly-certification-simulation-v1", simulationPolicyVersion: "1" }
      : { kind: "certificationFocusPractice", domain: "setup_environment", navigation: "linear", submission: "perItem", feedbackMode: "afterEachAnswer", answerChanges: "none", timer: "elapsedForeground" },
    requestedLength: questions.length,
    actualLength: questions.length,
    currentItemIndex: 0,
    itemOrder: questions.map((question, index) => ({ occurrenceId: `${id}:occurrence:${index}`, item: catalog.toContentItemRef(question) })),
    optionOrderByOccurrence: {},
    activeForegroundMs: 0,
    contentVersion: catalog.getContentVersion(),
    packagePin: catalog.getPackagePin(),
    taxonomyVersion: "test-taxonomy",
    planFingerprint: "0".repeat(64),
    status: "active",
    startedAt: TIMESTAMP,
  });
}

function attemptFor(session: TrainingSession, question: CertificationQuestion, index: number) {
  const item = session.itemOrder[index]!.item;
  const response = { kind: "option_selection" as const, selectedOptionIds: [...question.correctOptionIds] };
  return createTrainingAttempt({
    id: `${session.id}:attempt:${index}`,
    sessionId: session.id,
    trackId: session.trackId,
    modeId: session.modeId,
    occurrenceId: session.itemOrder[index]!.occurrenceId,
    item,
    response,
    result: scoreCertificationQuestion(question, response),
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt: TIMESTAMP,
    committedAt: TIMESTAMP,
  });
}

test("Certification practice max points follows every occurrence's exact option set", async () => {
  await prepareBundledTestPackages();
  const { catalog, questions } = testCatalog();
  const runtime = new CertificationFamilyRuntime(catalog, "test-taxonomy");
  const session = sessionFor(catalog, questions, "certification-focus-practice", "runtime-practice-max");
  const finalized = await runtime.finalizePractice({ session, attempts: questions.map((question, index) => attemptFor(session, question, index)), now: TIMESTAMP });
  const details = finalized.result.evidence.details as Record<string, number>;
  assert.equal(details.maxPoints, questions.reduce((sum, question) => sum + getCertificationQuestionMaxPoints(question), 0));
  assert.equal(details.maxPoints, 3);
  assert.equal(details.pointsEarned, 3);
});

test("Certification simulation keeps unanswered occurrences in the exact max and exposes no answers", async () => {
  await prepareBundledTestPackages();
  const { catalog, questions } = testCatalog();
  const runtime = new CertificationFamilyRuntime(catalog, "test-taxonomy");
  const session = sessionFor(catalog, questions, "certification-exam-simulation", "runtime-simulation-noanswers");
  const draft = createTrainingSessionDraft({ familyId: "certification", sessionId: session.id, trackId: session.trackId, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: TIMESTAMP });
  const finalized = await runtime.finalizeSimulation({ session, draft, attempts: [], reviews: [], now: TIMESTAMP });
  const details = finalized.result.evidence.details as Record<string, number>;
  assert.equal(details.maxPoints, 3);
  assert.equal(details.pointsEarned, 0);
  assert.equal(details.correctCount, 0);
  assert.equal(details.partialCount, 0);
  assert.equal(details.incorrectCount, 0);
  assert.deepEqual(finalized.result.answeredOccurrenceIds, []);
  assert.deepEqual(finalized.result.unansweredOccurrenceIds, session.itemOrder.map((occurrence) => occurrence.occurrenceId));
});
