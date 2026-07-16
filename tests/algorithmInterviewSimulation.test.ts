import assert from "node:assert/strict";
import test from "node:test";

import { AlgorithmsFamilyRuntime } from "../src/application/algorithms/AlgorithmsFamilyRuntime";
import { commitTrainingSessionFinalization, recoverPendingMutation } from "../src/application/learningMutations";
import { AlgorithmContentCatalog } from "../src/tracks/algorithms/algorithmContentCatalog";
import {
  AlgorithmsInterviewSimulationFinalizationGate,
  createAlgorithmsInterviewSimulationProfile,
  finalizeAlgorithmsInterviewSimulation,
  getAlgorithmQuestionEntries,
  getAlgorithmsInterviewSimulationRemainingMs,
  mutateAlgorithmsInterviewSimulationDraft,
  prepareAlgorithmsInterviewSimulation,
  type AlgorithmContentGroup,
  type AlgorithmQuestion,
} from "../src/tracks/algorithms";
import { STORAGE_KEYS } from "../src/storage/keys";
import { getActiveMutationJournal, getActiveTrainingSession, getActiveTrainingSessionDraft, getReviewQueueItems, getTrainingAttempts, getTrainingSessionResult, saveTrainingSession, saveTrainingSessionDraft } from "../src/storage/repositories";
import { installMemoryStorage } from "./journalTestSupport";

function question(id: string): AlgorithmQuestion {
  return {
    contentVersion: "v1", difficulty: "core", id, learningStage: "mixed_interview_practice", primarySkillAtomId: id, prompt: id, type: "single_choice",
    feedbackModel: { decisionSignal: "authored reason", details: "authored details", distractorExplanations: { no: "authored distractor" }, mentalModelCorrection: "correction", mistakeTypes: [], nextAction: "next", result: "diagnostic" },
    options: [{ id: "yes", isCorrect: true, text: "Yes" }, { id: "no", isCorrect: false, text: "No" }],
  };
}

function catalog(count = 40): AlgorithmContentCatalog {
  const group = { id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings", questions: Array.from({ length: count }, (_, index) => question(`simulation-${index}`)) } as const satisfies AlgorithmContentGroup;
  return new AlgorithmContentCatalog([group]);
}

function prepare(count = 40) {
  const content = catalog(count);
  const profile = createAlgorithmsInterviewSimulationProfile(["arrays_and_strings"]);
  const prepared = prepareAlgorithmsInterviewSimulation({ catalog: content, contentVersion: "v1", profile, sessionId: "simulation", startedAt: "2026-07-16T10:00:00.000Z" });
  return { content, prepared, profile };
}

test("Interview Simulation preparation is fixed at 40 unique identities and fails explicitly when insufficient", () => {
  const { prepared } = prepare();
  assert.equal(prepared.session.actualLength, 40);
  assert.equal(prepared.session.requestedLength, 40);
  assert.equal(new Set(prepared.session.itemOrder.map((occurrence) => occurrence.item.itemId)).size, 40);
  assert.deepEqual(prepared.session.conditionalReinsertSlots, []);
  assert.throws(() => prepare(39), /cannot prepare 40 unique items/);
});

test("Algorithms family runtime exposes only pure simulation semantics", () => {
  const { content, profile } = prepare();
  const runtime = new AlgorithmsFamilyRuntime(content);
  const prepared = runtime.prepareInterviewSimulation({ contentVersion: "v1", profile, sessionId: "runtime-simulation", startedAt: "2026-07-16T10:00:00.000Z" });
  assert.equal(prepared.session.itemOrder.length, 40);
  assert.equal(prepared.draft.revision, 1);
});

test("editable draft supports add, overwrite, remove, and exposes no scoring or feedback before finalization", () => {
  const { content, prepared } = prepare();
  const entries = getAlgorithmQuestionEntries(content.getGroups());
  const occurrenceId = prepared.session.itemOrder[0]!.occurrenceId;
  const added = mutateAlgorithmsInterviewSimulationDraft({ entries, session: prepared.session, draft: prepared.draft, occurrenceId, response: { kind: "choice", selectedOptionIds: ["yes"] }, updatedAt: "2026-07-16T10:01:00.000Z" });
  const overwritten = mutateAlgorithmsInterviewSimulationDraft({ entries, session: prepared.session, draft: added, occurrenceId, response: { kind: "choice", selectedOptionIds: ["no"] }, updatedAt: "2026-07-16T10:02:00.000Z" });
  const removed = mutateAlgorithmsInterviewSimulationDraft({ entries, session: prepared.session, draft: overwritten, occurrenceId, response: null, updatedAt: "2026-07-16T10:03:00.000Z" });
  assert.deepEqual(added.responsesByOccurrenceId[occurrenceId], { kind: "choice", selectedOptionIds: ["yes"] });
  assert.deepEqual(overwritten.responsesByOccurrenceId[occurrenceId], { kind: "choice", selectedOptionIds: ["no"] });
  assert.equal(occurrenceId in removed.responsesByOccurrenceId, false);
  assert.equal("score" in added, false);
  assert.equal("feedback" in added, false);
});

test("remaining simulation time uses canonical foreground work only", () => {
  const { prepared } = prepare();
  assert.equal(getAlgorithmsInterviewSimulationRemainingMs(prepared.session), 2_700_000);
  assert.equal(getAlgorithmsInterviewSimulationRemainingMs({ ...prepared.session, activeForegroundMs: 2_700_100 }), 0);
});

test("a persisted simulation session and its latest revisioned draft resume without a second timer or response owner", async () => {
  installMemoryStorage();
  const { content, prepared } = prepare();
  const entries = getAlgorithmQuestionEntries(content.getGroups());
  const first = prepared.session.itemOrder[0]!.occurrenceId;
  const edited = mutateAlgorithmsInterviewSimulationDraft({ entries, session: prepared.session, draft: prepared.draft, occurrenceId: first, response: { kind: "choice", selectedOptionIds: ["yes"] }, updatedAt: "2026-07-16T10:01:00.000Z" });
  await saveTrainingSession(prepared.session);
  const durableDraft = await saveTrainingSessionDraft(edited, null);
  assert.deepEqual(await getActiveTrainingSession(), prepared.session);
  assert.deepEqual(await getActiveTrainingSessionDraft(), durableDraft);
  assert.equal(getAlgorithmsInterviewSimulationRemainingMs(await getActiveTrainingSession() ?? prepared.session), 2_700_000);
});

test("manual finish and expiry share one frozen command; unanswered creates no attempt or fabricated response", async () => {
  installMemoryStorage();
  const { content, prepared } = prepare();
  const entries = getAlgorithmQuestionEntries(content.getGroups());
  const first = prepared.session.itemOrder[0]!.occurrenceId;
  const draft = mutateAlgorithmsInterviewSimulationDraft({ entries, session: prepared.session, draft: prepared.draft, occurrenceId: first, response: { kind: "choice", selectedOptionIds: ["yes"] }, updatedAt: "2026-07-16T10:01:00.000Z" });
  await saveTrainingSession(prepared.session);
  const durableDraft = await saveTrainingSessionDraft(draft, null);
  const gate = new AlgorithmsInterviewSimulationFinalizationGate();
  const manual = gate.begin({ entries, session: prepared.session, frozenDraft: durableDraft, completedAt: "2026-07-16T10:45:00.000Z" });
  const expiry = gate.begin({ entries, session: prepared.session, frozenDraft: durableDraft, completedAt: "2026-07-16T10:45:01.000Z" });
  assert.strictEqual(expiry, manual);
  assert.equal(manual.attempts.length, 1);
  assert.equal(manual.result.unansweredOccurrenceIds.length, 39);
  assert.deepEqual(manual.reviewMutations.map((mutation) => mutation.action), ["put"]);
  const summary = manual.result.evidence.details as Readonly<{ maxPoints: number; pointsEarned: number }>;
  assert.equal(summary.maxPoints, 40);
  assert.equal(summary.pointsEarned, 1);
  assert.equal("feedback" in manual, false);
  await commitTrainingSessionFinalization({ session: manual.session, attempts: manual.attempts, reviewMutations: manual.reviewMutations, result: manual.result, cleanup: { kind: "training_session_draft", draft: durableDraft, submittedOccurrenceIds: [first] }, createdAt: manual.result.completedAt });
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.equal((await getReviewQueueItems()).value.length, 1);
  assert.equal(await getActiveTrainingSessionDraft(), null);
  assert.deepEqual(await getTrainingSessionResult(prepared.session.id), manual.result);
});

test("simulation finalization retains its frozen command and recovers identically when result persistence fails", async () => {
  const storage = installMemoryStorage();
  const { content, prepared } = prepare();
  const entries = getAlgorithmQuestionEntries(content.getGroups());
  const first = prepared.session.itemOrder[0]!.occurrenceId;
  const edited = mutateAlgorithmsInterviewSimulationDraft({ entries, session: prepared.session, draft: prepared.draft, occurrenceId: first, response: { kind: "choice", selectedOptionIds: ["yes"] }, updatedAt: "2026-07-16T10:01:00.000Z" });
  await saveTrainingSession(prepared.session);
  const durableDraft = await saveTrainingSessionDraft(edited, null);
  const finalization = new AlgorithmsInterviewSimulationFinalizationGate().begin({ entries, session: prepared.session, frozenDraft: durableDraft, completedAt: "2026-07-16T10:45:00.000Z" });
  const commit = () => commitTrainingSessionFinalization({ session: finalization.session, attempts: finalization.attempts, reviewMutations: finalization.reviewMutations, result: finalization.result, cleanup: { kind: "training_session_draft", draft: durableDraft, submittedOccurrenceIds: [first] }, createdAt: finalization.result.completedAt });
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSessionResult(prepared.session.id) });
  await assert.rejects(commit);
  assert.notEqual(await getActiveMutationJournal(), null);
  assert.deepEqual(await getTrainingSessionResult(prepared.session.id), null);
  storage.setFailurePlan(null);
  await recoverPendingMutation();
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal((await getTrainingAttempts()).value.length, 1);
  assert.equal((await getReviewQueueItems()).value.length, 1);
  assert.equal(await getActiveTrainingSessionDraft(), null);
  assert.deepEqual(await getTrainingSessionResult(prepared.session.id), finalization.result);
});

test("finalization rejects an incomplete stored response instead of fabricating an answered attempt", () => {
  const { content, prepared } = prepare();
  const entries = getAlgorithmQuestionEntries(content.getGroups());
  const first = prepared.session.itemOrder[0]!.occurrenceId;
  assert.throws(() => finalizeAlgorithmsInterviewSimulation({ entries, session: prepared.session, frozenDraft: { ...prepared.draft, responsesByOccurrenceId: { [first]: { kind: "choice", selectedOptionIds: [] } } }, completedAt: "2026-07-16T10:45:00.000Z" }), /incomplete/);
});
