import { legalTranslationDraftsTestOnly, createLegalVariablesTestDraft, renderLegalTranslationDraftTestOnly } from "./legalTranslationDrafts.testOnly";
import { legalVariables, type LegalVariables } from "./legalVariables";
import { privacyPolicy, renderPrivacyPolicy } from "./privacyPolicy";
import { termsOfService, renderTermsOfService } from "./termsOfService";
import type { LegalTranslationLocale } from "./legalVariablesSchema";

export type LegalDocumentKind = "privacyPolicy" | "termsOfService";
export type LegalDocumentStatus = "canonical" | "unapproved-test-only" | "unavailable-unapproved";
export type LegalDocumentEntry = Readonly<{ privacyPolicy: string; termsOfService: string; status: "canonical" | "unapproved-test-only" }>;
export type LegalDocumentIndex = Readonly<Record<LegalTranslationLocale, LegalDocumentEntry>>;

/** Builds the visible document index from one source. Release translations are usable only after explicit approval. */
export function createLegalDocumentMap(source: LegalVariables, releaseRuntime: boolean): LegalDocumentIndex {
  if (releaseRuntime && source.legalDocumentApproval?.status !== "APPROVED") {
    throw new Error("Release legal documents are unapproved.");
  }

  const privacy = releaseRuntime ? renderPrivacyPolicy(source) : privacyPolicy;
  const terms = releaseRuntime ? renderTermsOfService(source) : termsOfService;
  const translatedVariables = releaseRuntime ? source : createLegalVariablesTestDraft(source);
  const translated = Object.fromEntries(
    legalTranslationDraftsTestOnly.locales.map((locale) => [locale, renderLegalTranslationDraftTestOnly(locale, translatedVariables)]),
  ) as Record<(typeof legalTranslationDraftsTestOnly.locales)[number], { privacyPolicy: string; termsOfService: string }>;
  const translatedStatus = releaseRuntime ? "canonical" as const : "unapproved-test-only" as const;

  return Object.freeze({
    en: Object.freeze({ privacyPolicy: privacy.en, termsOfService: terms.en, status: "canonical" as const }),
    pl: Object.freeze({ privacyPolicy: privacy.pl, termsOfService: terms.pl, status: "canonical" as const }),
    de: Object.freeze({ ...translated.de, status: translatedStatus }),
    fr: Object.freeze({ ...translated.fr, status: translatedStatus }),
    es: Object.freeze({ ...translated.es, status: translatedStatus }),
    it: Object.freeze({ ...translated.it, status: translatedStatus }),
    et: Object.freeze({ ...translated.et, status: translatedStatus }),
  });
}

const isReleaseRuntime = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "release";

/** The canonical visible-document index. Local translation drafts remain explicitly unapproved. */
export const legalDocumentMap = createLegalDocumentMap(legalVariables, isReleaseRuntime);

export function getLegalDocument(locale: LegalTranslationLocale, kind: LegalDocumentKind, releaseRuntime = isReleaseRuntime) {
  const entry = legalDocumentMap[locale];
  if (entry.status === "unapproved-test-only" && releaseRuntime) {
    return { content: null, status: "unavailable-unapproved" as const };
  }
  return { content: entry[kind], status: entry.status };
}
