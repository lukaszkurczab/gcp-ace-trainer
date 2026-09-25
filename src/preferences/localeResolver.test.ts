import assert from "node:assert/strict";
import test from "node:test";

import i18n from "../i18n";
import { LANGUAGE_SETTINGS_OPTIONS } from "../features/home/languageSettingsModel";
import { resolveLocale, TARGET_LOCALES } from "./localeResolver";

test("system locale resolver recognizes all supported targets and regional/case variants", () => {
  assert.deepEqual(TARGET_LOCALES, ["pl", "en", "de", "fr", "es", "it", "et"]);

  for (const locale of ["pl", "pl-PL", "PL-pl", "en-US", "de-DE", "fr-CA", "es-MX", "it-IT", "et-EE"]) {
    const result = resolveLocale("system", locale);
    const target = locale.slice(0, 2).toLowerCase();
    assert.equal(result.requestedLocale, target);
    assert.equal(result.reason, target === "pl" || target === "en" ? "translation_available" : "translation_unavailable");
    assert.equal(result.effectiveLocale, target === "pl" ? "pl" : "en");
  }
});

test("unknown and malformed system locale values resolve explicitly to temporary English", () => {
  for (const locale of ["", "  ", "not_a_locale", "xx-ZZ", "en--US", "💥"]) {
    const result = resolveLocale("system", locale);
    assert.deepEqual(result, {
      requestedLocale: null,
      effectiveLocale: "en",
      reason: "system_locale_unrecognized",
    });
  }
});

test("manual choices remain authoritative and settings offer only System, EN, and PL", () => {
  assert.deepEqual(resolveLocale("en", "fr-FR"), {
    requestedLocale: "en",
    effectiveLocale: "en",
    reason: "translation_available",
  });
  assert.deepEqual(resolveLocale("pl", "de-DE"), {
    requestedLocale: "pl",
    effectiveLocale: "pl",
    reason: "translation_available",
  });
  assert.deepEqual(LANGUAGE_SETTINGS_OPTIONS.map(({ value }) => value), ["system", "en", "pl"]);
});

test("i18next does not silently fill missing keys from another locale", () => {
  assert.equal(i18n.options.fallbackLng, false);
  assert.equal(i18n.options.fallbackNS, false);
  const key = "__odk117_missing_translation__";
  assert.equal(i18n.t(key, { lng: "pl" }), key);
});
