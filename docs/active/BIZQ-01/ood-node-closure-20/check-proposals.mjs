// Schema/scoring/identity bindings only; semantics and ID meaning need independent review.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validateQuestion, scoreQuestion } from '../../../../../patternly-content/scripts/content/question-contract.mjs';
const packet = fileURLToPath(new URL('./', import.meta.url));
const producer = resolve(packet, '../../../../../patternly-content');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifestBytes = await readFile(resolve(packet, 'MANIFEST.json'));
assert.equal(hash(manifestBytes), '74f929fef0122d1d75412e07d6b86ab2b634056dd0ed0a98a7051baca7e0eec0');
const manifest = JSON.parse(manifestBytes);
const requested = process.argv.slice(2);
const unitNames = requested.length ? requested : manifest.files.map(u => u.mentalUnitId);
assert.equal(new Set(unitNames).size, unitNames.length);
const identities = new Map();
for (const file of ['AUTHOR-NOTES-B01-B04.json', 'AUTHOR-NOTES-B05-B09.json']) {
  const ownerUnits = file.includes('B01') ? manifest.files.slice(0, 4) : manifest.files.slice(4);
  if (!ownerUnits.some(u => unitNames.includes(u.mentalUnitId))) continue;
  const notes = JSON.parse(await readFile(resolve(packet, file)));
  for (const item of notes.items) {
    assert(!identities.has(item.beforeQuestionId));
    identities.set(item.beforeQuestionId, item);
  }
}
const results = [];
let optionCases = 0;
for (const unitName of unitNames) {
  const u = manifest.files.find(u => u.mentalUnitId === unitName);
  assert(u, 'Unknown unit');
  const sourceBytes = await readFile(resolve(producer, u.path));
  assert.equal(hash(sourceBytes), u.sha256, 'Baseline source changed before proposal acceptance');
  const old = JSON.parse(sourceBytes);
  const bytes = await readFile(resolve(packet, 'proposals', `${unitName}.json`));
  const questions = JSON.parse(bytes);
  assert.equal(questions.length, 18);
  const ids = new Set();
  let replaced = 0, retained = 0, soleLongestCorrect = 0;
  const exactReasonMatchesKey = [];
  for (const [i, q] of questions.entries()) {
    const expected = u.items[i];
    const note = identities.get(expected.itemId);
    assert(note && ['learningObjective', 'decisiveFact', 'nearestAlternative', 'changedCondition', 'identityReason'].every(key => typeof note[key] === 'string' && note[key].trim()), 'Missing per-item evidence');
    assert.deepEqual(old[i], expected.oldQuestion, 'Current whole object differs from frozen manifest');
    assert.equal(note.mentalUnitId, unitName);
    assert.equal(note.questionId, q.questionId);
    const replacement = note.identityAction === 'replace_question_with_new_id';
    assert(replacement || note.identityAction === 'preserve_question_id');
    assert.equal(q.questionId, replacement ? expected.reservedReplacementId : expected.itemId);
    assert(!ids.has(q.questionId)); ids.add(q.questionId);
    for (const field of ['trackId', 'nodeId', 'mentalUnitId', 'difficulty']) assert.deepEqual(q[field], old[i][field]);
    assert.equal(q.interaction.type, old[i].interaction.type);
    assert.equal(q.interaction.scoringMethod, old[i].interaction.scoringMethod);
    const validation = validateQuestion(q);
    assert(validation.valid, `${q.questionId}: ${validation.errors.join('; ')}`);
    assert.deepEqual(note.sourceRefs, q.sourceRefs);
    if (replacement) {
      const prior = new Set(old[i].interaction.options.map(o => o.optionId));
      assert(q.interaction.options.every(o => !prior.has(o.optionId)), 'Replacement reuses retired option identity');
      replaced++;
    } else {
      // Retained primary semantics and any changed option identities require independent review.
      retained++;
    }
    const wrong = q.interaction.options.filter(o => o.optionId !== q.answer.optionId).map(o => o.optionId).sort();
    assert.deepEqual(q.feedback.messages.filter(m => m.kind === 'wrong_option').map(m => m.targetId).sort(), wrong);
    assert(!q.feedback.messages.some(m => m.targetId === q.answer.optionId), 'False error diagnosis on key');
    const words = s => s.trim().split(/\s+/u).length;
    const correct = q.interaction.options.find(o => o.optionId === q.answer.optionId);
    if (q.feedback.reason.trim() === correct.text.trim()) exactReasonMatchesKey.push(q.questionId);
    if (q.interaction.options.filter(o => o !== correct).every(o => words(correct.text) > words(o.text))) soleLongestCorrect++;
    for (const options of [q.interaction.options, [...q.interaction.options].reverse()]) {
      for (const option of options) {
        const scored = scoreQuestion({ ...q, interaction: { ...q.interaction, options } }, { type: 'choice_single', optionId: option.optionId });
        const accepted = option.optionId === q.answer.optionId;
        assert.equal(scored.status, accepted ? 'correct' : 'incorrect');
        assert.equal(scored.earnedPoints, accepted ? 1 : 0); optionCases++;
      }
    }
  }
  const groups = accessor => {
    const byText = new Map();
    for (const q of questions) {
      const text = accessor(q);
      const ids = byText.get(text) ?? [];
      ids.push(q.questionId); byText.set(text, ids);
    }
    return [...byText.values()].filter(ids => ids.length > 1);
  };
  results.push({ unit: unitName, proposalSha256: hash(bytes), count: 18, replaced, retained, advisory: {
    soleLongestCorrect, exactReasonMatchesKey, duplicateReasons: groups(q => q.feedback.reason),
    duplicateDetailsByField: Object.fromEntries(Object.keys(questions[0].feedback.details).map(key => [key, groups(q => q.feedback.details[key])]))
  } });
}
console.log(JSON.stringify({ verdict: 'PASS', scope: 'exact manifest/source binding, schema and declared identity-action structure, all-option score/reversal; not semantic/identity-meaning/admission/native acceptance. Style counts are warnings without rejection threshold.', manifestSha256: hash(manifestBytes), questionCount: results.length * 18, optionCases, units: results }, null, 2));
