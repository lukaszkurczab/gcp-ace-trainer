import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalJson, sha256, validateTrack } from '../../../../../patternly-content/scripts/build.mjs';

const packetDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packetDir, '../../../../../');
const contentRoot = path.join(repoRoot, 'patternly-content');
const priorPath = path.join(repoRoot, 'patternly/docs/active/BIZQ-01/ood-remaining-closure-21/SOURCE-PREFLIGHT.json');
const reportPath = path.join(packetDir, 'N07-CURRENT-SOURCE-OBSERVATIONS.json');
const prior = JSON.parse(await readFile(priorPath, 'utf8'));
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const validated = await validateTrack({ rootDirectory: contentRoot, trackId: 'object-oriented-design-interview' });
const actualTrack = {
  contentVersion: validated.track.contentVersion,
  questionCount: validated.questions.length,
  sourceFileCount: validated.sourceFiles.length,
  questionSetSha256: sha256(canonicalJson(validated.questions)),
};
assert.deepEqual(actualTrack, report.currentTrackBinding && {
  contentVersion: report.currentTrackBinding.contentVersion,
  questionCount: report.currentTrackBinding.questionCount,
  sourceFileCount: report.currentTrackBinding.sourceFileCount,
  questionSetSha256: report.currentTrackBinding.questionSetSha256,
});
const priorN07 = prior.items.filter((item) => item.mentalUnitId.startsWith('OOD-N07-'));
const reported = new Map(report.items.map((item) => [item.questionId, item]));
const current = validated.questions.filter((question) => question.mentalUnitId.startsWith('OOD-N07-'));
assert.equal(priorN07.length, 144);
assert.equal(current.length, 144);
assert.equal(reported.size, 144);
for (const fileBinding of report.files) {
  const absPath = path.join(contentRoot, fileBinding.sourcePath);
  const bytes = await readFile(absPath);
  assert.equal(sha256(bytes), fileBinding.rawSha256, `${fileBinding.file} raw SHA mismatch`);
  const questions = JSON.parse(bytes.toString('utf8'));
  assert.equal(questions.length, 18, `${fileBinding.file} question count mismatch`);
}
for (const priorItem of priorN07) {
  const actual = current.find((question) => question.questionId === priorItem.questionId);
  const row = reported.get(priorItem.questionId);
  assert.ok(actual, `Current source is missing ${priorItem.questionId}`);
  assert.ok(row, `Observation report is missing ${priorItem.questionId}`);
  const sourceBytes = await readFile(path.join(contentRoot, priorItem.sourcePath));
  const sourceSha256 = sha256(sourceBytes);
  const wholeQuestionSha256 = sha256(canonicalJson(actual));
  assert.equal(sourceSha256, priorItem.sourceSha256, `${priorItem.sourcePath} differs from prior raw-source binding`);
  assert.equal(wholeQuestionSha256, priorItem.wholeQuestionSha256, `${priorItem.questionId} differs from prior whole-object binding`);
  assert.equal(row.currentSourceSha256, sourceSha256, `${priorItem.questionId} observation raw-source binding differs`);
  assert.equal(row.currentWholeQuestionSha256, wholeQuestionSha256, `${priorItem.questionId} observation whole-object binding differs`);
  assert.equal(row.priorDisposition, priorItem.disposition, `${priorItem.questionId} prior disposition differs`);
}
console.log(JSON.stringify({ ...actualTrack, n07Questions: current.length, exactRawAndWholeObjectBindings: 144, sourceFiles: report.files.length }, null, 2));
