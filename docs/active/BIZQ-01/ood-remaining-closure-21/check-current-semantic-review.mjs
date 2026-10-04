// Checks every final review binding; the semantic verdict belongs to independent QA.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const read = name => readFile(new URL(name, packet));
const reportBytes = await read('SEMANTIC-CURRENT-FINAL-QA.json');
const report = JSON.parse(reportBytes);
assert.equal(report.verdict, 'PASS');
assert.deepEqual(report.findings, []);
assert.equal(report.criteria.specPath, '../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md');
const registryBytes = await read('ROOT-CURRENT-N05-INPUTS.json');
assert.equal(sha256(registryBytes), report.registry.sha256);
const registry = JSON.parse(registryBytes);
const manifestBytes = await read('N05-MANIFEST.json');
assert.equal(sha256(manifestBytes), report.criteria.manifestSha256);
const manifest = JSON.parse(manifestBytes);
for (const [name, expected] of [
  ['N05-CONTRACT.json', report.criteria.contractSha256],
  ['../../../specs/business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md', report.criteria.specSha256],
  ['../../../../../docs/07-content-guidelines.md', report.criteria.canonicalGuidelinesSha256],
]) assert.equal(sha256(await read(name)), expected, name);
const before = new Map(manifest.units.flatMap(unit => unit.items.map(item => [item.beforeQuestionId, item.beforeQuestion])));
const current = new Map();
const currentOptions = new Set();
const oldOptions = new Set([...before.values()].flatMap(q => q.interaction.options.map(o => o.optionId)));
for (const input of registry.units) {
  const bytes = await read(input.proposal);
  assert.equal(sha256(bytes), input.sha256);
  assert.equal(sha256(await read(input.frozenInput)), input.sha256);
  const review = report.unitReviews.find(item => item.unit === input.unit);
  assert(review);
  assert.equal(review.proposalSha256, input.sha256);
  assert.equal(review.verdict, 'PASS');
  const questions = JSON.parse(bytes);
  assert.equal(questions.length, review.questionCount);
  for (const q of questions) {
    assert(!current.has(q.questionId)); current.set(q.questionId, q);
    assert.equal(q.interaction.options.length, 4);
    for (const o of q.interaction.options) {
      assert(!oldOptions.has(o.optionId)); assert(!currentOptions.has(o.optionId)); currentOptions.add(o.optionId);
    }
  }
}
const seen = new Set();
for (const item of report.items) {
  assert(!seen.has(item.questionId)); seen.add(item.questionId);
  const q = current.get(item.questionId); const old = before.get(item.beforeQuestionId);
  assert(q && old); assert.equal(item.questionId, item.beforeQuestionId);
  assert.equal(sha256(JSON.stringify(q)), item.wholeObjectSha256CompactInsertionOrder);
  assert.equal(item.answerOptionId, q.answer.optionId);
  assert.equal(item.beforeAnswerOptionId, old.answer.optionId);
  assert.equal(item.identityAction, 'preserve_question_id');
  assert.equal(item.answerOptionFreshAgainstBefore, true);
}
assert.equal(seen.size, 153); assert.equal(current.size, 153); assert.equal(currentOptions.size, 612);
console.log(JSON.stringify({result: 'PASS', scope: 'Root actual current153 report/raw/frozen/whole-object/identity bindings; not producer/native acceptance',
  reportSha256: sha256(reportBytes), reportMarkdownSha256: sha256(await read('SEMANTIC-CURRENT-FINAL-QA.md')),
  registrySha256: sha256(registryBytes), questionCount: seen.size, uniqueCurrentOptionIds: currentOptions.size, oldOptionOverlap: 0}, null, 2));
