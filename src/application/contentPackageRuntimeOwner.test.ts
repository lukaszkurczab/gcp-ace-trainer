import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { before } from "node:test";
import { getProductSimulationModeConfig } from "../content/canonical/productModeConfig";
import { ContentPackageRuntimeOwner, contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { ExactContentArtifactUnavailableError } from "./trainingLifecycle/contracts";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const BESD_TRAINING_PREDECESSOR = Object.freeze({
  trackId: "backend-system-design-interview",
  contentVersion: "backend-system-design-interview-authoring-v2026.10.03-bizq01-14-bizq02-v2",
  artifactSha256: "d7f2762e8cc71e41addb775a5221cf1b79cd5ef2e885a7cef8fce914069d1481",
});
const CLAUDE_TRAINING_PREDECESSOR = Object.freeze({
  trackId: "claude-certified-architect-professional-certification",
  contentVersion: "ccarp-2026.10.07-bizq02-v2",
  artifactSha256: "b71ec4df1c1aeade75e29981defd731b4bdd9032fec48721723710284d787c5f",
});

before(async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
});

test("bundled verification observes this owner's cached catalog without opening installed storage", async () => {
  const plans: object[] = [], proofs: string[] = [];
  const off = contentPackageRuntimeOwner.subscribeBundledVerification({
    onWorkPlan(plan) { plans.push(plan.build); assert.equal(plan.units.length, 12); },
    onVerifiedUnit(proof) { assert.equal(proof.build, plans[0]); proofs.push(proof.unitId); },
  });
  assert.equal(plans.length, 1);
  assert.equal(proofs.length, 12);
  await contentPackageRuntimeOwner.verifyBundledPackages();
  assert.equal(plans.length, 1); assert.equal(proofs.length, 12);
  off();
});

test("resolves an exact canonical artifact by track, content version, and SHA", async () => {
  const prepared = contentPackageRuntimeOwner.getPreparedDiscovery(TRACK_ID);
  const resolved = await contentPackageRuntimeOwner.resolveExactArtifact({
    trackId: prepared.track.trackId,
    contentVersion: prepared.track.contentVersion,
    artifactSha256: prepared.track.artifactSha256,
  });
  assert.equal(resolved.track.trackId, prepared.track.trackId);
  assert.equal(resolved.track.artifactSha256, prepared.track.artifactSha256);
  await assert.rejects(
    contentPackageRuntimeOwner.resolveExactArtifact({
      trackId: prepared.track.trackId,
      contentVersion: prepared.track.contentVersion,
      artifactSha256: "f".repeat(64),
    }),
    (error: unknown) => error instanceof ExactContentArtifactUnavailableError,
  );
  await assert.rejects(
    contentPackageRuntimeOwner.resolveExactArtifact({
      trackId: prepared.track.trackId,
      contentVersion: prepared.track.contentVersion,
      artifactSha256: "not-a-sha",
    }),
    /identity is invalid/,
  );
});

test("family admission and runtime catalog pins cannot be substituted independently", async () => {
  await assert.rejects(
    contentPackageRuntimeOwner.resolveForPreparation({
      trackId: TRACK_ID,
      familyId: "certification",
      modeId: "coding-interview-guided-practice",
    }),
    /does not own coding-interview-dsa-problem-solving/u,
  );

  const prepared = contentPackageRuntimeOwner.getPreparedDiscovery(TRACK_ID);
  await assert.rejects(
    contentPackageRuntimeOwner.resolveExactArtifact({
      trackId: TRACK_ID,
      contentVersion: prepared.track.contentVersion,
      artifactSha256: "f".repeat(64),
    }),
    (error: unknown) => error instanceof ExactContentArtifactUnavailableError,
  );

  const runtime = prepared.runtime;
  await assert.rejects(runtime.prepare({
    trackId: "google-cloud-associate-cloud-engineer",
    modeId: "coding-interview-guided-practice",
    request: { sessionId: "wrong-runtime-track", requestedLength: 10 },
    attempts: [],
    reviews: [],
    now: "2026-09-27T00:00:00.000Z",
  }), /track mismatch/u);
});

test("verified current OOD identity does not resolve an absent exact prior-version pin when retained packages are empty", async () => {
  let retainedPackageLoads = 0;
  const owner = new ContentPackageRuntimeOwner(
    () => "test-profile",
    async () => { retainedPackageLoads += 1; return []; },
  );
  await owner.verifyBundledPackages();
  const current = owner.getPreparedDiscovery("object-oriented-design-interview").track;
  const trackId = "object-oriented-design-interview";
  const lock = JSON.parse(readFileSync("src/content/generated/canonical-content/content-lock.json", "utf8")) as {
    tracks: readonly { trackId: string; contentVersion: string; sha256: string }[];
  };
  const installedLock = lock.tracks.find((entry) => entry.trackId === trackId);
  assert.ok(installedLock, "the verified current APP bundle must contain its OOD content lock");
  const successorLedger = JSON.parse(readFileSync("src/content/generated/canonical-content/content-successor-ledger.json", "utf8")) as {
    tracks: readonly {
      trackId: string;
      training: Readonly<{ contentVersion: string; artifactSha256: string }>;
      planningPolicy: Readonly<{ contentVersion: string; artifactSha256: string; policyVersion: string }>;
    }[];
  };
  const currentSuccessor = successorLedger.tracks.find((entry) => entry.trackId === trackId);
  assert.ok(currentSuccessor, "the current OOD bundle must declare its training and planning-policy identities");
  const currentIdentity = { contentVersion: current.contentVersion, artifactSha256: current.artifactSha256 };
  assert.deepEqual(currentIdentity, {
    contentVersion: currentSuccessor.training.contentVersion,
    artifactSha256: currentSuccessor.training.artifactSha256,
  }, "the verified runtime catalog must use the installed current training identity");
  assert.deepEqual(
    { contentVersion: installedLock.contentVersion, artifactSha256: installedLock.sha256 },
    { contentVersion: currentSuccessor.planningPolicy.contentVersion, artifactSha256: currentSuccessor.planningPolicy.artifactSha256 },
    "the installed artifact lock pins the separate current planning-policy projection",
  );

  await assert.rejects(
    owner.resolveExactArtifact({
      trackId: "object-oriented-design-interview",
      contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
      artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
    }),
    (error: unknown) => error instanceof ExactContentArtifactUnavailableError
      && error.identity.trackId === "object-oriented-design-interview"
      && error.identity.contentVersion === "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
  );
  assert.notDeepEqual(currentIdentity, {
    contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
    artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
  }, "the current package does not impersonate the exact prior-version history pin");
  assert.equal(retainedPackageLoads, 1);
});

test("an existing BESD session keeps its exact predecessor pin and reports it unavailable after the approved successor", async () => {
  const current = contentPackageRuntimeOwner.getPreparedDiscovery(BESD_TRAINING_PREDECESSOR.trackId).track;
  assert.notDeepEqual(current.trainingIdentity, {
    contentVersion: BESD_TRAINING_PREDECESSOR.contentVersion,
    artifactSha256: BESD_TRAINING_PREDECESSOR.artifactSha256,
  }, "the BESD successor must not impersonate the previous training identity");
  await assert.rejects(
    contentPackageRuntimeOwner.resolveExactArtifact(BESD_TRAINING_PREDECESSOR),
    (error: unknown) => error instanceof ExactContentArtifactUnavailableError
      && error.identity.trackId === BESD_TRAINING_PREDECESSOR.trackId
      && error.identity.contentVersion === BESD_TRAINING_PREDECESSOR.contentVersion
      && error.identity.artifactSha256 === BESD_TRAINING_PREDECESSOR.artifactSha256,
  );
  const resolved = await contentPackageRuntimeOwner.resolveExactArtifact({
    trackId: current.trackId,
    contentVersion: current.trainingIdentity!.contentVersion,
    artifactSha256: current.trainingIdentity!.artifactSha256,
  });
  assert.equal(resolved.track.trackId, BESD_TRAINING_PREDECESSOR.trackId);
  assert.deepEqual(resolved.track.trainingIdentity, current.trainingIdentity);
});

test("a Claude session from before the published targeted repair keeps its exact predecessor pin", async () => {
  const current = contentPackageRuntimeOwner.getPreparedDiscovery(CLAUDE_TRAINING_PREDECESSOR.trackId).track;
  assert.notDeepEqual(current.trainingIdentity, {
    contentVersion: CLAUDE_TRAINING_PREDECESSOR.contentVersion,
    artifactSha256: CLAUDE_TRAINING_PREDECESSOR.artifactSha256,
  }, "the published Claude repair must not impersonate its previous training identity");
  await assert.rejects(
    contentPackageRuntimeOwner.resolveExactArtifact(CLAUDE_TRAINING_PREDECESSOR),
    (error: unknown) => error instanceof ExactContentArtifactUnavailableError
      && error.identity.trackId === CLAUDE_TRAINING_PREDECESSOR.trackId
      && error.identity.contentVersion === CLAUDE_TRAINING_PREDECESSOR.contentVersion
      && error.identity.artifactSha256 === CLAUDE_TRAINING_PREDECESSOR.artifactSha256,
  );
  const resolved = await contentPackageRuntimeOwner.resolveExactArtifact({
    trackId: current.trackId,
    contentVersion: current.trainingIdentity!.contentVersion,
    artifactSha256: current.trainingIdentity!.artifactSha256,
  });
  assert.equal(resolved.track.trackId, CLAUDE_TRAINING_PREDECESSOR.trackId);
  assert.deepEqual(resolved.track.trainingIdentity, current.trainingIdentity);
});

test("malformed runtime identities never become typed exact-artifact absence", async () => {
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  await owner.verifyBundledPackages();
  for (const identity of [
    { trackId: "not-a-registered-track" as never, contentVersion: "old-v1", artifactSha256: "a".repeat(64) },
    { trackId: TRACK_ID, contentVersion: "../old-v1", artifactSha256: "a".repeat(64) },
    { trackId: TRACK_ID, contentVersion: "old-v1", artifactSha256: "not-a-sha" },
  ]) {
    await assert.rejects(owner.resolveExactArtifact(identity), (error: unknown) => !(error instanceof ExactContentArtifactUnavailableError));
  }
});

test("retained inventory failures and profile-scope changes remain blocking, never typed missing", async () => {
  let scope = "profile-a";
  const unreadable = new ContentPackageRuntimeOwner(() => scope, async () => { throw new Error("retained package read failed"); });
  await unreadable.verifyBundledPackages();
  await assert.rejects(unreadable.resolveExactArtifact({
    trackId: "object-oriented-design-interview",
    contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
    artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
  }), (error: unknown) => !(error instanceof ExactContentArtifactUnavailableError));

  const transitioning = new ContentPackageRuntimeOwner(() => scope, async () => { scope = "profile-b"; return []; });
  await transitioning.verifyBundledPackages();
  await assert.rejects(transitioning.resolveExactArtifact({
    trackId: "object-oriented-design-interview",
    contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
    artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
  }), (error: unknown) => !(error instanceof ExactContentArtifactUnavailableError));
});

test("resolves only an opaque interaction item bound to the exact canonical package ref", async () => {
  const prepared = contentPackageRuntimeOwner.getPreparedDiscovery(TRACK_ID);
  const question = prepared.track.questions[0]!;
  const ref = {
    trackId: prepared.track.trackId,
    questionId: question.questionId,
    contentVersion: prepared.track.contentVersion,
    artifactSha256: prepared.track.artifactSha256,
  } as const;
  const resolved = await contentPackageRuntimeOwner.resolveItem(ref);
  assert.equal(resolved.question.questionId, question.questionId);
  assert.equal(resolved.question.interactionType, prepared.track.getQuestion(question.questionId)?.interactionType);
  assert.equal(resolved.interactions.present(question.questionId, null).interactionType, question.interactionType);
  await assert.rejects(
    contentPackageRuntimeOwner.resolveItem({ ...ref, artifactSha256: "f".repeat(64) }),
    (error: unknown) => error instanceof ExactContentArtifactUnavailableError,
  );
  await assert.rejects(
    contentPackageRuntimeOwner.resolveItem({ ...ref, questionId: "missing-question" }),
    /exact canonical question/,
  );
});

test("prepares Certification Exam Simulation from the exact canonical artifact profile", async () => {
  const trackId = "google-cloud-associate-cloud-engineer";
  const canonical = contentPackageRuntimeOwner.getPreparedDiscovery(trackId).track;
  const validated = getProductSimulationModeConfig(canonical.trackId, canonical.simulationProfiles);
  assert.equal(canonical.modes.some((mode) => mode.modeId === "certification-exam-simulation"), false);
  assert.equal(validated.profile.profileId, "google-cloud-associate-cloud-engineer-certification-exam-v1");

  const resolved = await contentPackageRuntimeOwner.resolveForPreparation({
    trackId,
    familyId: "certification",
    modeId: "certification-exam-simulation",
  });
  assert.equal(resolved.track.trackId, canonical.trackId);
  assert.equal(resolved.track.contentVersion, canonical.contentVersion);
  assert.equal(resolved.track.artifactSha256, canonical.artifactSha256);
  assert.equal(resolved.track.simulationProfiles?.[0]?.profileId, validated.profile.profileId);
  const prepared = await resolved.runtime.prepare({
    trackId,
    modeId: "certification-exam-simulation",
    request: { sessionId: "owner-gcp-simulation" },
    attempts: [],
    reviews: [],
    now: "2026-09-27T00:00:00.000Z",
  });
  assert.equal(prepared.session.actualLength, 50);
  await assert.rejects(
    contentPackageRuntimeOwner.resolveForPreparation({
      trackId,
      familyId: "certification",
      modeId: "certification-exam-simulation",
      nodeId: "organization_projects_policies_services_quotas_and_assets",
    }),
    /do not accept a nodeId/u,
  );
});

test("prepares Coding Mock from the exact canonical artifact profile and ordered 40-question pool", async () => {
  const canonical = contentPackageRuntimeOwner.getPreparedDiscovery(TRACK_ID).track;
  const validated = getProductSimulationModeConfig(canonical.trackId, canonical.simulationProfiles);
  assert.equal(validated.profile.profileId, "algorithms-interview-simulation-v1");
  assert.equal(validated.config.modeId, "coding-interview-simulation");
  assert.equal(validated.config.familyId, "coding_interview");
  if (validated.profile.familyId !== "coding_interview") throw new Error("Expected the canonical Coding Mock profile.");

  const resolved = await contentPackageRuntimeOwner.resolveForPreparation({
    trackId: TRACK_ID,
    familyId: "coding_interview",
    modeId: "coding-interview-simulation",
  });
  assert.equal(resolved.track.artifactSha256, canonical.artifactSha256);
  assert.deepEqual(resolved.track.simulationProfiles?.[0]?.familyConfig, validated.profile.familyConfig);
  const prepared = await resolved.runtime.prepare({
    trackId: TRACK_ID,
    modeId: "coding-interview-simulation",
    request: { sessionId: "owner-coding-simulation", scope: { simulationProfileId: validated.profile.profileId } },
    attempts: [],
    reviews: [],
    now: "2026-09-27T00:00:00.000Z",
  });
  assert.equal(prepared.session.actualLength, 40);
  assert.deepEqual(prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId), validated.profile.familyConfig.eligibleQuestionIds);
});
