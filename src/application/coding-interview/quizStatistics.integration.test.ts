import assert from "node:assert/strict";
import test from "node:test";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner, type ResolvedInteractionItem } from "../contentPackageRuntimeOwner";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { prepareCanonicalOptionOrder } from "../canonical/canonicalOptionOrder";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { createTrainingSession } from "../../domain";
import { commitTrainingSessionStart } from "../learningMutations";
import { STORAGE_KEYS } from "../../storage/keys";
import { loadTrainingAttempts, loadReviewQueueItems } from "../learningReadModels";
import { loadActivitySessionRecords, projectWeeklyAnsweredActivity, projectWeeklySessionActivity } from "../activityReadModels";
import { buildActivityModel } from "../../features/home/tabs/activityModel";
import { buildProgressTabModel } from "../../features/home/tabs/progressTabModel";
import { normalizeSessionResultDetails } from "../../features/exam/sessionResultPresentation";
import { getTrainingLifecycleUseCases, getForegroundSessionTimerFacade } from "../trainingLifecycle";
import { abandonAlgorithmsSession, advanceAlgorithmsPracticeSession, getAlgorithmsPracticeProjection, getAlgorithmsPracticeSummaryProjection, startAlgorithmsSession, submitAlgorithmsPracticeInteractionResponse } from "./codingInterviewSessionFacade";

const dependencies = { premiumSessionAdmission: { authorize: async () => "allowed" as const }, sessionIds: { create: async () => "quiz-statistics" } };
const id = "quiz-statistics";
function correct(item: ResolvedInteractionItem): any {
  const model = item.interactions.presentReview(item.question.questionId, null).model as any;
  const r = model.renderer;
  if (r.kind === "choice") return item.question.interactionType === "choice_single"
    ? { type: "choice_single", optionId: r.options.find((o: any) => o.selected).id }
    : { type: "choice_multiple", optionIds: r.options.filter((o: any) => o.selected).map((o: any) => o.id) };
  if (r.kind === "ordering") return { type: "ordering", orderedElementIds: r.elements.map((e: any) => e.id) };
  return { type: item.question.interactionType, selectedValueIdsByDimension: Object.fromEntries(r.dimensions.map((d: any) => [d.id, d.selectedValues])) };
}
function alternative(item: ResolvedInteractionItem, kind: "incorrect" | "partial"): any {
  const good = correct(item);
  const candidates: any[] = [];
  const model = item.interactions.presentReview(item.question.questionId, null).model as any;
  if (good.type === "choice_single") for (const option of model.renderer.options) candidates.push({ ...good, optionId: option.id });
  if (good.type === "choice_multiple") for (const option of model.renderer.options) candidates.push({ ...good, optionIds: [option.id] });
  if (good.type === "ordering") for (let i = 1; i < good.orderedElementIds.length; i++) {
    const ids = [...good.orderedElementIds]; [ids[0], ids[i]] = [ids[i], ids[0]]; candidates.push({ ...good, orderedElementIds: ids });
  }
  if (good.selectedValueIdsByDimension) for (const d of model.renderer.dimensions) for (const v of d.values ?? []) candidates.push({ ...good, selectedValueIdsByDimension: { ...good.selectedValueIdsByDimension, [d.id]: [v.id] } });
  return candidates.find(response => item.interactions.evaluate(item.question.questionId, response).result?.kind === kind);
}

// Uses real bundled questions, lifecycle writes and production read-model consumers in an isolated store.
test("early-ended quiz restores durable statistics across summary, Activity and Progress without completion credit", async (t) => {
  const storage = installMemoryStorage();
  await contentPackageRuntimeOwner.verifyBundledPackages();
  composeTrainingLifecycleUseCases(dependencies);
  await startAlgorithmsSession({ modeId: "coding-interview-learn-approach", requestedLength: 10 });
  let current = await getAlgorithmsPracticeProjection();
  await submitAlgorithmsPracticeInteractionResponse(correct(await contentPackageRuntimeOwner.resolveItem(current.item)));
  const firstAttempts = (await loadTrainingAttempts()).value;
  composeTrainingLifecycleUseCases(dependencies);
  const resumed = await getTrainingLifecycleUseCases().resumeActiveSession();
  assert.ok(resumed);
  await getForegroundSessionTimerFacade().restoreForResume(resumed);
  await advanceAlgorithmsPracticeSession();
  current = await getAlgorithmsPracticeProjection();
  const item = await contentPackageRuntimeOwner.resolveItem(current.item);
  const wrong = alternative(item, "incorrect"); assert.ok(wrong, "fixture has a genuinely incorrect answer");
  await submitAlgorithmsPracticeInteractionResponse(wrong);
  await abandonAlgorithmsSession();
  composeTrainingLifecycleUseCases(dependencies);
  const before = storage.snapshot();
  const summary = await getAlgorithmsPracticeSummaryProjection(id);
  assert.equal(summary.completionKind, "abandoned");
  assert.equal(summary.answeredOccurrenceIds.length, 2);
  assert.equal(summary.unansweredOccurrenceIds.length, 8);
  assert.deepEqual(summary.score, { correctCount: 1, partialCount: 0, incorrectCount: 1, pointsEarned: 1, maxPoints: 2 });
  assert.deepEqual(normalizeSessionResultDetails(summary.score, 2).score, { correctCount: 1, partialCount: 0, incorrectCount: 1 });
  const attempts = (await loadTrainingAttempts()).value;
  assert.equal(attempts.length, 2);
  assert.deepEqual(attempts.find(a => a.id === firstAttempts[0]!.id), firstAttempts[0]);
  const records = await loadActivitySessionRecords();
  const activity = buildActivityModel(records, "coding-interview-dsa-problem-solving").items[0]!;
  assert.equal(activity.answerCount, 2); assert.equal(activity.totalCount, 10); assert.equal(activity.status, "ended-early");
  assert.deepEqual(activity.interaction, { destination: "algorithms_practice_summary", kind: "open_result" });
  const now = new Date(Date.parse(summary.completedAt) + 1000).toISOString();
  const context = { trackId: "coding-interview-dsa-problem-solving", now, timezone: "UTC" };
  assert.equal((projectWeeklyAnsweredActivity(attempts, context) as any).answeredCount, 2);
  assert.equal((projectWeeklySessionActivity(records, context) as any).completedSessionCount, 0);
  const progress = buildProgressTabModel({ activeTrackId: "coding-interview-dsa-problem-solving", activityRecords: records, trainingAttempts: attempts, reviewQueueItems: (await loadReviewQueueItems()).value, now, timezone: "UTC" });
  assert.equal(progress.hasData, true);
  assert.equal(progress.algorithmsProgress?.evidenceSummary.currentFocus.responseCount, 2);
  assert.equal(progress.algorithmsProgress?.evidenceSummary.currentFocus.state, "building");
  assert.equal(progress.algorithmsProgress?.evidenceSummary.currentFocus.percent, undefined);
  assert.equal(storage.getString(STORAGE_KEYS.trainingSessionResult(id)), undefined);
  assert.deepEqual(await getAlgorithmsPracticeSummaryProjection(id), summary);
  assert.deepEqual(storage.snapshot(), before);

  const ids = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!).payload as string[];
  const key = STORAGE_KEYS.trainingAttempt(ids[0]!);
  async function rejectsWithoutWrites() {
    const snapshot = storage.snapshot();
    await assert.rejects(getAlgorithmsPracticeSummaryProjection(id), (error: any) => error.code === "summary_unavailable");
    assert.deepEqual(storage.snapshot(), snapshot);
  }
  function restore() { for (const k of storage.getAllKeys()) if (!before.has(k)) storage.remove(k); for (const [k, v] of before) storage.setString(k, v); }
  function change(changePayload: (value: any) => any) { const envelope = JSON.parse(storage.getString(key)!); storage.setString(key, JSON.stringify({ ...envelope, payload: changePayload(envelope.payload) })); }
  for (const [name, changePayload] of [
    ["mismatched mode", (a: any) => ({ ...a, modeId: "coding-interview-guided-practice" })],
    ["mismatched occurrence", (a: any) => ({ ...a, occurrenceId: "foreign-occurrence" })],
    ["grade disagrees with response", (a: any) => ({ ...a, result: { ...a.result, kind: a.result.kind === "correct" ? "incorrect" : "correct", earnedPoints: a.result.kind === "correct" ? 0 : a.result.maxPoints } })],
    ["corrupt attempt", () => ({})],
  ] as const) await t.test(name, async () => { restore(); change(changePayload); await rejectsWithoutWrites(); });
  await t.test("duplicate occurrence is unavailable", async () => {
    restore(); const a = JSON.parse(storage.getString(key)!); a.payload.id += ":duplicate";
    storage.setString(STORAGE_KEYS.trainingAttempt(a.payload.id), JSON.stringify(a));
    const index = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!); index.payload.push(a.payload.id);
    storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify(index)); await rejectsWithoutWrites();
  });
  await t.test("missing attempt record is unavailable", async () => { restore(); storage.remove(key); await rejectsWithoutWrites(); });
  await t.test("missing prior occurrence from index is unavailable", async () => {
    restore(); const index = JSON.parse(storage.getString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!);
    index.payload = index.payload.filter((attemptId: string) => attemptId !== firstAttempts[0]!.id);
    storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, JSON.stringify(index)); await rejectsWithoutWrites();
  });
  await t.test("missing exact pin is unavailable", async () => {
    restore(); const original = contentPackageRuntimeOwner.resolveExactArtifact;
    contentPackageRuntimeOwner.resolveExactArtifact = async () => { throw new Error("Exact artifact unavailable"); };
    try { await rejectsWithoutWrites(); } finally { contentPackageRuntimeOwner.resolveExactArtifact = original; }
  });
});

test("real zero-correct and no answers remain distinct", async () => {
  const storage = installMemoryStorage(); await contentPackageRuntimeOwner.verifyBundledPackages(); composeTrainingLifecycleUseCases(dependencies);
  await startAlgorithmsSession({ modeId: "coding-interview-learn-approach", requestedLength: 10 });
  const p = await getAlgorithmsPracticeProjection(); const item = await contentPackageRuntimeOwner.resolveItem(p.item);
  const wrong = alternative(item, "incorrect"); assert.ok(wrong); await submitAlgorithmsPracticeInteractionResponse(wrong); await abandonAlgorithmsSession();
  const before = storage.snapshot(); const result = await getAlgorithmsPracticeSummaryProjection(id);
  assert.deepEqual(result.score, { correctCount: 0, partialCount: 0, incorrectCount: 1, pointsEarned: 0, maxPoints: 1 });
  assert.equal(result.overallPointsEarned, 0); assert.deepEqual(storage.snapshot(), before);
  installMemoryStorage(); composeTrainingLifecycleUseCases(dependencies);
  await startAlgorithmsSession({ modeId: "coding-interview-learn-approach", requestedLength: 10 }); await abandonAlgorithmsSession();
  assert.equal((await getAlgorithmsPracticeSummaryProjection(id)).score, null);
});

test("early-ended quiz preserves an actual partial evaluation and its separate overall credit", async () => {
  installMemoryStorage(); await contentPackageRuntimeOwner.verifyBundledPackages(); composeTrainingLifecycleUseCases(dependencies);
  const { runtime } = await contentPackageRuntimeOwner.resolveForDiscovery("coding-interview-dsa-problem-solving", "coding_interview");
  const { session: prepared } = await runtime.prepare({ trackId: "coding-interview-dsa-problem-solving", modeId: "coding-interview-learn-approach",
    request: { sessionId: id, requestedLength: 10 }, attempts: [], reviews: [], now: new Date().toISOString() });
  // A valid exact-pin plan fixture selects a real ordering, since the first Learn pool is single-choice.
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("coding-interview-dsa-problem-solving");
  const question = track.questions.find(q => q.interaction.type === "ordering" && q.interaction.elements.length >= 4)!;
  assert.ok(question);
  const first = prepared.itemOrder[0]!;
  const ref = { ...first.item, questionId: question.questionId };
  const base = createTrainingSession({ ...prepared, itemOrder: prepared.itemOrder.map((o, i) => i === 0 ? { ...o, item: ref } : o),
    optionOrderByOccurrence: { ...prepared.optionOrderByOccurrence, [first.occurrenceId]: prepareCanonicalOptionOrder(question, first.occurrenceId, ref) }, planFingerprint: undefined, taxonomyVersion: undefined });
  const session = createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" }) });
  await commitTrainingSessionStart({ session, draft: null, createdAt: session.startedAt });
  await getForegroundSessionTimerFacade().initialize(session);
  const item = await contentPackageRuntimeOwner.resolveItem(ref);
  const partial = alternative(item, "partial"); assert.ok(partial, "real bundled ordering produces partial credit");
  await submitAlgorithmsPracticeInteractionResponse(partial);
  await abandonAlgorithmsSession(); const summary = await getAlgorithmsPracticeSummaryProjection(id);
  const attempts = (await loadTrainingAttempts()).value;
  assert.equal(summary.score?.partialCount, 1);
  assert.equal(summary.score?.pointsEarned, attempts.reduce((sum, a) => sum + a.result.earnedPoints, 0));
  assert.equal(summary.overallPointsEarned, attempts.filter(a => a.result.kind === "correct").reduce((sum, a) => sum + a.result.earnedPoints, 0));
});
