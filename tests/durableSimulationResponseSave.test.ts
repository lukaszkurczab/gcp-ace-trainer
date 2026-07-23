import assert from "node:assert/strict";
import test from "node:test";

import {
  getAlgorithmsInterviewSimulationEntry,
  getAlgorithmsSimulationProjection,
  recoverAlgorithmsSimulationSaveAndContinue,
  saveAlgorithmsSimulationResponse,
  saveAlgorithmsSimulationResponseAndContinue,
  startAlgorithmsSession,
} from "../src/application/algorithms";
import { composeTrainingLifecycleUseCases } from "../src/application/bootstrap";
import { validateBundledContent } from "../src/content/application";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import { getActiveTrainingSessionDraft } from "../src/storage/repositories";
import { STORAGE_KEYS } from "../src/storage/keys";
import {
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmResponse,
} from "../src/tracks/algorithms";
import { installMemoryStorage } from "./journalTestSupport";

const NOW = "2026-07-23T10:00:00.000Z";

function completeResponseFor(item: ReturnType<ReturnType<typeof getAlgorithmContentCatalog>["getItems"]>[number]): AlgorithmResponse {
  if (isAlgorithmChoiceQuestion(item)) return { kind: "choice", selectedOptionIds: item.interaction.acceptedOptionIds };
  if (isAlgorithmOrderingQuestion(item)) return { kind: "ordering", orderedSubgoalIds: item.interaction.canonicalOrder };
  if (isAlgorithmComplexityQuestion(item)) {
    return {
      kind: "complexity",
      selectedValuesByDimension: Object.fromEntries(item.interaction.checkedDimensions.map((dimension) => [dimension, item.interaction.acceptedValuesByDimension[dimension]![0]!])),
    };
  }
  throw new Error("Unsupported Algorithms simulation item.");
}

test("Algorithms Interview Simulation saves one response durably across lifecycle reload", async () => {
  await validateBundledContent();
  installMemoryStorage();
  const clock = { now: () => NOW };
  composeTrainingLifecycleUseCases({ wallClock: clock });

  const entry = getAlgorithmsInterviewSimulationEntry();
  const started = await startAlgorithmsSession({
    modeId: entry.modeId,
    requestedLength: entry.requestedLength,
    scope: { simulationProfileId: entry.profileId },
  });
  const occurrence = started.session.itemOrder[0]!;
  const response = completeResponseFor(getAlgorithmContentCatalog().getItemById(occurrence.item.itemId));

  await saveAlgorithmsSimulationResponse({ occurrenceId: occurrence.occurrenceId, response });
  assert.equal((await getActiveTrainingSessionDraft())?.revision, 2);

  const reloadedLifecycle = composeTrainingLifecycleUseCases({ wallClock: clock });
  assert.equal((await reloadedLifecycle.resumeActiveSession()).id, started.session.id);
  const reloadedDraft = await getActiveTrainingSessionDraft();
  const reloadedProjection = await getAlgorithmsSimulationProjection();

  assert.equal(reloadedDraft?.revision, 2);
  assert.deepEqual(reloadedDraft?.responsesByOccurrenceId[occurrence.occurrenceId], response);
  assert.equal(reloadedProjection.durableDraftRevision, 2);
  assert.equal(reloadedProjection.navigator[0]?.answered, true);
});

test("Algorithms save-and-continue is one application command for the active non-final occurrence", async () => {
  await validateBundledContent();
  installMemoryStorage();
  composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });

  const entry = getAlgorithmsInterviewSimulationEntry();
  const started = await startAlgorithmsSession({
    modeId: entry.modeId,
    requestedLength: entry.requestedLength,
    scope: { simulationProfileId: entry.profileId },
  });
  const occurrence = started.session.itemOrder[0]!;
  const response = completeResponseFor(getAlgorithmContentCatalog().getItemById(occurrence.item.itemId));

  const continued = await saveAlgorithmsSimulationResponseAndContinue({ occurrenceId: occurrence.occurrenceId, response });
  assert.equal(continued.position.current, 2);
  assert.equal((await getActiveTrainingSessionDraft())?.responsesByOccurrenceId[occurrence.occurrenceId] !== undefined, true);
});

test("Algorithms save-and-continue verifies its durable response revision before publishing occurrence two", async () => {
  await validateBundledContent();
  installMemoryStorage();
  composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });

  const entry = getAlgorithmsInterviewSimulationEntry();
  const started = await startAlgorithmsSession({
    modeId: entry.modeId,
    requestedLength: entry.requestedLength,
    scope: { simulationProfileId: entry.profileId },
  });
  const occurrence = started.session.itemOrder[0]!;
  const response = completeResponseFor(getAlgorithmContentCatalog().getItemById(occurrence.item.itemId));

  const projection = await saveAlgorithmsSimulationResponseAndContinue({ occurrenceId: occurrence.occurrenceId, response });
  const draft = await getActiveTrainingSessionDraft();

  assert.equal(projection.position.current, 2);
  assert.equal(projection.durableDraftRevision, 2);
  assert.equal(draft?.revision, 2);
  assert.deepEqual(draft?.responsesByOccurrenceId[occurrence.occurrenceId], response);
});

test("Algorithms save-and-continue recovery advances a durable response without a second draft revision", async () => {
  await validateBundledContent();
  const storage = installMemoryStorage();
  const lifecycle = composeTrainingLifecycleUseCases({ wallClock: { now: () => NOW } });

  const entry = getAlgorithmsInterviewSimulationEntry();
  const started = await startAlgorithmsSession({
    modeId: entry.modeId,
    requestedLength: entry.requestedLength,
    scope: { simulationProfileId: entry.profileId },
  });
  const occurrence = started.session.itemOrder[0]!;
  const response = completeResponseFor(getAlgorithmContentCatalog().getItemById(occurrence.item.itemId));
  storage.resetCounters();
  storage.setFailurePlan({ kind: "fail_on_key_write_occurrence", key: STORAGE_KEYS.trainingSession(started.session.id), occurrence: 2 });

  await assert.rejects(() => saveAlgorithmsSimulationResponseAndContinue({ occurrenceId: occurrence.occurrenceId, response }));
  const durableAfterFailure = await getActiveTrainingSessionDraft();
  assert.equal(durableAfterFailure?.revision, 2);
  assert.deepEqual(durableAfterFailure?.responsesByOccurrenceId[occurrence.occurrenceId], response);
  assert.equal((await lifecycle.getSimulationOperationState(started.session)).kind, "save_and_continue_advance_recovery");

  storage.setFailurePlan(null);
  const recovered = await recoverAlgorithmsSimulationSaveAndContinue({ occurrenceId: occurrence.occurrenceId });
  const durableAfterRecovery = await getActiveTrainingSessionDraft();

  assert.equal(recovered.position.current, 2);
  assert.equal(durableAfterRecovery?.revision, 2);
  assert.deepEqual(durableAfterRecovery?.responsesByOccurrenceId[occurrence.occurrenceId], response);
});
