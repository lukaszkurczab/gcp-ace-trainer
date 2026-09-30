import { legalVariables } from "./legalVariables";
import { getLegalDocument } from "./legalDocumentMap";
import { validateLegalVariables } from "./legalVariablesSchema";
import type { TargetLocale } from "../preferences/localeResolver";
import type { PatternlyRuntimeMode } from "../infrastructure/runtime/runtimeMode";

export type ProviderRegistrationDocuments = Readonly<{
  locale: "en" | "pl";
  terms: Readonly<{ content: string; version: string }>;
  privacy: Readonly<{ content: string; version: string }>;
}>;

export type ProviderRegistrationDocumentsResult = Readonly<
  | { kind: "ready"; documents: ProviderRegistrationDocuments }
  | { kind: "unavailable"; reason: "locale" | "documents" }
>;

export function resolveProviderRegistrationDocuments(
  locale: TargetLocale,
  runtimeMode: PatternlyRuntimeMode | undefined,
): ProviderRegistrationDocumentsResult {
  if (locale !== "en" && locale !== "pl") return { kind: "unavailable", reason: "locale" };
  if (runtimeMode !== "smoke" && runtimeMode !== "sandbox" && runtimeMode !== "release") {
    return { kind: "unavailable", reason: "documents" };
  }

  const releaseRuntime = runtimeMode === "release";
  const terms = getLegalDocument(locale, "termsOfService", releaseRuntime);
  const privacy = getLegalDocument(locale, "privacyPolicy", releaseRuntime);
  const termsVersion = legalVariables.documentVersion[locale]?.trim();
  const privacyVersion = legalVariables.documentVersion[locale]?.trim();
  const releaseIssues = runtimeMode === "release" ? validateLegalVariables(legalVariables, "release") : [];
  if (terms.status !== "canonical" || privacy.status !== "canonical"
    || !terms.content?.trim() || !privacy.content?.trim()
    || !termsVersion || !privacyVersion
    || releaseIssues.length > 0) return { kind: "unavailable", reason: "documents" };

  return {
    kind: "ready",
    documents: Object.freeze({
      locale,
      terms: Object.freeze({ content: terms.content, version: termsVersion }),
      privacy: Object.freeze({ content: privacy.content, version: privacyVersion }),
    }),
  };
}
