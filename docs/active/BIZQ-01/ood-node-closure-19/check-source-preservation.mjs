import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validateQuestion, scoreQuestion } from '../../../../../patternly-content/scripts/content/question-contract.mjs';

const packet = fileURLToPath(new URL('./', import.meta.url));
const repo = resolve(packet, '../../../../../patternly-content');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifestBytes = await readFile(resolve(packet, 'MANIFEST.json'));
assert.equal(hash(manifestBytes), 'c344367f12072c110761664825bd95c6f40334eea89296cb56e9787ab847fe73');
const manifest = JSON.parse(manifestBytes);
const before = JSON.parse(await readFile(resolve(packet, 'BEFORE-PRODUCTION.json')));
assert.equal(before.producerBefore, '90a1d83859c2be83c5266ffe981f487d3c29aeeb');
const frozenBytes = await readFile(resolve(packet, 'ROOT-PROPOSAL-FINAL.json'));
assert.equal(hash(frozenBytes), 'd95decaaa9d1f5f7f29e89f1366a13c0fc14c930664af16d5c056f5413de639f');
const frozen = JSON.parse(frozenBytes);
assert.equal(frozen.verdict, 'PASS'); assert.equal(frozen.questionCount, 162);
assert.equal(manifest.units.length, 9); assert.equal(frozen.units.length, 9);
const base = file => execFileSync('git', ['show', `${before.producerBefore}:${file}`], { cwd: repo, maxBuffer: 64 * 1024 * 1024 });
const allowed = new Set(['content/catalog.json', ...manifest.units.map(u => u.sourcePath)]);
const currentFiles = execFileSync('git', ['ls-files', 'content'], { cwd: repo, encoding: 'utf8' }).trim().split('\n').sort();
assert.deepEqual(currentFiles, before.sources.map(f => f.path).sort());
const catalog = JSON.parse(await readFile(resolve(repo, 'content/catalog.json')));
const oldCatalog = JSON.parse(base('content/catalog.json'));
const version = 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-19';
const trackId = 'object-oriented-design-interview';
assert.equal(oldCatalog.tracks.find(t => t.trackId === trackId).contentVersion, 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-17');
assert.deepEqual(catalog, { ...oldCatalog, tracks: oldCatalog.tracks.map(t => t.trackId === trackId ? { ...t, contentVersion: version } : t) });
let preservedFiles = 0, globalQuestions = 0, oodQuestions = 0;
for (const file of before.sources) {
  const bytes = await readFile(resolve(repo, file.path));
  assert.equal(hash(base(file.path)), file.sha256, `Baseline ${file.path}`);
  if (!allowed.has(file.path)) { assert.equal(hash(bytes), file.sha256, `Preserved ${file.path}`); preservedFiles++; }
  if (catalog.tracks.some(t => file.path.startsWith(`content/${t.trackId}/`)) && file.path.endsWith('.json')) {
    const value = JSON.parse(bytes);
    if (Array.isArray(value)) { globalQuestions += value.length; if (file.path.startsWith(`content/${trackId}/`)) oodQuestions += value.length; }
  }
}
let scoringCases = 0;
const units = [];
for (const [index, unit] of manifest.units.entries()) {
  const accepted = frozen.units[index]; assert.equal(accepted.unit, unit.unitId);
  const bytes = await readFile(resolve(packet, 'proposals', `${unit.unitId}.json`));
  assert.equal(hash(bytes), accepted.proposalSha256);
  const reviewed = JSON.parse(bytes);
  const currentBytes = await readFile(resolve(repo, unit.sourcePath));
  const current = JSON.parse(currentBytes);
  const oldBytes = base(unit.sourcePath); assert.equal(hash(oldBytes), unit.sourceSha256);
  assert.deepEqual(Buffer.from(JSON.stringify(JSON.parse(oldBytes))), oldBytes);
  assert.deepEqual(current, reviewed, `Actual reviewed source ${unit.unitId}`);
  assert.equal(current.length, 18);
  assert.deepEqual(current.map(q => q.questionId), unit.items.map(i => i.proposedQuestionId));
  assert(!current.some(q => unit.items.some(i => i.oldQuestionId === q.questionId)));
  for (const q of current) {
    assert.equal(validateQuestion(q).valid, true, q.questionId);
    assert.equal(q.mentalUnitId, unit.unitId);
    for (const options of [q.interaction.options, [...q.interaction.options].reverse()]) for (const option of options) {
      const result = scoreQuestion({ ...q, interaction: { ...q.interaction, options } }, { type: 'choice_single', optionId: option.optionId });
      const correct = option.optionId === q.answer.optionId;
      assert.equal(result.status, correct ? 'correct' : 'incorrect'); assert.equal(result.earnedPoints, correct ? 1 : 0); scoringCases++;
    }
  }
  units.push({ unit: unit.unitId, sourcePath: unit.sourcePath, reviewedSha256: hash(bytes), beforeSourceSha256: hash(oldBytes), sourceSha256: hash(currentBytes), questions: current.length });
}
for (const proof of before.immutableProofs) {
  assert.equal(hash(base(proof.path)), proof.sha256);
  assert.equal(hash(await readFile(resolve(repo, proof.path))), proof.sha256, proof.path);
}
assert.equal(before.immutableProofs.length, 8);
assert.equal(globalQuestions, 16077); assert.equal(oodQuestions, 1413); assert.equal(preservedFiles, 944); assert.equal(scoringCases, 1296);
const result = { result: 'PASS', producerBefore: before.producerBefore, contentVersion: version, canonicalQuestionCount: globalQuestions, oodQuestionCount: oodQuestions, changedReviewedQuestions: 162, preservedOtherGlobalObjects: globalQuestions - 162, preservedOtherOodObjects: oodQuestions - 162, preservedTrackedContentFiles: preservedFiles, scoringCases, units, immutableProofs: before.immutableProofs, limits: 'Actual reviewed-source integration and preservation only; separate semantic, build, consumer, admission, native and full-area evidence is required.' };
await writeFile(resolve(packet, 'ROOT-SOURCE-PRESERVATION.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ result: result.result, questions: 162, scoringCases, preservedFiles, preservedOtherOodObjects: result.preservedOtherOodObjects, preservedOtherGlobalObjects: result.preservedOtherGlobalObjects }));
