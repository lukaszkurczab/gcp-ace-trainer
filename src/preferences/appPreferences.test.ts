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
import enData from "../locales/en/data.json";
import enLegal from "../locales/en/legal.json";
import plData from "../locales/pl/data.json";
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

test("Legal information distinguishes device storage, account sync, local reset, account deletion, and retained deletion evidence", () => {
  for (const legal of [enLegal, plLegal]) {
    const topics = legal.sections.flatMap((section) => section.topics);
    const localStorage = topics.find((topic) => topic.icon === "shield-check");
    const resetLimits = topics.find((topic) => topic.icon === "trash");

    assert.ok(localStorage);
    assert.ok(resetLimits);
    const localCopy = [localStorage.summary, ...localStorage.paragraphs].join(" ");
    const resetCopy = [resetLimits.summary, ...resetLimits.paragraphs].join(" ");

    assert.match(localCopy, /device|urządzeniu/u);
    assert.match(localCopy, /account cloud|chmurą konta/u);
    assert.match(localCopy, /active track|aktywna ścieżka/u);
    assert.match(resetCopy, /[Ll]ocal reset|Reset lokalnej/u);
    assert.match(resetCopy, /Delete account|Usunięcie konta/u);
    assert.match(resetCopy, /does not delete an account|Nie usuwa konta/u);
    assert.match(resetCopy, /deletion safeguards|zabezpieczenia przed odtworzeniem konta/u);
    assert.match(resetCopy, /Privacy Policy|Polityka prywatności/u);
  }
});

test("Legal hub keeps full rules in local documents and presents only proven request timeframes", () => {
  assert.match(enLegal.infoBody, /short guide.+local Privacy Policy and Terms.+Support.+external/u);
  assert.match(plLegal.infoBody, /krótki przewodnik.+lokalnej Polityce prywatności i Warunkach.+Pomoc.+zewnętrzny/u);

  for (const legal of [enLegal, plLegal]) {
    assert.match(legal.complaintDetail, /14 dni|14 days/u);
    assert.match(legal.complaintDetail, /not a filing deadline|nie jest to termin na złożenie/u);
    assert.match(legal.withdrawalDetail, /14 dni|14 days/u);
    assert.match(legal.withdrawalDetail, /Terms|Warunkach/u);
    assert.match(legal.privacyRequestsDetail, /one month|miesiąca/u);
    assert.match(legal.privacyRequestsDetail, /two months|dwóch miesięcy/u);
    assert.match(legal.legalRequests.kinds.data_recovery.intro, /reasonable time|rozsądnym czasie/u);
    assert.match(legal.legalRequests.kinds.data_recovery.intro, /No fixed response time|Nie obiecujemy stałego terminu/u);
    assert.match(legal.legalRequests.kinds.suspension_appeal.intro, /No fixed response time|Nie obiecujemy stałego terminu/u);
  }

  assert.match(enData.privacyRequests.summary, /within one month.+up to two months.+within the first month/u);
  assert.match(plData.privacyRequests.summary, /w ciągu miesiąca.+do dwóch miesięcy.+w pierwszym miesiącu/u);
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
