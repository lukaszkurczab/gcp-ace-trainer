import assert from "node:assert/strict";
import test from "node:test";
import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { CanonicalQuestionResponse, Question } from "../../content/canonical/questionTypes";
import type { ReviewQueueEntry, TrainingAttempt } from "../../domain";
import { createTrainingSession } from "../../domain";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";

const NOW = "2026-01-01T00:00:00.000Z";
const catalogPromise = loadCanonicalRuntimeCatalog();
const responseFor = (question: Question): CanonicalQuestionResponse => question.answer;
const wrongResponse = (question: Question): CanonicalQuestionResponse => {
  if (question.interaction.type === "choice_single") { const q = question as Extract<Question, { interaction: { type: "choice_single" } }>; return { type: "choice_single", optionId: q.interaction.options.find((x) => x.optionId !== q.answer.optionId)!.optionId }; }
  if (question.interaction.type === "choice_multiple") { const q = question as Extract<Question, { interaction: { type: "choice_multiple" } }>; return { type: "choice_multiple", optionIds: [q.interaction.options.find((x) => !q.answer.optionIds.includes(x.optionId))!.optionId] }; }
  if (question.interaction.type === "ordering") { const q = question as Extract<Question, { interaction: { type: "ordering" } }>; return { type: "ordering", orderedElementIds: [...q.answer.orderedElementIds].reverse() }; }
  return { type: question.interaction.type, selectedValueIdsByDimension: Object.fromEntries(question.interaction.dimensions.map((d) => [d.dimensionId, [d.values[0]!.valueId]])) };
};
const reviewFor = (item: TrainingAttempt<unknown>["item"], dueAt: string, sourceSessionId = "old"): ReviewQueueEntry => ({ id: "review:stable", trackId: item.trackId, sourceAttemptId: "old-attempt", sourceSessionId, sourceItem: item, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt, createdAt: NOW, consecutiveAfterDueSuccesses: 0, persistent: false });

test("real loader prepares all 29 modes across nine tracks", async () => {
  const catalog = await catalogPromise; let modes = 0;
  for (const trackId of catalog.tracks) for (const mode of catalog.getTrack(trackId).modes) {
    const track = catalog.getTrack(trackId); const question = track.getPool(mode.modeId)[0]!;
    const reviews = mode.selection.kind === "evidence_conditioned" ? [reviewFor({ trackId, itemId: question.questionId, contentVersion: track.contentVersion, packagePin: track.packagePin }, NOW)] : [];
    const prepared = await new CanonicalTrainingRuntime(track).prepare({ trackId, modeId: mode.modeId, request: { sessionId: `${trackId}:${mode.modeId}`, requestedLength: mode.defaultRequestedLength }, attempts: [], reviews, now: NOW });
    assert.ok(prepared.session.actualLength > 0); await new CanonicalTrainingRuntime(track).validateResume({ session: prepared.session, draft: null }); modes += 1;
  }
  assert.equal(modes, 29);
});

test("real canonical questions submit and score all five interaction types", async () => {
  const catalog = await catalogPromise; const seen = new Set<string>();
  for (const trackId of catalog.tracks) { const track = catalog.getTrack(trackId);
    for (const question of track.questions) { if (seen.has(question.interaction.type)) continue;
      const mode = track.modes.find((x) => track.getPool(x.modeId).some((q) => q.questionId === question.questionId)); if (!mode) continue;
      const runtime = new CanonicalTrainingRuntime(track); const requestedLength = mode.requestedLengths[0]!; const prepared = await runtime.prepare({ trackId, modeId: mode.modeId, request: { sessionId: `types:${question.questionId}`, requestedLength }, attempts: [], reviews: [], now: NOW });
      const current = track.getQuestion(prepared.session.itemOrder[0]!.item.itemId)!; const submission = await runtime.submitPractice({ session: prepared.session, response: responseFor(current), attempts: [], reviews: [], now: NOW });
      assert.equal(submission.attempt.result.kind, "correct"); seen.add(question.interaction.type);
    }
  }
  assert.deepEqual([...seen].sort(), ["choice_multiple", "choice_single", "complexity", "decision_matrix", "ordering"]);
});

test("evidence permits one item and coding includes committed misses", async () => {
  const catalog = await catalogPromise; const gcp = catalog.getTrack("google-cloud-associate-cloud-engineer"); const mode = gcp.modes.find((x) => x.selection.kind === "evidence_conditioned")!; const question = gcp.getPool(mode.modeId)[0]!;
  const prepared = await new CanonicalTrainingRuntime(gcp).prepare({ trackId: gcp.trackId, modeId: mode.modeId, request: { sessionId: "evidence", requestedLength: 20 }, attempts: [], reviews: [reviewFor({ trackId: gcp.trackId, itemId: question.questionId, contentVersion: gcp.contentVersion, packagePin: gcp.packagePin }, NOW)], now: NOW }); assert.equal(prepared.session.actualLength, 1);
  const coding = catalog.getTrack("coding-interview-dsa-problem-solving"); const codingMode = coding.getMode("coding-interview-weak-area-review"); const codingQuestion = coding.getPool(codingMode.modeId)[0]!;
  const miss = { id: "miss", sessionId: "old", occurrenceId: "old:0", trackId: coding.trackId, modeId: "old", item: { trackId: coding.trackId, itemId: codingQuestion.questionId, contentVersion: coding.contentVersion, packagePin: coding.packagePin }, response: {}, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 }, reviewEvidence: { sourceItem: { trackId: coding.trackId, itemId: codingQuestion.questionId, contentVersion: coding.contentVersion, packagePin: coding.packagePin }, taxonomyOrSkillRefs: [] }, answeredAt: NOW, committedAt: NOW } as TrainingAttempt<unknown>;
  const codingPrepared = await new CanonicalTrainingRuntime(coding).prepare({ trackId: coding.trackId, modeId: codingMode.modeId, request: { sessionId: "coding-evidence", requestedLength: 20 }, attempts: [miss], reviews: [], now: NOW }); assert.ok(codingPrepared.session.actualLength > 0);
});

test("coding review preserves identity and resolves after two due successes", async () => {
  const catalog = await catalogPromise; const track = catalog.getTrack("coding-interview-dsa-problem-solving"); const runtime = new CanonicalTrainingRuntime(track); const mode = track.getMode("coding-interview-learn-approach"); const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "review", requestedLength: 10 }, attempts: [], reviews: [], now: NOW }); const question = track.getQuestion(prepared.session.itemOrder[0]!.item.itemId)!;
  const bad = await runtime.submitPractice({ session: prepared.session, response: wrongResponse(question), attempts: [], reviews: [], now: NOW }); assert.notEqual(bad.attempt.result.kind, "correct"); assert.equal(bad.reviewMutations[0]?.kind, "upsert"); if (bad.reviewMutations[0]?.kind !== "upsert") return; assert.equal(bad.reviewMutations[0].entry.dueAt, "2026-01-02T00:00:00.000Z");
  const priorDue = { ...bad.reviewMutations[0].entry, sourceSessionId: "older-session", dueAt: NOW }; const first = await runtime.submitPractice({ session: prepared.session, response: responseFor(question), attempts: [], reviews: [priorDue], now: "2026-01-02T00:00:00.000Z" }); assert.equal(first.reviewMutations[0]?.kind, "upsert"); if (first.reviewMutations[0]?.kind !== "upsert") return; assert.equal(first.reviewMutations[0].entry.id, priorDue.id);
  const second = await runtime.submitPractice({ session: prepared.session, response: responseFor(question), attempts: [], reviews: [first.reviewMutations[0].entry], now: "2026-01-03T00:00:00.000Z" }); assert.equal(second.reviewMutations[0]?.kind, "remove");
});

test("resume and query boundaries reject tampering, foreign attempts and old pins", async () => {
  const catalog = await catalogPromise; const track = catalog.getTrack("google-cloud-associate-cloud-engineer"); const runtime = new CanonicalTrainingRuntime(track); const prepared = await runtime.prepare({ trackId: track.trackId, modeId: "certification-diagnostic-baseline", request: { sessionId: "guard", requestedLength: 40 }, attempts: [], reviews: [], now: NOW });
  const tampered = { ...prepared.session, configurationSnapshot: { ...prepared.session.configurationSnapshot, feedbackMode: "atSessionEnd" } }; await assert.rejects(runtime.validateResume({ session: tampered, draft: null }));
  await assert.rejects(runtime.finalizePractice({ session: prepared.session, attempts: [], now: NOW })); await assert.rejects(runtime.queryReview({ trackId: "foreign", reviews: [], now: NOW }));
  const old = reviewFor(prepared.session.itemOrder[0]!.item, NOW); const view = await runtime.queryReview({ trackId: track.trackId, reviews: [old, { ...old, id: "old-pin", sourceItem: { ...old.sourceItem, packagePin: { ...old.sourceItem.packagePin, packageIdentity: "f".repeat(64) } } }], now: NOW }); assert.equal((view as { due: readonly ReviewQueueEntry[] }).due.length, 1);
});

test("reinsert resolves exact branch after three durable intervening submissions and preserves ordinary branch on correct", async () => {
  const catalog = await catalogPromise; const track = catalog.getTrack("coding-interview-dsa-problem-solving"); const runtime = new CanonicalTrainingRuntime(track); const mode = track.getMode("coding-interview-guided-practice");
  const prepare = (id: string) => runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: id, requestedLength: 10 }, attempts: [], reviews: [], now: NOW });
  const advance = async (session: TrainingAttempt<unknown>["item"] extends never ? never : Awaited<ReturnType<typeof prepare>>["session"], index: number) => { const base = createTrainingSession({ ...session, currentItemIndex: index, planFingerprint: undefined, taxonomyVersion: undefined }); const fingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" }); return createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: fingerprint }); };
  const run = async (sourceResponse: CanonicalQuestionResponse, id: string) => { let prepared = await prepare(id); const initialFingerprint = prepared.session.planFingerprint; const originalOrder = prepared.session.itemOrder; const attempts: TrainingAttempt<unknown>[] = []; const source = track.getQuestion(originalOrder[0]!.item.itemId)!; let submitted = await runtime.submitPractice({ session: prepared.session, response: sourceResponse, attempts, reviews: [], now: NOW }); attempts.push(submitted.attempt); prepared = { ...prepared, session: await advance(submitted.session, 1) };
    for (let index = 1; index <= 3; index += 1) { const q = track.getQuestion(prepared.session.itemOrder[index]!.item.itemId)!; submitted = await runtime.submitPractice({ session: prepared.session, response: responseFor(q), attempts, reviews: [], now: NOW }); attempts.push(submitted.attempt); prepared = { ...prepared, session: await advance(submitted.session, index + 1) }; }
    return { originalOrder, submitted, attempts, initialFingerprint };
  };
  const badRun = await run(wrongResponse(track.getQuestion((await prepare("bad")).session.itemOrder[0]!.item.itemId)!), "bad"); const badSession = badRun.submitted.session; assert.equal(badSession.itemOrder[4]!.item.itemId, badRun.originalOrder[0]!.item.itemId); assert.notEqual(badSession.itemOrder[4]!.occurrenceId, badRun.originalOrder[4]!.occurrenceId); assert.notEqual(badSession.planFingerprint, badRun.initialFingerprint); await runtime.validateResume({ session: badSession, draft: null });
  const correctRun = await run(responseFor(track.getQuestion((await prepare("correct")).session.itemOrder[0]!.item.itemId)!), "correct"); assert.equal(correctRun.submitted.session.itemOrder[4]!.occurrenceId, correctRun.originalOrder[4]!.occurrenceId); assert.equal(correctRun.submitted.session.planFingerprint, correctRun.initialFingerprint);
});
