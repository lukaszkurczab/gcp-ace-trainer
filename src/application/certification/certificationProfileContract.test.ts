import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import type { TestContext } from "node:test";
import type { CompletedTrainingSession } from "../../domain";
import { CanonicalQuestionValidationError } from "../../content/canonical/questionValidation";
import { createCanonicalQuestionCatalog } from "../../content/canonical/questionCatalog";
import { loadCanonicalRuntimeCatalog, type CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import { getProductSimulationModeConfig } from "../../content/canonical/productModeConfig";
import type { CanonicalArtifact, CanonicalContentLockRecord, CanonicalSimulationProfile } from "../../content/canonical/questionTypes";
import { createCanonicalTrainingFamilyRuntime, createTrainingCatalog, createTrainingInteractionPort } from "../canonicalTrainingFamilyComposition";
import { projectCertificationExamReview } from "./certificationExamReviewProjection";
import { buildCertificationPracticeStartCommand } from "./certificationSessionFacade";
import { lockedContentProducer } from "../../../scripts/fixtures/lockedContentProducer";

const GCP = "google-cloud-associate-cloud-engineer";
const FIXTURE_TRACK = "aws-certified-solutions-architect-associate";
const NOW = "2026-10-15T12:00:00.000Z";
const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
const producerRepositoryRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? "../patternly-content");

/** Test adapter uses the real validated artifact and production interaction modules. */
async function admittedFixture(artifact: CanonicalArtifact, lock: CanonicalContentLockRecord): Promise<CanonicalTrackRuntime> {
  const catalog = await createCanonicalQuestionCatalog(artifact, lock, artifact.trackId, async (text) => sha256(text));
  const original = (await loadCanonicalRuntimeCatalog()).getTrack(GCP);
  return {
    ...original, ...catalog, contentReleaseId: "certification-contract-fixture",
    getQuestion: catalog.getQuestionById,
    getQuestionsForNode: catalog.getQuestionsByNodeId,
    getQuestionsForMentalUnit: catalog.getQuestionsByMentalUnitId,
  };
}

async function buildGcp(t: Pick<TestContext, "after">) {
  const producerRoot = await lockedContentProducer({ appRoot: process.cwd(), repositoryRoot: producerRepositoryRoot, trackId: GCP, after: (cleanup) => t.after(cleanup) });
  const outputRoot = await mkdtemp(path.join(tmpdir(), "patternly26-producer-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const producer = await import(pathToFileURL(path.join(producerRoot, "scripts/build.mjs")).href) as {
    buildTrack(options: { rootDirectory: string; outputRoot: string; trackId: string }): Promise<{ artifactBytes: string; lockEntry: CanonicalContentLockRecord }>;
  };
  return producer.buildTrack({ rootDirectory: producerRoot, outputRoot, trackId: GCP });
}

async function exercise(track: CanonicalTrackRuntime, expectedCount: number, expectedDuration: number) {
  const runtime = createCanonicalTrainingFamilyRuntime(track);
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: "certification-exam-simulation", request: { sessionId: `contract:${track.trackId}` }, attempts: [], reviews: [], now: NOW });
  assert.ok(prepared.draft);
  assert.equal(prepared.session.actualLength, expectedCount);
  assert.equal(prepared.session.configurationSnapshot.timerDurationMs, expectedDuration * 60_000);
  assert.ok(prepared.session.itemOrder.every(({ item }) => item.trackId === track.trackId && item.contentVersion === track.contentVersion && item.artifactSha256 === track.artifactSha256));
  await runtime.validateResume({ session: prepared.session, draft: prepared.draft });
  const profile = track.simulationProfiles![0] as CanonicalSimulationProfile;
  const changedProfile = { ...profile, profileVersion: `${profile.profileVersion}-changed` };
  await assert.rejects(createCanonicalTrainingFamilyRuntime({ ...track, simulationProfiles: [changedProfile] }).validateResume({ session: prepared.session, draft: prepared.draft }), /snapshot/);
  await assert.rejects(runtime.validateResume({ session: { ...prepared.session, artifactSha256: "0".repeat(64) }, draft: prepared.draft }), /identity|exact|artifact|fingerprint/i);
  const first = prepared.session.itemOrder[0]!;
  const question = track.getQuestion(first.item.questionId)!;
  const draft = { ...prepared.draft, responsesByOccurrenceId: { [first.occurrenceId]: question.answer } };
  const finalized = await runtime.finalizeSimulation({ session: prepared.session, draft, attempts: [], reviews: [], now: "2026-10-15T12:01:00.000Z" });
  const summaries = createTrainingCatalog(track);
  const interactions = createTrainingInteractionPort(track);
  const input = {
    attempts: finalized.attempts, profile, result: finalized.result, session: finalized.session as CompletedTrainingSession,
    questionsById: new Map(summaries.questions.map((entry) => [entry.questionId, entry])),
    resolveItem: async (item: typeof first.item) => ({ question: summaries.getQuestion(item.questionId)!, interactions }),
  };
  const review = await projectCertificationExamReview(input);
  assert.equal(review.total, expectedCount);
  assert.equal(review.answeredCount, 1);
  assert.equal(review.unansweredCount, expectedCount - 1);
  assert.equal(review.profileId, profile.profileId);
  assert.equal(review.profileVersion, profile.profileVersion);
  await assert.rejects(projectCertificationExamReview({ ...input, profile: changedProfile }), /profile/);
  await assert.rejects(projectCertificationExamReview({ ...input, session: { ...input.session, trackId: "microsoft-azure-administrator-associate-az-104" } }), /profile/);
  await assert.rejects(projectCertificationExamReview({ ...input, result: { ...finalized.result, trackId: "microsoft-azure-administrator-associate-az-104" } }), /profile/);
  await assert.rejects(projectCertificationExamReview({ ...input, session: { ...input.session, contentVersion: `${track.contentVersion}-wrong` } }), /fingerprint|reference/);
  await assert.rejects(createCanonicalTrainingFamilyRuntime({ ...track, simulationProfiles: [] }).prepare({ trackId: track.trackId, modeId: profile.modeId, request: { sessionId: "missing-profile" }, attempts: [], reviews: [], now: NOW }), /unavailable/);
  return prepared;
}

test("real GCP producer artifact is byte-identical and reaches preparation, exact resume, finalization and result", async (t) => {
  const built = await buildGcp(t);
  const artifact = JSON.parse(built.artifactBytes) as CanonicalArtifact;
  const bundled = JSON.parse(await readFile(`src/content/generated/canonical-content/${GCP}.json`, "utf8"));
  assert.deepEqual(artifact, bundled);
  assert.equal(sha256(built.artifactBytes), built.lockEntry.sha256);
  const track = await admittedFixture(artifact, built.lockEntry);
  const prepared = await exercise(track, 50, 120);
  const bundledPrepared = await createCanonicalTrainingFamilyRuntime((await loadCanonicalRuntimeCatalog()).getTrack(GCP)).prepare({ trackId: GCP, modeId: "certification-exam-simulation", request: { sessionId: `contract:${GCP}` }, attempts: [], reviews: [], now: NOW });
  assert.deepEqual(prepared.session, bundledPrepared.session);
});

test("a test-only Certification artifact profile drives a different count, duration and blueprint without registry or storage changes", async (t) => {
  const built = await buildGcp(t);
  const artifact = JSON.parse(built.artifactBytes) as CanonicalArtifact;
  const original = artifact.simulationProfiles![0] as CanonicalSimulationProfile;
  // This profile exists only in this test. No product admission or config is changed.
  const profile: CanonicalSimulationProfile = {
    ...original, profileId: "fixture-certification-profile", profileVersion: "7",
    familyConfig: { ...original.familyConfig, durationMinutes: 17, questionCount: { kind: "range", minimum: 7, maximum: 9 },
      blueprint: { kind: "weighted_sections", sections: original.familyConfig.blueprint.sections.map((section, index) => ({ ...section, weightPercent: [10, 20, 30, 40][index]! })) },
      nodeDomainMapEvidence: { ...original.familyConfig.nodeDomainMapEvidence, artifactPath: `artifacts/tracks/${FIXTURE_TRACK}/${original.familyConfig.nodeDomainMapEvidence.contentVersion}/track-artifact.json` },
    },
  };
  const fixture: CanonicalArtifact = { ...artifact, trackId: FIXTURE_TRACK, contentVersion: "test-only-certification-v7", questions: artifact.questions.map((question) => ({ ...question, trackId: FIXTURE_TRACK })), simulationProfiles: [profile] };
  const lock = { ...built.lockEntry, trackId: fixture.trackId, contentVersion: fixture.contentVersion, sha256: sha256(JSON.stringify(fixture)) };
  const track = await admittedFixture(fixture, lock);
  const prepared = await exercise(track, 7, 17);
  const domainCounts = profile.familyConfig.blueprint.sections.map((section) => prepared.session.itemOrder.filter(({ item }) => track.getQuestion(item.questionId)!.contentDomainId === section.contentDomainId).length);
  assert.deepEqual(domainCounts, [1, 1, 2, 3]);
  assert.throws(() => getProductSimulationModeConfig(GCP, [profile]), /unavailable|does not match/);
  assert.throws(() => getProductSimulationModeConfig(FIXTURE_TRACK, [profile, profile]), /unavailable/);
  for (const mutate of [
    (copy: CanonicalSimulationProfile) => ({ ...copy, familyId: "coding_interview" }),
    (copy: CanonicalSimulationProfile) => ({ ...copy, familyConfig: { ...copy.familyConfig, durationMinutes: 0 } }),
    (copy: CanonicalSimulationProfile) => ({ ...copy, familyConfig: { ...copy.familyConfig, questionCount: { ...copy.familyConfig.questionCount, maximum: 0 } } }),
    (copy: CanonicalSimulationProfile) => ({ ...copy, familyConfig: { ...copy.familyConfig, blueprint: { ...copy.familyConfig.blueprint, sections: copy.familyConfig.blueprint.sections.map((section) => ({ ...section, weightPercent: 5 })) } } }),
  ]) {
    const bad = { ...fixture, simulationProfiles: [mutate(profile)] };
    await assert.rejects(admittedFixture(bad as CanonicalArtifact, { ...lock, sha256: sha256(JSON.stringify(bad)) }), (error: unknown) => error instanceof CanonicalQuestionValidationError && error.errors.some((message) => /family|duration|range|weights/.test(message)));
  }
  const firstDomain = profile.familyConfig.blueprint.sections[0]!.contentDomainId;
  const insufficient = { ...track, questions: track.questions.filter((question) => question.contentDomainId !== firstDomain) };
  await assert.rejects(createCanonicalTrainingFamilyRuntime(insufficient).prepare({ trackId: FIXTURE_TRACK, modeId: profile.modeId, request: { sessionId: "undersized" }, attempts: [], reviews: [], now: NOW }), /source pool.*requires/);
  assert.equal(buildCertificationPracticeStartCommand({ trackId: FIXTURE_TRACK, modeId: "certification-focus-practice" }).trackId, FIXTURE_TRACK);
});
