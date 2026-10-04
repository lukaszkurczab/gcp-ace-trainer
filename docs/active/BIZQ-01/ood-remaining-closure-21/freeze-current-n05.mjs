// Fixed current review-input registry; no source activation or identity verdict.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const inputs = [
  ['B01', 'v2', 'ef632970851fd14d8e468c858c32ba9b0a4b96ae35cf3159c0a67b0f4047f174'],
  ['B02', 'v3', 'c7e250a944861b637e561d1293953bf031b9da1fc15f20a8c12060cab600eadd'],
  ['B03', 'v4', '98d7f3b25566afacac31944f5a7557fc03efacc3ba297aeacbd15789775df7af'],
  ['B04', 'v2', '8c12c1c740a1332aa5d3a554acafd81e76c273725d396e8915d8e02b14c48611'],
  ['B05', 'v2', 'b7cfa499a82d56e10a1619c09512f6a304ffb7cda11498175e55262e5928e409'],
  ['B06', 'v1', 'e401e6dc966a7abc0535a9b6bad350b562bb8837008d4fd03a957927a029c89d'],
  ['B07', 'v1', '87d1961108c1a24ceaf45385539badf72877aa87c0c5cd11cb956532c54e77ef'],
  ['B08', 'v1', 'bf6ae3b52c70f02239d5c957af81bfdb28a840e2331e9cfda12f02b9dec61d18'],
  ['B09', 'v1', 'e8b8b17b1b04a5f27e4ccc180564b12e62cf77dd78c24e0f556cb21ee5be944d'],
];
const manifestBytes = await readFile(new URL('N05-MANIFEST.json', packet));
assert.equal(sha256(manifestBytes), 'bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a');
const manifest = JSON.parse(manifestBytes);
const registry = [];
for (const [unit, version, hash] of inputs) {
  const proposal = `proposals/N05-${unit}.json`;
  const frozenInput = `review-inputs/N05-${unit}-${version}.json`;
  const bytes = await readFile(new URL(proposal, packet));
  assert.equal(sha256(bytes), hash, proposal);
  assert.equal(sha256(await readFile(new URL(frozenInput, packet))), hash, frozenInput);
  const before = manifest.units.find(item => item.mentalUnitId === `OOD-N05-${unit}`);
  assert.equal(sha256(await readFile(new URL(`../../../../../patternly-content/${before.sourceFile}`, packet))), before.beforeSourceSha256);
  const questions = JSON.parse(bytes);
  assert.equal(questions.length, 17);
  assert.deepEqual(questions.map(q => q.questionId), before.items.map(item => item.beforeQuestionId));
  registry.push({unit: before.mentalUnitId, proposal, frozenInput, sha256: hash, questionCount: questions.length});
}
console.log(JSON.stringify({result: 'PASS', scope: 'Fixed current153 proposal/raw-source/review-input bindings only; same-ID semantic approval is pending independent review', manifestSha256: sha256(manifestBytes), questionCount: 153, units: registry}, null, 2));
