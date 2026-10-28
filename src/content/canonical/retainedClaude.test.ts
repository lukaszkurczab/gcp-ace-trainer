import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveRetainedClaudeTrack } from "./runtimeCatalog";
import type { Question } from "./questionTypes";

for (const file of ["claude-pre-qle-v2", "claude-qle-v2-first-cases", "claude-qle-v2-before-identity", "claude-qle-v2-active-before-exam"]) {
  const retained = JSON.parse(readFileSync(`src/content/generated/retained-content/${file}.json`, "utf8"));
  test(`${file}: resolves exact full and training content without question substitution`, async () => {
    for (const pin of [
      { contentVersion: retained.lock.contentVersion, artifactSha256: retained.lock.sha256 },
      retained.ledger.training,
    ]) {
      const track = await resolveRetainedClaudeTrack({ trackId: retained.lock.trackId, ...pin });
      assert.ok(track);
      assert.equal(track.contentVersion, pin.contentVersion);
      assert.equal(track.artifactSha256, pin.artifactSha256);
      assert.deepEqual(track.questions, retained.artifact.questions);
    }
  });
  test(`${file}: rejects crossed, unknown and foreign pins`, async () => {
    const invalidPins = [
      ...(retained.lock.contentVersion === retained.ledger.training.contentVersion ? [] : [
        { trackId: retained.lock.trackId, contentVersion: retained.lock.contentVersion, artifactSha256: retained.ledger.training.artifactSha256 },
        { trackId: retained.lock.trackId, contentVersion: retained.ledger.training.contentVersion, artifactSha256: retained.lock.sha256 },
      ]),
      { trackId: retained.lock.trackId, contentVersion: "unknown", artifactSha256: retained.lock.sha256 },
      { trackId: "aws-certified-solutions-architect-associate", contentVersion: retained.lock.contentVersion, artifactSha256: retained.lock.sha256 },
    ];
    for (const pin of invalidPins) assert.equal(await resolveRetainedClaudeTrack(pin), null);
  });
}

test('replacement IDs are current-only and predecessor IDs resolve only through exact historical pins', async () => {
  const trackId = 'claude-certified-architect-professional-certification';
  const pairs = [
    ['CCARP-D05-O02-qle-v2-context-budget-admission', 'CCARP-D05-O02-expansion-17'],
    ['CCARP-D05-O05-qle-v2-decision-path-provenance', 'CCARP-D05-O05-expansion-30'],
    ['CCARP-D06-O01-qle-v2-retention-assumption', 'CCARP-D06-O01-expansion-28'],
    ['CCARP-D06-O02-qle-v2-architecture-cost-volume', 'CCARP-D06-O02-expansion-27'],
    ['CCARP-D06-O03-qle-v2-scheduled-governance-review', 'CCARP-D06-O03-expansion-18'],
    ['CCARP-D06-O04-qle-v2-architecture-rationale-handoff', 'CCARP-D06-O04-expansion-28'],
    ['CCARP-D07-O02-qle-v2-generated-code-understanding', 'CCARP-D07-O02-expansion-27'],
    ['CCARP-D07-O03-qle-v2-spend-driver-diagnosis', 'CCARP-D07-O03-expansion-25'],
  ] as const;
  const retained = JSON.parse(readFileSync('src/content/generated/retained-content/claude-pre-qle-v2.json', 'utf8'));
  const appRoot = fileURLToPath(new URL('../../../', import.meta.url));
  const contentRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, '../patternly-content'));
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), 'patternly-claude-current-source-'));
  let currentCatalog;
  try {
    const { buildAll } = await import(pathToFileURL(path.join(contentRoot, 'scripts/build.mjs')).href);
    const source = await buildAll({ rootDirectory: contentRoot, outputRoot });
    const artifact = JSON.parse(await readFile(path.join(outputRoot, `${trackId}.json`), 'utf8'));
    const lock = source.lock.tracks.find((entry: { trackId: string }) => entry.trackId === trackId);
    assert.ok(lock, 'current CONTENT build emits the Claude artifact lock');
    const require = createRequire(import.meta.url);
    const { createCanonicalQuestionCatalog } = require('./questionCatalog.ts');
    const { sha256Utf8 } = require('../../infrastructure/identity/sha256.ts');
    currentCatalog = await createCanonicalQuestionCatalog(artifact, lock, trackId, async (value: string) => sha256Utf8(value));
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }

  const retainedIdentity = {
    trackId,
    contentVersion: retained.lock.contentVersion,
    artifactSha256: retained.lock.sha256,
  };
  const { ContentPackageRuntimeOwner } = await import('../../application/contentPackageRuntimeOwner');
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  await owner.verifyBundledPackages();
  const current = await owner.resolveForDiscovery(trackId, 'certification');
  const historical = await resolveRetainedClaudeTrack(retainedIdentity);
  assert.ok(historical, 'the exact retained package still resolves');
  assert.equal(historical.contentVersion, retainedIdentity.contentVersion);
  assert.equal(historical.artifactSha256, retainedIdentity.artifactSha256);
  assert.equal(await resolveRetainedClaudeTrack({ ...retainedIdentity, artifactSha256: 'f'.repeat(64) }), null,
    'a retained question is not substituted when the exact retained pin is unavailable');

  for (const [currentQuestionId, predecessorQuestionId] of pairs) {
    const question = currentCatalog.getQuestionById(currentQuestionId);
    assert.ok(question);
    assert.equal(currentCatalog.getQuestionById(predecessorQuestionId), undefined, `${predecessorQuestionId} is not silently mapped into current content`);
    assert.ok(current.track.getQuestion(currentQuestionId), `${currentQuestionId} is available through APP discovery`);
    assert.equal(current.track.getQuestion(predecessorQuestionId), undefined, `${predecessorQuestionId} is not selected from active APP discovery`);
    const oldQuestion: Question | undefined = historical.getQuestion(predecessorQuestionId);
    assert.ok(oldQuestion, `${predecessorQuestionId} remains available in its exact retained package`);
    const retainedSource = retained.artifact.questions.find((candidate: { questionId: string }) => candidate.questionId === predecessorQuestionId);
    assert.ok(retainedSource);
    assert.equal(oldQuestion.prompt, retainedSource.prompt, `${predecessorQuestionId} resolves from retained source`);
    assert.equal(historical.getQuestion(currentQuestionId), undefined, `${currentQuestionId} remains current-only`);

    const retainedRef = { ...retainedIdentity, questionId: predecessorQuestionId };
    const resolvedRetained = await owner.resolveItem(retainedRef);
    assert.equal(resolvedRetained.question.prompt, retainedSource.prompt, `${predecessorQuestionId} resolves through the APP exact-package owner`);
    await assert.rejects(owner.resolveItem({ trackId, contentVersion: current.track.contentVersion, artifactSha256: current.track.artifactSha256, questionId: predecessorQuestionId }));
    await assert.rejects(owner.resolveItem({ ...retainedRef, questionId: currentQuestionId }));

    const prepared = await current.runtime.prepare({
      trackId,
      modeId: 'certification-focus-practice',
      request: { sessionId: `replacement-${currentQuestionId}`, mentalUnitId: question.mentalUnitId, requestedLength: 40 },
      attempts: [],
      reviews: [],
      now: '2026-10-14T12:00:00.000Z',
    });
    assert.ok(prepared.session.itemOrder.some((occurrence) => occurrence.item.questionId === currentQuestionId), `${currentQuestionId} enters current practice`);
    assert.ok(prepared.session.itemOrder.every((occurrence) => occurrence.item.questionId !== predecessorQuestionId), `${predecessorQuestionId} is not substituted into current practice`);
  }
});
