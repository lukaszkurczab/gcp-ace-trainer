import { legalTranslationDraftsTestOnly, createLegalVariablesTestDraft, renderLegalTranslationDraftTestOnly } from "./legalTranslationDrafts.testOnly";
import { legalVariables } from "./legalVariables";
import { privacyPolicy } from "./privacyPolicy";
import { termsOfService } from "./termsOfService";
import type { LegalTranslationLocale } from "./legalVariablesSchema";

export type LegalDocumentKind = "privacyPolicy" | "termsOfService";
export type LegalDocumentStatus = "canonical" | "unapproved-test-only" | "unavailable-unapproved";

const testDraftVariables = createLegalVariablesTestDraft(legalVariables);
const renderedTestDrafts = Object.fromEntries(
  legalTranslationDraftsTestOnly.locales.map((locale) => [locale, renderLegalTranslationDraftTestOnly(locale, testDraftVariables)]),
) as Record<(typeof legalTranslationDraftsTestOnly.locales)[number], { privacyPolicy: string; termsOfService: string }>;

/** The canonical visible-document index. Draft locale content is explicitly unapproved. */
export const legalDocumentMap = Object.freeze({
  en: Object.freeze({ privacyPolicy: privacyPolicy.en, termsOfService: termsOfService.en, status: "canonical" as const }),
  pl: Object.freeze({ privacyPolicy: privacyPolicy.pl, termsOfService: termsOfService.pl, status: "canonical" as const }),
  de: Object.freeze({ ...renderedTestDrafts.de, status: "unapproved-test-only" as const }),
  fr: Object.freeze({ ...renderedTestDrafts.fr, status: "unapproved-test-only" as const }),
  es: Object.freeze({ ...renderedTestDrafts.es, status: "unapproved-test-only" as const }),
  it: Object.freeze({ ...renderedTestDrafts.it, status: "unapproved-test-only" as const }),
  et: Object.freeze({ ...renderedTestDrafts.et, status: "unapproved-test-only" as const }),
} satisfies Record<LegalTranslationLocale, { privacyPolicy: string; termsOfService: string; status: "canonical" | "unapproved-test-only" }>);

const isReleaseRuntime = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "release";

export function getLegalDocument(locale: LegalTranslationLocale, kind: LegalDocumentKind, releaseRuntime = isReleaseRuntime) {
  const entry = legalDocumentMap[locale];
  if (entry.status === "unapproved-test-only" && releaseRuntime) {
    return { content: null, status: "unavailable-unapproved" as const };
  }
  return { content: entry[kind], status: entry.status };
}
