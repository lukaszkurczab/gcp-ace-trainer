import assert from "node:assert/strict";
import test from "node:test";
import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { advanceTrainingSession, createTrainingSession, type TrainingSession } from "../../domain";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { buildCanonicalInteractionViewModel } from "./canonicalInteractionPresentation";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { commitSessionCompletion, commitTrainingOutcome, commitTrainingSessionAdvance, commitTrainingSessionStart } from "../learningMutations";
import { getReviewQueueItems, getTrainingAttempts, getTrainingSessions } from "../../storage";
import { isCanonicalOptionOrder, prepareCanonicalOptionOrder } from "./canonicalOptionOrder";
import { scoreCanonicalQuestion } from "../../content/canonical/questionScoring";

const NOW = "2026-10-02T12:00:00.000Z";
const catalogPromise = loadCanonicalRuntimeCatalog();

test("actual GCP practice choice orders vary between session identities and survive durable resume unchanged", async () => {
  const storage = installMemoryStorage();
  const track = (await catalogPromise).getTrack("google-cloud-associate-cloud-engineer");
  const runtime = new CanonicalTrainingRuntime(track);
  const prepare = (sessionId: string) => runtime.prepare({ trackId: track.trackId, modeId: "certification-focus-practice", request: { sessionId, requestedLength: 10 }, attempts: [], reviews: [], now: NOW });
  const first = await prepare("bizq01-choice-order:first");
  const second = await prepare("bizq01-choice-order:second");
  for (const session of [first.session, second.session]) for (const [index, occurrence] of session.itemOrder.entries()) assert.equal(occurrence.occurrenceId, `${session.id}:occurrence:${index}`);
  assert.deepEqual(first.session.itemOrder.map((entry) => entry.item), second.session.itemOrder.map((entry) => entry.item));
  const orders = (session: typeof first.session) => session.itemOrder.map((entry) => session.optionOrderByOccurrence[entry.occurrenceId]);
  assert.notDeepEqual(orders(first.session), orders(second.session), "different session seeds must not always expose source option order");
  assert.deepEqual((await prepare(first.session.id)).session, first.session);
  await commitTrainingSessionStart({ session: first.session, draft: null, createdAt: NOW });
  installKeyValueStorageForTests(storage);
  const resumed = (await getTrainingSessions()).value.find((session) => session.id === first.session.id)!;
  assert.deepEqual(resumed, first.session);
  await runtime.validateResume({ session: resumed, draft: null });
  const occurrence = resumed.itemOrder[0]!;
  const question = track.getQuestion(occurrence.item.questionId)!;
  const vm = buildCanonicalInteractionViewModel(question, null, resumed.optionOrderByOccurrence[occurrence.occurrenceId]);
  assert.equal(vm.renderer.kind, "choice");
  if (vm.renderer.kind === "choice") assert.deepEqual(vm.renderer.options.map((option) => option.id), resumed.optionOrderByOccurrence[occurrence.occurrenceId]);
});

test("resume accepts a fingerprint-bound legal choice permutation without requiring regeneration", async () => {
  const track = (await catalogPromise).getTrack("google-cloud-associate-cloud-engineer");
  const runtime = new CanonicalTrainingRuntime(track);
  const { session } = await runtime.prepare({ trackId: track.trackId, modeId: "certification-focus-practice", request: { sessionId: "bizq01-choice-permutation", requestedLength: 10 }, attempts: [], reviews: [], now: NOW });
  const occurrence = session.itemOrder[0]!;
  const order = [...session.optionOrderByOccurrence[occurrence.occurrenceId]!].reverse();
  const optionOrderByOccurrence = { ...session.optionOrderByOccurrence, [occurrence.occurrenceId]: order };
  const base = createTrainingSession({ ...session, optionOrderByOccurrence, taxonomyVersion: undefined, planFingerprint: undefined });
  const permuted = createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" }) });
  await runtime.validateResume({ session: permuted, draft: null });
  assert.deepEqual(permuted.optionOrderByOccurrence[occurrence.occurrenceId], order);
});

async function refingerprint(session: TrainingSession): Promise<TrainingSession> {
  const base = createTrainingSession({ ...session, taxonomyVersion: undefined, planFingerprint: undefined });
  return createTrainingSession({ ...base, taxonomyVersion: "canonical-content-v1", planFingerprint: await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "canonical-content-v1" }) });
}

test("all current actual items preserve control membership, ID answers and non-choice order without exposing an answer to the ranker", async () => {
  const catalog = await catalogPromise;
  let choiceCount = 0, nonChoiceCount = 0;
  for (const trackId of catalog.tracks) {
    const track = catalog.getTrack(trackId);
    for (const question of track.questions) {
      const seed = `actual:${trackId}:${question.questionId}`;
      const order = prepareCanonicalOptionOrder(question, seed, track);
      assert.equal(isCanonicalOptionOrder(question, order), true, question.questionId);
      assert.equal(Object.isFrozen(order), true);
      assert.deepEqual(prepareCanonicalOptionOrder(question, seed, track), order);
      assert.equal(isCanonicalOptionOrder(question, [...order, "foreign"]), false);
      assert.equal(isCanonicalOptionOrder(question, new Array(order.length)), false);
      if (question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") {
        nonChoiceCount += 1;
        const expected = question.interaction.type === "ordering" ? question.interaction.elements.map((element) => element.elementId) : question.interaction.dimensions.map((dimension) => dimension.dimensionId);
        assert.deepEqual(order, expected);
        if (order.length > 1) assert.equal(isCanonicalOptionOrder(question, [...order].reverse()), false);
        continue;
      }
      choiceCount += 1;
      const sourceIds = question.interaction.options.map((option) => option.optionId);
      assert.deepEqual([...order].sort(), [...sourceIds].sort());
      assert.equal(isCanonicalOptionOrder(question, [...order].reverse()), true);
      assert.equal(isCanonicalOptionOrder(question, order.map((id, index) => index === 0 ? "foreign" : id)), false);
      assert.equal(isCanonicalOptionOrder(question, order.map((id, index) => index === 0 ? order[1]! : id)), false);
      assert.deepEqual(prepareCanonicalOptionOrder({ ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() }, answer: null } as unknown as typeof question, seed, track), order);
      const vm = buildCanonicalInteractionViewModel(question, question.answer, order);
      assert.equal(vm.renderer.kind, "choice");
      if (vm.renderer.kind !== "choice") continue;
      assert.deepEqual(vm.renderer.options.map((option) => option.id), order);
      const selected = vm.renderer.options.filter((option) => option.selected).map((option) => option.id);
      const response = question.interaction.type === "choice_single" ? { type: "choice_single", optionId: selected[0] } : { type: "choice_multiple", optionIds: selected };
      assert.equal(scoreCanonicalQuestion(question, response).kind, "correct");
      assert.deepEqual(vm.accessibility.controls.map((control) => control.id), order);
    }
  }
  assert.deepEqual({ choiceCount, nonChoiceCount }, { choiceCount: 14880, nonChoiceCount: 1742 });
});

test("all real 29 practice modes and canonical simulation profiles prepare valid frozen orders with unchanged question selection", async () => {
  const catalog = await catalogPromise;
  let modes = 0, simulations = 0;
  for (const trackId of catalog.tracks) {
    const track = catalog.getTrack(trackId), runtime = new CanonicalTrainingRuntime(track);
    for (const mode of track.modes) {
      const question = track.getPool(mode.modeId)[0]!;
      const sourceItem = { trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
      const reviews = mode.selection.kind === "evidence_conditioned" ? [{ id: `review:${trackId}`, trackId, sourceAttemptId: "prior", sourceSessionId: "prior", sourceItem, taxonomyOrSkillRefs: [], reasons: ["incorrect" as const], dueAt: NOW, createdAt: NOW, consecutiveAfterDueSuccesses: 0, persistent: true }] : [];
      const prepared = await runtime.prepare({ trackId, modeId: mode.modeId, request: { sessionId: `modes:${trackId}:${mode.modeId}`, requestedLength: mode.defaultRequestedLength, ...(mode.selection.kind === "evidence_conditioned" ? { reviewSource: "due_queue" } : {}) }, attempts: [], reviews, now: NOW });
      await runtime.validateResume({ session: prepared.session, draft: null });
      for (const occurrence of prepared.session.itemOrder) assert.equal(isCanonicalOptionOrder(track.getQuestion(occurrence.item.questionId)!, prepared.session.optionOrderByOccurrence[occurrence.occurrenceId]), true);
      modes += 1;
    }
    for (const profile of track.simulationProfiles ?? []) {
      const input = { trackId, modeId: profile.modeId, request: { sessionId: `sim:first:${trackId}`, scope: { simulationProfileId: profile.profileId } }, attempts: [], reviews: [], now: NOW };
      const first = await runtime.prepare(input), second = await runtime.prepare({ ...input, request: { ...input.request, sessionId: `sim:second:${trackId}` } });
      await runtime.validateResume(first); await runtime.validateResume(second);
      assert.deepEqual(first.session.itemOrder.map((entry) => entry.item), second.session.itemOrder.map((entry) => entry.item));
      const choices = first.session.itemOrder.filter((entry) => "options" in track.getQuestion(entry.item.questionId)!.interaction);
      if (choices.length > 0) assert.notDeepEqual(choices.map((entry) => first.session.optionOrderByOccurrence[entry.occurrenceId]), second.session.itemOrder.filter((entry) => "options" in track.getQuestion(entry.item.questionId)!.interaction).map((entry) => second.session.optionOrderByOccurrence[entry.occurrenceId]));
      simulations += 1;
    }
  }
  assert.deepEqual({ modes, simulations }, { modes: 29, simulations: 5 });
});

test("legacy source orders remain valid; malformed orders, stale pins and unstored permutation changes fail resume", async () => {
  const track = (await catalogPromise).getTrack("google-cloud-associate-cloud-engineer"), runtime = new CanonicalTrainingRuntime(track);
  const { session } = await runtime.prepare({ trackId: track.trackId, modeId: "certification-focus-practice", request: { sessionId: "choice-guards", requestedLength: 10 }, attempts: [], reviews: [], now: NOW });
  const legacyOrders = Object.fromEntries(session.itemOrder.map((entry) => [entry.occurrenceId, (track.getQuestion(entry.item.questionId)!.interaction as { options: readonly { optionId: string }[] }).options.map((option) => option.optionId)]));
  await runtime.validateResume({ session: await refingerprint({ ...session, optionOrderByOccurrence: legacyOrders }), draft: null });
  const occurrence = session.itemOrder[0]!, original = session.optionOrderByOccurrence[occurrence.occurrenceId]!;
  await assert.rejects(runtime.validateResume({ session: { ...session, optionOrderByOccurrence: { ...session.optionOrderByOccurrence, [occurrence.occurrenceId]: [...original].reverse() } }, draft: null }), /fingerprint/);
  for (const order of [original.slice(1), original.map((id, index) => index === 0 ? "foreign" : id)]) {
    await assert.rejects(runtime.validateResume({ session: await refingerprint({ ...session, optionOrderByOccurrence: { ...session.optionOrderByOccurrence, [occurrence.occurrenceId]: order } }), draft: null }), /option order/);
  }
  const missing = { ...session.optionOrderByOccurrence }; delete missing[occurrence.occurrenceId];
  for (const orders of [missing, { ...session.optionOrderByOccurrence, foreign: original }]) await assert.rejects(runtime.validateResume({ session: { ...session, optionOrderByOccurrence: orders }, draft: null }), /option order/);
  await assert.rejects(runtime.validateResume({ session: { ...session, artifactSha256: "f".repeat(64) }, draft: null }));
});

test("actual Coding conditional repeat retains the source prepared order after three durable intervening answers and rebind", async () => {
  const storage = installMemoryStorage();
  const track = (await catalogPromise).getTrack("coding-interview-dsa-problem-solving"), runtime = new CanonicalTrainingRuntime(track);
  let { session } = await runtime.prepare({ trackId: track.trackId, modeId: "coding-interview-custom-practice", request: { sessionId: "choice-repeat", requestedLength: 10 }, attempts: [], reviews: [], now: NOW });
  const slot = session.conditionalReinsertSlots![0]!, source = session.itemOrder[0]!;
  const sourceOrder = session.optionOrderByOccurrence[source.occurrenceId]!;
  assert.ok(slot.exactSourceBranch);
  assert.deepEqual(slot.exactSourceBranch.optionOrder, sourceOrder);
  const branchBad = { ...slot, exactSourceBranch: { ...slot.exactSourceBranch, optionOrder: slot.exactSourceBranch.optionOrder.map((id, index) => index === 0 ? "foreign" : id) } };
  await assert.rejects(runtime.validateResume({ session: await refingerprint({ ...session, conditionalReinsertSlots: [branchBad, ...session.conditionalReinsertSlots!.slice(1)] }), draft: null }), /option order/);
  const ordinaryBad = { ...slot, ordinaryBranch: { ...slot.ordinaryBranch, optionOrder: [...slot.ordinaryBranch.optionOrder].reverse() } };
  await assert.rejects(async () => runtime.validateResume({ session: await refingerprint({ ...session, conditionalReinsertSlots: [ordinaryBad, ...session.conditionalReinsertSlots!.slice(1)] }), draft: null }), /option order/);
  await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });
  for (let index = 0; index < 4; index += 1) {
    const question = track.getQuestion(session.itemOrder[index]!.item.questionId)!;
    assert.equal(question.interaction.type, "choice_single");
    const correct = (question.answer as { optionId: string }).optionId;
    const wrong = (question.interaction as { options: readonly { optionId: string }[] }).options.find((option) => option.optionId !== correct)!.optionId;
    const outcome = await runtime.submitPractice({ session, response: index === 0 ? { type: "choice_single", optionId: wrong } : question.answer, attempts: (await getTrainingAttempts()).value, reviews: (await getReviewQueueItems()).value, now: NOW });
    await commitTrainingOutcome({ attempt: outcome.attempt, session: outcome.session, reviews: outcome.reviewMutations.filter((mutation) => mutation.kind === "upsert").map((mutation) => mutation.entry), createdAt: NOW });
    session = advanceTrainingSession(outcome.session);
    await commitTrainingSessionAdvance(session, NOW);
  }
  assert.equal(session.itemOrder[4]!.occurrenceId, slot.exactSourceBranch.occurrence.occurrenceId);
  assert.deepEqual(session.optionOrderByOccurrence[session.itemOrder[4]!.occurrenceId], sourceOrder);
  installKeyValueStorageForTests(storage);
  const resumed = (await getTrainingSessions()).value.find((entry) => entry.id === session.id)!;
  await runtime.validateResume({ session: resumed, draft: null });
  assert.deepEqual(resumed, session);
  assert.equal((await getTrainingAttempts()).value.length, 4);
});

test("MC becomes reachable through completed canonical sessions and real persisted history without changing selection policy", async () => {
  const catalog = await catalogPromise;
  for (const [trackId, modeId] of [["coding-interview-dsa-problem-solving", "coding-interview-learn-approach"], ["claude-certified-architect-professional-certification", "certification-focus-practice"]]) {
    const storage = installMemoryStorage();
    const track = catalog.getTrack(trackId!), runtime = new CanonicalTrainingRuntime(track), mode = track.getMode(modeId!);
    let encountered = false;
    const bound = Math.ceil(track.getPool(mode.modeId).length / mode.defaultRequestedLength);
    for (let round = 1; round <= bound && !encountered; round += 1) {
      let { session } = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: `mc-history:${trackId}:${round}`, requestedLength: mode.defaultRequestedLength }, attempts: (await getTrainingAttempts()).value, reviews: (await getReviewQueueItems()).value, now: NOW });
      encountered = session.itemOrder.some((entry) => track.getQuestion(entry.item.questionId)!.interaction.type === "choice_multiple");
      await commitTrainingSessionStart({ session, draft: null, createdAt: NOW });
      for (let index = 0; index < session.actualLength; index += 1) {
        const response = track.getQuestion(session.itemOrder[index]!.item.questionId)!.answer;
        const outcome = await runtime.submitPractice({ session, response, attempts: (await getTrainingAttempts()).value, reviews: (await getReviewQueueItems()).value, now: NOW });
        await commitTrainingOutcome({ attempt: outcome.attempt, session: outcome.session, reviews: outcome.reviewMutations.filter((mutation) => mutation.kind === "upsert").map((mutation) => mutation.entry), createdAt: NOW });
        session = outcome.session;
        if (index < session.actualLength - 1) { session = advanceTrainingSession(session); await commitTrainingSessionAdvance(session, NOW); }
      }
      const finalized = await runtime.finalizePractice({ session, attempts: (await getTrainingAttempts()).value, now: NOW });
      await commitSessionCompletion(finalized.session, finalized.result, NOW);
      installKeyValueStorageForTests(storage);
      if (encountered) console.log(`MC_REACHABLE ${trackId} completedRound=${round}`);
    }
    assert.equal(encountered, true, `${trackId} must not exclude MC from its actual eligible pool`);
  }
});
