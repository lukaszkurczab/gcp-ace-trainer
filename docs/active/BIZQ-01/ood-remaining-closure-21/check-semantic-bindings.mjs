// Checks evidence bindings, not the correctness of a semantic verdict.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canonicalJson, sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const reportName = process.argv[2];
assert(/^SEMANTIC-[A-Za-z0-9-]+\.json$/.test(reportName ?? ''), 'Literal semantic report filename required');
const reportBytes = await readFile(new URL(reportName, packet));
const report = JSON.parse(reportBytes);
assert.equal(report.verdict, 'PASS');
const manifestBytes = await readFile(new URL('N05-MANIFEST.json', packet));
assert.equal(sha256(manifestBytes), report.manifestSha256);
const manifest = JSON.parse(manifestBytes);
const predecessors = new Map(manifest.units.flatMap(unit => unit.items.map(item => [item.beforeQuestionId, item])));
const proposals = new Map();
for (const [name, expected] of Object.entries(report.proposalHashes)) {
  assert(/^N05-B0[1-9]\.json$/.test(name));
  const bytes = await readFile(new URL(`proposals/${name}`, packet));
  assert.equal(sha256(bytes), expected, `${name}: proposal changed`);
  const frozenBytes = await readFile(new URL(`review-inputs/${name.replace('.json', '-v1.json')}`, packet));
  assert.equal(sha256(frozenBytes), expected, `${name}: frozen input mismatch`);
  for (const question of JSON.parse(bytes)) {
    assert(!proposals.has(question.questionId));
    proposals.set(question.questionId, question);
  }
}
const seen = new Set();
for (const item of report.items) {
  assert(!seen.has(item.questionId));
  seen.add(item.questionId);
  const proposal = proposals.get(item.questionId);
  const predecessor = predecessors.get(item.predecessorQuestionId);
  assert(proposal && predecessor);
  // Reviewer current-object fingerprints use compact insertion-order JSON;
  // predecessor fingerprints use the fixed manifest's canonical serialization.
  assert.equal(sha256(JSON.stringify(proposal)), item.currentWholeObjectSha256);
  assert.equal(sha256(canonicalJson(predecessor.beforeQuestion)), item.predecessorWholeObjectSha256);
  assert.equal(item.assessment, 'PASS');
  assert.equal(proposal.questionId, predecessor.beforeQuestionId);
  assert.equal(item.identityAction, 'PRESERVE_QUESTION_ID');
}
assert.equal(seen.size, proposals.size);
assert.equal(seen.size, report.wholeObjectCount);
for (const [file, expected] of [
  ['N05-CONTRACT.json', report.contractSha256],
  ['../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md', report.bizqSpecSha256],
  ['../../../../../docs/07-content-guidelines.md', report.canonicalGuidelineSha256],
]) assert.equal(sha256(await readFile(new URL(file, packet))), expected, file);
console.log(JSON.stringify({result: 'PASS', scope: 'Evidence currentness and identity bindings only; semantic conclusions belong to independent reviewer', report: reportName, reportSha256: sha256(reportBytes), questionCount: seen.size, proposalHashes: report.proposalHashes}, null, 2));
