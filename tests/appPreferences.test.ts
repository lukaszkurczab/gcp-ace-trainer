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
import { translate } from "../src/preferences/translations";
import { getSettings } from "../src/storage/repositories/settingsRepository";

beforeEach(() => {
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
});

test("app preferences default to device language and appearance", async () => {
  assert.deepEqual(await loadAppSettings(), DEFAULT_APP_SETTINGS);
});

test("app preferences persist the selected language and appearance together", async () => {
  await updateAppSettings({ appearance: "dark", language: "pl" });

  assert.deepEqual(await getSettings(), { appearance: "dark", language: "pl" });
  assert.deepEqual(await loadAppSettings(), { appearance: "dark", language: "pl" });
});

test("translations use Polish chrome and preserve educational content without a UI translation", () => {
  assert.equal(translate("pl", "Settings"), "Ustawienia");
  assert.equal(translate("en", "Settings"), "Settings");
  assert.equal(translate("pl", "Unmapped learning prompt"), "Unmapped learning prompt");
});
