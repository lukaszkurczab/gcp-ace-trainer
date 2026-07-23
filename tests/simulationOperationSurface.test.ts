import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync("src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx", "utf8");
const panel = readFileSync("src/features/simulation/operation/SimulationOperationPanel.tsx", "utf8");
const lifecycle = readFileSync("src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "utf8");
const facade = readFileSync("src/application/algorithms/algorithmsSessionFacade.ts", "utf8");

test("simulation operation surface renders only declared state actions and never a generic retry", () => {
  assert.match(screen, /operation\.kind === "saving"/);
  assert.match(screen, /operation\.kind === "save_failed" \|\| operation\.kind === "stale_revision"/);
  assert.match(screen, /operation\.kind === "navigation_failed" \|\| operation\.kind === "save_and_continue_advance_recovery"/);
  assert.match(screen, /operation\.kind === "finalization_journal_failed" \|\| operation\.kind === "materialization_failed"/);
  assert.match(screen, /id: "simulation-keep-editing", label: "Keep editing"/);
  assert.match(screen, /id: operation\.error\.allowedAction === "retry_same_command" \? "simulation-finish" : "simulation-recover"/);
  assert.doesNotMatch(screen, /id: "retry"/);
  assert.doesNotMatch(screen, /label: "Try again", onPress: retry/);
  assert.match(panel, /accessibilityLiveRegion="polite"/);
  assert.match(panel, /ActivityIndicator/);
  assert.match(lifecycle, /resumeEditableSimulationAfterSaveFailure/);
  assert.match(lifecycle, /operation\.kind !== "save_failed" && operation\.kind !== "stale_revision"/);
  assert.match(facade, /operation\.error\.allowedAction !== "recover"/);
});
