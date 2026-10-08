import assert from "node:assert/strict";
import test from "node:test";

import { loadCanonicalRuntimeCatalog } from "../../content/canonical";
import type { CanonicalQuestionResponse, Question } from "../../content/canonical";
import { createTrainingSession, type CompletedTrainingSession, type TrainingAttempt, type TrainingSessionResult } from "../../domain";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createCertificationPracticeAnswerFixture } from "../../testing/certificationPracticeAnswerFixture";
import { CanonicalTrainingRuntime } from "../canonical/CanonicalTrainingRuntime";
import { projectCertificationPracticeReview } from "./certificationPracticeReviewProjection";

const fixturePromise = createCertificationPracticeAnswerFixture();

test("completed practice projector preserves the canonical five-state answer matrix", async () => {
  const fixture = await fixturePromise;
  assert.deepEqual(fixture.projection.items.map((item) => item.sourceAttemptId), fixture.attempts.map((attempt) => attempt.id));
  assert.deepEqual(fixture.projection.items.slice(0, 5).map((item) => item.result), ["correct", "incorrect", "correct", "partial", "incorrect"]);
  assert.deepEqual(fixture.projection.items.slice(0, 5).map((item) => item.selectionMode), ["single", "single", "multiple", "multiple", "multiple"]);
  assert.equal(fixture.projection.total, 10);
  assert.equal(fixture.projection.items[2]?.selectedOptionIds.join(","), "b,d");
  assert.equal(fixture.projection.items[3]?.selectedOptionIds.length, 1);
  assert.equal(fixture.projection.overallPointsEarned, fixture.attempts.filter((attempt) => attempt.result.kind === "correct").reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0));
  assert.ok(fixture.projection.overallPointsEarned < fixture.projection.items.reduce((sum, item) => sum + fixture.attempts.find((attempt) => attempt.occurrenceId === item.occurrenceId)!.result.earnedPoints, 0));
  assert.deepEqual(fixture.result.evidence.details, { activeForegroundMs: 0, correctCount: 7, partialCount: 1, incorrectCount: 2, pointsEarned: 15, maxPoints: 22 });
});

test("completed practice review projects authored wrong and omitted-correct messages from the saved response only", async () => {
  const fixture = await fixturePromise;
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(fixture.session.trackId);
  const authoredMessagesByQuestion = new Map<string, Question>();
  for (const occurrence of fixture.session.itemOrder) {
    const question = track.getQuestion(occurrence.item.questionId)!;
    if (question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") throw new Error("Expected a canonical choice question.");
    const correctIds = question.answer.type === "choice_single" ? [question.answer.optionId] : question.answer.type === "choice_multiple" ? question.answer.optionIds : [];
    const messages = [
      ...question.interaction.options.filter((option) => !correctIds.includes(option.optionId)).map((option) => ({ kind: "wrong_option" as const, targetId: option.optionId, text: `Wrong option ${option.optionId}.` })),
      ...(question.interaction.type === "choice_multiple" ? correctIds.map((optionId) => ({ kind: "omitted_option" as const, targetId: optionId, text: `Omitted correct option ${optionId}.` })) : []),
    ];
    authoredMessagesByQuestion.set(question.questionId, { ...question, feedback: { ...question.feedback, messages } } as Question);
  }
  const projection = await projectCertificationPracticeReview({
    attempts: fixture.attempts,
    resolveQuestion: async (item) => authoredMessagesByQuestion.get(item.questionId)!,
    result: fixture.result,
    session: fixture.session,
  });

  assert.equal(projection.items[0]?.result, "correct");
  assert.deepEqual(projection.items[0]?.messages, []);
  const wrong = projection.items[1]!;
  assert.equal(wrong.result, "incorrect");
  const wrongSelected = wrong.selectedOptionIds.filter((id) => !wrong.correctOptionIds.includes(id));
  const omittedCorrect = wrong.selectionMode === "multiple" ? wrong.correctOptionIds.filter((id) => !wrong.selectedOptionIds.includes(id)) : [];
  assert.deepEqual(wrong.messages?.filter((message) => message.kind === "wrong_option").map((message) => message.targetId), wrongSelected);
  assert.deepEqual(wrong.messages?.filter((message) => message.kind === "omitted_option").map((message) => message.targetId), omittedCorrect);
  const partial = projection.items[3]!;
  assert.equal(partial.result, "partial");
  assert.deepEqual(partial.messages?.filter((message) => message.kind === "wrong_option").map((message) => message.targetId), partial.selectedOptionIds.filter((id) => !partial.correctOptionIds.includes(id)));
  assert.deepEqual(partial.messages?.filter((message) => message.kind === "omitted_option").map((message) => message.targetId), partial.correctOptionIds.filter((id) => !partial.selectedOptionIds.includes(id)));

  const noAuthoredMessagesId = fixture.session.itemOrder[5]!.item.questionId;
  const noAuthored = track.getQuestion(noAuthoredMessagesId)!;
  const { messages: _messages, ...feedbackWithoutMessages } = noAuthored.feedback;
  authoredMessagesByQuestion.set(noAuthoredMessagesId, { ...noAuthored, feedback: feedbackWithoutMessages } as Question);
  const withoutAuthored = await projectCertificationPracticeReview({
    attempts: fixture.attempts,
    resolveQuestion: async (item) => authoredMessagesByQuestion.get(item.questionId)!,
    result: fixture.result,
    session: fixture.session,
  });
  assert.equal("messages" in withoutAuthored.items[5]!, false);
});

test("practice review rejects altered identity, coverage, attempts, score, and resolution", async () => {
  const fixture = await fixturePromise;
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(fixture.session.trackId);
  const resolveQuestion = async (item: CompletedTrainingSession["itemOrder"][number]["item"]) => {
    assert.equal(item.trackId, track.trackId);
    assert.equal(item.contentVersion, track.contentVersion);
    assert.equal(item.artifactSha256, track.artifactSha256);
    return track.getQuestion(item.questionId)!;
  };
  const project = (result = fixture.result, attempts: readonly TrainingAttempt<unknown>[] = fixture.attempts, session = fixture.session) => projectCertificationPracticeReview({ attempts, resolveQuestion, result, session });
  await assert.rejects(project({ ...fixture.result, unansweredOccurrenceIds: ["invented"] } as TrainingSessionResult), /completion evidence/i);
  await assert.rejects(project(fixture.result, fixture.attempts.slice(1)), /missing or duplicated/i);
  const assertPreflightRejectsWithoutResolving = async (attempts: readonly TrainingAttempt<unknown>[]) => {
    let resolverCalls = 0;
    await assert.rejects(projectCertificationPracticeReview({
      attempts,
      resolveQuestion: async (item) => { resolverCalls += 1; return track.getQuestion(item.questionId)!; },
      result: fixture.result,
      session: fixture.session,
    }), /immutable session plan/i);
    assert.equal(resolverCalls, 0);
  };
  const lastAttempt = fixture.attempts.at(-1)!;
  const badLastItem = { ...lastAttempt, item: { ...lastAttempt.item, questionId: "CCARP-D01-O01-diagnosis" } } as TrainingAttempt<unknown>;
  await assertPreflightRejectsWithoutResolving([...fixture.attempts.slice(0, -1), badLastItem]);
  const badLastTrack = { ...lastAttempt, trackId: "google-cloud-associate-cloud-engineer" } as TrainingAttempt<unknown>;
  await assertPreflightRejectsWithoutResolving([...fixture.attempts.slice(0, -1), badLastTrack]);
  const badLastMode = { ...lastAttempt, modeId: "certification-diagnostic-baseline" } as TrainingAttempt<unknown>;
  await assertPreflightRejectsWithoutResolving([...fixture.attempts.slice(0, -1), badLastMode]);
  const badScore = { ...fixture.attempts[0]!, result: { ...fixture.attempts[0]!.result, earnedPoints: 0, kind: "incorrect" } } as TrainingAttempt<unknown>;
  await assert.rejects(project(fixture.result, [badScore, ...fixture.attempts.slice(1)]), /invalid result/i);
  const wrongQuestion = { ...fixture.session.itemOrder[0]!.item, questionId: "CCARP-D01-O01-diagnosis" };
  await assert.rejects(project(fixture.result, fixture.attempts, { ...fixture.session, itemOrder: [{ ...fixture.session.itemOrder[0]!, item: wrongQuestion }, ...fixture.session.itemOrder.slice(1)] } as CompletedTrainingSession), /immutable session plan/i);
  await assert.rejects(projectCertificationPracticeReview({
    attempts: fixture.attempts,
    resolveQuestion: async (item) => track.getQuestion(item.questionId === "CCARP-D01-O01-boundary" ? "CCARP-D01-O01-diagnosis" : item.questionId)!,
    result: fixture.result,
    session: fixture.session,
  }), /immutable session plan/i);
});

test("verified GCP diagnostic evidence recommends only an observed weak unit and keeps all-correct results neutral", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const diagnostic = track.getMode("certification-diagnostic-baseline");
  const focus = track.getMode("certification-focus-practice");
  assert.equal(diagnostic.selection.kind, "exact_ordered_questions");
  assert.equal(focus.selection.kind, "node");
  const questionIds = diagnostic.selection.questionIds;
  const focusPool = track.getPool(focus.modeId);
  const nodeId = focus.selection.nodeId;
  const eligibleUnits = [...new Set(focusPool.filter((question) => question.nodeId === nodeId && questionIds.some((id) => track.getQuestion(id)?.mentalUnitId === question.mentalUnitId)).map((question) => question.mentalUnitId))]
    .filter((unitId) => focusPool.filter((question) => question.nodeId === nodeId && question.mentalUnitId === unitId).length >= focus.minimumActualLength);
  assert.ok(eligibleUnits.length >= 2);
  const runtime = new CanonicalTrainingRuntime(track);
  const run = async (sessionId: string, weakUnitId?: string, hour = 0, priorAttempts: readonly TrainingAttempt<unknown>[] = []) => {
    const hourText = String(hour).padStart(2, "0");
    const prepared = await runtime.prepare({ trackId: track.trackId, modeId: diagnostic.modeId, request: { sessionId, requestedLength: questionIds.length }, attempts: priorAttempts, reviews: [], now: "2026-02-01T" + hourText + ":00:00.000Z" });
    const attempts: TrainingAttempt<unknown>[] = [];
    const sessionAt = async (index: number) => {
      const base = createTrainingSession({ ...prepared.session, currentItemIndex: index, planFingerprint: undefined, taxonomyVersion: undefined });
      const taxonomyVersion = "canonical-content-v1";
      const planFingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion });
      return createTrainingSession({ ...base, taxonomyVersion, planFingerprint });
    };
    for (let index = 0; index < prepared.session.itemOrder.length; index += 1) {
      const session = await sessionAt(index);
      const occurrence = session.itemOrder[index]!;
      const question = track.getQuestion(occurrence.item.questionId)!;
      const response = weakUnitId && question.mentalUnitId === weakUnitId
        ? incorrectResponse(question)
        : question.answer as CanonicalQuestionResponse;
      const minute = String(Math.floor(index / 60)).padStart(2, "0");
      const second = String(index % 60).padStart(2, "0");
      const submission = await runtime.submitPractice({ session, response, attempts: [...priorAttempts, ...attempts], reviews: [], now: "2026-02-01T" + hourText + ":" + minute + ":" + second + ".000Z" });
      attempts.push(submission.attempt);
    }
    const finalized = await runtime.finalizePractice({ session: await sessionAt(prepared.session.actualLength - 1), attempts, now: "2026-02-01T" + String(hour + 1).padStart(2, "0") + ":00:00.000Z" });
    assert.equal(finalized.session.status, "completed");
    const projection = await projectCertificationPracticeReview({
      attempts: [...priorAttempts, ...attempts],
      diagnosticContext: { focusPool, focusMinimumActualLength: focus.minimumActualLength, diagnosticQuestionIds: questionIds, exposureHistoryAvailable: true },
      resolveQuestion: async (item) => {
        assert.equal(item.contentVersion, track.contentVersion);
        assert.equal(item.artifactSha256, track.artifactSha256);
        return track.getQuestion(item.questionId)!;
      },
      result: finalized.result,
      session: finalized.session as CompletedTrainingSession,
    });
    return { attempts, projection, result: finalized.result, session: finalized.session as CompletedTrainingSession };
  };

  for (const expectedUnit of eligibleUnits.slice(0, 2)) {
    const { projection } = await run("gcp-diagnostic-gap-" + expectedUnit, expectedUnit);
    const report = projection.diagnosticReport;
    assert.ok(report);
    assert.equal(report.answeredCount, questionIds.length);
    assert.equal(report.unansweredCount, 0);
    assert.equal(report.exposureHistory, "available");
    assert.equal(report.recommendation.kind, "observed_gap");
    if (report.recommendation.kind === "observed_gap") assert.equal(report.recommendation.mentalUnitId, expectedUnit);
    assert.equal(report.units.find((unit) => unit.mentalUnitId === expectedUnit)?.incorrectCount, questionIds.filter((id) => track.getQuestion(id)?.mentalUnitId === expectedUnit).length);
  }
  const first = await run("gcp-diagnostic-first-exposure", eligibleUnits[0]);
  const repeated = await run("gcp-diagnostic-repeat-exposure", undefined, 2, first.attempts);
  const repeatedReport = repeated.projection.diagnosticReport;
  assert.ok(repeatedReport);
  assert.equal(repeatedReport.exposureHistory, "available");
  assert.ok(repeatedReport.units.every((unit) => unit.repeatExposureCount === unit.questionCount && unit.firstRecordedExposureCount === 0));

  const tieAttempt = { ...first.attempts[0]!, id: "prior-tied-diagnostic-attempt", sessionId: "prior-tied-diagnostic-session", answeredAt: repeated.attempts[0]!.answeredAt };
  const tied = await projectCertificationPracticeReview({
    attempts: [...first.attempts, ...repeated.attempts, tieAttempt],
    diagnosticContext: { focusPool, focusMinimumActualLength: focus.minimumActualLength, diagnosticQuestionIds: questionIds, exposureHistoryAvailable: true },
    resolveQuestion: async (item) => track.getQuestion(item.questionId)!,
    result: repeated.result,
    session: repeated.session,
  });
  assert.equal(tied.diagnosticReport?.exposureHistory, "unknown");
  assert.equal(tied.diagnosticReport?.units.find((unit) => unit.mentalUnitId === track.getQuestion(repeated.attempts[0]!.item.questionId)!.mentalUnitId)?.firstRecordedExposureCount, null);

  const allCorrect = await run("gcp-diagnostic-neutral");
  const report = allCorrect.projection.diagnosticReport;
  assert.ok(report);
  assert.equal(report.correctCount, questionIds.length);
  assert.equal(report.incorrectCount, 0);
  assert.equal(report.unansweredCount, 0);
  assert.ok(report.units.every((unit) => unit.unansweredCount === 0 && unit.unitNumber > 0));
  assert.equal(report.recommendation.kind, "neutral_practice");
  if (report.recommendation.kind === "neutral_practice") assert.ok(!report.sampledMentalUnitIds.includes(report.recommendation.mentalUnitId));
});

test("diagnostic report is unavailable when a sampled item is foreign to the exact pinned Focus pool", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const diagnostic = track.getMode("certification-diagnostic-baseline");
  const focus = track.getMode("certification-focus-practice");
  const sample = await (async () => {
    const runtime = new CanonicalTrainingRuntime(track);
    const prepared = await runtime.prepare({ trackId: track.trackId, modeId: diagnostic.modeId, request: { sessionId: "gcp-diagnostic-foreign-focus-membership", requestedLength: diagnostic.requestedLengths[0]! }, attempts: [], reviews: [], now: "2026-02-02T00:00:00.000Z" });
    let session = prepared.session;
    const attempts: TrainingAttempt<unknown>[] = [];
    const sessionAt = async (index: number) => {
      const base = createTrainingSession({ ...prepared.session, currentItemIndex: index, planFingerprint: undefined, taxonomyVersion: undefined });
      const taxonomyVersion = "canonical-content-v1";
      const planFingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion });
      return createTrainingSession({ ...base, taxonomyVersion, planFingerprint });
    };
    for (let index = 0; index < session.itemOrder.length; index += 1) {
      session = await sessionAt(index);
      const occurrence = session.itemOrder[index]!;
      const question = track.getQuestion(occurrence.item.questionId)!;
      const submitted = await runtime.submitPractice({ session, response: incorrectResponse(question), attempts, reviews: [], now: "2026-02-02T00:00:00.000Z" });
      session = submitted.session;
      attempts.push(submitted.attempt);
    }
    const finalized = await runtime.finalizePractice({ session: await sessionAt(session.actualLength - 1), attempts, now: "2026-02-02T01:00:00.000Z" });
    return { session: finalized.session as CompletedTrainingSession, result: finalized.result, attempts };
  })();
  const firstSampledQuestion = track.getQuestion(sample.session.itemOrder[0]!.item.questionId)!;
  const focusPool = track.getPool(focus.modeId).map((question) => question.questionId === firstSampledQuestion.questionId
    ? { ...question, nodeId: "foreign-node-with-colliding-unit-id" }
    : question);
  const projection = await projectCertificationPracticeReview({
    attempts: sample.attempts,
    diagnosticContext: { focusPool, focusMinimumActualLength: focus.minimumActualLength, diagnosticQuestionIds: diagnostic.selection.kind === "exact_ordered_questions" ? diagnostic.selection.questionIds : [], exposureHistoryAvailable: true },
    resolveQuestion: async (item) => track.getQuestion(item.questionId)!,
    result: sample.result,
    session: sample.session,
  });
  assert.equal(projection.items.length, 40, "verified saved feedback remains readable");
  assert.equal(projection.diagnosticReport, undefined, "foreign sample membership cannot produce a weak-unit recommendation");
});

function incorrectResponse(question: Question): CanonicalQuestionResponse {
  if (question.interaction.type === "choice_single" && question.answer.type === "choice_single") {
    const options = question.interaction.options;
    const correctOptionId = question.answer.optionId;
    return { type: "choice_single", optionId: options.find((option) => option.optionId !== correctOptionId)!.optionId };
  }
  if (question.interaction.type === "choice_multiple" && question.answer.type === "choice_multiple") {
    const options = question.interaction.options;
    const correctOptionIds = question.answer.optionIds;
    const wrong = options.find((option) => !correctOptionIds.includes(option.optionId));
    return wrong ? { type: "choice_multiple", optionIds: [wrong.optionId] } : { type: "choice_multiple", optionIds: [correctOptionIds[0]!] };
  }
  throw new Error("The GCP diagnostic fixture must use a supported choice question.");
}
