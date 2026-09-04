import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../application/contentPackageRuntimeOwner";
import { GENERATED_FREE_NODE_PACKAGES, GENERATED_RETAINED_FREE_NODE_PACKAGES } from "./bundled/generatedFreeNodePackages";
import { prepareBundledTestPackages } from "../testing/contentPackageRuntimeTestSupport";

const frontendRoot = process.cwd();
const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(frontendRoot, "../patternly-content");
const lock = JSON.parse(readFileSync(join(frontendRoot, "integration/contracts/content-release/release.lock.json"), "utf8"));

test("every bundled Free-node package exactly matches its producer artifact and release lock", async () => {
  await prepareBundledTestPackages();
  assert.equal(lock.schemaVersion, 2);
  assert.equal(lock.repository, "lukaszkurczab/patternly-content");
  for (const pin of lock.artifacts) {
    const source = GENERATED_FREE_NODE_PACKAGES.find((candidate) => candidate.trackId === pin.trackId);
    assert.ok(source);
    const packagePath = join(contentRoot, "artifacts", "bundled-free-nodes", pin.trackId, source.packageVersion, "package.json");
    const producerBytes = execFileSync(
      "git",
      ["-C", contentRoot, "show", `${pin.producerCommit}:${relative(contentRoot, packagePath)}`],
      { encoding: "utf8" },
    );
    assert.equal(source.packageBytes, producerBytes);
    assert.equal(createHash("sha256").update(source.packageBytes).digest("hex"), source.packageSha256);
    const resolution = contentPackageRuntimeOwner.getPreparedDiscovery(pin.trackId);
    assert.equal(resolution.package.packagePin.contentReleaseId, pin.releaseId);
    assert.equal(resolution.package.contentVersion, pin.contentVersion);
  }
});

test("the retained GCP package resolves only by its exact old pin while discovery stays on current bytes", async () => {
  await prepareBundledTestPackages();
  const retained = GENERATED_RETAINED_FREE_NODE_PACKAGES.find((candidate) => candidate.trackId === "google-cloud-associate-cloud-engineer");
  const current = GENERATED_FREE_NODE_PACKAGES.find((candidate) => candidate.trackId === "google-cloud-associate-cloud-engineer");
  assert.ok(retained);
  assert.ok(current);
  const exact = await contentPackageRuntimeOwner.resolveExact({
    packageIdentity: retained.packageSha256,
    packageVersion: retained.packageVersion,
    contentReleaseId: retained.manifest.provenance.releaseId,
  });
  assert.equal(exact.package.packagePin.packageIdentity, retained.packageSha256);
  assert.equal(exact.package.packagePin.packageVersion, retained.packageVersion);
  assert.equal(exact.profile.modes.some((mode) => mode.modeId === "certification-diagnostic-baseline"), false);
  const discovered = await contentPackageRuntimeOwner.resolveForDiscovery("google-cloud-associate-cloud-engineer", "certification");
  assert.equal(discovered.package.packagePin.packageIdentity, current.packageSha256);
  assert.equal(discovered.package.packagePin.packageVersion, current.packageVersion);
});

test("CI reads the current per-artifact content lock instead of retired aggregate lock fields", () => {
  const workflow = readFileSync(join(frontendRoot, ".github", "workflows", "qa.yml"), "utf8");
  assert.match(workflow, /lock\.schemaVersion !== 2/u);
  assert.match(workflow, /coding-interview-dsa-problem-solving.*backend-system-design-interview.*object-oriented-design-interview.*frontend-system-design-interview.*google-cloud-associate-cloud-engineer.*aws-certified-solutions-architect-associate.*microsoft-azure-administrator-associate-az-104.*microsoft-azure-ai-fundamentals-ai-901.*claude-certified-architect-professional-certification/su);
  assert.match(workflow, /lock\.artifacts\.at\(-1\)\.producerCommit/u);
  assert.doesNotMatch(workflow, /algorithms,cloud-certification/u);
  assert.doesNotMatch(workflow, /lock\.producerCommit/u);
  assert.doesNotMatch(workflow, /lock\.sourceRepositoryCommit/u);
});
