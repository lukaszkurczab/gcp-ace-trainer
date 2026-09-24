import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

import { legalVariables } from "./legalVariables";
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
  const malformed = copyLegalVariables();
  malformed.premiumCheckoutEnabled = "false";
  assert.ok(validateLegalVariables(malformed).some(({ path }) => path === "premiumCheckoutEnabled"));
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
  assert.ok(issues.some(({ path }) => path === "terms.operatorLegalName.en"));
  assert.ok(issues.some(({ path }) => path === "privacy.controllerLegalName.pl"));
  assert.deepEqual(validateLegalVariables(legalVariables, "test"), []);
});

test("accepts complete production-like legal values in release mode", () => {
  assert.deepEqual(validateLegalVariables(completePlaceholders(legalVariables), "release"), []);
});

test("CLI passes test mode and release mode rejects placeholders with field paths", () => {
  const script = resolve(process.cwd(), "scripts/checkLegalVariables.mjs");
  const testRun = spawnSync(process.execPath, ["--import", "tsx", script], { encoding: "utf8" });
  assert.equal(testRun.status, 0, testRun.stderr);
  assert.match(testRun.stdout, /LEGAL_VARIABLES_CHECK=passed mode=test/);

  const releaseRun = spawnSync(process.execPath, ["--import", "tsx", script, "--release"], { encoding: "utf8" });
  assert.equal(releaseRun.status, 1);
  assert.match(releaseRun.stderr, /terms\.operatorLegalName\.en: Unresolved legal placeholder/);
  assert.doesNotMatch(releaseRun.stderr, /\[TO BE COMPLETED:/);
});
