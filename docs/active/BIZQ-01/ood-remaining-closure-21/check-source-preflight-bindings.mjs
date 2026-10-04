// Whole-object/raw-source/currentness evidence only; not semantic certification.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateTrack, canonicalJson, sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const producer = fileURLToPath(new URL('../../../../../patternly-content/', packet));
const app = fileURLToPath(new URL('../../../../', packet));
const baseline = '32f785940a8e78bf65b507888b1d5f5d38fe2c00';
const old = JSON.parse(execFileSync('git', ['show', `${baseline}:docs/active/BIZQ-01/ood-remaining-closure-21/SOURCE-PREFLIGHT.json`], {cwd: app, maxBuffer: 16 * 1024 * 1024}));
const bytes = await readFile(new URL('SOURCE-PREFLIGHT.json', packet));
const ledger = JSON.parse(bytes);
assert.equal(old.items.length, 477);
assert.equal(canonicalJson(ledger.items.slice(0, 477)), canonicalJson(old.items));
assert.equal(ledger.items.length, 801);
assert.equal(ledger.scopeInventory.pendingQuestions, 0);
assert.equal(ledger.scopeInventory.pendingFiles, 0);
const track = await validateTrack({rootDirectory: producer, trackId: ledger.track.trackId});
assert.equal(track.track.contentVersion, ledger.track.contentVersion);
assert.equal(sha256(canonicalJson(track.questions)), ledger.track.questionSetSha256);
const byId = new Map(track.questions.map(q => [q.questionId, q]));
const files = new Map();
const seen = new Set();
const counts = {};
for (const item of ledger.items) {
  assert(!seen.has(item.questionId)); seen.add(item.questionId);
  const q = byId.get(item.questionId); assert(q);
  assert.equal(q.mentalUnitId, item.mentalUnitId);
  assert.equal(sha256(canonicalJson(q)), item.wholeQuestionSha256);
  assert(/^content\/object-oriented-design-interview\/[a-z_]+\/OOD-N0[5-9]-B\d{2}\.json$/.test(item.sourcePath));
  assert.equal(item.sourcePath, `content/${q.trackId}/${q.nodeId}/${q.mentalUnitId}.json`);
  if (!files.has(item.sourcePath)) files.set(item.sourcePath, {sha256: sha256(await readFile(new URL(`../../../../../patternly-content/${item.sourcePath}`, packet))), questions: new Map()});
  const source = files.get(item.sourcePath);
  assert.equal(source.sha256, item.sourceSha256);
  source.questions.set(item.questionId, item);
  counts[item.disposition] = (counts[item.disposition] ?? 0) + 1;
}
assert.equal(files.size, 45);
for (const [path, source] of files) {
  const sourceRows = JSON.parse(await readFile(new URL(`../../../../../patternly-content/${path}`, packet)));
  assert.deepEqual(sourceRows.map(q => q.questionId).sort(), [...source.questions.keys()].sort());
}
console.log(JSON.stringify({result: 'PASS', scope: 'Actual801 canonical whole-object hashes and45 raw-source bindings,477 prior records preserved; findings remain source-preflight judgements, not accepted source repairs', sourcePreflightSha256: sha256(bytes), priorLedgerCommit: baseline, preservedPriorRecords: 477, appendedRecords: 324, questionCount: seen.size, sourceFileCount: files.size, dispositionCounts: counts, questionSetSha256: ledger.track.questionSetSha256}, null, 2));
