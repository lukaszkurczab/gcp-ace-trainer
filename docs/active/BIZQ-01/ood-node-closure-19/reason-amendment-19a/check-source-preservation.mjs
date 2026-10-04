import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const packet = fileURLToPath(new URL('./', import.meta.url));
const repo = resolve(packet, '../../../../../../patternly-content');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const readBound = async (file, sha) => {
  const bytes = await readFile(resolve(packet, file));
  assert.equal(hash(bytes), sha, `${file} fixed bytes`);
  return JSON.parse(bytes);
};
const manifest = await readBound('MANIFEST.json', '725750aa6c8ebdba357f2e892e7c6aa94c45202a97c677d41284b8d063e199bf');
const proposals = await readBound('PROPOSED-REASONS.json', '76fd88c540bd1b6ffe83eb2034cbf565b2ac030454e80511e56a341555edfa15');
const before = JSON.parse(await readFile(resolve(packet, 'BEFORE-PRODUCTION.json')));
assert.equal(before.producerBefore, '1d024bb62328bdb81490d713dc41a6f7d155e9b6');
const base = file => execFileSync('git', ['show', `${before.producerBefore}:${file}`], { cwd: repo, maxBuffer: 64 * 1024 * 1024 });
const changes = new Map(proposals.map(p => [p.questionId, p]));
assert.equal(changes.size, 25);
assert.deepEqual(proposals.map(p => p.questionId), manifest.items.map(i => i.itemId));
const sources = new Set(manifest.items.map(i => i.sourcePath));
assert.equal(sources.size, 3);
const allowed = new Set(['content/catalog.json', ...sources]);
const files = execFileSync('git', ['ls-files', 'content'], { cwd: repo, encoding: 'utf8' }).trim().split('\n').sort();
assert.deepEqual(files, before.files.map(f => f.path).sort());
const oldCatalog = JSON.parse(base('content/catalog.json'));
const catalog = JSON.parse(await readFile(resolve(repo, 'content/catalog.json')));
const trackId = 'object-oriented-design-interview';
const version = 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-19a';
assert.deepEqual(catalog, { ...oldCatalog, tracks: oldCatalog.tracks.map(t => t.trackId === trackId ? { ...t, contentVersion: version } : t) });
let preservedFiles = 0, globalQuestions = 0, oodQuestions = 0, changed = 0, unchangedInTouchedFiles = 0;
const reviewedSources = [];
for (const file of before.files) {
  const bytes = await readFile(resolve(repo, file.path));
  const oldBytes = base(file.path);
  assert.equal(hash(oldBytes), file.sha256, `${file.path} baseline`);
  if (!allowed.has(file.path)) {
    assert.equal(hash(bytes), file.sha256, `${file.path} unchanged`);
    preservedFiles++;
  }
  if (catalog.tracks.some(t => file.path.startsWith(`content/${t.trackId}/`)) && file.path.endsWith('.json')) {
    const value = JSON.parse(bytes);
    if (Array.isArray(value)) {
      globalQuestions += value.length;
      if (file.path.startsWith(`content/${trackId}/`)) oodQuestions += value.length;
    }
  }
  if (sources.has(file.path)) {
    const old = JSON.parse(oldBytes);
    const expected = old.map(q => {
      const proposal = changes.get(q.questionId);
      if (!proposal) { unchangedInTouchedFiles++; return q; }
      assert.equal(q.feedback.reason, proposal.beforeReason, `${q.questionId} before Reason`);
      changed++;
      return { ...q, feedback: { ...q.feedback, reason: proposal.reason } };
    });
    assert.deepEqual(JSON.parse(bytes), expected, `${file.path} only approved Reason changed`);
    assert.deepEqual(bytes, Buffer.from(JSON.stringify(expected)), `${file.path} canonical source bytes`);
    reviewedSources.push({ path: file.path, beforeSha256: hash(oldBytes), sha256: hash(bytes), objects: old.length });
  }
}
for (const proof of before.historyProofs) {
  assert.equal(hash(base(proof.path)), proof.sha256);
  assert.equal(hash(await readFile(resolve(repo, proof.path))), proof.sha256, `${proof.path} immutable`);
}
assert.equal(before.historyProofs.length, 10);
assert.equal(preservedFiles, 950);
assert.equal(changed, 25);
assert.equal(unchangedInTouchedFiles, 29);
assert.equal(globalQuestions, 16077);
assert.equal(oodQuestions, 1413);
const result = { result: 'PASS', beforeProducerCommit: before.producerBefore, contentVersion: version,
  changedReasonOnlyObjects: changed, unchangedObjectsInTouchedFiles: unchangedInTouchedFiles,
  unchangedOtherOodObjects: oodQuestions - changed, unchangedOtherGlobalObjects: globalQuestions - changed,
  preservedTrackedContentFiles: preservedFiles, canonicalQuestionCount: globalQuestions, oodQuestionCount: oodQuestions,
  reviewedSources, immutableProofs: before.historyProofs,
  limits: 'Actual source preservation only; semantic acceptance, migration, consumer, admission and full-area evidence remain separate.' };
await writeFile(resolve(packet, 'ROOT-SOURCE-PRESERVATION.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ result: result.result, changed, preservedFiles, unchangedInTouchedFiles, globalQuestions, oodQuestions }));
