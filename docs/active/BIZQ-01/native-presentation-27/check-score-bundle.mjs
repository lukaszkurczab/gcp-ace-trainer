// Read-only acceptance check for the already-probed Babel output of this package.
// Bundle input stays private; output contains only booleans and its hash.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const bytes = readFileSync(process.argv[2]);
const text = bytes.toString('utf8');
const checks = {
  correctOnlyHelper: text.includes('return result.kind === "correct" ? result.earnedPoints : 0;'),
  examDerivedAccumulation: text.includes('overallPointsEarned += (0, _canonicalOverallScoreCredit.overallScoreCredit)(attempt.result);'),
  practiceOptionalDerived: text.includes('certificationPracticeOverallPoints = practiceReview.overallPointsEarned;'),
  genericDerivedPointsProp: text.includes('points: displayedPoints,'),
  codingPracticeDerived: text.includes('earned: result.overallPointsEarned,\n          max: normalizedDetails.points.max'),
  codingSimulationDerived: text.includes('earned: result.overallPointsEarned,\n          max: score.maxPoints'),
  progressHelperAtBothNumerators: text.split('_applicationCanonicalOverallScoreCredit.overallScoreCredit)(attempt.result)').length - 1 >= 2,
};
for (const [stage, present] of Object.entries(checks)) assert(present, `compiled_score_marker_missing:${stage}`);
const result = { checks, bundleSha256: createHash('sha256').update(bytes).digest('hex'), interpretation: 'Actual Babel transformed helper/caller wiring; not native partial proof' };
writeFileSync(process.argv[3], `${JSON.stringify(result, null, 2)}\n`);
console.log('PASS: actual compiled overall-score helper and consumer markers');
