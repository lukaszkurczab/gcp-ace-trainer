import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resultScreen = readFileSync("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx", "utf8");
const surface = readFileSync("src/features/simulation/SimulationSessionSurface.tsx", "utf8");
const card = readFileSync("src/components/Card.tsx", "utf8");

test("Interview Simulation review renders the immutable completed feedback projection by occurrence", () => {
  assert.match(resultScreen, /reviewItems: result\.feedbackItems/);
  assert.match(resultScreen, /runtimeIdentity: \{ sessionId: result\.sessionId \}/);
  assert.match(surface, /sessionId \? runtimeSelectors\.summary\.feedbackItem\(sessionId, item\.occurrenceId\) : undefined/);
  assert.match(surface, /rootTestID=\{runtimeIdentity \? runtimeSelectors\.simulation\.root\(runtimeIdentity\.sessionId\) : undefined\}/);
  assert.doesNotMatch(surface, /<View>\s*<SessionShell/);
  assert.match(card, /collapsable=\{testID \? false : undefined\}/);
  assert.match(surface, /PracticeFeedbackBlock feedback=\{\{ details: item\.details, reason: item\.reason, result: item\.correctness \}\}/);
  assert.doesNotMatch(resultScreen, /loadTrainingAttempts|composeCommittedAlgorithmPracticeFeedback/);
});
