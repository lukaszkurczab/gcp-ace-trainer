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
import i18n, { normalizeNamespace } from "../i18n";
import enLegal from "../locales/en/legal.json";
import plLegal from "../locales/pl/legal.json";
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

test("nested legal and data translations resolve and interpolate in English and Polish", () => {
  assert.equal(i18n.options.keySeparator, false);

  const expected = {
    en: {
      legalCreate: "Send request",
      dataRights: "Your rights",
      legalReceived: "Received: 2026-09-10",
      dataDeadline: "Deadline: 2026-09-10",
      sections: enLegal.sections,
    },
    pl: {
      legalCreate: "Wyślij zgłoszenie",
      dataRights: "Twoje prawa",
      legalReceived: "Przyjęto: 2026-09-10",
      dataDeadline: "Termin: 2026-09-10",
      sections: plLegal.sections,
    },
  } as const;

  for (const lng of ["en", "pl"] as const) {
    assert.equal(i18n.t("legalRequests.create", { lng, ns: "legal" }), expected[lng].legalCreate);
    assert.equal(i18n.t("rights.title", { lng, ns: "data" }), expected[lng].dataRights);
    assert.equal(
      i18n.t("legalRequests.received", { lng, ns: "legal", date: "2026-09-10" }),
      expected[lng].legalReceived,
    );
    assert.equal(
      i18n.t("privacyRequests.deadline", { lng, ns: "data", date: "2026-09-10" }),
      expected[lng].dataDeadline,
    );
    assert.deepEqual(i18n.t("sections", { lng, ns: "legal", returnObjects: true }), expected[lng].sections);
  }
});

test("sentence keys containing dots remain literal in common", () => {
  const key = "Checking saved sign-in.";

  assert.equal(i18n.t(key, { lng: "en" }), key);
  assert.equal(i18n.t(key, { lng: "pl" }), "Sprawdzanie zapamiętanego logowania.");
});

test("flat common labels containing colons remain literal keys", () => {
  const key = "Coding Interview: DSA & Problem Solving";

  assert.equal(i18n.t(key, { lng: "en" }), key);
  assert.equal(i18n.t(key, { lng: "pl" }), "Rozmowa techniczna: DSA i rozwiązywanie problemów");
});

test("flat learningPlan plural resources remain addressable and mutable", () => {
  const cases = [
    {
      count: 2,
      expected: "2 temporary questions per week",
      key: "targetDateGuidance.fact.questionsPerWeek_other",
      language: "en",
      replacement: "{{count}} temporary questions per week",
    },
    {
      count: 2,
      expected: "2 tymczasowe pytania tygodniowo",
      key: "targetDateGuidance.fact.questionsPerWeek_few",
      language: "pl",
      replacement: "{{count}} tymczasowe pytania tygodniowo",
    },
  ] as const;

  for (const { count, expected, key, language, replacement } of cases) {
    const original = i18n.getResource(language, "learningPlan", key);
    assert.equal(typeof original, "string");
    i18n.addResource(language, "learningPlan", key, replacement, { silent: true });
    try {
      assert.equal(i18n.t(key, { count, lng: language, ns: "learningPlan" }), expected);
    } finally {
      i18n.addResource(language, "learningPlan", key, original as string, { silent: true });
    }
  }
});

test("namespace normalization rejects dotted-key collisions atomically regardless of source order", () => {
  const nestedFirst = {
    legalRequests: { create: "nested" },
    "legalRequests.create": "flat",
  };
  const flatFirst = {
    "legalRequests.create": "flat",
    legalRequests: { create: "nested" },
  };

  for (const source of [nestedFirst, flatFirst]) {
    assert.throws(
      () => normalizeNamespace(source),
      /Translation namespace key collision: legalRequests\.create/u,
    );
  }
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
