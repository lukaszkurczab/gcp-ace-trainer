import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";

import { legalDocumentApprovalIssue, renderCanonicalLegalDocuments, renderedDocumentsSha256 } from "../../scripts/publicLegalApproval.mjs";
import releaseLegalVariables from "../../config/public-legal.release.json";
import { TARGET_LOCALES } from "../preferences/localeResolver";
import { validateLegalVariablesRelease } from "./legalVariablesSchema";

import { resolveProviderRegistrationDocuments } from "./providerRegistrationDocuments";
import type { PatternlyRuntimeMode } from "../infrastructure/runtime/runtimeMode";

test("provider registration binds the complete canonical English and Polish documents to their loaded versions", () => {
  for (const locale of ["en", "pl"] as const) {
    for (const runtimeMode of ["smoke", "sandbox"] as const) {
      const result = resolveProviderRegistrationDocuments(locale, runtimeMode);
      assert.equal(result.kind, "ready");
      if (result.kind !== "ready") continue;
      assert.equal(result.documents.locale, locale);
      assert.ok(result.documents.terms.content.length > 1_000);
      assert.ok(result.documents.privacy.content.length > 1_000);
      assert.match(result.documents.terms.version, /^\d{4}-\d{2}-\d{2}$/u);
      assert.match(result.documents.privacy.version, /^\d{4}-\d{2}-\d{2}$/u);
    }
    assert.deepEqual(resolveProviderRegistrationDocuments(locale, "release"), { kind: "unavailable", reason: "documents" });
    assert.deepEqual(resolveProviderRegistrationDocuments(locale, undefined), { kind: "unavailable", reason: "documents" });
    assert.deepEqual(resolveProviderRegistrationDocuments(locale, "invalid" as PatternlyRuntimeMode), { kind: "unavailable", reason: "documents" });
  }
});

test("provider registration fails closed for draft locales and incomplete release legal configuration", () => {
  for (const locale of ["de", "fr", "es", "it", "et"] as const) {
    assert.deepEqual(resolveProviderRegistrationDocuments(locale, "release"), { kind: "unavailable", reason: "locale" });
  }
  assert.deepEqual(resolveProviderRegistrationDocuments("en", "release"), { kind: "unavailable", reason: "documents" });
});

// A fresh process exercises runtime source selection without changing the release file or module globals.
function releaseDocumentsFrom(source: unknown) {
  const result = spawnSync(process.execPath, ["--import", "tsx", "-e", `
    const { readFileSync } = require("node:fs");
    const sourcePath = require.resolve("./config/public-legal.release.json");
    require(sourcePath);
    require.cache[sourcePath].exports = JSON.parse(readFileSync(0, "utf8"));
    try {
      const { resolveProviderRegistrationDocuments } = require("./src/legal/providerRegistrationDocuments.ts");
      console.log(JSON.stringify(resolveProviderRegistrationDocuments("en", "release")));
    } catch (error) {
      console.log(JSON.stringify({ kind: "rejected", message: error.message }));
    }
  `], {
    cwd: process.cwd(),
    env: { ...process.env, EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "release" },
    input: JSON.stringify(source), encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("release registration uses approved release data and refuses unapproved or incomplete data without local fallback", () => {
  const source = {
    ...structuredClone(releaseLegalVariables),
    legalDocumentApproval: { status: "APPROVED", renderedDocumentsSha256: "" },
  };
  for (const locale of TARGET_LOCALES) source.privacy.processingRegisterDisclosure[locale] = `Synthetic release disclosure ${locale}`;
  source.documentVersion.en = "2099-01-01";
  source.privacy.controllerLegalName.en = "Synthetic release controller";
  source.terms.operatorLegalName.en = "Synthetic release operator";
  source.legalDocumentApproval.renderedDocumentsSha256 = renderedDocumentsSha256(renderCanonicalLegalDocuments(source));
  assert.equal(legalDocumentApprovalIssue(source), null);
  assert.deepEqual(validateLegalVariablesRelease(source), []);

  const ready = releaseDocumentsFrom(source);
  assert.equal(ready.kind, "ready");
  assert.equal(ready.documents.terms.version, "2099-01-01");
  assert.equal(ready.documents.privacy.version, "2099-01-01");
  assert.ok(ready.documents.privacy.content.includes("Synthetic release controller"));
  assert.ok(ready.documents.terms.content.includes("Synthetic release operator"));

  const unapproved = releaseDocumentsFrom({ ...source, legalDocumentApproval: { status: "UNAPPROVED", renderedDocumentsSha256: null } });
  assert.equal(unapproved.kind, "rejected");
  assert.match(unapproved.message, /unapproved/u);
  const { supportUrl: _supportUrl, ...incompleteLinks } = source.publicLinks;
  assert.deepEqual(releaseDocumentsFrom({ ...source, publicLinks: incompleteLinks }), { kind: "unavailable", reason: "documents" });
});
