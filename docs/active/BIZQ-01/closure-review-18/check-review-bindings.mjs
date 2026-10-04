// Structural evidence check only. Matching hashes/counts cannot certify semantics.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { canonicalJson } from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
import { validateTrack } from '../../../../../patternly-content/scripts/build.mjs';
const packet = fileURLToPath(new URL('./', import.meta.url));
const app = resolve(packet, '../../../..');
const content = resolve(app, '../patternly-content');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sampleBytes = await readFile(resolve(packet, 'SAMPLE.json'));
const sampleSha = sha(sampleBytes);
if (sampleSha !== 'd2c083f3f3ac02fdaa38de725c717d31c88ad227365c30fb54bd121c16241ad4') throw new Error('Unexpected frozen sample identity');
const sample = JSON.parse(sampleBytes);
const records = new Map(sample.questions.map(q => [`${q.trackId}:${q.questionId}`, q]));
const covered = new Set();
const reports = [];
const totals = { reviewed: 0, PASS: 0, DEFECT: 0, UNRESOLVED: 0 };
const byTrack = {};
for (const [file, rowKey, verdictKey] of [
  ['SEMANTIC-DESIGN-CODING.json', 'reviews', 'verdict'],
  ['SEMANTIC-CERTIFICATION.json', 'items', 'status'],
]) {
  const bytes = await readFile(resolve(packet, file));
  const report = JSON.parse(bytes);
  if (report.sample.sha256 !== sampleSha) throw new Error(`Wrong sample binding in ${file}`);
  const counts = { reviewed: 0, PASS: 0, DEFECT: 0, UNRESOLVED: 0 };
  for (const r of report[rowKey]) {
    const key = `${r.trackId}:${r.questionId}`;
    const source = records.get(key);
    if (!source || covered.has(key)) throw new Error(`Unknown/duplicate review ${key}`);
    for (const field of ['contentVersion', 'sourceFile', 'sourceFileSha256', 'itemFingerprint']) {
      if (r[field] !== source[field]) throw new Error(`Mismatched ${field} for ${key}`);
    }
    const verdict = r[verdictKey];
    if (!['PASS', 'DEFECT', 'UNRESOLVED'].includes(verdict)) throw new Error(`Unsupported verdict for ${key}`);
    if (!(r.reviewNote || r.reason || r.finding || r.rationale)) throw new Error(`Missing substantive review record ${key}`);
    covered.add(key);
    counts.reviewed++; counts[verdict]++; totals.reviewed++; totals[verdict]++;
    byTrack[r.trackId] ??= { reviewed: 0, PASS: 0, DEFECT: 0, UNRESOLVED: 0 };
    byTrack[r.trackId].reviewed++; byTrack[r.trackId][verdict]++;
  }
  for (const key of Object.keys(counts)) if ((report.counts[key] ?? 0) !== counts[key]) throw new Error(`Count mismatch ${file}:${key}`);
  reports.push({ file, sha256: sha(bytes), counts });
}
if (covered.size !== 216 || Object.values(byTrack).some(t => t.reviewed !== 24)) throw new Error('Incomplete frozen sample review');
const artifacts = new Map();
// Use the existing canonical builder, including its validated GCP domain mapping.
// Never discard a field merely to make source/bundle equality pass.
const gcp = await validateTrack({ rootDirectory: content, trackId: 'google-cloud-associate-cloud-engineer' });
const projectedGcp = new Map(gcp.artifactQuestions.map(q => [q.questionId, q]));
for (const r of sample.questions) {
  const bytes = await readFile(resolve(content, r.sourceFile));
  if (sha(bytes) !== r.sourceFileSha256) throw new Error(`Current source mismatch ${r.questionId}`);
  const q = JSON.parse(bytes).find(q => q.questionId === r.questionId);
  if (!q || canonicalJson(q) !== canonicalJson(r.item) || sha(canonicalJson(q)) !== r.itemFingerprint) throw new Error(`Whole source object mismatch ${r.questionId}`);
  if (!artifacts.has(r.trackId)) artifacts.set(r.trackId, JSON.parse(await readFile(resolve(app, 'src/content/generated/canonical-content', `${r.trackId}.json`))));
  const artifact = artifacts.get(r.trackId);
  const bundled = artifact.questions.find(q => q.questionId === r.questionId);
  const expected = r.trackId === gcp.trackId ? projectedGcp.get(r.questionId) : r.item;
  if (artifact.contentVersion !== r.contentVersion || !bundled || canonicalJson(bundled) !== canonicalJson(expected)) throw new Error(`Bundled parity mismatch ${r.questionId}`);
}
console.log(JSON.stringify({ verdict: 'PASS', scope: '216 distinct report bindings/current whole source objects/bundled parity; not semantic correctness, pool eligibility, native or admission',
  sampleSha256: sampleSha, contentHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: content, encoding: 'utf8' }).trim(),
  appHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: app, encoding: 'utf8' }).trim(), reports, totals, byTrack,
  projection: { trackId: gcp.trackId, implementation: 'patternly-content/scripts/build.mjs validateTrack', rule: 'exact canonical artifactQuestions equality, including validated contentDomainId' },
}, null, 2));
