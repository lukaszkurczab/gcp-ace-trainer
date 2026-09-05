import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../application/contentPackageRuntimeOwner";
import { contentPackagePinsEqual, getTrackDisplay, getTracks } from "../domain";
import { buildPracticeModes } from "../features/practice/practiceFlowModel";
import { GENERATED_FREE_NODE_PACKAGES } from "./bundled/generatedFreeNodePackages";

const REMOVED_RUNTIME_OWNERS = [
  "src/content/catalogRepository.ts",
  "src/content/application/contentCatalogRepository.ts",
  "src/content/application/validateBundledContent.ts",
  "src/content/application/bundledContentAvailabilityPort.ts",
  "src/application/coding-interview/createCodingInterviewRuntime.ts",
  "src/application/certification/createCertificationRuntime.ts",
  "src/tracks/contentFamilyHandlers.ts",
] as const;

test("PKG-04A makes exact package pins and closed profiles the only runtime content authority", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();

  const coding = await contentPackageRuntimeOwner.resolveForPreparation({
    familyId: "coding_interview",
    modeId: "coding-interview-guided-practice",
    trackId: "coding-interview-dsa-problem-solving",
  });
  const exactCoding = await contentPackageRuntimeOwner.resolveExact(coding.package.packagePin);
  assert.equal(contentPackagePinsEqual(exactCoding.package.packagePin, coding.package.packagePin), true);
  assert.deepEqual(coding.profile.modes.map((mode) => mode.modeId), [
    "coding-interview-learn-approach",
    "coding-interview-guided-practice",
    "coding-interview-custom-practice",
    "coding-interview-weak-area-review",
  ]);
  await assert.rejects(() => contentPackageRuntimeOwner.resolveForPreparation({
    familyId: "coding_interview",
    modeId: "coding-interview-simulation",
    trackId: "coding-interview-dsa-problem-solving",
  }));

  const certification = await contentPackageRuntimeOwner.resolveForDiscovery(
    "google-cloud-associate-cloud-engineer",
    "certification",
  );
  assert.deepEqual(certification.profile.modes.map((mode) => mode.modeId), [
    "certification-diagnostic-baseline",
    "certification-focus-practice",
    "certification-weak-area-review",
    "certification-quick-review",
  ]);
  await assert.rejects(() => contentPackageRuntimeOwner.resolveForPreparation({
    familyId: "certification",
    modeId: "certification-exam-simulation",
    trackId: "google-cloud-associate-cloud-engineer",
  }));

  for (const path of REMOVED_RUNTIME_OWNERS) assert.equal(existsSync(path), false, path);
  const runtimeSource = sourceFiles("src").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(runtimeSource, /validateBundledContent|BundledContentAvailabilityPort|contentFamilyHandlers|createCodingInterviewRuntime|createCertificationRuntime/);
  const ownerSource = readFileSync("src/application/contentPackageRuntimeOwner.ts", "utf8");
  assert.match(ownerSource, /pkg\.familyId === "certification"/);
  assert.match(ownerSource, /unsupportedPackageFamily\(\(pkg as \{ familyId: string \}\)\.familyId\)/);
  assert.doesNotMatch(ownerSource, /pkg\.familyId === "coding_interview"[\s\S]*?: new CertificationFamilyRuntime/);
});

test("Free Practice entry points use the approved primary modes and never route to excluded package modes", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  for (const track of getTracks()) {
    const profile = contentPackageRuntimeOwner.getPreparedDiscovery(track.id).profile;
    assert.equal(buildPracticeModes(getTrackDisplay(track.id))[0]?.mode, profile.primaryEntry.modeId);
  }
  const hub = readFileSync("src/features/practice/PracticeHubScreen.tsx", "utf8");
  const setup = readFileSync("src/features/practice/PracticeSetupScreen.tsx", "utf8");

  assert.match(hub, /const resolvedMode = mode \?\? primaryMode\.mode/);
  assert.match(hub, /isDesignInterviewTrack[\s\S]*packageProfile\.primaryEntry\.modeId/);
  assert.match(hub, /resolvedMode === "certification-diagnostic-baseline"/);
  assert.match(hub, /mode:\s*isDesignInterviewTrack \? packageProfile\.primaryEntry\.modeId as PracticeSessionMode : "certification-focus-practice"/);
  assert.match(hub, /topicId: topic\.id, trackId: activeTrack\.id/);
  assert.match(setup, /focusTopicId \?\? packageProfile\.freeNodeId/);
  assert.equal(hub.includes("route.params?.topicId !== undefined && route.params.topicId !== packageProfile.freeNodeId"), true);
  assert.equal(setup.includes("route.params?.topicId !== undefined && route.params.topicId !== packageProfile.freeNodeId"), true);
});

test("package-backed Algorithms discovery never recommends an excluded whole-track mode", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const resolution = await contentPackageRuntimeOwner.resolveForDiscovery(
    "coding-interview-dsa-problem-solving",
    "coding_interview",
  );
  const dashboard = await resolution.runtime.queryDashboard({
    activeSession: null,
    attempts: [],
    now: "2026-08-10T12:00:00.000Z",
    reviews: [],
    trackId: "coding-interview-dsa-problem-solving",
  }) as { recommendation: { action: { kind: string; modeId?: string }; modeId: string } };

  assert.equal(dashboard.recommendation.modeId, "coding-interview-guided-practice");
  assert.equal(dashboard.recommendation.action.kind, "start_practice");
  assert.equal(dashboard.recommendation.action.modeId, "coding-interview-guided-practice");
});

test("all launch tracks resolve an exact Free package and prepare through their canonical family runtime", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  for (const registration of getTracks()) {
    const source = GENERATED_FREE_NODE_PACKAGES.find((candidate) => candidate.trackId === registration.id);
    assert.ok(source);
    const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(registration.id, registration.familyId);
    assert.equal(resolved.package.trackId, registration.id);
    assert.equal(resolved.package.familyId, registration.familyId);
    assert.equal(resolved.package.packagePin.contentReleaseId, source.manifest.provenance.releaseId);
    const mode = resolved.profile.primaryEntry.modeId;
    const requestedLength = resolved.profile.getMode(mode).defaultRequestedLength;
    const request = registration.familyId === "coding_interview"
      ? { sessionId: `admission:${registration.id}`, requestedLength, feedbackMode: "afterEachAnswer", scope: { roadmapNodeId: resolved.profile.freeNodeId } }
      : registration.familyId === "certification"
        ? { sessionId: `admission:${registration.id}`, requestedLength, domain: resolved.profile.freeNodeId }
        : { sessionId: `admission:${registration.id}`, requestedLength };
    const prepared = await resolved.runtime.prepare({ trackId: registration.id, modeId: mode, request, attempts: [], reviews: [], now: "2026-08-21T10:00:00.000Z" });
    assert.equal(prepared.session.trackId, registration.id);
    assert.equal(prepared.session.packagePin.contentReleaseId, source.manifest.provenance.releaseId);
    assert.ok(prepared.session.actualLength > 0);
  }
});

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.") ? [path] : [];
  });
}
