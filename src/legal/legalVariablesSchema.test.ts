import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import releaseLegalVariables from "../../config/public-legal.release.json";
import { resolveLegalVariables } from "../../scripts/checkLegalVariables.mjs";
import { legalVariables } from "./legalVariables";
import { legalVariablesLocalFixture } from "./legalVariablesLocalFixture";
import { validateLegalVariables } from "./legalVariablesSchema";

function copyLegalVariables(): Record<string, any> {
  return JSON.parse(JSON.stringify(legalVariables));
}

function completePlaceholders(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(completePlaceholders);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, completePlaceholders(nested)]));
  }
  if (typeof value === "string" && /^\[(?:TO BE COMPLETED|DO UZUPEŁNIENIA):/.test(value)) return "Completed legal value";
  return value;
}

test("accepts the current legal variable shape in test mode and preserves checkout flag boolean", () => {
  assert.deepEqual(validateLegalVariables(legalVariables, "test"), []);
  assert.deepEqual(releaseLegalVariables, legalVariablesLocalFixture);
  assert.deepEqual(validateLegalVariables(releaseLegalVariables, "test"), []);
  const malformed = copyLegalVariables();
  malformed.premiumCheckoutEnabled = "false";
  assert.ok(validateLegalVariables(malformed).some(({ path }) => path === "premiumCheckoutEnabled"));
});

test("legal variables select the local fixture for local mode and the checked-in JSON for release mode", () => {
  const source = [
    'const assert = require("node:assert/strict");',
    'const { legalVariables } = require("./src/legal/legalVariables.ts");',
    'const fixture = require("./src/legal/legalVariablesLocalFixture.ts").legalVariablesLocalFixture;',
    'const release = require("./config/public-legal.release.json");',
    'const selected = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "release" ? release : fixture;',
    'assert.equal(legalVariables, selected);',
  ].join("\n");
  for (const mode of ["sandbox", "smoke", "release"]) {
    const result = spawnSync(process.execPath, ["--import", "tsx", "-e", source], {
      cwd: process.cwd(),
      env: { ...process.env, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: mode },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, `${mode}: ${result.stderr}`);
  }
});

test("legal variable CLI resolver uses distinct sources and never falls back for missing or invalid release JSON", () => {
  const directory = mkdtempSync(join(tmpdir(), "patternly-legal-"));
  const syntheticReleasePath = join(directory, "public-legal.release.json");
  const syntheticRelease = JSON.parse(JSON.stringify(legalVariablesLocalFixture));
  syntheticRelease.terms.premiumProductName.en = "Release-only product label";
  writeFileSync(syntheticReleasePath, JSON.stringify(syntheticRelease));

  try {
    assert.equal(resolveLegalVariables("test"), legalVariablesLocalFixture);
    assert.equal(resolveLegalVariables("test", syntheticReleasePath), legalVariablesLocalFixture);
    assert.deepEqual(resolveLegalVariables("release"), releaseLegalVariables);
    assert.deepEqual(resolveLegalVariables("release", syntheticReleasePath), syntheticRelease);
    assert.notEqual(resolveLegalVariables("release", syntheticReleasePath), legalVariablesLocalFixture);
    assert.throws(() => resolveLegalVariables("release", join(directory, "missing.json")), /could not be read/);

    const invalidReleasePath = join(directory, "invalid.json");
    writeFileSync(invalidReleasePath, "{");
    assert.throws(() => resolveLegalVariables("release", invalidReleasePath), /not valid JSON/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("reports missing keys, locales and unexpected keys by field path", () => {
  const malformed = copyLegalVariables();
  delete malformed.terms.complaintEmail;
  assert.ok(validateLegalVariables(malformed).some(({ path }) => path === "terms.complaintEmail"));

  const malformedLocale = copyLegalVariables();
  delete malformedLocale.terms.complaintEmail.pl;
  malformedLocale.privacy.unexpected = { en: "value", pl: "wartość" };
  const issues = validateLegalVariables(malformedLocale);
  assert.ok(issues.some(({ path }) => path === "terms.complaintEmail.pl"));
  assert.ok(issues.some(({ path }) => path === "privacy.unexpected"));
  malformedLocale.terms.extra = { en: "value", pl: "wartość" };
  assert.ok(validateLegalVariables(malformedLocale).some(({ path }) => path === "terms.extra"));
});

test("rejects empty, whitespace-only and padded localized values", () => {
  for (const invalid of ["", "   ", " value", "value "]) {
    const malformed = copyLegalVariables();
    malformed.documentVersion.en = invalid;
    assert.ok(validateLegalVariables(malformed).some(({ path }) => path === "documentVersion.en"), JSON.stringify(invalid));
  }
});

test("release mode rejects recognized placeholders and test mode allows them", () => {
  const issues = validateLegalVariables(legalVariables, "release");
  const checkedInReleaseIssues = validateLegalVariables(releaseLegalVariables, "release");
  assert.ok(issues.some(({ path }) => path === "terms.operatorLegalName.en"));
  assert.ok(issues.some(({ path }) => path === "privacy.controllerLegalName.pl"));
  assert.ok(checkedInReleaseIssues.some(({ path }) => path === "terms.operatorLegalName.en"));
  assert.deepEqual(validateLegalVariables(legalVariables, "test"), []);
});

test("accepts complete production-like legal values in release mode", () => {
  assert.deepEqual(validateLegalVariables(completePlaceholders(legalVariables), "release"), []);
});

test("CLI passes test mode and release mode rejects placeholders with field paths", () => {
  const script = resolve(process.cwd(), "scripts/checkLegalVariables.mjs");
  const testRun = spawnSync(process.execPath, ["--import", "tsx", script], { encoding: "utf8", env: { ...process.env, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "release" } });
  assert.equal(testRun.status, 0, testRun.stderr);
  assert.match(testRun.stdout, /LEGAL_VARIABLES_CHECK=passed mode=test/);

  const releaseRun = spawnSync(process.execPath, ["--import", "tsx", script, "--release"], { encoding: "utf8" });
  assert.equal(releaseRun.status, 1);
  assert.match(releaseRun.stderr, /terms\.operatorLegalName\.en: Unresolved legal placeholder/);
  assert.doesNotMatch(releaseRun.stderr, /\[TO BE COMPLETED:/);
});
