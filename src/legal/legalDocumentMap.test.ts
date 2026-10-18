import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import releaseLegalVariables from "../../config/public-legal.release.json";
import { createLegalDocumentMap, legalDocumentMap, getLegalDocument } from "./legalDocumentMap";
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

test("synthetic approved seven-locale source maps all rendered locale documents as canonical", () => {
  const source = structuredClone(releaseLegalVariables);
  source.legalDocumentApproval.status = "APPROVED";
  const map = createLegalDocumentMap(source, true);
  for (const locale of TARGET_LOCALES) {
    assert.equal(map[locale].status, "canonical");
    assert.ok(map[locale].privacyPolicy.includes(source.privacy.controllerLegalName[locale]), `${locale} privacy document uses its canonical source value`);
    assert.ok(map[locale].termsOfService.includes(source.terms.operatorLegalName[locale]), `${locale} terms document uses its canonical source value`);
  }
  assert.throws(() => createLegalDocumentMap(releaseLegalVariables, true), /unapproved/u);
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

test("rendered dispute and support clauses preserve consumer venue and statutory rights", () => {
  const enDisputes = termsOfService.en.split("13. Governing law and disputes")[1]!.split("14. Changes")[0]!;
  const plDisputes = termsOfService.pl.split("13. Prawo właściwe i spory")[1]!.split("14. Zmiany")[0]!;
  assert.match(enDisputes, /mandatory consumer protections/u);
  assert.match(enDisputes, /right to bring a claim[\s\S]*place of residence/u);
  assert.match(plDisputes, /bezwzględnej ochrony konsumenckiej/u);
  assert.match(plDisputes, /prawa do wniesienia sprawy[\s\S]*miejscu Twojego zamieszkania/u);
  const enAdr = termsOfService.en.split("21. Out-of-court dispute resolution")[1]!.split("22.")[0]!;
  const plAdr = termsOfService.pl.split("21. Pozasądowe rozstrzyganie sporów")[1]!.split("22.")[0]!;
  assert.match(enAdr, /express statement on participation or refusal[\s\S]*durable medium/u);
  assert.match(plAdr, /trwałym nośniku[\s\S]*oświadczenie o udziale albo odmowie/u);
  assert.match(termsOfService.en, /Required security and conformity updates[\s\S]*mandatory law/u);
  assert.match(termsOfService.pl, /Aktualizacje bezpieczeństwa i zgodności[\s\S]*bezwzględnie obowiązującym prawem/u);
});
