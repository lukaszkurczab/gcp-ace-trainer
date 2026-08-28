import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  updateAppSettings,
} from "../src/application/appPreferences";
import {
  MemoryKeyValueStorage,
  installKeyValueStorageForTests,
} from "../src/infrastructure/storage/mmkvClient";
import i18n from "../src/i18n";
import { getSettings } from "../src/storage/repositories/settingsRepository";

beforeEach(() => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
});

test("app preferences default to English content locale and device appearance", async () => {
  assert.deepEqual(await loadAppSettings(), DEFAULT_APP_SETTINGS);
  assert.equal(DEFAULT_APP_SETTINGS.language, "en");
});

test("app preferences retain an explicitly selected Polish locale", async () => {
  await updateAppSettings({ appearance: "dark", language: "pl" });

  assert.deepEqual(await getSettings(), { appearance: "dark", language: "pl" });
  assert.deepEqual(await loadAppSettings(), { appearance: "dark", language: "pl" });
});

test("translations resolve common UI copy through i18next", () => {
  assert.equal(i18n.t("Settings", { lng: "pl" }), "Ustawienia");
  assert.equal(i18n.t("Settings", { lng: "en" }), "Settings");
  assert.equal(i18n.t("Unmapped learning prompt", { lng: "pl" }), "Unmapped learning prompt");
});
