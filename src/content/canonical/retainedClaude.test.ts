import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolveRetainedClaudeTrack } from "./runtimeCatalog";

for (const file of ["claude-pre-qle-v2", "claude-qle-v2-first-cases", "claude-qle-v2-before-identity"]) {
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
    for (const pin of [
      { trackId: retained.lock.trackId, contentVersion: retained.lock.contentVersion, artifactSha256: retained.ledger.training.artifactSha256 },
      { trackId: retained.lock.trackId, contentVersion: retained.ledger.training.contentVersion, artifactSha256: retained.lock.sha256 },
      { trackId: retained.lock.trackId, contentVersion: "unknown", artifactSha256: retained.lock.sha256 },
      { trackId: "aws-certified-solutions-architect-associate", contentVersion: retained.lock.contentVersion, artifactSha256: retained.lock.sha256 },
    ]) assert.equal(await resolveRetainedClaudeTrack(pin), null);
  });
}

test('replacement IDs are current-only and predecessor IDs resolve only through exact historical pins', async () => {
  const { ContentPackageRuntimeOwner } = await import('../../application/contentPackageRuntimeOwner');
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  await owner.verifyBundledPackages();
  const trackId = 'claude-certified-architect-professional-certification';
  const current = await owner.resolveForDiscovery(trackId, 'certification');
  const coverage = JSON.parse(readFileSync('../patternly-content/docs/evidence/content-audits/2026-10-13-claude-qle-v2-coverage.json', 'utf8'));
  const original = JSON.parse(readFileSync('src/content/generated/retained-content/claude-pre-qle-v2.json', 'utf8'));
  assert.equal(coverage.replacementLineage.length, 8);
  for (const relation of coverage.replacementLineage) {
    const question = current.track.getQuestion(relation.currentQuestionId);
    assert.ok(question);
    assert.equal(current.track.getQuestion(relation.predecessor.questionId), undefined);
    const historical = await owner.resolveItem(relation.predecessor);
    const expected = original.artifact.questions.find((q: { questionId: string }) => q.questionId === relation.predecessor.questionId);
    assert.equal(historical.question.prompt, expected.prompt);
    await assert.rejects(owner.resolveItem({ trackId, contentVersion: current.track.contentVersion, artifactSha256: current.track.artifactSha256, questionId: relation.predecessor.questionId }));
    await assert.rejects(owner.resolveItem({ ...relation.predecessor, questionId: relation.currentQuestionId }));
    const prepared = await current.runtime.prepare({ trackId, modeId: 'certification-focus-practice', request: { sessionId: `replacement-${question.questionId}`, mentalUnitId: question.mentalUnitId, requestedLength: 40 }, attempts: [], reviews: [], now: '2026-10-14T12:00:00.000Z' });
    assert.ok(prepared.session.itemOrder.some(occurrence => occurrence.item.questionId === relation.currentQuestionId));
    assert.ok(prepared.session.itemOrder.every(occurrence => occurrence.item.questionId !== relation.predecessor.questionId));
  }
});
