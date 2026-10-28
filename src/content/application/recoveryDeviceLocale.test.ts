import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { TARGET_LOCALES } from "../../preferences/localeResolver";
import { recoveryDeviceLocale } from "./recoveryDeviceLocale";

test("recovery resolves every supported native language and regional separator without encrypted preferences", () => {
  for (const language of TARGET_LOCALES) {
    for (const tag of [language, `${language}-EE`, `${language}_EE`]) {
      assert.equal(recoveryDeviceLocale([tag, "en"], "en_US"), language);
      assert.equal(recoveryDeviceLocale(undefined, tag), language);
    }
  }
  assert.equal(recoveryDeviceLocale(["en", "pl"], "pl_PL"), "en");
  const source = readFileSync("src/content/application/recoveryDeviceLocale.ts", "utf8");
  assert.doesNotMatch(source, /storage|Repository|mmkv|appPreferences["']/);
});
test("unsupported and malformed device values fail to English", () => {
  for (const value of [undefined, null, 42, "", "plausible", "zz-ZZ", "pl--PL"]) assert.equal(recoveryDeviceLocale([], value), "en");
  assert.equal(recoveryDeviceLocale([42], "pl_PL"), "pl");
  assert.equal(recoveryDeviceLocale("pl", null), "en");
});
