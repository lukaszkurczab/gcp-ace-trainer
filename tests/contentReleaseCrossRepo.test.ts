import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../src/application/contentPackageRuntimeOwner";
import { GENERATED_FREE_NODE_PACKAGES } from "../src/content/bundled/generatedFreeNodePackages";
import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";

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

test("CI reads the current per-artifact content lock instead of retired aggregate lock fields", () => {
  const workflow = readFileSync(join(frontendRoot, ".github", "workflows", "qa.yml"), "utf8");
  assert.match(workflow, /lock\.schemaVersion !== 2/u);
  assert.match(workflow, /aws-certified-solutions-architect-associate.*backend-system-design-interview.*coding-interview-dsa-problem-solving.*frontend-system-design-interview.*google-cloud-associate-cloud-engineer.*microsoft-azure-administrator-associate-az-104.*microsoft-azure-ai-fundamentals-ai-901.*object-oriented-design-interview/su);
  assert.match(workflow, /lock\.artifacts\.at\(-1\)\.producerCommit/u);
  assert.doesNotMatch(workflow, /algorithms,cloud-certification/u);
  assert.doesNotMatch(workflow, /lock\.producerCommit/u);
  assert.doesNotMatch(workflow, /lock\.sourceRepositoryCommit/u);
});
