// One-time fixed source/proof activation after the recorded independent reviews.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile, lstat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const producer = new URL('../../../../../patternly-content/', packet);
const read = name => readFile(new URL(name, packet));
const designBytes = await read('PRODUCER-DESIGN-QA.json');
assert.equal(sha256(designBytes), '75e4e9b33cb871ccb8c000d5b69229535a03642942789af3b580228b0dfd31c1');
const design = JSON.parse(designBytes);
assert.equal(design.verdict, 'PASS');
assert.equal(sha256(await read(design.input.path)), design.input.sha256);
for (const input of Object.values(design.bindingsReviewed)) assert.equal(sha256(await read(input.path)), input.sha256);
const map = JSON.parse(await read('ROOT-N05-PRODUCER-MAP.json'));
assert.equal(map.sameIdCorrections.length, 153); assert.deepEqual(map.replacements, []);
const head = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:fileURLToPath(producer)}).toString().trim();
assert.equal(head, design.map.beforeProducerCommit);
const before = JSON.parse(await read('BEFORE-PRODUCTION.json'));
const catalogUrl = new URL('content/catalog.json', producer);
const catalog = JSON.parse(await readFile(catalogUrl));
assert.deepEqual(catalog, before.catalog);
const writes = [];
for (const source of map.sourceFiles) {
  const url = new URL(source.sourceFile, producer);
  const info = await lstat(url); assert(info.isFile() && !info.isSymbolicLink());
  assert.equal(sha256(await readFile(url)), source.beforeSourceSha256);
  const questions = map.sameIdCorrections.filter(item => item.sourceFile === source.sourceFile).map(item => item.currentQuestion);
  assert.equal(questions.length, 17);
  const bytes = Buffer.from(JSON.stringify(questions), 'utf8');
  assert.equal(sha256(bytes), source.sourceSha256);
  writes.push([url, bytes]);
}
const canonicalProofPath = 'evidence/business-quality/bizq-01-ood-node-closure-21.json';
const proofUrl = new URL(canonicalProofPath, producer);
assert.equal(await lstat(proofUrl).catch(error => {if(error.code === 'ENOENT') return undefined; throw error;}), undefined);
const proof = {schemaVersion:'patternly-bizq-semantic-replacement-v1',
  scope:'BIZQ-01 OOD source21, fixed nine-unit N05 cohort; 153 same-ID corrections and zero question replacements; not full-bank acceptance',
  trackId:'object-oriented-design-interview', beforeProducerCommit:head,
  beforeContentVersion:map.beforeContentVersion, contentVersion:map.contentVersion,
  beforeQuestionSetSha256:map.beforeQuestionSetSha256, questionSetSha256:map.questionSetSha256,
  sourceFiles:map.sourceFiles, replacements:[], sameIdCorrections:map.sameIdCorrections};
const proofBytes = Buffer.from(`${JSON.stringify(proof, null, 2)}\n`, 'utf8');
const nextCatalog = {...catalog, tracks:catalog.tracks.map(track => track.trackId === proof.trackId ? {...track,contentVersion:proof.contentVersion} : track)};
for (const [url, bytes] of writes) await writeFile(url, bytes);
await writeFile(catalogUrl, `${JSON.stringify(nextCatalog)}\n`);
await writeFile(proofUrl, proofBytes);
console.log(JSON.stringify({result:'ACTIVATED_FOR_VERIFICATION', scope:'Fixed153 source/proof activation only; no migration/consumer/admission acceptance',
  beforeProducerCommit:head, sourceFiles:writes.length, sameIdCorrections:153, replacements:0,
  proofPath:canonicalProofPath, proofSha256:sha256(proofBytes), contentVersion:proof.contentVersion, questionSetSha256:proof.questionSetSha256,
  designReviewSha256:sha256(designBytes)}, null, 2));
