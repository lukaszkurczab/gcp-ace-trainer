import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import "tsx/cjs";
import { legalSourceFingerprint } from "./legalSourceFingerprint.mjs";

const require = createRequire(import.meta.url);
const { validateLegalVariables } = require("../src/legal/legalVariablesSchema.ts");
const { renderPrivacyPolicy } = require("../src/legal/privacyPolicy.ts");
const { renderTermsOfService } = require("../src/legal/termsOfService.ts");
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const canonicalSourcePath = resolve(appRoot, "config/public-legal.release.json");
const locales = ["en", "pl"];

function validateSource(source, mode) {
  const issues = validateLegalVariables(source, mode);
  if (issues.length > 0) {
    const paths = [...new Set(issues.map(({ path }) => path))].sort();
    throw new Error(`Public legal source is invalid (${paths.join(", ")}).`);
  }
}

function publicProfileFrom(source) {
  return {
    controller: {
      legalName: source.privacy.controllerLegalName,
      businessForm: source.privacy.controllerBusinessForm,
      address: source.privacy.controllerAddress,
      email: source.privacy.privacyEmail,
      phone: source.privacy.controllerPhone,
      registrationNumber: source.privacy.registrationNumber,
      taxIdentifier: source.privacy.taxIdentifier,
    },
    operator: {
      legalName: source.terms.operatorLegalName,
      businessForm: source.terms.operatorBusinessForm,
      address: source.terms.operatorRegisteredAddress,
      email: source.terms.operatorEmail,
      phone: source.terms.operatorPhone,
      registrationNumber: source.terms.operatorRegistrationNumber,
      taxIdentifier: source.terms.operatorTaxIdentifier,
    },
  };
}

function renderedDocuments(source) {
  const privacy = renderPrivacyPolicy(source);
  const terms = renderTermsOfService(source);
  return {
    privacyPolicy: Object.fromEntries(locales.map((locale) => [locale, privacy[locale]])),
    termsOfService: Object.fromEntries(locales.map((locale) => [locale, terms[locale]])),
  };
}

function createArtifact(source, testOnly) {
  validateSource(source, testOnly ? "test" : "release");
  return {
    schemaVersion: "patternly-public-legal-export-v1",
    testOnly,
    documentVersion: source.documentVersion,
    sourceFingerprint: legalSourceFingerprint(source),
    publicProfile: publicProfileFrom(source),
    publicLinks: source.publicLinks,
    documents: renderedDocuments(source),
  };
}

/** Builds an explicitly test-only artifact from synthetic data. */
export function buildPublicLegalArtifactForTest(syntheticSource) {
  return createArtifact(syntheticSource, true);
}

/** Reads the one canonical release source and builds a production artifact. */
export function buildProductionPublicLegalArtifact() {
  if (!existsSync(canonicalSourcePath)) throw new Error("Canonical public legal source is missing.");
  let source;
  try {
    source = JSON.parse(readFileSync(canonicalSourcePath, "utf8"));
  } catch {
    throw new Error("Canonical public legal source is malformed.");
  }
  return createArtifact(source, false);
}

function outputPathFromArgs(args) {
  if (args.length === 0) return resolve(appRoot, "dist/public-legal-export.json");
  if (args.length !== 2 || args[0] !== "--output" || !args[1] || args[1].startsWith("--")) {
    throw new Error("Usage: exportPublicLegal.mjs [--output <path>]");
  }
  const outputPath = resolve(args[1]);
  if (outputPath === canonicalSourcePath) throw new Error("Output path cannot replace the canonical public legal source.");
  return outputPath;
}

export function runPublicLegalExporter(args = process.argv.slice(2)) {
  const outputPath = outputPathFromArgs(args);
  const artifact = buildProductionPublicLegalArtifact();
  const contents = `${JSON.stringify(artifact, null, 2)}\n`;
  mkdirSync(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  try {
    writeFileSync(temporaryPath, contents, { flag: "wx" });
    renameSync(temporaryPath, outputPath);
  } catch (error) {
    try { rmSync(temporaryPath, { force: true }); } catch { /* retain the original write error */ }
    throw error;
  }
  return { outputPath, artifact };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { outputPath, artifact } = runPublicLegalExporter();
    process.stdout.write(`${JSON.stringify({ status: "written", outputPath, sourceFingerprint: artifact.sourceFingerprint })}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
