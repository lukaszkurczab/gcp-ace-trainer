// Reproduces the frozen v1 review bindings and current v2 reuse boundary.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const report = JSON.parse(await readFile(new URL('SEMANTIC-B02-B04-v1.json', packet)));
assert.equal(report.verdict, 'REVISE');
const manifestBytes = await readFile(new URL('N05-MANIFEST.json', packet));
assert.equal(sha256(manifestBytes), report.manifestSha256);
const before = new Map(JSON.parse(manifestBytes).units.flatMap(unit => unit.items.map(item => [item.beforeQuestionId, item.beforeQuestion])));
const frozen = new Map();
for (const [name, hash] of Object.entries(report.frozenProposalHashes)) {
  assert(/^review-inputs\/N05-B0[234]-v1\.json$/.test(name));
  const bytes = await readFile(new URL(name, packet));
  assert.equal(sha256(bytes), hash);
  for (const q of JSON.parse(bytes)) {
    assert(!frozen.has(q.questionId));
    frozen.set(q.questionId, q);
  }
}
const revisions = [];
for (const item of report.items) {
  assert.equal(sha256(JSON.stringify(frozen.get(item.questionId))), item.currentWholeObjectSha256);
  assert.equal(sha256(JSON.stringify(before.get(item.predecessorQuestionId))), item.predecessorWholeObjectSha256);
  assert(['PASS', 'REVISE'].includes(item.verdict));
  if (item.verdict === 'REVISE') revisions.push(item.questionId);
}
assert.equal(report.items.length, 51);
assert.equal(frozen.size, 51);
assert.deepEqual(revisions, ['ood-n05-b02-i010', 'ood-n05-b03-i017']);
let preserved = 0;
for (const unit of ['B02', 'B03', 'B04']) {
  const current = JSON.parse(await readFile(new URL(`proposals/N05-${unit}.json`, packet)));
  for (const q of current) {
    const unchanged = JSON.stringify(q) === JSON.stringify(frozen.get(q.questionId));
    assert.equal(unchanged, !revisions.includes(q.questionId));
    if (unchanged) preserved++;
  }
}
assert.equal(preserved, 49);
const currentReport = JSON.parse(await readFile(new URL('SEMANTIC-B02-B04-v2.json', packet)));
assert.equal(currentReport.verdict, 'PASS');
assert.equal(currentReport.manifestSha256, report.manifestSha256);
const currentById = new Map();
for (const [name, hash] of Object.entries(currentReport.proposalHashes)) {
  assert(/^review-inputs\/N05-B0[234]-v[12]\.json$/.test(name));
  const bytes = await readFile(new URL(name, packet));
  assert.equal(sha256(bytes), hash);
  const proposalName = name.replace('review-inputs/', 'proposals/').replace(/-v[12]\.json$/, '.json');
  assert.equal(sha256(await readFile(new URL(proposalName, packet))), hash);
  for (const q of JSON.parse(bytes)) currentById.set(q.questionId, q);
}
assert.equal(currentById.size, 51);
assert.equal(currentReport.items.length, 51);
const currentSeen = new Set();
for (const item of currentReport.items) {
  assert(!currentSeen.has(item.questionId));
  currentSeen.add(item.questionId);
  assert.equal(item.verdict, 'PASS');
  assert.equal(item.identityAction, 'PRESERVE_QUESTION_ID');
  assert.equal(sha256(JSON.stringify(currentById.get(item.questionId))), item.currentWholeObjectFingerprintSha256);
}
console.log(JSON.stringify({result: 'PASS', scope: 'Frozen v1 evidence, actual v2 preservation and independent current51 verdict bindings; not final153 cross-unit or source acceptance', frozenQuestions: 51, currentUnchangedPassQuestions: preserved, independentlyReviewedCorrections: revisions, currentPassQuestions: currentSeen.size}, null, 2));
