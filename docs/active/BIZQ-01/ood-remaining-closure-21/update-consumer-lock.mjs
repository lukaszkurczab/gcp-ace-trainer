import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packet = fileURLToPath(new URL('./', import.meta.url));
const app = path.resolve(packet, '../../../..');
const producer = path.resolve(app, '../patternly-content');
const previousCandidateId = '3001b254f9a1c4f9d15a01577f5457b8cb4ad79723f9958ecbdb7c8c5658417b';
const { CANDIDATE_PATH, RELEASE_PATH } = await import(
  pathToFileURL(path.join(producer, 'scripts/review/candidate-readiness-v2.mjs')),
);
const { canonicalJsonBytes } = await import(
  pathToFileURL(path.join(producer, 'scripts/review/candidate-manifest.mjs')),
);
const readJson = async (root, relativePath) => JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const candidate = await readJson(producer, CANDIDATE_PATH);
const release = await readJson(producer, RELEASE_PATH);
const checkpoint = await readJson(packet, 'SOURCE-CHECKPOINT.json');
assert.equal(candidate.release.sourceRepositoryCommit, checkpoint.commit);
assert.equal(candidate.status, 'draft_not_admitted');

const lockPath = 'integration/contracts/content-release/release.lock.json';
const lock = await readJson(app, lockPath);
assert.equal(lock.candidateId, previousCandidateId, 'the app lock still has the expected prior candidate');
const historicalLockPath = 'integration/contracts/content-release/release.lock.historical-0024.json';
const before = await readJson(packet, 'BEFORE-CONSUMER.json');
const priorHistoricalHash = before.files.find((item) => item.path === historicalLockPath)?.sha256;
assert.ok(priorHistoricalHash, 'before inventory binds the historical release lock');
assert.equal(sha256(await readFile(path.join(app, historicalLockPath))), priorHistoricalHash);

const generatedLockPath = 'src/content/generated/canonical-content/content-lock.json';
const generatedLock = await readJson(app, generatedLockPath);
assert.equal(generatedLock.tracks.find((item) => item.trackId === 'object-oriented-design-interview')?.contentVersion, 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-21');
const beforeByTrack = new Map(release.artifacts.map((artifact) => [artifact.trackId, artifact]));
for (const artifact of release.artifacts) {
  const prior = before.files.find((item) => item.path.endsWith(`/${artifact.trackId}.json`));
  assert.ok(prior, `before inventory has ${artifact.trackId}`);
  if (artifact.trackId !== 'object-oriented-design-interview') {
    assert.equal(artifact.checksumSha256, prior.sha256, `other release artifact preserved: ${artifact.trackId}`);
  }
}
assert.equal(beforeByTrack.size, 9);

lock.artifacts = release.artifacts.map((artifact) => ({
  checksumSha256: artifact.checksumSha256,
  contentVersion: artifact.contentVersion,
  producerCommit: checkpoint.commit,
  releaseId: release.manifest.releaseId,
  sourceRepositoryCommit: checkpoint.commit,
  trackId: artifact.trackId,
}));
lock.bundleId = `patternly-app-candidate-${candidate.candidateId.slice(0, 12)}`;
lock.bundledContentLockSha256 = sha256(await readFile(path.join(app, generatedLockPath)));
lock.candidateId = candidate.candidateId;
lock.releaseManifestSha256 = candidate.release.checksumSha256;
await writeFile(path.join(app, lockPath), canonicalJsonBytes(lock));

const runtimePinPath = 'src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts';
const runtimePin = await readFile(path.join(app, runtimePinPath), 'utf8');
assert.equal(runtimePin.split(previousCandidateId).length, 2, 'runtime admission fixture contains exactly one prior candidate pin');
await writeFile(path.join(app, runtimePinPath), runtimePin.replace(previousCandidateId, candidate.candidateId));
console.log(`Updated current release lock and one runtime test candidate pin for ${candidate.candidateId}; historical lock preserved; admission remains separate.`);
