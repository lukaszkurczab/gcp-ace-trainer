import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const configPath = resolve(root, "metro.config.js");
const request = "../features/exam/certificationExamReviewFixtureRuntime";

function resolveFixture(mode) {
  process.env.PATTERNLY_RUNTIME_MODE = mode;
  delete require.cache[configPath];
  const config = require(configPath);
  return config.resolver.resolveRequest({ resolveRequest() { throw new Error(`Expected fixture mapping for ${request}`); } }, request, "ios");
}

test("Metro selects Certification Exam review fixtures only in smoke and keeps disabled peer inert", () => {
  assert.equal(resolveFixture("smoke").filePath, resolve(root, "src/features/exam/certificationExamReviewFixtureRuntime.smoke.ts"));
  for (const mode of ["sandbox", "release", "invalid"]) {
    const disabled = resolveFixture(mode).filePath;
    assert.equal(disabled, resolve(root, "src/features/exam/certificationExamReviewFixtureRuntime.disabled.ts"));
    const source = readFileSync(disabled, "utf8");
    assert.doesNotMatch(source, /\.\.\/\.\.\/testing\/certificationExamReviewFixture|Linking\.openURL/);
    assert.match(source, /unavailable in this runtime/);
  }
});
