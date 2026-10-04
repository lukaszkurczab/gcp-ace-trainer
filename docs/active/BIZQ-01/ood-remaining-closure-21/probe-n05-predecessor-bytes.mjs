// Real source-byte probe of the proposed same-ID reconstruction shape.
// This models the private validator operation; it does not invoke producer21.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const manifestBytes = await readFile(new URL('N05-MANIFEST.json', packet));
assert.equal(sha256(manifestBytes), 'bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a');
const manifest = JSON.parse(manifestBytes);
const results = [];
for (const unit of manifest.units) {
  const sourceBytes = await readFile(new URL(`../../../../../patternly-content/${unit.sourceFile}`, packet));
  assert.equal(sha256(sourceBytes), unit.beforeSourceSha256);
  const proposed = JSON.parse(await readFile(new URL(`proposals/${unit.mentalUnitId.replace('OOD-', '')}.json`, packet)));
  const beforeByCurrentId = new Map(unit.items.map(item => [item.beforeQuestionId, item.beforeQuestion]));
  assert.equal(proposed.length, 17);
  const reconstructed = proposed.map(q => {
    const before = beforeByCurrentId.get(q.questionId);
    assert(before, 'Probe is restricted to the current same-ID hypothesis');
    return before;
  }).sort((a, b) => a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0);
  const bytes = Buffer.from(JSON.stringify(reconstructed), 'utf8');
  assert(bytes.equals(sourceBytes), `${unit.mentalUnitId}: predecessor byte mismatch`);
  assert.notEqual(sha256(Buffer.concat([bytes, Buffer.from('\n')])), unit.beforeSourceSha256);
  results.push({unit: unit.mentalUnitId, sourceFile: unit.sourceFile, beforeSourceSha256: unit.beforeSourceSha256, questionCount: reconstructed.length, byteExact: true});
}
console.log(JSON.stringify({result: 'PASS', scope: 'Nine real N05 predecessor raw files reconstructed from frozen before objects under the current same-ID proposal hypothesis; not producer21, identity approval or admission', serialization: 'Map exact before objects, lexical questionId sort, JSON.stringify without trailing newline', questionCount: 153, units: results}, null, 2));
