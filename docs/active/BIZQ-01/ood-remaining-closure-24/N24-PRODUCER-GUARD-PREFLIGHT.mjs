import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sha256, validateTrack } from '../../../../../patternly-content/scripts/build.mjs';
import { MigrationVerificationError, verifyMigration } from '../../../../../patternly-content/scripts/content/verify-migration.mjs';

const packetDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(packetDirectory, '../../../../../');
const contentRepository = path.join(repositoryRoot, 'patternly-content');
const trackId = 'object-oriented-design-interview';
const sourceVersion23 = 'object-oriented-design-interview-authoring-v2026.10.05-bizq01-23';
const sourceVersion24 = 'object-oriented-design-interview-authoring-v2026.10.05-bizq01-24';
const sourceContentRoot = path.join(contentRepository, 'content');
const proofFile = path.join(packetDirectory, 'PREPARED-FIXED-PROOF24.json');
const outputReport = path.join(packetDirectory, 'N24-PRODUCER-GUARD-PREFLIGHT.json');
const proofFilename = 'bizq-01-ood-node-closure-24.json';
const proofCopyList = [
  'bizq-01-besd-slice-01.json',
  'bizq-01-besd-seed-cohort-14.json',
  'bizq-01-coding-source-copy-04.json',
  'bizq-01-ood-source-11.json',
  'bizq-01-ood-source-12.json',
  'bizq-01-ood-unit-cohort-13.json',
  'bizq-01-ood-node-closure-16.json',
  'bizq-01-ood-node-closure-17.json',
  'bizq-01-ood-node-closure-19.json',
  'bizq-01-ood-reason-amendment-19a.json',
  'bizq-01-ood-node-closure-20.json',
  'bizq-01-ood-node-closure-21.json',
  'bizq-01-ood-node-closure-22.json',
  'bizq-01-ood-node-closure-23.json'
];

async function main() {
  const proofBytes = await readFile(proofFile);
  const proof = JSON.parse(proofBytes.toString('utf8'));
  assert.equal(proof.schemaVersion, 'patternly-bizq-semantic-replacement-v1');
  assert.equal(proof.trackId, trackId);
  assert.equal(proof.beforeContentVersion, sourceVersion23);
  assert.equal(proof.contentVersion, sourceVersion24);
  assert.equal(proof.sourceFiles.length, 18);

  const fixtureRoot = await realpath(await mkdtemp(path.join('/private/tmp', 'bizq01-ood-n24-guard-')));
  const fixtureContentRoot = path.join(fixtureRoot, 'content');
  let report;
  try {
    await cp(sourceContentRoot, fixtureContentRoot, { recursive: true });
    await mkdir(path.join(fixtureRoot, 'evidence/business-quality'), { recursive: true });
    for (const name of proofCopyList) {
      await cp(
        path.join(contentRepository, 'evidence/business-quality', name),
        path.join(fixtureRoot, 'evidence/business-quality', name)
      );
    }
    await cp(
      path.join(contentRepository, 'evidence/canonical-content-approvals'),
      path.join(fixtureRoot, 'evidence/canonical-content-approvals'),
      { recursive: true }
    );
    await cp(
      proofFile,
      path.join(fixtureRoot, 'evidence/business-quality', proofFilename)
    );

    const currentCatalog = JSON.parse(await readFile(path.join(fixtureContentRoot, 'catalog.json'), 'utf8'));
    const oodTrack = currentCatalog.tracks.find((track) => track.trackId === trackId);
    assert.ok(oodTrack, 'fixture catalog must contain the OOD track');
    assert.equal(oodTrack.contentVersion, sourceVersion23, 'fixture must start from the actual current v23 catalog');

    const currentSources = [];
    for (const source of proof.sourceFiles) {
      const sourcePath = path.join(fixtureContentRoot, source.sourceFile.replace(/^content\//, ''));
      const originalBytes = await readFile(sourcePath);
      assert.equal(sha256(originalBytes), source.beforeSourceSha256, `${source.sourceFile} starts at the exact v23 predecessor`);
      const questions = [...proof.replacements, ...proof.sameIdCorrections]
        .filter((item) => item.sourceFile === source.sourceFile)
        .map((item) => item.currentQuestion)
        .sort((left, right) => left.questionId.localeCompare(right.questionId));
      assert.equal(questions.length, 18, `${source.sourceFile} fixed N24 membership`);
      const currentBytes = Buffer.from(JSON.stringify(questions), 'utf8');
      assert.equal(sha256(currentBytes), source.sourceSha256, `${source.sourceFile} prepared v24 bytes match the fixed proof`);
      await writeFile(sourcePath, currentBytes);
      currentSources.push({
        path: source.sourceFile,
        beforeSourceSha256: source.beforeSourceSha256,
        preparedSourceSha256: sha256(currentBytes),
        itemCount: questions.length
      });
    }

    oodTrack.contentVersion = sourceVersion24;
    await writeFile(path.join(fixtureContentRoot, 'catalog.json'), `${JSON.stringify(currentCatalog)}\n`, 'utf8');
    const validated = await validateTrack({ rootDirectory: fixtureRoot, trackId });
    assert.equal(validated.track.contentVersion, sourceVersion24);
    assert.equal(validated.questions.length, 1413);
    assert.equal(sha256(validated.questions), proof.questionSetSha256);

    const verifierBytes = await readFile(path.join(contentRepository, 'scripts/content/verify-migration.mjs'));
    try {
      const result = await verifyMigration({ contentRoot: fixtureContentRoot });
      report = {
        result: 'PROBED',
        oldGuardRejected: false,
        verifierOutcome: 'accepted',
        verifierResult: result.result,
        verifierVersion: sha256(verifierBytes),
        proofSha256: sha256(proofBytes),
        sourceVersionBefore: sourceVersion23,
        sourceVersionPrepared: sourceVersion24,
        preparedQuestionSetSha256: proof.questionSetSha256,
        sourceFiles: currentSources,
        fixtureCleaned: true
      };
    } catch (error) {
      report = {
        result: 'PROBED',
        oldGuardRejected: true,
        verifierOutcome: 'rejected',
        errorClass: error?.constructor?.name ?? typeof error,
        errorCode: error instanceof MigrationVerificationError ? error.code : null,
        safeMessage: error instanceof MigrationVerificationError ? error.message : String(error?.message ?? error),
        verifierVersion: sha256(verifierBytes),
        proofSha256: sha256(proofBytes),
        sourceVersionBefore: sourceVersion23,
        sourceVersionPrepared: sourceVersion24,
        preparedQuestionSetSha256: proof.questionSetSha256,
        sourceFiles: currentSources,
        fixtureCleaned: true
      };
    }
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }

  await writeFile(outputReport, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify(report, null, 2));
}

await main();
