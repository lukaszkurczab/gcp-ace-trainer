// Prospective exact hashes for the current proposal registry; no source writes.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateTrack, canonicalJson, sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const root = fileURLToPath(new URL('../../../../../patternly-content/', import.meta.url));
const manifestBytes = await readFile(new URL('N05-MANIFEST.json', packet));
assert.equal(sha256(manifestBytes), 'bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a');
const manifest = JSON.parse(manifestBytes);
const registry = JSON.parse(await readFile(new URL('ROOT-CURRENT-N05-INPUTS.json', packet)));
const track = await validateTrack({rootDirectory: root, trackId: manifest.trackId});
assert.equal(track.track.contentVersion, manifest.beforeContentVersion);
assert.equal(sha256(canonicalJson(track.questions)), manifest.beforeQuestionSetSha256);
const proposedById = new Map();
const sources = [];
for (const unit of manifest.units) {
  const input = registry.units.find(item => item.unit === unit.mentalUnitId);
  assert(input);
  const proposalBytes = await readFile(new URL(input.proposal, packet));
  assert.equal(sha256(proposalBytes), input.sha256);
  assert.equal(sha256(await readFile(new URL(input.frozenInput, packet))), input.sha256);
  const questions = JSON.parse(proposalBytes);
  assert.deepEqual(questions.map(q => q.questionId), unit.items.map(item => item.beforeQuestionId));
  for (const q of questions) {
    assert(!proposedById.has(q.questionId));
    proposedById.set(q.questionId, q);
  }
  sources.push({sourceFile: unit.sourceFile, nodeId: questions[0].nodeId, mentalUnitId: unit.mentalUnitId, beforeSourceSha256: unit.beforeSourceSha256, prospectiveSourceSha256: sha256(Buffer.from(JSON.stringify(questions), 'utf8')), questionCount: questions.length});
}
assert.equal(proposedById.size, 153);
const projected = track.questions.map(q => proposedById.get(q.questionId) ?? q);
const untouched = track.questions.filter(q => !proposedById.has(q.questionId));
assert.equal(untouched.length, 1260);
assert.equal(projected.length, 1413);
console.log(JSON.stringify({result: 'PASS', scope: 'Prospective source21 hash bindings under the frozen153 same-ID proposal hypothesis; no producer21/source/admission or semantic verdict', beforeContentVersion: track.track.contentVersion, beforeQuestionSetSha256: manifest.beforeQuestionSetSha256, prospectiveQuestionSetSha256: sha256(canonicalJson(projected)), sameIdHypothesisCount: proposedById.size, preservedOtherQuestionCount: untouched.length, preservedOtherQuestionsSha256: sha256(canonicalJson(untouched)), sourceSerialization: 'JSON.stringify parsed proposal array, no trailing newline', sourceFiles: sources}, null, 2));
