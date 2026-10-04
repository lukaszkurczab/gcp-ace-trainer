// Compare actual verifier outputs and require the current code/proof snapshot.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from '../../../../../patternly-content/scripts/build.mjs';
const packet = fileURLToPath(new URL('./', import.meta.url));
const producer = resolve(packet, '../../../../../patternly-content');
const previousBytes = await readFile(resolve(packet, '../ood-node-closure-19/reason-amendment-19a/ROOT-MIGRATION.log'));
const currentBytes = await readFile(resolve(packet, 'ROOT-MIGRATION.log'));
const priorText = previousBytes.toString('utf8');
const previous = JSON.parse(priorText.slice(priorText.indexOf('{')));
const current = JSON.parse(currentBytes);
const summary = JSON.parse(await readFile(resolve(packet, 'ROOT-MIGRATION-SUMMARY.json')));
for (const [file, expected] of Object.entries(summary.inputHashes)) {
  assert.equal(sha256(await readFile(resolve(producer, file))), expected, 'Actual verifier/proof differs from executed snapshot');
}
assert.equal(previous.result, 'passed');
assert.equal(current.result, 'passed');
assert.equal(previous.semanticReplacementProof.replacements.length, 450);
assert.equal(current.semanticReplacementProof.replacements.length, 594);
assert.deepEqual(current.semanticReplacementProof.replacements.slice(0, 450), previous.semanticReplacementProof.replacements);
const bindings = JSON.parse(await readFile(resolve(packet, 'ROOT-FINAL-BINDINGS-v2.json')));
const additions = bindings.units.flatMap(u => u.identityActions)
  .filter(a => a.identityAction === 'replace_question_with_new_id')
  .map(({ beforeQuestionId, questionId }) => ({ beforeQuestionId, questionId }));
assert.deepEqual(current.semanticReplacementProof.replacements.slice(450), additions);
assert.deepEqual(current.sameIdCorrectionProof.questionIds, Array.from({ length: 18 }, (_, i) => `ood-n04-b05-i${String(i + 1).padStart(3, '0')}`));
const unchangedFields = ['counts', 'interactions', 'historicalCounts', 'tracks', 'approvedAdditionCount', 'reasonAmendmentProof', 'wordingCorrectionProof', 'replacementProof'];
for (const field of unchangedFields) assert.deepEqual(current[field], previous[field], `Prior ${field} changed`);
console.log(JSON.stringify({ verdict: 'PASS', scope: 'Actual executed migration output and current code/proof binding against accepted19a output; not focused-negative/producer/admission/native acceptance',
  priorLogSha256: sha256(previousBytes), currentLogSha256: sha256(currentBytes),
  preservedPriorSemanticMappings: 450, unchangedFields, newSemanticMappings: 144,
  separateSameIdCorrections: 18, preservedReasonCorrections: 25 }, null, 2));
