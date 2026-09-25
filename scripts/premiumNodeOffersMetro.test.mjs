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
const transportRequest = "../../src/content/application/premiumNodeOfferSmokeTransport";

function resolveBuildOnly(mode, request) {
  process.env.PATTERNLY_RUNTIME_MODE = mode;
  delete require.cache[configPath];
  const config = require(configPath);
  return config.resolver.resolveRequest({ resolveRequest() { throw new Error(`Expected a build-only implementation for ${request}`); } }, request, "ios");
}

test("Premium node offers and local fixture transport are smoke-only Metro modules", () => {
  assert.equal(resolveBuildOnly("smoke", offerRequest).filePath, resolve(root, "src/content/application/premiumNodeOffers.smoke.ts"));
  assert.equal(resolveBuildOnly("smoke", transportRequest).filePath, resolve(root, "src/content/application/premiumNodeOfferSmokeTransport.smoke.ts"));
  for (const mode of ["sandbox", "release", "invalid"]) {
    assert.equal(resolveBuildOnly(mode, offerRequest).filePath, resolve(root, "src/content/application/premiumNodeOffers.disabled.ts"));
    assert.equal(resolveBuildOnly(mode, transportRequest).filePath, resolve(root, "src/content/application/premiumNodeOfferSmokeTransport.disabled.ts"));
  }
});

test("release Metro source selections cannot expose the local Premium offer or payload", () => {
  for (const mode of ["release", "sandbox", "invalid"]) {
    const offerPath = resolveBuildOnly(mode, offerRequest).filePath;
    const transportPath = resolveBuildOnly(mode, transportRequest).filePath;
    const selectedSources = `${readFileSync(offerPath, "utf8")}\n${readFileSync(transportPath, "utf8")}`;
    assert.ok(!selectedSources.includes("aud-04-local-smoke-package-fixture"));
    assert.ok(!selectedSources.includes("aud04-smoke-fixture-question"));
  }
  const smokeOfferSource = readFileSync(resolve(root, "src/content/application/premiumNodeOffers.smoke.ts"), "utf8");
  const smokeTransportSource = readFileSync(resolve(root, "src/content/application/premiumNodeOfferSmokeTransport.smoke.ts"), "utf8");
  assert.ok(smokeOfferSource.includes("aud-04-local-smoke-package-fixture"));
  assert.ok(smokeTransportSource.includes("aud04-smoke-fixture-question"));
});
