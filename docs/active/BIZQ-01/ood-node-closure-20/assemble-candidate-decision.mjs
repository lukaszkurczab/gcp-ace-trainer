import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const appRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const root = path.resolve(appRoot, '../patternly-content');
const packet = fileURLToPath(new URL('./', import.meta.url));
const { CANDIDATE_PATH, RELEASE_PATH, DECISION_PATH, validateCandidateDecisionV2 } = await import(pathToFileURL(path.join(root, 'scripts/review/candidate-readiness-v2.mjs')));
const { canonicalJsonBytes, CANDIDATE_TRACK_IDS } = await import(pathToFileURL(path.join(root, 'scripts/review/candidate-manifest.mjs')));
const json = async p => JSON.parse(await readFile(path.join(root, p), 'utf8'));
const candidate = await json(CANDIDATE_PATH);
const release = await json(RELEASE_PATH);
const checkpoint = JSON.parse(await readFile(path.join(packet, 'SOURCE-CHECKPOINT.json'), 'utf8'));
assert.equal(candidate.release.sourceRepositoryCommit, checkpoint.commit);
assert.ok(candidate.candidateId.match(/^[a-f0-9]{64}$/u));
assert.equal(candidate.status, 'draft_not_admitted');
const semanticReview = await readFile(path.join(packet, 'SEMANTIC-FINAL-QA.md'), 'utf8');
assert.match(semanticReview, /Verdict[^\n]*PASS/u);
const producerReview = await readFile(path.join(packet, 'PRODUCER-QA.md'), 'utf8');
assert.match(producerReview, /Verdict[^\n]*PASS/u);
const actualSuite = await readFile(path.join(packet, 'ROOT-PRODUCER-CANONICAL.log'), 'utf8');
const totals = actualSuite.match(/(?:#|ℹ) tests (\d+)\n(?:#|ℹ) suites \d+\n(?:#|ℹ) pass (\d+)\n(?:#|ℹ) fail (\d+)\n(?:#|ℹ) cancelled (\d+)\n(?:#|ℹ) skipped (\d+)/u);
assert.ok(totals, 'actual canonical suite totals');
assert.ok(Number(totals[1]) > 0, 'required canonical suite must actually execute');
assert.equal(totals[1], totals[2]);
assert.deepEqual(totals.slice(3), ['0', '0', '0']);
const finalBindings = JSON.parse(await readFile(path.join(packet, 'ROOT-FINAL-BINDINGS-v2.json'), 'utf8'));
const ood = release.artifacts.find(a => a.trackId === 'object-oriented-design-interview');
assert.equal(ood.questionCount, 1413);
assert.equal(ood.questionSetSha256, finalBindings.proposedQuestionSetSha256);
assert.equal(ood.contentVersion, 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-20');
const before = JSON.parse(await readFile(path.join(packet, 'BEFORE-CONSUMER.json'), 'utf8'));
for (const artifact of release.artifacts) {
  const previous = before.files.find(item => item.path.endsWith(`/${artifact.trackId}.json`));
  assert.ok(previous);
  if (artifact.trackId !== 'object-oriented-design-interview') assert.equal(artifact.checksumSha256, previous.sha256);
}
const bindings = release.artifacts.map(artifact => ({ trackId: artifact.trackId, sourcePath: artifact.sourcePath, artifactPath: artifact.artifactPath, questionCount: artifact.questionCount, questionSetSha256: artifact.questionSetSha256, artifactSha256: artifact.checksumSha256 }));
const decision = {
  schemaVersion: 'patternly-content-candidate-decision-v2',
  decisionId: `codex-content-candidate-review-v2:${candidate.candidateId}`,
  decisionAuthority: 'delegated_codex', taskId: 'BIZQ-01/CANDIDATE', decision: 'approved_for_candidate_readiness',
  decisionRationale: 'Fixed independently reviewed OOD N04 nine-unit cohort:144 genuine new-question identities and18 same-ID dependency-boundary corrections. Whole162 semantic/cross/identity and independent producer QA passed. Root actual canonical suite, nine-track build, unchanged eight artifacts and exact predecessor reconstruction bind this snapshot. Existing450 semantic maps and25Reason corrections remain; current594 semantic maps and18same-ID history corrections are distinct. Existing delegated candidate readiness only; consumer admission and final QA follow. Full BIZQ01/native/Premium acceptance remains open. No deploy, publication, purchase or service configuration change',
  candidatePath: CANDIDATE_PATH, candidateId: candidate.candidateId, sourceRepositoryCommit: candidate.release.sourceRepositoryCommit,
  release: { releaseId: release.manifest.releaseId, releasePath: RELEASE_PATH, checksumSha256: createHash('sha256').update(canonicalJsonBytes(release)).digest('hex') },
  trackIds: [...CANDIDATE_TRACK_IDS], tracks: bindings,
  basis: { odk096: 'passed', nineTrackBuild: 'passed', repositoryTests: 'passed', migrationVerification: 'passed' },
  boundaries: { publishingAdmission: 'not_granted', runtimeAdmission: 'not_granted', appReleaseLockUpdated: false },
};
await validateCandidateDecisionV2(decision, { root, candidate, release, bindings });
await writeFile(path.join(root, DECISION_PATH), canonicalJsonBytes(decision));
console.log(`Exact delegated N04/20 candidate decision validated: ${candidate.candidateId}`);
