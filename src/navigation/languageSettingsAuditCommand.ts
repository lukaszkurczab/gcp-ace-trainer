const LANGUAGE_SETTINGS_AUDIT_URL = "com.lkurczab.patternly://audit/show-language-settings";

export function isLanguageSettingsAuditCommand(
  url: string | null,
  environment: Readonly<{ development: boolean; smoke: boolean }>,
): boolean {
  if (!environment.development || !environment.smoke || url === null) return false;
  return url === LANGUAGE_SETTINGS_AUDIT_URL;
}
