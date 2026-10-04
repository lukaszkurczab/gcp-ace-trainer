import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateQuestion, scoreQuestion} from '../../../../../patternly-content/scripts/content/question-contract.mjs';

// Independent source integration check. Reviewed files are evidence inputs;
// this script neither admits content nor changes the producer proof contract.
const packet = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(packet, '../../../../../patternly-content');
const pre = JSON.parse(await readFile(path.join(packet, 'PREFLIGHT-MANIFEST.json'), 'utf8'));
const before = JSON.parse(await readFile(path.join(packet, 'BEFORE-PRODUCTION.json'), 'utf8'));
const frozen = JSON.parse(await readFile(path.join(packet, 'ROOT-PROPOSAL-FINAL.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const base = file => execFileSync('git', ['show', `${before.producerBefore}:${file}`], {cwd: repo, maxBuffer: 64 * 1024 * 1024});
const [output, ...reviewedNames] = process.argv.slice(2);
assert.ok(output, 'Provide output report and eight frozen reviewed payload filenames in B01–B08 order.');
assert.equal(reviewedNames.length, 8);
const fixedUnits = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08'].map(unit => `OOD-N02-${unit}`);
const fixedReviewedNames = ["REVIEWED-B01-v3.json", "REVIEWED-B02-v5.json", "REVIEWED-B03-v4.json", "REVIEWED-B04-v3.json", "REVIEWED-B05-v6.json", "REVIEWED-B06-v2.json", "REVIEWED-B07-v4.json", "REVIEWED-B08-v5.json"];
assert.deepEqual(reviewedNames, fixedReviewedNames, 'Accepted frozen payload order/names');
const fixedReviewedHashes = ["9ce1b243551a97356bcab6ae093df0a463dc2f9e978d96456329b555e8efff58", "2990cbe047af3761b107b19460346b8020747a0b5621521c08f32a5d6189b8bf", "1e2ffd502acc9ee098e51c80633151ec2b9009590455b2726701a733c97fe795", "61b729c8d159391deef0a1d0cebd17b3e19e5ee339fde49c9a586d579819fd33", "ac6e20b5eb4d2602ddf294185809d49465de9444d1f725330e5793dcfe4b455c", "46ba770ef4ebeb58c0f4a7e0dc312afb89c4d5efd17474612276276b6975249b", "781ed817fdddc5e6533e46136ecbae1aef116ab53ae7b4ed2f3c9cf7d198881e", "d0e6d4dce12cbb74caf50d7fc41d7637abd4f133e6fe22016a0555c355a17169"];
assert.deepEqual(frozen.units.map(unit => unit.proposalSha256), fixedReviewedHashes, 'Fixed accepted payload hashes');
assert.equal(before.producerBefore, 'c2112775a1a9e8173202b921c027b9b43f754d74');
assert.deepEqual(pre.units.map(unit => unit.unit), fixedUnits, 'Fixed eight unit identities');
assert.deepEqual(pre.units.map(unit => unit.path), fixedUnits.map(unit => `content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/${unit}.json`), 'Fixed eight source paths');
assert.deepEqual(frozen.units.map(unit => unit.unit), fixedUnits, 'Final frozen-set identities');
assert.equal(frozen.result, 'PASS');
assert.equal(frozen.questionCount, 152);
assert.equal(before.producerBefore, pre.contentHead);
const allowed = new Set(['content/catalog.json', ...pre.units.map(unit => unit.path)]);
const currentFiles = execFileSync('git', ['ls-files', 'content'], {cwd: repo, encoding: 'utf8'}).trim().split('\n').sort();
assert.deepEqual(currentFiles, before.sources.map(item => item.path).sort(), 'Tracked content inventory changed');
let preservedFiles = 0;
let total = 0;
const catalog = JSON.parse(await readFile(path.join(repo, 'content/catalog.json'), 'utf8'));
const oldCatalog = JSON.parse(base('content/catalog.json'));
assert.equal(oldCatalog.tracks.find(track => track.trackId === 'object-oriented-design-interview')?.contentVersion, 'object-oriented-design-interview-authoring-v2026.10.03-bizq01-16', 'Baseline catalog/preflight lineage');
const expectedVersion = 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-17';
assert.equal(catalog.tracks.find(track => track.trackId === 'object-oriented-design-interview')?.contentVersion, expectedVersion, 'Source integration stage: OOD17 catalog identity is required for this check');
assert.deepEqual(catalog, {...oldCatalog, tracks: oldCatalog.tracks.map(track => track.trackId === 'object-oriented-design-interview' ? {...track, contentVersion: expectedVersion} : track)});
for (const item of before.sources) {
  const bytes = await readFile(path.join(repo, item.path));
  assert.equal(hash(base(item.path)), item.sha256, `Baseline binding: ${item.path}`);
  if (!allowed.has(item.path)) {assert.equal(hash(bytes), item.sha256, item.path); preservedFiles++;}
  if (catalog.tracks.some(track => item.path.startsWith(`content/${track.trackId}/`)) && item.path.endsWith('.json')) {
    const value = JSON.parse(bytes);
    if (Array.isArray(value)) total += value.length;
  }
}
const units = [];
let questions = 0;
let scoringCases = 0;
for (let index = 0; index < pre.units.length; index++) {
  const unit = pre.units[index];
  const reviewedBytes = await readFile(path.join(packet, reviewedNames[index]));
  assert.equal(hash(reviewedBytes), frozen.units[index].proposalSha256, `Accepted payload binding: ${unit.unit}`);
  const reviewed = JSON.parse(reviewedBytes).map(item => item.question ?? item);
  const oldBytes = base(unit.path);
  assert.equal(hash(oldBytes), unit.sourceSha256);
  const old = JSON.parse(oldBytes);
  // The eight predecessor files are compact JSON without a trailing newline.
  assert.deepEqual(Buffer.from(JSON.stringify(old)), oldBytes, 'Exact predecessor serialization');
  assert.deepEqual(old, unit.items.map(item => item.oldObject));
  const currentBytes = await readFile(path.join(repo, unit.path));
  const current = JSON.parse(currentBytes);
  assert.equal(current.length, 19);
  assert.deepEqual(current, reviewed, `Reviewed integration: ${unit.unit}`);
  assert.deepEqual(current.map(question => question.questionId), unit.items.map(item => item.newItemId));
  for (const question of current) {
    assert.equal(question.mentalUnitId, unit.unit);
    assert.equal(validateQuestion(question).valid, true, question.questionId);
    assert.equal(old.some(item => item.questionId === question.questionId), false);
    questions++;
    for (const options of [question.interaction.options, [...question.interaction.options].reverse()]) {
      const reordered = {...question, interaction: {...question.interaction, options}};
      for (const option of options) {
        const result = scoreQuestion(reordered, {type: 'choice_single', optionId: option.optionId});
        const correct = option.optionId === question.answer.optionId;
        assert.equal(result.status, correct ? 'correct' : 'incorrect');
        assert.equal(result.earnedPoints, correct ? 1 : 0);
        scoringCases++;
      }
    }
  }
  units.push({unit: unit.unit, path: unit.path, reviewedFile: reviewedNames[index], reviewedSha256: hash(reviewedBytes), beforeSha256: hash(oldBytes), currentSha256: hash(currentBytes), questions: current.length});
}
const immutable = [];
for (const item of before.immutableProofs) {
  assert.equal(hash(await readFile(path.join(repo, item.path))), item.sha256, item.path);
  assert.equal(hash(base(item.path)), item.sha256);
  immutable.push(item);
}
assert.equal(total, 16077);
assert.equal(questions, 152);
assert.equal(preservedFiles, 945);
const result = {result: 'PASS', producerBefore: before.producerBefore, contentVersion: expectedVersion, canonicalQuestionCount: total, preservedQuestionObjects: total - questions, preservedTrackedContentFiles: preservedFiles, validatedActualSourceQuestions: questions, scoringCases, units, immutableProofs: immutable, limits: 'Exact reviewed-source integration and preservation only; semantic review, admission, consumers, native and whole BIZQ acceptance remain separate evidence.'};
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({result: result.result, validatedActualSourceQuestions: questions, scoringCases, preservedTrackedContentFiles: preservedFiles}));
