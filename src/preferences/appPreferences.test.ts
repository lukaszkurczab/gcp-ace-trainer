import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  updateAppSettings,
} from "../application/appPreferences";
import {
  MemoryKeyValueStorage,
  installKeyValueStorageForTests,
} from "../infrastructure/storage/mmkvClient";
import i18n from "../i18n";
import { getSettings } from "../storage/repositories/settingsRepository";

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

test("language changes persist all supported choices without changing appearance", async () => {
  for (const language of ["pl", "system", "en"] as const) {
    await updateAppSettings({ appearance: "dark", language });
    assert.deepEqual(await loadAppSettings(), { appearance: "dark", language });
  }
});

test("a failed language write rejects and preserves the previous saved choice for retry", async () => {
  class FailingSettingsStorage extends MemoryKeyValueStorage {
    failWrites = false;
    override setString(key: string, value: string): void {
      if (this.failWrites) throw new Error("settings write unavailable");
      super.setString(key, value);
    }
  }
  const storage = new FailingSettingsStorage();
  installKeyValueStorageForTests(storage);
  await updateAppSettings({ appearance: "system", language: "en" });
  storage.failWrites = true;
  await assert.rejects(updateAppSettings({ appearance: "system", language: "pl" }));
  assert.deepEqual(await loadAppSettings(), { appearance: "system", language: "en" });
  storage.failWrites = false;
  await updateAppSettings({ appearance: "system", language: "pl" });
  assert.deepEqual(await loadAppSettings(), { appearance: "system", language: "pl" });
});
