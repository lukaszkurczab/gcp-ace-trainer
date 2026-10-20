import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const examReview = readFileSync("src/features/exam/ExamReviewScreen.tsx", "utf8");
const algorithmsPracticeReview = readFileSync("src/features/practice/AlgorithmsPracticeReviewScreen.tsx", "utf8");
const algorithmsSimulationReview = readFileSync("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx", "utf8");
const designSimulationReview = readFileSync("src/features/simulation/DesignInterviewSimulationScreens.tsx", "utf8");

test("review headers use the shared back link and name the exact result destination", () => {
  assert.match(examReview, /navigation\.popTo\(ROUTES\.RESULT, \{ sessionId: requestKey \}\)/);
  assert.match(examReview, /<ReviewLoadingSkeleton destinationLabel=\{t\("Result"\)\} onBack=\{onBack\} \/>/);
  assert.match(examReview, /<BackLink destinationLabel=\{t\("Result"\)\} onPress=\{backToResult\} testID=\{runtimeSelectors\.practiceReview\.result\(\)\} \/>/);

  assert.match(algorithmsPracticeReview, /navigation\.popTo\(ROUTES\.ALGORITHMS_PRACTICE_SUMMARY, \{ sessionId \}\)/);
  assert.match(algorithmsPracticeReview, /<BackLink destinationLabel=\{t\("Session result"\)\} onPress=\{backToResult\} testID=\{runtimeSelectors\.practiceReview\.result\(\)\} \/>/);

  assert.match(algorithmsSimulationReview, /navigation\.popTo\(ROUTES\.ALGORITHMS_INTERVIEW_SIMULATION_SUMMARY, \{ sessionId: route\.params\.sessionId \}\)/);
  assert.match(algorithmsSimulationReview, /<BackLink destinationLabel=\{t\("Simulation result"\)\} onPress=\{backToResult\} testID=\{runtimeSelectors\.practiceReview\.result\(\)\} \/>/);

  assert.match(designSimulationReview, /navigation\.navigate\(ROUTES\.DESIGN_INTERVIEW_SIMULATION_RESULT, \{ sessionId: result\.sessionId \}\)/);
  assert.match(designSimulationReview, /<Screen backAction=\{\{ destinationLabel: t\("Simulation result"\), onPress: \(\) => navigation\.navigate\(ROUTES\.DESIGN_INTERVIEW_SIMULATION_RESULT, \{ sessionId: result\.sessionId \}\) \}\}/);
});
