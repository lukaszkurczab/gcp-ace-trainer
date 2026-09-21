export type RecoveryLocale = "en" | "pl";

/** Device-language fallback used only while encrypted app preferences cannot be read. */
export function recoveryDeviceLocale(languages: unknown, locale: unknown): RecoveryLocale {
  const primary = Array.isArray(languages) && typeof languages[0] === "string" ? languages[0] : locale;
  return typeof primary === "string" && /^pl(?:[-_]|$)/i.test(primary) ? "pl" : "en";
}
