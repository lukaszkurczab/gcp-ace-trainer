import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const packet = fileURLToPath(new URL('./', import.meta.url));
const app = path.resolve(packet, '../../../../..');
const before = JSON.parse(readFileSync(path.join(packet, 'BEFORE-CONSUMER.json')));
assert.equal(before.applicationBefore, 'c4dd44c546dbeffe77c58bea181286cc44fb09fe');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const proposalBytes = readFileSync(path.join(packet, 'PROPOSED-REASONS.json'));
assert.equal(hash(proposalBytes), '76fd88c540bd1b6ffe83eb2034cbf565b2ac030454e80511e56a341555edfa15');
const corrections = new Map(JSON.parse(proposalBytes).map(p => [p.questionId, p]));
assert.equal(corrections.size, 25);
const oldBytes = file => execFileSync('git', ['show', `${before.applicationBefore}:${file}`], { cwd: app, maxBuffer: 64 * 1024 * 1024 });
let unaffectedArtifacts = 0;
for (const file of before.files) {
  assert.equal(hash(oldBytes(file.path)), file.sha256);
  if (file.path.includes('/canonical-content/') && file.path.endsWith('.json') &&
      !file.path.endsWith('content-lock.json') && !file.path.endsWith('object-oriented-design-interview.json')) {
    assert.equal(hash(readFileSync(path.join(app, file.path))), file.sha256);
    unaffectedArtifacts++;
  }
  if (file.path.endsWith('release.lock.historical-0024.json')) assert.equal(hash(readFileSync(path.join(app, file.path))), file.sha256);
}
assert.equal(unaffectedArtifacts, 8);
const artifactPath = 'src/content/generated/canonical-content/object-oriented-design-interview.json';
const old = JSON.parse(oldBytes(artifactPath));
const bytes = readFileSync(path.join(app, artifactPath));
const current = JSON.parse(bytes);
assert.equal(old.questions.length, 1413);
assert.equal(current.questions.length, 1413);
let changed = 0;
const expected = old.questions.map(q => {
  const correction = corrections.get(q.questionId);
  if (!correction) return q;
  assert.equal(q.feedback.reason, correction.beforeReason);
  changed++;
  return { ...q, feedback: { ...q.feedback, reason: correction.reason } };
});
assert.equal(changed, 25);
assert.deepEqual(current.questions, expected, 'all current runtime objects match reviewed Reason-only change');
const metadata = o => Object.fromEntries(Object.entries(o).filter(([key]) => !['questions', 'contentVersion'].includes(key)));
assert.deepEqual(metadata(current), metadata(old));
assert.equal(current.contentVersion, 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-19a');
const report = { result: 'PASS', unchangedArtifacts: 8, unchangedOodObjects: 1388, changedReasonOnlyObjects: 25,
  allQuestionAndOptionIds: 'unchanged', historicalLock: 'byte-exact', artifactSha256: hash(bytes),
  scope: 'Actual consumer artifact preservation; focused runtime behavior and exact admission are separate gates.' };
writeFileSync(path.join(packet, 'ROOT-CONSUMER-PRESERVATION.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
