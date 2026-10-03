// Exact source11 preservation check; hashes/data bind the recorded real preflight.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const packet = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(packet, '../../../..');
const content = path.resolve(app, '../patternly-content');
const before = JSON.parse(readFileSync(path.join(packet, 'BEFORE-IMPLEMENTATION.json'), 'utf8'));
assert.ok(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--source-only'), 'supported verification stage');
const sourceOnly = process.argv[2] === '--source-only';
const sourcePath = 'content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => JSON.stringify(Array.isArray(value) ? value.map(v => JSON.parse(canonical(v))) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, JSON.parse(canonical(value[k]))])) : value);
const historical = relative => JSON.parse(execFileSync('git', ['show', `${before['patternly-content'].HEAD.trim()}:${relative}`], {cwd: content, maxBuffer: 32*1024*1024, encoding:'utf8'}));
const json = (root, relative) => JSON.parse(readFileSync(path.join(root, relative), 'utf8'));
const unchangedFiles = [];
for (const [relative, expected] of Object.entries(before['patternly-content'].fileHashes)) {
  if ([sourcePath, 'content/catalog.json'].includes(relative)) continue;
  assert.equal(hash(readFileSync(path.join(content, relative))), expected, relative);
  unchangedFiles.push(relative);
}
const oldUnit = historical(sourcePath), newUnit = json(content, sourcePath);
assert.equal(oldUnit.length,17); assert.equal(newUnit.length,17);
assert.equal(newUnit.some(q => q.questionId === 'ood-n01-b01-i001'), false);
assert.equal(newUnit.filter(q => q.questionId === 'ood-n01-b01-i018').length,1);
for (const old of oldUnit.filter(q => q.questionId !== 'ood-n01-b01-i001')) {
  assert.equal(canonical(newUnit.find(q => q.questionId === old.questionId)), canonical(old), old.questionId);
}
const oldCatalog = historical('content/catalog.json'), newCatalog = json(content, 'content/catalog.json');
const newVersion = 'object-oriented-design-interview-authoring-v2026.10.03-bizq01-11';
const target = newCatalog.tracks.find(t => t.trackId === 'object-oriented-design-interview');
assert.equal(target.contentVersion,newVersion);
target.contentVersion = oldCatalog.tracks.find(t=> t.trackId === target.trackId).contentVersion;
assert.equal(canonical(newCatalog),canonical(oldCatalog),'catalog outside OOD version');
const unchangedArtifacts=[];
for (const [relative, expected] of Object.entries(before.patternly.fileHashes)) {
  if (relative.endsWith('/content-lock.json') || relative.endsWith('/object-oriented-design-interview.json')) continue;
  assert.equal(hash(readFileSync(path.join(app,relative))),expected,relative); unchangedArtifacts.push(relative);
}
assert.equal(unchangedArtifacts.length,8);
const sourceQuestions = newUnit;
if (!sourceOnly) {
  const artifact = json(app,'src/content/generated/canonical-content/object-oriented-design-interview.json');
  assert.equal(artifact.contentVersion,newVersion); assert.equal(artifact.questions.length,1413);
  assert.equal(canonical(artifact.questions.find(q=>q.questionId==='ood-n01-b01-i018')),canonical(sourceQuestions.find(q=>q.questionId==='ood-n01-b01-i018')));
}
// Every other canonical source file is byte-identical; the sixteen untouched unit
// objects are exact. Therefore all 1,412 unaffected OOD source questions persist.
console.log(JSON.stringify({result:'passed', stage:sourceOnly?'source-only':'source-and-consumer', unchangedContentFiles:unchangedFiles.length, untouchedUnitQuestions:16, unchangedOodQuestions:1412, unchangedArtifactBytes:unchangedArtifacts, newVersion},null,2));
