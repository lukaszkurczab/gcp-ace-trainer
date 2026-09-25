import type { LanguagePreference } from "../application/appPreferences";

export const TARGET_LOCALES = ["pl", "en", "de", "fr", "es", "it", "et"] as const;
export type TargetLocale = (typeof TARGET_LOCALES)[number];
export type AvailableLocale = "en" | "pl";

export type LocaleResolutionReason = "translation_available" | "translation_unavailable" | "system_locale_unrecognized";

export type LocaleResolution = Readonly<{
  requestedLocale: TargetLocale | null;
  effectiveLocale: AvailableLocale;
  reason: LocaleResolutionReason;
}>;

const AVAILABLE_LOCALES = new Set<AvailableLocale>(["en", "pl"]);
const TARGET_LOCALE_SET = new Set<string>(TARGET_LOCALES);

function parseTargetLocale(rawLocale: string): TargetLocale | null {
  if (typeof rawLocale !== "string" || rawLocale.trim().length === 0) return null;

  try {
    const [canonicalLocale] = Intl.getCanonicalLocales(rawLocale.trim());
    const language = canonicalLocale?.split("-")[0]?.toLowerCase();
    return language && TARGET_LOCALE_SET.has(language) ? (language as TargetLocale) : null;
  } catch {
    return null;
  }
}

export function resolveLocale(preference: LanguagePreference, systemLocale: string): LocaleResolution {
  if (preference === "en" || preference === "pl") {
    return { requestedLocale: preference, effectiveLocale: preference, reason: "translation_available" };
  }

  const requestedLocale = parseTargetLocale(systemLocale);
  if (requestedLocale === null) {
    return { requestedLocale: null, effectiveLocale: "en", reason: "system_locale_unrecognized" };
  }
  if (AVAILABLE_LOCALES.has(requestedLocale as AvailableLocale)) {
    return { requestedLocale, effectiveLocale: requestedLocale as AvailableLocale, reason: "translation_available" };
  }
  return { requestedLocale, effectiveLocale: "en", reason: "translation_unavailable" };
}
