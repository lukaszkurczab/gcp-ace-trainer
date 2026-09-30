import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const configPath = resolve(root, "metro.config.js");
const request = "../features/home/learningPlanProposalFixtureRuntime";

function resolveFixture(mode) {
  process.env.PATTERNLY_RUNTIME_MODE = mode;
  delete require.cache[configPath];
  const config = require(configPath);
  return config.resolver.resolveRequest({ resolveRequest() { throw new Error(`Expected fixture mapping for ${request}`); } }, request, "ios");
}

test("Metro selects proposal fixtures only in the smoke runtime", () => {
  assert.equal(resolveFixture("smoke").filePath, resolve(root, "src/features/home/learningPlanProposalFixtureRuntime.smoke.ts"));
  for (const mode of ["sandbox", "release", "invalid"]) {
    assert.equal(resolveFixture(mode).filePath, resolve(root, "src/features/home/learningPlanProposalFixtureRuntime.disabled.ts"));
    const disabledSource = readFileSync(resolveFixture(mode).filePath, "utf8");
    assert.equal(disabledSource.includes("generateLearningPlanProposal"), false);
    assert.equal(disabledSource.includes("ui11-fixture-proposal"), false);
  }
});
