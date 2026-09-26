import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enAccount from "./locales/en/account.json";
import enAppearance from "./locales/en/appearance.json";
import enCommon from "./locales/en/common.json";
import enData from "./locales/en/data.json";
import enLegal from "./locales/en/legal.json";
import enLearningPlan from "./locales/en/learningPlan.json";
import enNotifications from "./locales/en/notifications.json";
import enSettings from "./locales/en/settings.json";
import plAccount from "./locales/pl/account.json";
import plAppearance from "./locales/pl/appearance.json";
import plCommon from "./locales/pl/common.json";
import plData from "./locales/pl/data.json";
import plLegal from "./locales/pl/legal.json";
import plLearningPlan from "./locales/pl/learningPlan.json";
import plNotifications from "./locales/pl/notifications.json";
import plSettings from "./locales/pl/settings.json";

import deAccount from "./locales/de/account.json";
import deAppearance from "./locales/de/appearance.json";
import deCommon from "./locales/de/common.json";
import deData from "./locales/de/data.json";
import deLegal from "./locales/de/legal.json";
import deLearningPlan from "./locales/de/learningPlan.json";
import deNotifications from "./locales/de/notifications.json";
import deSettings from "./locales/de/settings.json";
import frAccount from "./locales/fr/account.json";
import frAppearance from "./locales/fr/appearance.json";
import frCommon from "./locales/fr/common.json";
import frData from "./locales/fr/data.json";
import frLegal from "./locales/fr/legal.json";
import frLearningPlan from "./locales/fr/learningPlan.json";
import frNotifications from "./locales/fr/notifications.json";
import frSettings from "./locales/fr/settings.json";
import esAccount from "./locales/es/account.json";
import esAppearance from "./locales/es/appearance.json";
import esCommon from "./locales/es/common.json";
import esData from "./locales/es/data.json";
import esLegal from "./locales/es/legal.json";
import esLearningPlan from "./locales/es/learningPlan.json";
import esNotifications from "./locales/es/notifications.json";
import esSettings from "./locales/es/settings.json";
import itAccount from "./locales/it/account.json";
import itAppearance from "./locales/it/appearance.json";
import itCommon from "./locales/it/common.json";
import itData from "./locales/it/data.json";
import itLegal from "./locales/it/legal.json";
import itLearningPlan from "./locales/it/learningPlan.json";
import itNotifications from "./locales/it/notifications.json";
import itSettings from "./locales/it/settings.json";
import etAccount from "./locales/et/account.json";
import etAppearance from "./locales/et/appearance.json";
import etCommon from "./locales/et/common.json";
import etData from "./locales/et/data.json";
import etLegal from "./locales/et/legal.json";
import etLearningPlan from "./locales/et/learningPlan.json";
import etNotifications from "./locales/et/notifications.json";
import etSettings from "./locales/et/settings.json";

type TranslationLeaf = string | readonly unknown[];
type TranslationEntry = readonly [key: string, value: TranslationLeaf];

function collectTranslationEntries(value: unknown, prefix: string, entries: TranslationEntry[]): void {
  if (typeof value === "string" || Array.isArray(value)) {
    if (prefix.length === 0) throw new TypeError("A translation namespace must contain an object.");
    entries.push([prefix, value]);
    return;
  }
  if (value === null || typeof value !== "object") throw new TypeError(`Translation value at "${prefix}" must be a string, array, or object.`);
  for (const [key, child] of Object.entries(value)) collectTranslationEntries(child, prefix ? `${prefix}.${key}` : key, entries);
}

export function normalizeNamespace(namespace: Readonly<Record<string, unknown>>): Record<string, TranslationLeaf> {
  const entries: TranslationEntry[] = [];
  collectTranslationEntries(namespace, "", entries);
  const values = new Map<string, TranslationLeaf>();
  const collisions = new Set<string>();
  for (const [key, value] of entries) {
    if (values.has(key)) collisions.add(key);
    else values.set(key, value);
  }
  if (collisions.size > 0) throw new Error(`Translation namespace key collision: ${[...collisions].sort().join(", ")}`);
  return Object.fromEntries([...values.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

void i18n.use(initReactI18next).init({
  fallbackLng: false,
  fallbackNS: false,
  lng: "en",
  supportedLngs: ["en", "pl", "de", "fr", "es", "it", "et"],
  ns: ["common", "account", "appearance", "data", "legal", "learningPlan", "notifications", "settings"],
  defaultNS: "common",
  resources: {
    en: {
      account: enAccount,
      appearance: enAppearance,
      common: enCommon,
      data: normalizeNamespace(enData),
      legal: normalizeNamespace(enLegal),
      learningPlan: enLearningPlan,
      notifications: enNotifications,
      settings: enSettings,
    },
    de: {
      account: deAccount,
      appearance: deAppearance,
      common: deCommon,
      data: normalizeNamespace(deData),
      legal: normalizeNamespace(deLegal),
      learningPlan: deLearningPlan,
      notifications: deNotifications,
      settings: deSettings,
    },
    fr: {
      account: frAccount,
      appearance: frAppearance,
      common: frCommon,
      data: normalizeNamespace(frData),
      legal: normalizeNamespace(frLegal),
      learningPlan: frLearningPlan,
      notifications: frNotifications,
      settings: frSettings,
    },
    es: {
      account: esAccount,
      appearance: esAppearance,
      common: esCommon,
      data: normalizeNamespace(esData),
      legal: normalizeNamespace(esLegal),
      learningPlan: esLearningPlan,
      notifications: esNotifications,
      settings: esSettings,
    },
    it: {
      account: itAccount,
      appearance: itAppearance,
      common: itCommon,
      data: normalizeNamespace(itData),
      legal: normalizeNamespace(itLegal),
      learningPlan: itLearningPlan,
      notifications: itNotifications,
      settings: itSettings,
    },
    et: {
      account: etAccount,
      appearance: etAppearance,
      common: etCommon,
      data: normalizeNamespace(etData),
      legal: normalizeNamespace(etLegal),
      learningPlan: etLearningPlan,
      notifications: etNotifications,
      settings: etSettings,
    },
    pl: {
      account: plAccount,
      appearance: plAppearance,
      common: plCommon,
      data: normalizeNamespace(plData),
      legal: normalizeNamespace(plLegal),
      learningPlan: plLearningPlan,
      notifications: plNotifications,
      settings: plSettings,
    },
  },
  interpolation: { escapeValue: false },
  keySeparator: false,
  returnNull: false,
});

export default i18n;
