import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import "tsx/cjs";
import { buildPublicLegalArtifactForTest } from "./exportPublicLegal.mjs";
import { legalSourceFingerprint } from "./legalSourceFingerprint.mjs";

const root = process.cwd();
const require = createRequire(import.meta.url);
const source = JSON.parse(readFileSync(join(root, "config/public-legal.release.json"), "utf8"));
const { legalVariables } = require("../src/legal/legalVariables.ts");
const { privacyPolicy, renderPrivacyPolicy } = require("../src/legal/privacyPolicy.ts");
const { termsOfService, renderTermsOfService } = require("../src/legal/termsOfService.ts");

function syntheticSource() {
  const fill = (value) => {
    if (Array.isArray(value)) return value.map(fill);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, fill(child)]));
    return typeof value === "string" && /^\[(?:TO BE COMPLETED|DO UZUPEŁNIENIA):/u.test(value)
      ? `Synthetic ${value.slice(1, -1)}`
      : value;
  };
  const result = fill(source);
  result.publicLinks = {
    privacyUrl: "https://patternly.example/privacy",
    termsUrl: "https://patternly.example/terms",
    supportUrl: "https://patternly.example/support",
  };
  return result;
}

test("production exporter rejects the current incomplete canonical source before creating output", () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "patternly-public-legal-export-"));
  const outputPath = join(temporaryRoot, "nested", "legal.json");
  try {
    const result = spawnSync("node", ["--import", "tsx", "scripts/exportPublicLegal.mjs", "--output", outputPath], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Public legal source is invalid/u);
    assert.equal(existsSync(outputPath), false);
    assert.equal(existsSync(join(temporaryRoot, "nested")), false);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("synthetic artifacts are marked test-only and contain rendered EN and PL docs with the source version", () => {
  const input = syntheticSource();
  const artifact = buildPublicLegalArtifactForTest(input);
  assert.equal(artifact.schemaVersion, "patternly-public-legal-export-v1");
  assert.equal(artifact.testOnly, true);
  assert.deepEqual(artifact.documentVersion, input.documentVersion);
  assert.match(artifact.sourceFingerprint, /^[a-f0-9]{64}$/u);
  assert.match(artifact.documents.privacyPolicy.en, /Synthetic TO BE COMPLETED/u);
  assert.match(artifact.documents.privacyPolicy.pl, /Synthetic DO UZUPEŁNIENIA/u);
  assert.match(artifact.documents.termsOfService.en, /Synthetic TO BE COMPLETED/u);
  assert.match(artifact.documents.termsOfService.pl, /Synthetic DO UZUPEŁNIENIA/u);
  assert.deepEqual(artifact.publicLinks, input.publicLinks);
  assert.equal(JSON.stringify(artifact).includes("secret"), false);
  assert.throws(() => buildPublicLegalArtifactForTest({ ...input, publicLinks: { ...input.publicLinks, privacyUrl: "http://patternly.example/privacy" } }), /Public legal source is invalid \(publicLinks\.privacyUrl\)/u);
  for (const invalidPrivacyUrl of ["https://patternly.example/other", "https://patternly.example/privacy?source=app", "https://patternly.example/privacy?", "https://user:pass@patternly.example/privacy"]) {
    assert.throws(() => buildPublicLegalArtifactForTest({ ...input, publicLinks: { ...input.publicLinks, privacyUrl: invalidPrivacyUrl } }), /publicLinks\.privacyUrl/u);
  }
  for (const invalidTermsUrl of ["https://patternly.example/other", "https://patternly.example/terms#section", "https://patternly.example/terms#", "https://user:pass@patternly.example/terms"]) {
    assert.throws(() => buildPublicLegalArtifactForTest({ ...input, publicLinks: { ...input.publicLinks, termsUrl: invalidTermsUrl } }), /publicLinks\.termsUrl/u);
  }
});

test("app legal exports retain the same output as parameterized template rendering", () => {
  assert.deepEqual(renderPrivacyPolicy(legalVariables), privacyPolicy);
  assert.deepEqual(renderTermsOfService(legalVariables), termsOfService);
});

test("release gate and exporter use the same canonical source fingerprint", () => {
  const output = execFileSync("node", ["scripts/releaseGate.mjs"], { cwd: root, encoding: "utf8" });
  const report = JSON.parse(output);
  const artifact = buildPublicLegalArtifactForTest(syntheticSource());
  // The release-gate fingerprint is over the canonical source as checked in,
  // while test builders intentionally fingerprint their explicit synthetic input.
  assert.equal(report.publicLegalVariables.fingerprint, legalSourceFingerprint(source));
  assert.equal(artifact.sourceFingerprint, legalSourceFingerprint(syntheticSource()));
});
