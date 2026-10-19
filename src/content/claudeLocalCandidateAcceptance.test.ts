import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadCanonicalRuntimeCatalog } from "./canonical/runtimeCatalog";
import { projectCanonicalSourceLinks } from "../application/canonical/canonicalSourceLinks";
import { createCanonicalTrainingFamilyRuntime } from "../application/canonicalTrainingFamilyComposition";
import { evaluatePackageCompletion } from "../domain/learning/packageCompletionRule";
import { createTrainingAttempt } from "../domain/learning/trainingAttempt";
import type { TrackId } from "../domain/learning/trackIdentity";
import retainedClaude from "./generated/retained-content/claude-pre-qle-v2.json";
import { ContentPackageRuntimeOwner } from "../application/contentPackageRuntimeOwner";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../infrastructure/storage/mmkvClient";
import { initializeStorageMetadata } from "../storage/repositories/storageMetadataRepository";
import { addTrainingAttempt, getTrainingAttempts } from "../storage/repositories";
import { productionTrackAdmissionContext } from "../application/tracks/trackAdmissionContext";


const TRACK = "claude-certified-architect-professional-certification";
const NOW = "2026-10-19T12:00:00.000Z";

test("current Claude preserves CC05 resources and all required completion units", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(TRACK);
  const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const contentRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, "../patternly-content"));
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "patternly-claude-current-source-"));
  try {
    const { buildAll } = await import(pathToFileURL(path.join(contentRoot, "scripts/build.mjs")).href);
    const source = await buildAll({ rootDirectory: contentRoot, outputRoot });
    const artifact = JSON.parse(await readFile(path.join(outputRoot, `${TRACK}.json`), "utf8"));
    const lock = source.lock.tracks.find((entry: { trackId: string }) => entry.trackId === TRACK);
    assert.ok(lock, "the current CONTENT builder emits the Claude lock");
    assert.equal(track.contentVersion, lock.contentVersion);
    assert.equal(track.artifactSha256, lock.sha256);
    assert.deepEqual(track.questions, artifact.questions, "APP runtime questions match the validated current source build");
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
  const rule = track.completionRule;
  assert.equal(rule?.ruleVersion, 3);
  if (rule?.ruleVersion !== 3) throw new Error("The current Claude package requires unit coverage.");
  assert.equal(rule.chapters.length, 7);
  assert.equal(rule.chapters.reduce((total, chapter) => total + chapter.minimumAttemptCount, 0), 260);
  const units = rule.chapters.flatMap((chapter) => chapter.units.map((unit) => ({ nodeId: chapter.nodeId, ...unit })));
  assert.equal(units.length, 53);
  for (const question of track.questions) {
    const links = projectCanonicalSourceLinks(question);
    if (question.questionId.includes("-qle-v2-")) { assert.equal(links[0]?.role, "documentation"); continue; }
    assert.deepEqual(links.map((link) => link.role), ["documentation", "course"], question.questionId);
    assert.equal(links[1]?.requiresAccount, true);
    assert.equal(new URL(links[1]!.url).hostname, "anthropic-partners.skilljar.com");
    assert.ok(links[1]?.section);
  }
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  for (const [index, unit] of units.entries()) {
    const session = await runtime.prepare({ trackId: TRACK, modeId: "certification-focus-practice", request: { sessionId: `cc05-${index}`, requestedLength: 10, mentalUnitId: unit.mentalUnitId }, attempts: [], reviews: [], now: NOW });
    assert.ok(session.session.actualLength >= 4, unit.mentalUnitId);
    for (const occurrence of session.session.itemOrder) {
      const question = track.getQuestion(occurrence.item.questionId);
      assert.equal(question?.mentalUnitId, unit.mentalUnitId);
      assert.equal(question?.nodeId, unit.nodeId);
    }
    await runtime.validateResume({ session: session.session, draft: null });
  }
  for (const trackId of catalog.tracks.filter((id) => id !== TRACK)) {
    assert.equal(catalog.getTrack(trackId).completionRule?.ruleVersion, 2);
  }
});

test("CC05 keeps historical answer identity intact and grants no current coverage or resume alias", async () => {
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  const { track, runtime } = await owner.resolveForPreparation({ trackId: TRACK, familyId: "certification", modeId: "certification-focus-practice" });
  const retainedIdentity = { trackId: TRACK, contentVersion: retainedClaude.lock.contentVersion, artifactSha256: retainedClaude.lock.sha256 };
  const retained = await owner.resolveExactArtifact(retainedIdentity);
  assert.equal(retained.track.contentVersion, retainedIdentity.contentVersion);
  assert.equal(retained.track.artifactSha256, retainedIdentity.artifactSha256);
  const question = retained.track.questions[0]!;
  const oldItem = { trackId: TRACK as TrackId, questionId: question.questionId, contentVersion: retainedIdentity.contentVersion, artifactSha256: retainedIdentity.artifactSha256 };
  const history = [createTrainingAttempt({ id: "cc05-history", sessionId: "old-session", occurrenceId: "old-occurrence", trackId: TRACK, modeId: "certification-focus-practice", item: oldItem, response: {}, result: { kind: "correct", earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: oldItem, taxonomyOrSkillRefs: [] }, answeredAt: NOW, committedAt: NOW })];
  const before = JSON.stringify(history);
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  initializeStorageMetadata();
  await addTrainingAttempt(history[0]!, productionTrackAdmissionContext);
  const completion = evaluatePackageCompletion(track, history, (questionId) => track.getQuestion(questionId));
  assert.equal(completion.kind, "in_progress");
  assert.equal(completion.qualifyingAttemptCount, 0);
  assert.equal(completion.coverageDeficit, 212);
  assert.equal(JSON.stringify(history), before);
  assert.notDeepEqual(track.trainingIdentity, { contentVersion: retainedIdentity.contentVersion, artifactSha256: retainedIdentity.artifactSha256 });
  assert.notEqual(track.artifactSha256, retainedIdentity.artifactSha256);
  const resolvedOldQuestion = await owner.resolveItem(oldItem);
  assert.equal(resolvedOldQuestion.question.questionId, question.questionId);
  assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value, history, "resolving the retained exact package preserves stored historical attempts");
  const prepared = await runtime.prepare({ trackId: TRACK, modeId: "certification-focus-practice", request: { sessionId: "cc05-current", requestedLength: 10 }, attempts: [], reviews: [], now: NOW });
  await assert.rejects(() => runtime.validateResume({ session: { ...prepared.session, contentVersion: retainedIdentity.contentVersion, artifactSha256: retainedIdentity.artifactSha256 }, draft: null }), /content identity is unavailable/u);
});
