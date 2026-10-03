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
assert.equal(candidate.candidateId, '22b98e6c929f187e3afcd94183685b702cff6c72110d0882ea3e9b267c9c3f0f');
assert.equal(candidate.release.sourceRepositoryCommit, '39420ca4d38a17556b168832e76b32dbf206d5d2');
assert.equal(candidate.status, 'draft_not_admitted');
const actualSuite = await readFile(path.join(packet, 'ROOT-PRODUCER-canonical-after-checkpoint.log'), 'utf8');
assert.match(actualSuite, /# tests 116\n# suites 0\n# pass 116\n# fail 0\n# cancelled 0\n# skipped 0/u);
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
  decisionRationale: 'Bounded source12 i002→i019: completed actor-facing success/retryable failure with four new option meanings and authored diagnostics; accepted i018 and other1412 OOD items preserved. Independent Luna High source semantic PASS and fixed successor proof checkpoint PASS25/25; root targeted54/54, actual migration/current16077/history16041, OOD validate/answers1413 and buildall9 passed. Full canonical post-source-checkpoint116/116 passed; pre-checkpoint114/116 snapshot guard failures retained without weakening. Exact reconstructed predecessor validates unchanged source11 proof; existing historical/global checks preserved. Root compared eight other built artifact bytes/counts/versions to prior app and candidate output. Fifteen unit defects and native/provider/transfer/full-bank acceptance remain open. This is existing delegated candidate-readiness authority only; separate exact consumer, lock, runtime admission and final review follow. No publishing, deployment, purchase or service change.',
  candidatePath: CANDIDATE_PATH, candidateId: candidate.candidateId, sourceRepositoryCommit: candidate.release.sourceRepositoryCommit,
  release: { releaseId: release.manifest.releaseId, releasePath: RELEASE_PATH, checksumSha256: createHash('sha256').update(canonicalJsonBytes(release)).digest('hex') },
  trackIds: [...CANDIDATE_TRACK_IDS], tracks: bindings,
  basis: { odk096: 'passed', nineTrackBuild: 'passed', repositoryTests: 'passed', migrationVerification: 'passed' },
  boundaries: { publishingAdmission: 'not_granted', runtimeAdmission: 'not_granted', appReleaseLockUpdated: false },
};
await validateCandidateDecisionV2(decision, { root, candidate, release, bindings });
await writeFile(path.join(root, DECISION_PATH), canonicalJsonBytes(decision));
console.log(`Exact delegated source12 candidate decision validated: ${candidate.candidateId}`);
