// Read-only review evidence. Never records admission or changes source questions.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createContentReviewConsole, LAUNCH_TRACK_IDS, canonicalJson } from '../../../../../patternly-content/scripts/review/content-review-console.mjs';

const packet = fileURLToPath(new URL('./', import.meta.url));
const contentRoot = resolve(packet, '../../../../../patternly-content');
const seed = 'BIZQ-01-section3.2-review18-v1';
const hash = value => createHash('sha256').update(value).digest('hex');
const service = await createContentReviewConsole({ root: contentRoot });
const records = service.listItems();
const catalog = JSON.parse(await readFile(resolve(contentRoot, 'content/catalog.json'), 'utf8'));
const versions = new Map(catalog.tracks.map(t => [t.trackId, t.contentVersion]));
const result = [];
const summaries = [];
const overrides = {
  'coding-interview-dsa-problem-solving': [['lower_and_upper_bound', 'A1 binary-search trace control']],
  'backend-system-design-interview': [
    ['BESD-N02-B01', 'repaired A1 request/IoT seed control'],
    ['BESD-N04-B01', 'repaired A1 cache/audit seed control'],
    ['BESD-N01-B01', 'remaining author-instruction risk'],
  ],
  'object-oriented-design-interview': [
    ['OOD-N01-B01', 'accepted N01 semantic control'],
    ['OOD-N02-B01', 'accepted N02 semantic control'],
    ['OOD-N03-B01', 'remaining malformed-feedback template risk'],
    ['OOD-N06-B01', 'remaining workflow mechanism risk'],
  ],
  'google-cloud-associate-cloud-engineer': [['GCPACE-N01-B02', 'exact GCP07 resource-scope defect; repair attribution dependency remains', 'gcp-ace-gcpace-n01-b02-001']],
  'claude-certified-architect-professional-certification': [['CCARP-D03-O01', 'A1 control; not blanket bank approval']],
};

for (const trackId of LAUNCH_TRACK_IDS) {
  const all = records.filter(r => r.trackId === trackId).map(r => ({ ...r, rank: hash(`${seed}:${r.questionKey}`) }))
    .sort((a, b) => a.rank.localeCompare(b.rank));
  const limit = Math.min(24, all.length);
  const picked = [];
  const add = (r, reason) => {
    if (picked.some(x => x.questionId === r.questionId)) return;
    if (picked.length >= limit) throw new Error('Selection budget exceeded');
    picked.push({ ...r, selectionReason: reason });
  };
  for (const [unit, reason, exactId] of overrides[trackId] ?? []) {
    const r = all.find(x => x.mentalUnitId === unit && (!exactId || x.questionId === exactId));
    if (!r) throw new Error(`Missing explicit override unit ${trackId}:${unit}`);
    add(r, `explicit-risk/control-override: ${reason}; ${exactId ? 'fixed known-risk item ID' : 'lowest seeded hash in unit'}`);
  }
  for (const type of [...new Set(all.map(r => r.item.interaction.type))].sort()) {
    if (!picked.some(r => r.item.interaction.type === type)) add(all.find(r => r.item.interaction.type === type), `interaction coverage: ${type}`);
  }
  // Prefer unseen nodes, then interaction/difficulty strata, then unseen units.
  while (picked.length < limit) {
    const score = r => (
      (picked.some(x => x.nodeId === r.nodeId) ? 0 : 100) +
      (picked.some(x => x.item.interaction.type === r.item.interaction.type && x.item.difficulty === r.item.difficulty) ? 0 : 10) +
      (picked.some(x => x.mentalUnitId === r.mentalUnitId) ? 0 : 1)
    );
    const candidates = all.filter(r => !picked.some(x => x.questionId === r.questionId));
    candidates.sort((a, b) => score(b) - score(a) || a.rank.localeCompare(b.rank));
    add(candidates[0], 'seeded hash with node, interaction/difficulty and unit spread');
  }
  for (const r of picked) {
    const raw = await readFile(resolve(contentRoot, r.sourceFile));
    if (hash(raw) !== r.sourceFileSha256 || hash(canonicalJson(r.item)) !== r.itemFingerprint) throw new Error(`Source identity changed: ${r.questionKey}`);
    result.push({ trackId, contentVersion: versions.get(trackId), questionId: r.questionId,
      nodeId: r.nodeId, mentalUnitId: r.mentalUnitId, sourceFile: r.sourceFile,
      sourceFileSha256: r.sourceFileSha256, itemFingerprint: r.itemFingerprint,
      selectionRank: r.rank, selectionReason: r.selectionReason, advisoryRiskFlags: r.riskFlags, item: r.item });
  }
  const types = [...new Set(all.map(r => r.item.interaction.type))].sort();
  const selectedTypes = [...new Set(picked.map(r => r.item.interaction.type))].sort();
  if (canonicalJson(types) !== canonicalJson(selectedTypes)) throw new Error(`Interaction coverage gap: ${trackId}`);
  summaries.push({ trackId, population: all.length, selected: picked.length,
    populationNodes: new Set(all.map(r => r.nodeId)).size, selectedNodes: new Set(picked.map(r => r.nodeId)).size,
    selectedUnits: new Set(picked.map(r => r.mentalUnitId)).size, populationInteractions: types, selectedInteractions: selectedTypes,
    selectedDifficulties: [...new Set(picked.map(r => r.item.difficulty))].sort(),
    explicitOverrides: picked.filter(r => r.selectionReason.startsWith('explicit-')).map(r => r.questionId) });
}
if (records.length !== 16077 || result.length !== 216 || new Set(result.map(r => `${r.trackId}:${r.questionId}`)).size !== 216) throw new Error('Unexpected current inventory/sample identity');
const output = {
  purpose: 'Spec section3.2 bounded semantic review evidence; no approval/admission or statistical quality estimate',
  seed, contentHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: contentRoot, encoding: 'utf8' }).trim(),
  population: records.length, sampleCount: result.length,
  stageCoverage: 'Not established: canonical question sources have no authored stage field. Node/difficulty spread is not stage stratification.',
  trackCoverage: summaries, questions: result,
};
const bytes = JSON.stringify(output, null, 2) + '\n';
const target = resolve(packet, 'SAMPLE.json');
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== bytes) throw new Error('Frozen sample differs from current deterministic source selection');
} else {
  await writeFile(target, bytes);
}
console.log(JSON.stringify({ sampleCount: result.length, sha256: hash(bytes), tracks: summaries, stageCoverage: output.stageCoverage }, null, 2));
