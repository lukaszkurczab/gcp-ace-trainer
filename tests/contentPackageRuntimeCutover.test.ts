import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../src/application/contentPackageRuntimeOwner";
import { contentPackagePinsEqual } from "../src/domain";

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

test("Free Practice entry points use the approved primary modes and never route to excluded package modes", () => {
  const hub = readFileSync("src/features/practice/PracticeHubScreen.tsx", "utf8");
  const setup = readFileSync("src/features/practice/PracticeSetupScreen.tsx", "utf8");

  assert.match(hub, /\? ALGORITHM_MODE_IDS\.learnApproach\s*:\s*"certification-focus-practice"/);
  assert.doesNotMatch(hub, /mode: "certification-diagnostic-baseline"/);
  assert.match(hub, /mode: "certification-focus-practice"/);
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

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}
