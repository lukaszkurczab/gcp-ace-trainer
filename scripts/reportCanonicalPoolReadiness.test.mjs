import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCanonicalPoolReadinessReport,
  writeCanonicalPoolReadinessReport,
} from "./reportCanonicalPoolReadiness.mjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getTracks,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  CODING_INTERVIEW_TRACK_ID,
  BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
  FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
  OBJECT_ORIENTED_DESIGN_INTERVIEW_TRACK_ID,
} = require("../src/domain/tracks/trackRegistry.ts");
const { loadCanonicalRuntimeCatalog } = require("../src/content/canonical/runtimeCatalog.ts");

test("reports actual canonical tracks, ordinary pool counts, and production-prepared simulation shapes", async () => {
  const report = await buildCanonicalPoolReadinessReport();
  assert.equal(report.schema, "patternly-canonical-pool-readiness-v1");
  assert.equal(report.sourceScope, "bundled_canonical_snapshot");
  assert.equal(report.userAvailability, "not_evaluated");
  assert.equal(report.trackCount, 9);
  assert.equal(report.ordinaryModeCount, 29);
  const expectedConfiguredIds = [
    GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
    CODING_INTERVIEW_TRACK_ID,
    BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
    FRONTEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID,
    OBJECT_ORIENTED_DESIGN_INTERVIEW_TRACK_ID,
  ].sort();
  const configuredIds = report.tracks.filter((track) => track.simulation.status === "configured").map((track) => track.trackId).sort();
  assert.deepEqual(configuredIds, expectedConfiguredIds);

  const gcp = report.tracks.find((track) => track.trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);
  assert.ok(gcp);
  assert.deepEqual(gcp.simulation.preparedQuestionsByContentDomain.map(({ questionCount }) => questionCount), [10, 15, 15, 10]);
  assert.equal(gcp.simulation.preparedQuestionCount, 50);

  const coding = report.tracks.find((track) => track.familyId === "coding_interview");
  assert.equal(coding?.simulation.preparedQuestionCount, 40);
  assert.equal(coding?.simulation.profileOrderVerified, true);

  const designTracks = report.tracks.filter((track) => track.familyId === "design_interview");
  assert.equal(designTracks.length, 3);
  assert.ok(designTracks.every((track) => track.simulation.shape === "staged_case_anchor" && track.simulation.anchorCount === 1));
  assert.ok(designTracks.every((track) => !JSON.stringify(track).includes("poolCapacity")));

  const unconfiguredCertification = report.tracks.filter((track) => track.familyId === "certification" && track.trackId !== GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);
  assert.equal(unconfiguredCertification.length, 4);
  assert.ok(unconfiguredCertification.every((track) => track.simulation.status === "not_configured"));

  const evidenceModes = report.tracks.flatMap((track) => track.ordinaryModes).filter((mode) => mode.availability === "evidence_conditioned");
  assert.ok(evidenceModes.length > 0);
  assert.ok(evidenceModes.every((mode) => mode.eligibility === "not_evaluated"));

  const serialized = JSON.stringify(report);
  assert.equal(serialized.includes("questionId"), false);
  assert.equal(serialized.includes("profileId"), false);
  assert.equal(serialized.includes("answer"), false);
});

test("fails closed on duplicate registry IDs and mismatched or duplicate catalog sets without writing partial JSON", async () => {
  const registrations = getTracks();
  const catalog = await loadCanonicalRuntimeCatalog();
  for (const options of [
    { registrations: [...registrations, registrations[0]], catalog },
    { registrations, catalog: { ...catalog, tracks: catalog.tracks.slice(1) } },
    { registrations, catalog: { ...catalog, tracks: [...catalog.tracks, catalog.tracks[0]] } },
  ]) {
    let output = "";
    await assert.rejects(writeCanonicalPoolReadinessReport((text) => { output += text; }, options));
    assert.equal(output, "");
  }
});

test("fails closed when a required configured simulation profile is missing or has the wrong mode", async () => {
  const registrations = getTracks();
  const catalog = await loadCanonicalRuntimeCatalog();
  const codingTrackId = "coding-interview-dsa-problem-solving";
  const baseCodingTrack = catalog.getTrack(codingTrackId);
  const withTrack = (track) => ({
    ...catalog,
    getTrack(trackId) { return trackId === codingTrackId ? track : catalog.getTrack(trackId); },
  });
  const invalidCatalogs = [
    withTrack({ ...baseCodingTrack, simulationProfiles: [] }),
    withTrack({ ...baseCodingTrack, simulationProfiles: baseCodingTrack.simulationProfiles.map((profile) => ({ ...profile, modeId: "wrong-simulation-mode" })) }),
  ];
  for (const invalidCatalog of invalidCatalogs) {
    let output = "";
    await assert.rejects(writeCanonicalPoolReadinessReport((text) => { output += text; }, { registrations, catalog: invalidCatalog }));
    assert.equal(output, "");
  }
});

test("fails closed when an unconfigured certification track unexpectedly gains a simulation profile", async () => {
  const registrations = getTracks();
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.tracks.map((trackId) => catalog.getTrack(trackId)).find((candidate) =>
    candidate.trackId !== GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID
      && registrations.find((registration) => registration.id === candidate.trackId)?.familyId === "certification");
  assert.ok(track);
  const invalidCatalog = {
    ...catalog,
    getTrack(trackId) {
      return trackId === track.trackId
        ? { ...track, simulationProfiles: [{ profileId: "unexpected-profile", familyId: "certification", modeId: "unexpected-mode", familyConfig: {} }] }
        : catalog.getTrack(trackId);
    },
  };
  let output = "";
  await assert.rejects(writeCanonicalPoolReadinessReport((text) => { output += text; }, { registrations, catalog: invalidCatalog }));
  assert.equal(output, "");
});

test("rejects wrong pins, empty prepared plans, and duplicate prepared references without partial output", async () => {
  const registrations = getTracks();
  const catalog = await loadCanonicalRuntimeCatalog();
  const invalidRuntimes = [
    async (track, input) => preparedRuntime(track, input, { pin: "wrong" }),
    async (track, input) => preparedRuntime(track, input, { empty: true }),
    async (track, input) => preparedRuntime(track, input, { duplicate: true }),
  ];
  for (const runtimeFactory of invalidRuntimes) {
    let output = "";
    await assert.rejects(writeCanonicalPoolReadinessReport((text) => { output += text; }, { registrations, catalog, createRuntime: (track) => ({
      prepare: (input) => runtimeFactory(track, input),
      validateResume: async () => undefined,
    }) }));
    assert.equal(output, "");
  }
});

async function preparedRuntime(track, input, variant) {
  const question = track.questions[0];
  const actualLength = variant.empty ? 0 : variant.duplicate ? 2 : 1;
  const item = {
    trackId: track.trackId,
    questionId: question.questionId,
    contentVersion: variant.pin ? "wrong-version" : track.contentVersion,
    artifactSha256: track.artifactSha256,
  };
  const occurrences = Array.from({ length: actualLength }, (_, index) => ({ occurrenceId: `${input.request.sessionId}:${index}`, item }));
  return {
    session: {
      id: input.request.sessionId,
      trackId: track.trackId,
      modeId: input.modeId,
      status: "active",
      requestedLength: actualLength,
      actualLength,
      itemOrder: occurrences,
    },
    firstOccurrence: { questionId: question.questionId },
    draft: null,
  };
}
