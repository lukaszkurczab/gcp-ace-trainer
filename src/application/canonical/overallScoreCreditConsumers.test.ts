import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const resultScreen = readFileSync("src/features/exam/ResultScreen.tsx", "utf8");
const codingPractice = readFileSync("src/features/practice/AlgorithmsPracticeSummaryScreen.tsx", "utf8");
const codingSimulation = readFileSync("src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx", "utf8");
const progressModel = readFileSync("src/features/home/tabs/progressTabModel.ts", "utf8");

test("result screens render validated overall credit rather than raw diagnostic points", () => {
  assert.match(resultScreen, /points=\{displayedPoints\}/);
  assert.match(resultScreen, /summary\.certificationExam\.overallPointsEarned/);
  assert.match(resultScreen, /summary\.certificationPracticeOverallPoints/);
  assert.match(resultScreen, /try\s*\{\s*const practiceReview = await getCertificationPracticeReviewProjection[\s\S]*?catch\s*\{[\s\S]*?optional exact-points projection is unavailable/);
  assert.doesNotMatch(resultScreen, /certificationPractice && \([^)]*certificationPracticeOverallPoints/);

  assert.match(codingPractice, /earned: result\.overallPointsEarned/);
  assert.match(codingPractice, /result\.completionKind === "completed" && result\.overallPointsEarned !== null/);
  assert.match(codingSimulation, /earned: result\.overallPointsEarned/);
});

test("both progress point numerators use the shared correct-only credit policy", () => {
  assert.match(progressModel, /import \{ overallScoreCredit \} from "\.\.\/\.\.\/\.\.\/application\/canonical\/overallScoreCredit"/);
  assert.match(progressModel, /earned: score\.earned \+ overallScoreCredit\(attempt\.result\)/);
  assert.match(progressModel, /attempts\.reduce\(\(total, attempt\) => total \+ overallScoreCredit\(attempt\.result\), 0\)/);
});
