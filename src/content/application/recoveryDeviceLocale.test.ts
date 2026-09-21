import assert from "node:assert/strict";
import test from "node:test";

import { recoveryDeviceLocale } from "./recoveryDeviceLocale";

test("recovery locale uses the first device language and supports Polish regional tags", () => {
  assert.equal(recoveryDeviceLocale(["pl"], "en_US"), "pl");
  assert.equal(recoveryDeviceLocale(["pl-PL", "en"], "en_US"), "pl");
  assert.equal(recoveryDeviceLocale(["en", "pl"], "pl_PL"), "en");
  assert.equal(recoveryDeviceLocale(undefined, "pl_PL"), "pl");
});

test("recovery locale fails to English for unsupported or malformed native values", () => {
  assert.equal(recoveryDeviceLocale(["de-DE"], "pl_PL"), "en");
  assert.equal(recoveryDeviceLocale([], undefined), "en");
  assert.equal(recoveryDeviceLocale([42], "en_US"), "en");
  assert.equal(recoveryDeviceLocale("pl", null), "en");
  assert.equal(recoveryDeviceLocale(undefined, "plausible"), "en");
});
