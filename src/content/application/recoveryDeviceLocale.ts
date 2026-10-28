import { resolveLocale, type TargetLocale } from "../../preferences/localeResolver";

export type RecoveryLocale = TargetLocale;

/** Device-language fallback used only while encrypted app preferences cannot be read. */
export function recoveryDeviceLocale(languages: unknown, locale: unknown): RecoveryLocale {
  const primary = Array.isArray(languages) && typeof languages[0] === "string" ? languages[0] : locale;
  return resolveLocale("system", typeof primary === "string" ? primary.replace(/_/g, "-") : "").effectiveLocale;
}
