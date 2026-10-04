import assert from 'node:assert/strict';
import { readFile, writeFile, lstat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const packet = fileURLToPath(new URL('./', import.meta.url));
const repo = path.resolve(packet, '../../../../../../patternly-content');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const bound = async (file, expected) => {
  const bytes = await readFile(path.join(packet, file));
  assert.equal(digest(bytes), expected, `${file} frozen bytes`);
  return JSON.parse(bytes);
};
const manifestSha = '725750aa6c8ebdba357f2e892e7c6aa94c45202a97c677d41284b8d063e199bf';
const proposalSha = '76fd88c540bd1b6ffe83eb2034cbf565b2ac030454e80511e56a341555edfa15';
const manifest = await bound('MANIFEST.json', manifestSha);
const proposals = await bound('PROPOSED-REASONS.json', proposalSha);
const semantic = JSON.parse(await readFile(path.join(packet, 'SEMANTIC-QA.json')));
assert.equal(semantic.verdict, 'PASS');
assert.equal(semantic.manifestSha256, manifestSha);
assert.equal(semantic.proposalSha256, proposalSha);
assert.equal(semantic.scope.itemsReviewed, 25);
const structure = JSON.parse(await readFile(path.join(packet, 'ROOT-PROPOSAL-STRUCTURE.json')));
assert.equal(structure.proposalSha256, proposalSha);
assert.equal(structure.scoringAndReversalCases, 200);
assert.match(structure.result, /^PASS/u);
const contract = JSON.parse(await readFile(path.join(packet, 'CONTRACT.json')));
// The canonical contract has already been written and reviewed; bind its actual bytes.
const contractPath = path.resolve(repo, '../docs/07-content-guidelines.md');
assert.equal(digest(await readFile(contractPath)), 'a84ef6bdeb3d8a35bfe38650ad750f0455e00898140c63e36a1647610dcdf8b9');
assert.ok(contract);
const { sha256 } = await import(pathToFileURL(path.join(repo, 'scripts/build.mjs')));
const baseCommit = '1d024bb62328bdb81490d713dc41a6f7d155e9b6';
assert.equal(manifest.beforeProducerCommit, baseCommit);
const base = file => execFileSync('git', ['show', `${baseCommit}:${file}`], { cwd: repo, maxBuffer: 64 * 1024 * 1024 });
const proofPath = 'evidence/business-quality/bizq-01-ood-reason-amendment-19a.json';
assert.equal(await lstat(path.join(repo, proofPath)).then(() => true).catch(e => { if (e.code === 'ENOENT') return false; throw e; }), false, 'immutable new proof must not exist');
const predecessorPath = 'evidence/business-quality/bizq-01-ood-node-closure-19.json';
assert.equal(digest(await readFile(path.join(repo, predecessorPath))), '7161c91cc3ec8cf1cc22d99121928902b1e706986cd833f6663c0d4534715a4f');
const predecessor = JSON.parse(base(predecessorPath));
const byId = new Map(proposals.map(p => [p.questionId, p]));
assert.equal(byId.size, 25);
assert.deepEqual(proposals.map(p => p.questionId), manifest.items.map(i => i.itemId));
const sourceFiles = [], replacements = [], prepared = new Map(), oldById = new Map(), currentById = new Map();
for (const sourceFile of new Set(manifest.items.map(i => i.sourcePath))) {
  const oldBytes = base(sourceFile);
  assert.deepEqual(await readFile(path.join(repo, sourceFile)), oldBytes, `${sourceFile} unchanged since reviewed baseline`);
  const old = JSON.parse(oldBytes);
  assert.deepEqual(Buffer.from(JSON.stringify(old)), oldBytes);
  const current = old.map(q => {
    oldById.set(q.questionId, q);
    const change = byId.get(q.questionId);
    if (change) assert.equal(q.feedback.reason, change.beforeReason);
    const after = change ? { ...q, feedback: { ...q.feedback, reason: change.reason } } : q;
    currentById.set(q.questionId, after);
    return after;
  });
  const bytes = Buffer.from(JSON.stringify(current));
  const oldDescriptor = predecessor.sourceFiles.find(s => s.sourceFile === sourceFile);
  assert.equal(digest(oldBytes), oldDescriptor.sourceSha256);
  sourceFiles.push({ sourceFile, beforeSourceSha256: digest(oldBytes), sourceSha256: digest(bytes), nodeId: oldDescriptor.nodeId, mentalUnitId: oldDescriptor.mentalUnitId });
  prepared.set(sourceFile, bytes);
}
for (const item of manifest.items) {
  const before = oldById.get(item.itemId), current = currentById.get(item.itemId);
  assert.equal(digest(Buffer.from(JSON.stringify(before))), item.sourceEvidence.oldWholeObjectSha256);
  replacements.push({ sourceFile: item.sourcePath, questionId: item.itemId, mentalUnitId: item.primaryMentalUnitId,
    beforeReason: before.feedback.reason, reason: current.feedback.reason,
    beforeQuestionSha256: sha256(before), questionSha256: sha256(current) });
}
const paths = execFileSync('git', ['ls-files', 'content/object-oriented-design-interview'], { cwd: repo, encoding: 'utf8' }).trim().split('\n');
const oldQuestions = paths.flatMap(p => { const v = JSON.parse(base(p)); return Array.isArray(v) ? v : []; }).sort((a,b) => a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0);
assert.equal(oldQuestions.length, 1413);
const questions = oldQuestions.map(q => currentById.get(q.questionId) ?? q);
assert.equal(sha256(oldQuestions), predecessor.questionSetSha256);
const proof = { schemaVersion: 'patternly-bizq01-ood-reason-amendment-v1', scope: 'bizq-01-ood-reason-amendment-19a',
  trackId: predecessor.trackId, beforeProducerCommit: baseCommit, beforeContentVersion: predecessor.contentVersion,
  contentVersion: 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-19a',
  beforeQuestionSetSha256: sha256(oldQuestions), questionSetSha256: sha256(questions), sourceFiles, replacements };
const catalogPath = 'content/catalog.json';
const catalogBytes = base(catalogPath);
assert.deepEqual(await readFile(path.join(repo, catalogPath)), catalogBytes);
const catalog = JSON.parse(catalogBytes);
assert.equal(catalog.tracks.find(t => t.trackId === proof.trackId).contentVersion, proof.beforeContentVersion);
const nextCatalog = { ...catalog, tracks: catalog.tracks.map(t => t.trackId === proof.trackId ? { ...t, contentVersion: proof.contentVersion } : t) };
// All review and baseline checks precede mutations. Source and proof share one reviewed scope.
for (const [file, bytes] of prepared) await writeFile(path.join(repo, file), bytes);
await writeFile(path.join(repo, catalogPath), JSON.stringify(nextCatalog));
await writeFile(path.join(repo, proofPath), JSON.stringify(proof, null, 2) + '\n');
await writeFile(path.join(packet, 'ROOT-INTEGRATION.json'), JSON.stringify({ result: 'integrated; producer/consumer/admission acceptance pending',
  manifestSha256: manifestSha, proposalSha256: proposalSha, semanticReviewSha256: digest(await readFile(path.join(packet, 'SEMANTIC-QA.json'))),
  proofPath, proofSha256: digest(await readFile(path.join(repo, proofPath))), sourceFiles, questionSetSha256: proof.questionSetSha256,
  changedReasonOnlyObjects: 25, preservedQuestionAndOptionIds: true }, null, 2) + '\n');
console.log(JSON.stringify({ sourceFiles: 3, reasonCorrections: 25, questionSetSha256: proof.questionSetSha256, proofPath }));
