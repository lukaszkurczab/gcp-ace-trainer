import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packet = fileURLToPath(new URL('./', import.meta.url));
const app = path.resolve(packet, '../../../..');
const producer = path.resolve(app, '../patternly-content');
const { CANDIDATE_PATH, RELEASE_PATH, DECISION_PATH, validateCandidateDecisionV2 } = await import(
  pathToFileURL(path.join(producer, 'scripts/review/candidate-readiness-v2.mjs')),
);
const { canonicalJsonBytes, CANDIDATE_TRACK_IDS } = await import(
  pathToFileURL(path.join(producer, 'scripts/review/candidate-manifest.mjs')),
);
const json = async (root, relativePath) => JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const candidate = await json(producer, CANDIDATE_PATH);
const release = await json(producer, RELEASE_PATH);
const checkpoint = await json(packet, 'SOURCE-CHECKPOINT.json');
const activation = await json(packet, 'ROOT-SOURCE-ACTIVATION.json');
const map = await json(packet, 'ROOT-N05-PRODUCER-MAP.json');
const semantic = await json(packet, 'SEMANTIC-CURRENT-FINAL-QA.json');
const canonical = await json(packet, 'ROOT-PRODUCER-CANONICAL.json');
const canonicalLog = await readFile(path.join(packet, canonical.logPath));
const proofBytes = await readFile(path.join(producer, activation.proofPath));

assert.equal(candidate.release.sourceRepositoryCommit, checkpoint.commit);
assert.equal(sha256(proofBytes), activation.proofSha256);
assert.equal(activation.questionSetSha256, map.questionSetSha256);
assert.equal(activation.contentVersion, map.contentVersion);
assert.equal(semantic.verdict, 'PASS');
assert.equal(semantic.registry.sha256, map.registrySha256);
assert.equal(canonical.result, 'PASS');
assert.equal(canonical.exitCode, 0);
assert.equal(canonical.tests, 173);
assert.equal(canonical.passed, 173);
assert.equal(canonical.failed + canonical.cancelled + canonical.skipped, 0);
assert.equal(sha256(canonicalLog), canonical.logSha256);
assert.equal(candidate.status, 'draft_not_admitted');
assert.equal(release.artifacts.length, CANDIDATE_TRACK_IDS.length);

const ood = release.artifacts.find((item) => item.trackId === 'object-oriented-design-interview');
assert.ok(ood);
assert.equal(ood.contentVersion, map.contentVersion);
assert.equal(ood.questionSetSha256, map.questionSetSha256);
assert.equal(ood.questionCount, 1413);

const before = await json(packet, 'BEFORE-CONSUMER.json');
for (const artifact of release.artifacts) {
  const old = before.files.find((item) => item.path.endsWith(`/${artifact.trackId}.json`));
  assert.ok(old, `previous artifact exists for ${artifact.trackId}`);
  if (artifact.trackId !== 'object-oriented-design-interview') {
    assert.equal(artifact.checksumSha256, old.sha256, `unrelated artifact remains exact: ${artifact.trackId}`);
  }
}

const bindings = release.artifacts.map((artifact) => ({
  trackId: artifact.trackId,
  sourcePath: artifact.sourcePath,
  artifactPath: artifact.artifactPath,
  questionCount: artifact.questionCount,
  questionSetSha256: artifact.questionSetSha256,
  artifactSha256: artifact.checksumSha256,
}));
const decision = {
  schemaVersion: 'patternly-content-candidate-decision-v2',
  decisionId: `codex-content-candidate-review-v2:${candidate.candidateId}`,
  decisionAuthority: 'delegated_codex',
  taskId: 'BIZQ-01/CANDIDATE',
  decision: 'approved_for_candidate_readiness',
  decisionRationale: 'The exact N05/21 source checkpoint, fixed 153-item producer proof, current semantic review, and independent canonical suite are bound to this candidate. The nine-track release contains the reviewed OOD v21 set and preserves the other eight artifact bytes. This decision authorizes candidate readiness only; app consumer verification and delegated admission remain separate. It does not claim native/Premium eligibility or full BIZQ-01 acceptance.',
  candidatePath: CANDIDATE_PATH,
  candidateId: candidate.candidateId,
  sourceRepositoryCommit: candidate.release.sourceRepositoryCommit,
  release: {
    releaseId: release.manifest.releaseId,
    releasePath: RELEASE_PATH,
    checksumSha256: sha256(canonicalJsonBytes(release)),
  },
  trackIds: [...CANDIDATE_TRACK_IDS],
  tracks: bindings,
  basis: {
    odk096: 'passed',
    nineTrackBuild: 'passed',
    repositoryTests: 'passed',
    migrationVerification: 'passed',
  },
  boundaries: {
    publishingAdmission: 'not_granted',
    runtimeAdmission: 'not_granted',
    appReleaseLockUpdated: false,
  },
};

await validateCandidateDecisionV2(decision, { root: producer, candidate, release, bindings });
await writeFile(path.join(producer, DECISION_PATH), canonicalJsonBytes(decision));
console.log(`Exact delegated N05/21 candidate decision validated: ${candidate.candidateId}`);
