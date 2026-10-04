// Read-only preflight bindings. This does not approve semantics or ID changes.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { canonicalJson } from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
const packet = fileURLToPath(new URL('./', import.meta.url));
const content = resolve(packet, '../../../../../patternly-content');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = await readFile(resolve(packet, 'MANIFEST.json'));
const m = JSON.parse(bytes);
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: content, encoding: 'utf8' }).trim();
if (head !== m.currentContentHead || m.units.length !== 9) throw new Error('Wrong producer snapshot or unit count');
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(p));
    else if (entry.isFile() && entry.name.endsWith('.json')) result.push(p);
  }
  return result;
}
const active = new Set();
for (const p of await files(resolve(content, 'content/object-oriented-design-interview'))) {
  for (const q of JSON.parse(await readFile(p))) active.add(q.questionId);
}
const proposed = new Set();
let count = 0;
for (const [unitIndex, u] of m.units.entries()) {
  if (u.unitId !== `OOD-N03-B${String(unitIndex + 1).padStart(2, '0')}` || u.items.length !== 18) throw new Error('Wrong fixed unit membership');
  const source = await readFile(resolve(content, u.sourcePath));
  const questions = JSON.parse(source);
  if (hash(source) !== u.sourceSha256 || questions.length !== 18) throw new Error('Source bytes/count changed');
  for (const [i, r] of u.items.entries()) {
    const q = questions[i];
    const prefix = `ood-n03-b${String(unitIndex + 1).padStart(2, '0')}-i`;
    if (q.questionId !== `${prefix}${String(i + 1).padStart(3, '0')}` || r.oldQuestionId !== q.questionId || r.currentItemFingerprint !== hash(canonicalJson(q))) throw new Error('Old identity/object binding mismatch');
    if (r.proposedQuestionId !== `${prefix}${String(i + 19).padStart(3, '0')}` || active.has(r.proposedQuestionId) || proposed.has(r.proposedQuestionId)) throw new Error('Candidate ID collision/mapping mismatch');
    if (!r.itemSpecificCurrentGap) throw new Error('Missing item-level preflight');
    proposed.add(r.proposedQuestionId); count++;
  }
}
if (count !== 162) throw new Error('Incomplete cohort');
console.log(JSON.stringify({ verdict: 'PASS', scope: '162 current object fingerprints, nine file hashes, exact old identities and collision-free conditional candidate IDs; not semantic or identity approval', contentHead: head, manifestSha256: hash(bytes), checked: count, files: m.units.length, activeOODObjects: active.size }, null, 2));
