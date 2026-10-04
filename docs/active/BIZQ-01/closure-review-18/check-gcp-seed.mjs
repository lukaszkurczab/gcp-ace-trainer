// Read-only full-seed bindings, separate from the frozen216 sample counts.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { canonicalJson } from '../../../../../patternly-content/scripts/review/content-review-console.mjs';
import { validateTrack } from '../../../../../patternly-content/scripts/build.mjs';
const packet = fileURLToPath(new URL('./', import.meta.url));
const content = resolve(packet, '../../../../../patternly-content');
const app = resolve(packet, '../../../..');
const hash = b => createHash('sha256').update(b).digest('hex');
const bytes = await readFile(resolve(packet, 'GCP-SEED-REVIEW.json'));
const r = JSON.parse(bytes);
const src = await readFile(resolve(content, r.source.path));
const qs = JSON.parse(src);
if (hash(src) !== r.source.sha256 || qs.length !== 18 || r.items.length !== 18) throw Error('Source/count mismatch');
const projected = await validateTrack({ rootDirectory: content, trackId: 'google-cloud-associate-cloud-engineer' });
const bundled = JSON.parse(await readFile(resolve(app, 'src/content/generated/canonical-content/google-cloud-associate-cloud-engineer.json')));
const unique = new Set();
for (const item of r.items) {
  const q = qs.find(q => q.questionId === item.questionId);
  if (!q || unique.has(item.questionId) || hash(canonicalJson(q)) !== item.itemFingerprint || item.sourceFileSha256 !== hash(src)) throw Error('Review binding mismatch');
  unique.add(item.questionId);
  const actual = bundled.questions.find(q => q.questionId === item.questionId);
  const expected = projected.artifactQuestions.find(q => q.questionId === item.questionId);
  if (canonicalJson(actual) !== canonicalJson(expected)) throw Error('Bundle projection mismatch');
}
if (r.summary.high !== 2 || r.summary.moderate !== 16 || r.summary.defect !== 18) throw Error('Disposition mismatch');
console.log(JSON.stringify({ verdict: 'PASS', sourceCommit: r.source.commit, sourceSha256: hash(src), reportSha256: hash(bytes), reviewed: unique.size, high: 2, moderate: 16, sampleOverlap: ['gcp-ace-gcpace-n01-b02-001'], additionalDistinctObjects: 17, scope: 'Full18-unit report bindings/current source/builder-derived bundle parity; not semantic/admission/native/wholebank acceptance' }, null, 2));
