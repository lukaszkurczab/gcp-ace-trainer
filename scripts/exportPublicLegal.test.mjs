import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import "tsx/cjs";
import { buildProductionPublicLegalArtifactFrom, buildPublicLegalArtifactForTest } from "./exportPublicLegal.mjs";
import { legalSourceFingerprint } from "./legalSourceFingerprint.mjs";
import { legalDocumentApprovalIssue, renderCanonicalLegalDocuments, renderedDocumentsSha256 } from "./publicLegalApproval.mjs";

const root = process.cwd();
const require = createRequire(import.meta.url);
const { legalVariablesLocalFixture } = require("../src/legal/legalVariablesLocalFixture.ts");
const source = JSON.parse(readFileSync(join(root, "config/public-legal.release.json"), "utf8"));
const { legalVariables } = require("../src/legal/legalVariables.ts");
const { privacyPolicy, renderPrivacyPolicy } = require("../src/legal/privacyPolicy.ts");
const { termsOfService, renderTermsOfService } = require("../src/legal/termsOfService.ts");
const { legalTranslationDraftsTestOnly } = require("../src/legal/legalTranslationDrafts.testOnly.ts");
const privacyTemplateSource = readFileSync(join(root, "src/legal/privacyPolicy.ts"), "utf8");
const termsTemplateSource = readFileSync(join(root, "src/legal/termsOfService.ts"), "utf8");

function interpolationPaths(source) {
  const nested = [...source.matchAll(/\$\{vars\.([A-Za-z][A-Za-z0-9]*)\.([A-Za-z][A-Za-z0-9]*)\.(?:en|pl)\}/gu)]
    .map(([, section, field]) => `${section}.${field}`);
  const root = [...source.matchAll(/\$\{vars\.([A-Za-z][A-Za-z0-9]*)\.(?:en|pl)\}/gu)]
    .map(([, field]) => field);
  return [...new Set([...nested, ...root])].sort();
}

function draftInterpolationPaths(source) {
  return [...new Set([...source.matchAll(/\{\{([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)?)\}\}/gu)].map(([, key]) => key))].sort();
}

function completePlaceholders(value) {
  if (Array.isArray(value)) return value.map(completePlaceholders);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, completePlaceholders(child)]));
  return typeof value === "string" && /^\[(?:TO BE COMPLETED|DO UZUPEŁNIENIA|UNRESOLVED):/u.test(value)
    ? `Synthetic ${value.slice(1, -1)}`
    : value;
}

function syntheticSource() {
  const fill = (value) => {
    if (Array.isArray(value)) return value.map(fill);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, fill(child)]));
    return typeof value === "string" && /^\[(?:TO BE COMPLETED|DO UZUPEŁNIENIA|UNRESOLVED):/u.test(value)
      ? `Synthetic ${value.slice(1, -1)}`
      : value;
  };
  const result = fill(legalVariablesLocalFixture);
  result.publicLinks = {
    privacyUrl: "https://patternly.example/privacy",
    termsUrl: "https://patternly.example/terms",
    supportUrl: "https://patternly.example/support",
  };
  return result;
}

function syntheticCanonicalSource() {
  const result = completePlaceholders(source);
  result.publicLinks = {
    privacyUrl: "https://patternly.example/privacy",
    termsUrl: "https://patternly.example/terms",
    supportUrl: "https://patternly.example/support",
  };
  return result;
}

test("production exporter honors the canonical document approval when writing output", () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "patternly-public-legal-export-"));
  const outputPath = join(temporaryRoot, "nested", "legal.json");
  try {
    const result = spawnSync("node", ["--import", "tsx", "scripts/exportPublicLegal.mjs", "--output", outputPath], {
      cwd: root,
      encoding: "utf8",
    });
    if (source.legalDocumentApproval.status === "APPROVED") {
      assert.equal(result.status, 0, result.stderr);
      const exported = JSON.parse(readFileSync(outputPath, "utf8"));
      assert.deepEqual(exported, buildProductionPublicLegalArtifactFrom(source));
      assert.equal(exported.approvedDocumentsSha256, source.legalDocumentApproval.renderedDocumentsSha256);
    } else {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Public legal approval is invalid \(legalDocumentApproval\.status must be APPROVED\)/u);
      assert.equal(existsSync(outputPath), false);
      assert.equal(existsSync(join(temporaryRoot, "nested")), false);
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("production export requires all locales, explicit approval and an exact rendered-document binding", () => {
  const candidate = syntheticCanonicalSource();
  candidate.legalDocumentApproval = { status: "APPROVED", renderedDocumentsSha256: null };
  const documents = renderCanonicalLegalDocuments(candidate);
  candidate.legalDocumentApproval.renderedDocumentsSha256 = renderedDocumentsSha256(documents);
  const artifact = buildProductionPublicLegalArtifactFrom(candidate);
  assert.equal(artifact.testOnly, false);
  assert.equal(artifact.approvalStatus, "APPROVED");
  assert.equal(artifact.approvedDocumentsSha256, candidate.legalDocumentApproval.renderedDocumentsSha256);
  assert.deepEqual(Object.keys(artifact.documents.privacyPolicy), ["en", "pl", "de", "fr", "es", "it", "et"]);
  const missingLocale = structuredClone(candidate);
  delete missingLocale.privacy.processingRegisterDisclosure.et;
  assert.throws(() => buildProductionPublicLegalArtifactFrom(missingLocale), /Public legal source is invalid/u);
  const unapproved = structuredClone(candidate);
  unapproved.legalDocumentApproval.status = "UNAPPROVED";
  assert.throws(() => buildProductionPublicLegalArtifactFrom(unapproved), /must be APPROVED/u);
  const changedSource = structuredClone(candidate);
  changedSource.terms.operatorLegalName.en += " changed";
  assert.throws(() => buildProductionPublicLegalArtifactFrom(changedSource), /does not match rendered document bytes/u);
  const changedTemplateOutput = structuredClone(documents);
  changedTemplateOutput.privacyPolicy.en += "\nchanged template bytes";
  assert.match(legalDocumentApprovalIssue(candidate, changedTemplateOutput), /does not match rendered document bytes/u);
});

test("synthetic seven-locale artifacts are marked unapproved and contain complete, interpolated drafts", () => {
  const input = syntheticCanonicalSource();
  delete input.legalDocumentApproval;
  input.terms.operatorLegalName = { en: "Synthetic test operator", pl: "Syntetyczny operator testowy" };
  input.privacy.controllerLegalName = { en: "Synthetic privacy controller", pl: "Syntetyczny administrator testowy" };
  const artifact = buildPublicLegalArtifactForTest(input);
  assert.equal(artifact.schemaVersion, "patternly-public-legal-export-v1");
  assert.equal(artifact.testOnly, true);
  assert.equal(artifact.approvalStatus, "UNAPPROVED");
  const locales = ["en", "pl", "de", "fr", "es", "it", "et"];
  assert.deepEqual(Object.keys(artifact.documentVersion), locales);
  assert.deepEqual(Object.keys(artifact.documents.privacyPolicy), locales);
  assert.deepEqual(Object.keys(artifact.documents.termsOfService), locales);
  assert.match(artifact.sourceFingerprint, /^[a-f0-9]{64}$/u);
  assert.match(artifact.documents.privacyPolicy.en, /Synthetic privacy controller/u);
  assert.match(artifact.documents.privacyPolicy.pl, /Syntetyczny administrator testowy/u);
  assert.match(artifact.documents.termsOfService.en, /Synthetic test operator/u);
  assert.match(artifact.documents.termsOfService.pl, /Syntetyczny operator testowy/u);
  for (const locale of locales) {
    const privacy = artifact.documents.privacyPolicy[locale];
    const terms = artifact.documents.termsOfService[locale];
    for (const document of [privacy, terms]) {
      assert.ok(document.trim().length > 2500, `${locale} draft is unexpectedly incomplete`);
      assert.equal(document, document.trim(), `${locale} draft has outer whitespace`);
      assert.doesNotMatch(document, /\{\{[^}]+\}\}|\$\{vars\.[^}]+\}/u, `${locale} draft has an unresolved interpolation`);
    }
    if (!["en", "pl"].includes(locale)) {
      assert.equal((privacy.match(/^\d+\./gmu) ?? []).length, 14, `${locale} privacy section count`);
      assert.equal((terms.match(/^\d+\./gmu) ?? []).length, 22, `${locale} terms section count`);
      assert.equal(privacy.split(/\n\n+/u).length, privacyPolicy.en.split(/\n\n+/u).length, `${locale} privacy paragraph structure`);
      assert.equal(terms.split(/\n\n+/u).length, termsOfService.en.split(/\n\n+/u).length, `${locale} terms paragraph structure`);
      const privacyDraft = legalTranslationDraftsTestOnly.documents[locale].privacyPolicy;
      const termsDraft = legalTranslationDraftsTestOnly.documents[locale].termsOfService;
      assert.deepEqual(draftInterpolationPaths(privacyDraft), interpolationPaths(privacyTemplateSource), `${locale} privacy interpolation coverage`);
      assert.deepEqual(draftInterpolationPaths(termsDraft), interpolationPaths(termsTemplateSource), `${locale} terms interpolation coverage`);
    }
  }
  assert.match(artifact.documents.privacyPolicy.de, /UNAPPROVED TEST ONLY: controllerLegalName DE/u);
  assert.doesNotMatch(artifact.documents.privacyPolicy.de, /controllerLegalName FR/u);
  assert.deepEqual(artifact.publicLinks, input.publicLinks);
  assert.doesNotMatch(JSON.stringify(artifact), /Synthetic secret|secret-token|BEGIN PRIVATE KEY/u);
  assert.throws(() => buildPublicLegalArtifactForTest({ ...input, publicLinks: { ...input.publicLinks, privacyUrl: "http://patternly.example/privacy" } }), /Test-only legal draft is invalid \(publicLinks\.privacyUrl\)/u);
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
  if (source.legalDocumentApproval.status === "APPROVED") {
    assert.equal(report.publicLegalVariables.status, "valid");
    assert.equal(report.publicLegalVariables.fieldPaths.length, 0);
  } else {
    assert.equal(report.publicLegalVariables.status, "incomplete");
    assert.ok(report.publicLegalVariables.fieldPaths.includes("legalDocumentApproval.status"));
  }
  const testSource = syntheticSource();
  const artifact = buildPublicLegalArtifactForTest(testSource);
  const repeatedArtifact = buildPublicLegalArtifactForTest(testSource);
  // The release-gate fingerprint is over the canonical source as checked in,
  // while the test-only fingerprint includes all synthetic draft documents.
  assert.equal(report.publicLegalVariables.fingerprint, legalSourceFingerprint(source));
  assert.match(artifact.sourceFingerprint, /^[a-f0-9]{64}$/u);
  assert.equal(artifact.sourceFingerprint, repeatedArtifact.sourceFingerprint);
  assert.deepEqual(Object.keys(source.documentVersion), ["en", "pl", "de", "fr", "es", "it", "et"]);
  assert.equal(Object.hasOwn(source, "testOnly"), false);
});
