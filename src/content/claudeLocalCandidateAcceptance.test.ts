import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "./canonical/runtimeCatalog";
import { projectCanonicalSourceLinks } from "../application/canonical/canonicalSourceLinks";
import { createCanonicalTrainingFamilyRuntime } from "../application/canonicalTrainingFamilyComposition";
import { evaluatePackageCompletion } from "../domain/learning/packageCompletionRule";
import { createTrainingAttempt } from "../domain/learning/trainingAttempt";
import type { TrackId } from "../domain/learning/trackIdentity";
import frozenRelease from "../../integration/contracts/content-release/release.lock.json";
import historicalRelease from "../../integration/contracts/content-release/release.lock.historical-0024.json";
import { ContentPackageRuntimeOwner } from "../application/contentPackageRuntimeOwner";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../infrastructure/storage/mmkvClient";
import { initializeStorageMetadata } from "../storage/repositories/storageMetadataRepository";
import { addTrainingAttempt, getTrainingAttempts } from "../storage/repositories";
import { productionTrackAdmissionContext } from "../application/tracks/trackAdmissionContext";


const TRACK = "claude-certified-architect-professional-certification";
const NOW = "2026-10-11T12:00:00.000Z";

test("CC05 formal bundled Claude exposes both learning resources and all 53 required exam units", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack(TRACK);
  assert.equal(track.questions.length, 918);
  const activeReleaseArtifact = frozenRelease.artifacts.find((artifact) => artifact.trackId === TRACK);
  assert.ok(activeReleaseArtifact, "the formal release lock must bind Claude");
  assert.equal(track.artifactSha256, activeReleaseArtifact.checksumSha256, "runtime pin must match the formal release lock, not the local-only acceptance record");
  const rule = track.completionRule;
  assert.equal(rule?.ruleVersion, 3);
  if (rule?.ruleVersion !== 3) throw new Error("The locally accepted Claude package requires unit coverage.");
  assert.equal(rule.chapters.length, 7);
  assert.equal(rule.chapters.reduce((total, chapter) => total + chapter.minimumAttemptCount, 0), 260);
  const units = rule.chapters.flatMap((chapter) => chapter.units.map((unit) => ({ nodeId: chapter.nodeId, ...unit })));
  assert.equal(units.length, 53);
  for (const question of track.questions) {
    const links = projectCanonicalSourceLinks(question);
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
  const previous = historicalRelease.artifacts.find((artifact) => artifact.trackId === TRACK)!;
  const previousTraining = { contentVersion: "ccarp-2026.10.11-capacity-v1-bizq02-v2-bizq03-planning-v2-training", artifactSha256: "4cf89c3a8a8bd5576abea3b655d90a6362d0ac9ae0eda08894dcdb26a943e23a" };
  const question = track.questions[0]!;
  const oldItem = { trackId: TRACK as TrackId, questionId: question.questionId, ...previousTraining };
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
  assert.notEqual(track.trainingIdentity?.artifactSha256, previous.checksumSha256);
  assert.notEqual(track.artifactSha256, previousTraining.artifactSha256);
  await assert.rejects(() => owner.resolveExactArtifact({ trackId: TRACK, ...previousTraining }), /unavailable/u);
  assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value, history, "loading the new package and failing old exact resolution preserve stored historical attempts");
  const prepared = await runtime.prepare({ trackId: TRACK, modeId: "certification-focus-practice", request: { sessionId: "cc05-current", requestedLength: 10 }, attempts: [], reviews: [], now: NOW });
  await assert.rejects(() => runtime.validateResume({ session: { ...prepared.session, contentVersion: previous.contentVersion, artifactSha256: previous.checksumSha256 }, draft: null }), /content identity is unavailable/u);
});
