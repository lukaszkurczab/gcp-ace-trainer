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
const actualSuite = await readFile(path.join(packet, 'ROOT-PRODUCER-canonical-after-checkpoint.log'), 'utf8');
assert.match(actualSuite, /# tests 121\n# suites 0\n# pass 121\n# fail 0\n# cancelled 0\n# skipped 0/u);
const before = JSON.parse(await readFile(path.join(packet, 'BEFORE-BOUNDARY.json'), 'utf8'));
for (const artifact of release.artifacts) {
  const previous = before.appArtifacts.find(item => item.trackId === artifact.trackId);
  assert.ok(previous);
  assert.equal(artifact.questionCount, previous.questionCount);
  if (artifact.trackId !== 'object-oriented-design-interview') assert.equal(artifact.checksumSha256, previous.fileSha256);
}
const bindings = release.artifacts.map(artifact => ({ trackId: artifact.trackId, sourcePath: artifact.sourcePath, artifactPath: artifact.artifactPath, questionCount: artifact.questionCount, questionSetSha256: artifact.questionSetSha256, artifactSha256: artifact.checksumSha256 }));
const decision = {
  schemaVersion: 'patternly-content-candidate-decision-v2',
  decisionId: `codex-content-candidate-review-v2:${candidate.candidateId}`,
  decisionAuthority: 'delegated_codex', taskId: 'BIZQ-01/CANDIDATE', decision: 'approved_for_candidate_readiness',
  decisionRationale: 'Fixed reviewed fifteen-item OOD-N01-B01 cohort i003..i017 to i020..i034; i018/i019 preserved. Independent Luna High semantic V3 and actual producer proof QA passed; root migration29/29 and postcheckpoint canonical121/121, nine artifacts built with eight others byte-exact. Strict fixed proof reconstructs exact immutable source12 then source11; unchanged historical/global migration guards retained. Source objects/options/authored diagnostics match reviewed proposal. Broader semantic expansion, native/provider/transfer and full BIZQ acceptance remain open. Existing delegated candidate-readiness authority only; exact consumer/runtime admission and final QA follow. No deployment, external publication, purchase or service change',
  candidatePath: CANDIDATE_PATH, candidateId: candidate.candidateId, sourceRepositoryCommit: candidate.release.sourceRepositoryCommit,
  release: { releaseId: release.manifest.releaseId, releasePath: RELEASE_PATH, checksumSha256: createHash('sha256').update(canonicalJsonBytes(release)).digest('hex') },
  trackIds: [...CANDIDATE_TRACK_IDS], tracks: bindings,
  basis: { odk096: 'passed', nineTrackBuild: 'passed', repositoryTests: 'passed', migrationVerification: 'passed' },
  boundaries: { publishingAdmission: 'not_granted', runtimeAdmission: 'not_granted', appReleaseLockUpdated: false },
};
await validateCandidateDecisionV2(decision, { root, candidate, release, bindings });
await writeFile(path.join(root, DECISION_PATH), canonicalJsonBytes(decision));
console.log(`Exact delegated cohort13 candidate decision validated: ${candidate.candidateId}`);
