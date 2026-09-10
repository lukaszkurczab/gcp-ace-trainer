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
  fallbackLng: "en",
  lng: "en",
  supportedLngs: ["en", "pl"],
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
