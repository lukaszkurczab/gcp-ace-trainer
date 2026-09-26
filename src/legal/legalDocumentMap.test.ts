import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { legalDocumentMap, getLegalDocument } from "./legalDocumentMap";
import { legalTranslationDraftsTestOnly } from "./legalTranslationDrafts.testOnly";
import { privacyPolicy } from "./privacyPolicy";
import { termsOfService } from "./termsOfService";
import { TARGET_LOCALES } from "../preferences/localeResolver";

test("visible legal documents index all seven locales directly", () => {
  assert.deepEqual(Object.keys(legalDocumentMap).sort(), TARGET_LOCALES.slice().sort());
  assert.equal(legalDocumentMap.en.privacyPolicy, privacyPolicy.en);
  assert.equal(legalDocumentMap.en.termsOfService, termsOfService.en);
  assert.equal(legalDocumentMap.pl.privacyPolicy, privacyPolicy.pl);
  assert.equal(legalDocumentMap.pl.termsOfService, termsOfService.pl);

  for (const locale of legalTranslationDraftsTestOnly.locales) {
    assert.equal(legalDocumentMap[locale].status, "unapproved-test-only");
    assert.equal(legalDocumentMap[locale].privacyPolicy.split("\n", 1)[0], legalTranslationDraftsTestOnly.documents[locale].privacyPolicy.split("\n", 1)[0]);
    assert.equal(legalDocumentMap[locale].termsOfService.split("\n", 1)[0], legalTranslationDraftsTestOnly.documents[locale].termsOfService.split("\n", 1)[0]);
    assert.equal(getLegalDocument(locale, "privacyPolicy", false).content, legalDocumentMap[locale].privacyPolicy);
    assert.equal(getLegalDocument(locale, "termsOfService", false).content, legalDocumentMap[locale].termsOfService);
  }
});

test("unapproved locale documents fail closed in release and never fall back to English", () => {
  for (const locale of legalTranslationDraftsTestOnly.locales) {
    assert.deepEqual(getLegalDocument(locale, "privacyPolicy", true), { content: null, status: "unavailable-unapproved" });
    assert.deepEqual(getLegalDocument(locale, "termsOfService", true), { content: null, status: "unavailable-unapproved" });
  }
  assert.equal(getLegalDocument("en", "privacyPolicy", true).content, privacyPolicy.en);
  assert.equal(getLegalDocument("pl", "termsOfService", true).content, termsOfService.pl);
});

test("visible legal screens request the selected locale directly", () => {
  for (const path of ["src/features/home/PrivacyPolicyScreen.tsx", "src/features/home/TermsOfServiceScreen.tsx"]) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /getLegalDocument\(locale,/u);
    assert.doesNotMatch(source, /locale === "pl"/u);
    assert.doesNotMatch(source, /\? "pl" : "en"/u);
  }
});
