import { legalTranslationDraftsDeTestOnly } from "./legalTranslationDrafts.de.testOnly";
import { legalTranslationDraftsEsTestOnly } from "./legalTranslationDrafts.es.testOnly";
import { estonianLegalTranslationDraftTestOnly } from "./legalTranslationDrafts.et.testOnly";
import { legalTranslationDraftsFrTestOnly } from "./legalTranslationDrafts.fr.testOnly";
import { italianLegalTranslationDraftTestOnly } from "./legalTranslationDrafts.it.testOnly";
import type { LegalTranslationLocale } from "./legalVariablesSchema";

/** Test-only, unapproved legal translations. Never use for release readiness. */
export const legalTranslationDraftsTestOnly = Object.freeze({
  testOnly: true as const,
  approvalStatus: "UNAPPROVED" as const,
  locales: ["de", "fr", "es", "it", "et"] as const,
  documents: {
    de: legalTranslationDraftsDeTestOnly,
    fr: legalTranslationDraftsFrTestOnly,
    es: legalTranslationDraftsEsTestOnly,
    it: italianLegalTranslationDraftTestOnly,
    et: estonianLegalTranslationDraftTestOnly,
  } satisfies Record<Exclude<LegalTranslationLocale, "en" | "pl">, { privacyPolicy: string; termsOfService: string }>,
});

export function createLegalVariablesTestDraft(source: Record<string, any>) {
  const clone = JSON.parse(JSON.stringify(source)) as Record<string, any>;
  const extend = (value: unknown, path: string): unknown => {
    if (Array.isArray(value)) return value.map((item, index) => extend(item, `${path}.${index}`));
    if (!value || typeof value !== "object") return value;
    const record = value as Record<string, unknown>;
    if (Object.hasOwn(record, "en") && Object.hasOwn(record, "pl") && Object.keys(record).length === 2) {
      const field = path.split(".").at(-1) ?? "value";
      return {
        en: record.en,
        pl: record.pl,
        de: `[UNAPPROVED TEST ONLY: ${field} DE]`,
        fr: `[UNAPPROVED TEST ONLY: ${field} FR]`,
        es: `[UNAPPROVED TEST ONLY: ${field} ES]`,
        it: `[UNAPPROVED TEST ONLY: ${field} IT]`,
        et: `[UNAPPROVED TEST ONLY: ${field} ET]`,
      };
    }
    return Object.fromEntries(Object.entries(record).map(([key, nested]) => [key, extend(nested, path ? `${path}.${key}` : key)]));
  };
  return { ...extend(clone, "") as Record<string, unknown>, testOnly: true, approvalStatus: "UNAPPROVED" };
}

export function renderLegalTranslationDraftTestOnly(
  locale: Exclude<LegalTranslationLocale, "en" | "pl">,
  variables: Record<string, unknown>,
) {
  const template = legalTranslationDraftsTestOnly.documents[locale];
  const render = (document: string) => document.replace(/\{\{([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)?)\}\}/gu, (_match, key: string) => {
    const parts = key.split(".");
    const source = variables as Record<string, Record<string, Record<string, unknown>> | Record<string, unknown>>;
    const value = parts.length === 2
      ? (source[parts[0]!] as Record<string, Record<string, unknown>> | undefined)?.[parts[1]!]?.[locale]
      : (source[key] as Record<string, unknown> | undefined)?.[locale];
    if (typeof value !== "string" || value.trim() === "") throw new Error(`Missing legal draft interpolation: ${locale}.${key}`);
    return value;
  });
  return { privacyPolicy: render(template.privacyPolicy), termsOfService: render(template.termsOfService) };
}
