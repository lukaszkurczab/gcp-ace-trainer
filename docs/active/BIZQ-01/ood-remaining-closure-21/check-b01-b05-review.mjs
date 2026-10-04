// Reproduces current B01/B05 bounded review bindings, not a semantic verdict.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const read = async name => readFile(new URL(name, packet));
const manifestBytes = await read('N05-MANIFEST.json');
const predecessors = new Map(JSON.parse(manifestBytes).units.flatMap(unit => unit.items.map(item => [item.beforeQuestionId, item])));
const result = [];
for (const unit of ['B01', 'B05']) {
  const report = JSON.parse(await read(`SEMANTIC-${unit}-v2.json`));
  assert.equal(report.verdict, 'PASS');
  assert.equal(report.manifestSha256, sha256(manifestBytes));
  assert.equal(report.contractSha256, sha256(await read('N05-CONTRACT.json')));
  assert.equal(report.specSha256, sha256(await read('../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md')));
  assert.equal(report.canonicalGuidelinesSha256, sha256(await read('../../../../../docs/07-content-guidelines.md')));
  const bytes = await read(report.proposalPath);
  assert.equal(sha256(bytes), report.proposalSha256);
  assert.equal(sha256(await read(`proposals/N05-${unit}.json`)), report.proposalSha256);
  const byId = new Map(JSON.parse(bytes).map(q => [q.questionId, q]));
  assert.equal(byId.size, 17);
  if (unit === 'B01') {
    assert.equal(report.items.length, 17);
    const seen = new Set();
    for (const item of report.items) {
      assert.equal(item.proposed, item.before);
      assert(predecessors.has(item.before));
      assert(!seen.has(item.proposed)); seen.add(item.proposed);
      assert.equal(item.identityAction, 'preserve_question_id');
      assert.equal(sha256(JSON.stringify(byId.get(item.proposed))), item.proposedWholeObjectSha256);
    }
    result.push({unit, currentPass: 17, reviewedCurrentWholeObjects: 17});
  } else {
    const priorBytes = await read('review-inputs/N05-B05-v1.json');
    assert.equal(sha256(priorBytes), report.previousProposalSha256);
    const priorReviewBytes = await read('SEMANTIC-B05-v1.json');
    assert.equal(sha256(priorReviewBytes), report.previousReviewJsonSha256);
    const priorPass = new Set(JSON.parse(priorReviewBytes).passIds);
    const priorById = new Map(JSON.parse(priorBytes).map(q => [q.questionId, q]));
    assert.equal(report.changedObjectsReviewed.length, 2);
    assert.equal(report.unchangedObjectsReusedFromPriorPass.length, 15);
    const seen = new Set();
    for (const item of [...report.changedObjectsReviewed, ...report.unchangedObjectsReusedFromPriorPass]) {
      assert(!seen.has(item.questionId)); seen.add(item.questionId);
      assert.equal(sha256(JSON.stringify(byId.get(item.questionId))), item.wholeObjectSha256);
    }
    for (const item of report.unchangedObjectsReusedFromPriorPass) {
      assert(priorPass.has(item.questionId));
      assert.equal(JSON.stringify(byId.get(item.questionId)), JSON.stringify(priorById.get(item.questionId)));
    }
    assert.deepEqual(report.changedObjectsReviewed.map(item => item.questionId), ['ood-n05-b05-i006', 'ood-n05-b05-i014']);
    for (const item of report.changedObjectsReviewed) {
      assert.equal(item.verdict, 'PASS');
      assert.equal(item.identityAction, 'preserve_question_id');
    }
    result.push({unit, currentPass: 17, reviewedCurrentCorrections: 2, exactPriorPassReused: 15});
  }
}
console.log(JSON.stringify({result: 'PASS', scope: 'Current bounded34 verdict/raw-input/fingerprint/preservation bindings only; final153 cross review remains separate', units: result}, null, 2));
