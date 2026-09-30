import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const configPath = resolve(root, "metro.config.js");
const request = "../../infrastructure/firebase/providerAuthFixtureRuntime";

function resolveRuntime(mode) {
  process.env.PATTERNLY_RUNTIME_MODE = mode;
  delete require.cache[configPath];
  const config = require(configPath);
  return config.resolver.resolveRequest({ resolveRequest() { throw new Error(`Expected provider fixture mapping for ${request}`); } }, request, "ios");
}

test("provider auth fixture runtime resolves to smoke implementation only for smoke", () => {
  assert.equal(resolveRuntime("smoke").filePath, resolve(root, "src/infrastructure/firebase/providerAuthFixtureRuntime.smoke.ts"));
  for (const mode of ["sandbox", "release", "invalid"]) {
    assert.equal(resolveRuntime(mode).filePath, resolve(root, "src/infrastructure/firebase/providerAuthFixtureRuntime.disabled.ts"));
  }
});

test("non-smoke provider fixture peer contains no token-generation or provider-auth SDK calls", () => {
  const disabled = readFileSync(resolveRuntime("release").filePath, "utf8");
  assert.match(disabled, /unavailable in this runtime/u);
  assert.doesNotMatch(disabled, /signInWithCredential|OAuthProvider|email_verified|patternly-smoke/u);
});
