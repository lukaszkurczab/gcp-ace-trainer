// Read-only probe of the exact existing closed-history serialization contract.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canonicalJson, sha256} from '../../../../../patternly-content/scripts/build.mjs';

const packet = new URL('./', import.meta.url);
const producer = new URL('../../../../../patternly-content/', import.meta.url);
const manifestBytes = await readFile(new URL('N06-MANIFEST.json', packet));
const manifest = JSON.parse(manifestBytes);
assert.equal(manifest.units.length, 10);
const files = [];
for (const unit of manifest.units) {
  const raw = await readFile(new URL(unit.sourcePath, producer));
  assert.equal(sha256(raw), unit.sourceSha256);
  const actual = JSON.parse(raw);
  assert.equal(actual.length, 18);
  assert.equal(unit.beforeItems.length, 18);
  for (const entry of unit.beforeItems) {
    const question = actual.find(item => item.questionId === entry.questionId);
    assert(question);
    assert.equal(canonicalJson(question), canonicalJson(entry.beforeQuestion));
  }
  const reconstructed = Buffer.from(JSON.stringify(
    [...actual].sort((a, b) => a.questionId.localeCompare(b.questionId)),
  ));
  assert(raw.equals(reconstructed), unit.sourcePath + ': predecessor byte reconstruction');
  files.push({sourcePath:unit.sourcePath, sha256:sha256(raw), questionCount:actual.length,
    serialization:'questionId lexical order; JSON.stringify; no trailing newline'});
}
console.log(JSON.stringify({result:'PASS', scope:'Existing v21 source and fixed private predecessor serialization only; no new-map, semantic or producer-design acceptance', manifestSha256:sha256(manifestBytes), files}, null, 2));
