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
  assert.match(resultScreen, /const practiceReview = await getCertificationPracticeReviewProjection\(capturedRequestKey\)/);
  assert.match(resultScreen, /certificationPracticeOverallPoints = practiceReview\.overallPointsEarned/);
  assert.doesNotMatch(resultScreen, /certificationPractice && \([^)]*certificationPracticeOverallPoints/);

  assert.match(codingPractice, /earned: result\.overallPointsEarned/);
  assert.match(codingPractice, /result\.completionKind === "completed" && result\.overallPointsEarned !== null/);
  assert.match(codingSimulation, /earned: result\.overallPointsEarned/);
});

test("progress policy owners use shared correct-only credit and UI imports no scorer", () => {
  const projection = readFileSync("src/application/canonical/canonicalProgressEvidence.ts", "utf8");
  const coding = readFileSync("src/application/coding-interview/codingProgressProjection.ts", "utf8");
  assert.match(projection, /earned: score\.earned \+ overallScoreCredit\(attempt\.result\)/);
  assert.match(coding, /attempts\.reduce\(\(total, attempt\) => total \+ overallScoreCredit\(attempt\.result\), 0\)/);
  for (const path of ["src/features/home/tabs/HomeTab.tsx", "src/features/home/tabs/homeTabModel.ts"]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /scoreCanonicalQuestion|overallScoreCredit|qualifyPackageAttempts|selectSingleCase|isActiveReviewQueueEntry|getApplicationCurrentTime/);
  }
  assert.doesNotMatch(progressModel, /overallScoreCredit|scoreCanonicalQuestion|qualifyPackageAttempts|calculateEffectiveness|buildLearningPriority/);
});
