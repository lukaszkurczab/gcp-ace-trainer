import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const configPath = resolve(root, "metro.config.js");
const offerRequest = "../../src/content/application/premiumNodeOffers";

function resolveBuildOnly(mode, request) {
  process.env.PATTERNLY_RUNTIME_MODE = mode;
  delete require.cache[configPath];
  const config = require(configPath);
  return config.resolver.resolveRequest({ resolveRequest() { throw new Error(`Expected a build-only implementation for ${request}`); } }, request, "ios");
}

test("Premium node offers and their local fixture transport share one smoke-only Metro module", () => {
  assert.equal(resolveBuildOnly("smoke", offerRequest).filePath, resolve(root, "src/content/application/premiumNodeOffers.smoke.ts"));
  for (const mode of ["sandbox", "release", "invalid"]) {
    assert.equal(resolveBuildOnly(mode, offerRequest).filePath, resolve(root, "src/content/application/premiumNodeOffers.disabled.ts"));
  }
});

test("release Metro source selections cannot expose the local Premium offer or payload", () => {
  for (const mode of ["release", "sandbox", "invalid"]) {
    const offerPath = resolveBuildOnly(mode, offerRequest).filePath;
    const selectedSources = readFileSync(offerPath, "utf8");
    assert.ok(!selectedSources.includes("aud-04-local-smoke-package-fixture"));
    assert.ok(!selectedSources.includes("aud04-smoke-fixture-question"));
  }
  const smokeOfferSource = readFileSync(resolve(root, "src/content/application/premiumNodeOffers.smoke.ts"), "utf8");
  assert.ok(smokeOfferSource.includes("aud-04-local-smoke-package-fixture"));
  assert.ok(smokeOfferSource.includes("aud04-smoke-fixture-question"));
});
