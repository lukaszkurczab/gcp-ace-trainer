require("tsx/cjs");
const { createHash } = require("node:crypto");

function renderCanonicalLegalDocuments(source) {
  const { renderPrivacyPolicy } = require("../src/legal/privacyPolicy.ts");
  const { renderTermsOfService } = require("../src/legal/termsOfService.ts");
  const { renderLegalTranslationDraftTestOnly, legalTranslationDraftsTestOnly } = require("../src/legal/legalTranslationDrafts.testOnly.ts");
  const locales = ["en", "pl", ...legalTranslationDraftsTestOnly.locales];
  const privacy = renderPrivacyPolicy(source);
  const terms = renderTermsOfService(source);
  const translated = Object.fromEntries(legalTranslationDraftsTestOnly.locales.map((locale) => [locale, renderLegalTranslationDraftTestOnly(locale, source)]));
  return {
    privacyPolicy: Object.fromEntries(locales.map((locale) => [locale, translated[locale]?.privacyPolicy ?? privacy[locale]])),
    termsOfService: Object.fromEntries(locales.map((locale) => [locale, translated[locale]?.termsOfService ?? terms[locale]])),
  };
}

function renderedDocumentsSha256(documents) {
  return createHash("sha256").update(JSON.stringify(documents)).digest("hex");
}

function legalDocumentApprovalIssue(source, documents) {
  const approval = source?.legalDocumentApproval;
  if (approval?.status === "UNAPPROVED") return null;
  if (approval?.status !== "APPROVED") return "legalDocumentApproval.status must be APPROVED.";
  const rendered = documents ?? renderCanonicalLegalDocuments(source);
  if (typeof approval.renderedDocumentsSha256 !== "string"
    || approval.renderedDocumentsSha256 !== renderedDocumentsSha256(rendered)) {
    return "legalDocumentApproval.renderedDocumentsSha256 does not match rendered document bytes.";
  }
  return null;
}

module.exports = { legalDocumentApprovalIssue, renderCanonicalLegalDocuments, renderedDocumentsSha256 };
