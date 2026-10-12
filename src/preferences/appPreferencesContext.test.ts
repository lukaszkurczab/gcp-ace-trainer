import assert from "node:assert/strict";
import test from "node:test";
import { deriveAppPreferencesPresentation } from "./appPreferencesContext";
import { TARGET_LOCALES } from "./localeResolver";
import { colors } from "../theme/tokens";

test("presentation keeps explicit preferences independent of the OS and resolves every supported locale", () => {
  for (const locale of TARGET_LOCALES) {
    const value = deriveAppPreferencesPresentation("light", locale, "dark", "pl-PL");
    assert.equal(value.locale, locale);
    assert.equal(value.deviceLocale, "pl");
    assert.equal(value.colorMode, "light");
    assert.equal(value.colors, colors.light);
    assert.equal(value.localeResolution.reason, "translation_available");
  }
});

test("presentation follows OS preferences and preserves explicit unrecognized-locale resolution", () => {
  const dark = deriveAppPreferencesPresentation("system", "system", "dark", "de-DE");
  assert.equal(dark.colorMode, "dark");
  assert.equal(dark.colors, colors.dark);
  assert.equal(dark.locale, "de");
  const unknown = deriveAppPreferencesPresentation("system", "system", null, "ja-JP");
  assert.equal(unknown.colorMode, "light");
  assert.equal(unknown.locale, "en");
  assert.equal(unknown.localeResolution.reason, "system_locale_unrecognized");
});
