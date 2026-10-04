import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const packet = path.resolve('patternly/docs/active/BIZQ-01/ood-remaining-closure-22');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const units = {
  B01: {
    input: '259cc143512849ffc408879253d4ee622494938a9b8172ee9b59917d1ce890eb',
    keys: {
      1: 'Delegate rate calculation through one policy operation; keep statement processing common.',
      2: 'Select regional eligibility through one policy operation in the unchanged claim flow.',
      3: 'Call the account-selected allocation algorithm behind a shared operation.',
      5: 'Depend on one recognition operation implemented by the customer-selected engine.',
      6: 'Use one meter-selected policy operation for priority calculation.',
      7: 'Call the campaign-selected points policy through the common calculation contract.',
      8: 'Select stop ranking from the route plan; leave dispatch common.',
      9: 'Invoke campaign-specific fees through the common receipt calculation boundary.',
      10: 'Keep accessibility ranking agency-selected; share trip search, rendering, and fare lookup.',
      11: 'Delegate scoring to the season-selected policy; keep reward settlement common.',
      12: 'Let the account plan supply one urgency-ranking policy to shared triage.',
      13: 'Call the selected client’s redaction policy through the shared intake operation.',
      15: 'Call the seller program’s fee policy during common checkout.',
      17: 'Select the contract’s labor estimator behind a shared operation.',
      18: 'Select the region’s ranking policy; keep dispatch and delivery proof common.',
    },
  },
  B03: {
    input: '6cb88be1e41095f3d02f548c0b9531d3db7061aff597f868eb5eee019e2bfcdd',
    keys: {
      1: 'Capture components and policy version in a reviewable command; validate before applying.',
      3: 'Record asset ID and before/after values so approved undo restores the same asset.',
      4: 'Queue territory and expiry; recheck authority at execution and record the actor and approved scope.',
      5: 'Record the battery and both aircraft IDs; undo only if its replacement assignment still matches.',
      6: 'Queue the approved recipient; recheck consent at execution before disclosure.',
      7: 'Bind grading to the attempt’s exercise and scoring-policy versions.',
      8: 'Queue manager, rationale, and scope; approve only after controls pass, otherwise leave pending.',
      9: 'Carry the proposed recording and stable-segment map; replace only after review approval.',
      10: 'Bind the grant to approval ID and expiry; retries return the same grant.',
      11: 'Queue the exact revision and seal only if it remains current and immutable.',
      12: 'Use a distinct payout ID per order; same-order retries return its record.',
      13: 'Carry sequence and platform; apply only the next sequence, preserving current platform on rejection.',
      14: 'Queue meter and interval; check overlap against current reservations before commit.',
      15: 'Use one command for both volunteers and shifts; validate both before either assignment moves.',
      16: 'Carry base revision with route edit; report conflict rather than overwrite on mismatch.',
      17: 'Queue character and reward; apply only after campaign-phase validation succeeds.',
      18: 'Bind shipment, prior owner, proposed carrier, and temperature limits; transfer only on acceptance.',
    },
  },
  B05: {
    input: '51db77ba7356e461968b9550ed6f808341f4510fea5c2e372602180ab4299608',
    keys: {
      1: 'Coordinate revocation order across registry, door policy, and audit; keep their rules with each owner.',
      2: 'Coordinate validation, carrier lookup, rendering, and status; keep each module’s rules local.',
      3: 'Route move calls through one coordinator; reservation, capacity, fee, and notice owners keep policy.',
      4: 'Let a maintenance coordinator sequence disablement, technician assignment, and panel update.',
      5: 'Coordinate catalog retirement and curriculum removal while progress stays on the stable lesson ID.',
      6: 'Have one coordinator freeze the revision, then route export, indexing, and notice to their owners.',
      7: 'Route the owner/deadline change and follow-up calls through one coordinator.',
      8: 'Validate price/stock with the listing owner, then coordinate search, seller, and feed updates.',
      9: 'Coordinate vendor allocation and status around the original request ID and delivery promise.',
      10: 'Coordinate approved plot transfer across allocation, directory, and audit while preserving boundary and history.',
      12: 'Sequence capacity and expiry, operator notice, and grid update through one reservation coordinator.',
      13: 'Route the accepted asset revision through one coordinator to catalog, search, and rights owners.',
      14: 'Distribute approved territory and expiry to catalog, rights, reporting, and notice through one workflow.',
      16: 'Coordinate consent and named-recipient routing across scheduling, transmission, and audit owners.',
      17: 'Route the attempt ID and captured versions to progress and analytics without consumer-specific storage logic.',
      18: 'Send one attributed scope to both control owners; approve only after both accept.',
    },
  },
};

const clone = (x) => JSON.parse(JSON.stringify(x));
const modified = {};
for (const [unit, spec] of Object.entries(units)) {
  const filename = `N06-${unit}.json`;
  const filepath = path.join(packet, 'review-inputs', `N06-${unit}-${unit === 'B05' ? 'v2' : 'v1'}.json`);
  const bytes = readFileSync(filepath);
  assert.equal(sha(bytes), spec.input, `${filename} differs from the authorized frozen input`);
  const questions = JSON.parse(bytes.toString('utf8'));
  assert.equal(questions.length, 18);
  for (const [numberText, keyText] of Object.entries(spec.keys)) {
    const number = Number(numberText);
    const qid = `ood-n06-${unit.toLowerCase()}-i${String(number).padStart(3, '0')}`;
    const q = questions.find((item) => item.questionId === qid);
    assert(q, `missing ${qid}`);
    const before = clone(q);
    const keyed = q.interaction.options.find((option) => option.optionId === q.answer.optionId);
    assert(keyed, `${qid}: no option matches answer.optionId`);
    keyed.text = keyText;
    const after = clone(q);
    const oldOptions = before.interaction.options;
    const newOptions = after.interaction.options;
    assert.deepEqual(newOptions.map((option) => option.optionId), oldOptions.map((option) => option.optionId), `${qid}: option ID changed`);
    const newWithoutKeyText = clone(after);
    const oldWithoutKeyText = clone(before);
    newWithoutKeyText.interaction.options.forEach((option) => {
      if (option.optionId === q.answer.optionId) option.text = '__KEY_TEXT__';
    });
    oldWithoutKeyText.interaction.options.forEach((option) => {
      if (option.optionId === q.answer.optionId) option.text = '__KEY_TEXT__';
    });
    assert.deepEqual(newWithoutKeyText, oldWithoutKeyText, `${qid}: changed a non-key field`);
  }
  const output = Buffer.from(`${JSON.stringify(questions, null, 2)}\n`);
  writeFileSync(path.join(packet, 'proposals', filename), output);
  modified[unit] = { questionsChanged: Object.keys(spec.keys).length, sha256: sha(output), IDs: Object.keys(spec.keys).map((n) => `ood-n06-${unit.toLowerCase()}-i${String(n).padStart(3, '0')}`) };
}
console.log(JSON.stringify({ result: 'KEY-ONLY-CORRECTIONS-WRITTEN', units: modified }, null, 2));
