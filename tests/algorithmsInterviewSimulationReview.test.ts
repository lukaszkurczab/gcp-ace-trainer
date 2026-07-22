import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resultScreen = readFileSync("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx", "utf8");
const surface = readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8");

test("Interview Simulation review renders the immutable completed feedback projection by occurrence", () => {
  assert.match(resultScreen, /reviewItems: result\.feedbackItems/);
  assert.match(surface, /runtimeSelectors\.summary\.feedbackItem\(sessionId \?\? "simulation-result", item\.occurrenceId\)/);
  assert.match(surface, /PracticeFeedbackBlock feedback=\{\{ details: item\.details, reason: item\.reason, result: item\.correctness \}\}/);
  assert.doesNotMatch(resultScreen, /loadTrainingAttempts|composeCommittedAlgorithmPracticeFeedback/);
});
