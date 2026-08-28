import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enAccount from "./locales/en/account.json";
import enAppearance from "./locales/en/appearance.json";
import enCommon from "./locales/en/common.json";
import enData from "./locales/en/data.json";
import enLegal from "./locales/en/legal.json";
import enNotifications from "./locales/en/notifications.json";
import enSettings from "./locales/en/settings.json";
import plAccount from "./locales/pl/account.json";
import plAppearance from "./locales/pl/appearance.json";
import plCommon from "./locales/pl/common.json";
import plData from "./locales/pl/data.json";
import plLegal from "./locales/pl/legal.json";
import plNotifications from "./locales/pl/notifications.json";
import plSettings from "./locales/pl/settings.json";

void i18n.use(initReactI18next).init({
  fallbackLng: "en",
  lng: "en",
  supportedLngs: ["en", "pl"],
  ns: ["common", "account", "appearance", "data", "legal", "notifications", "settings"],
  defaultNS: "common",
  resources: {
    en: {
      account: enAccount,
      appearance: enAppearance,
      common: enCommon,
      data: enData,
      legal: enLegal,
      notifications: enNotifications,
      settings: enSettings,
    },
    pl: {
      account: plAccount,
      appearance: plAppearance,
      common: plCommon,
      data: plData,
      legal: plLegal,
      notifications: plNotifications,
      settings: plSettings,
    },
  },
  interpolation: { escapeValue: false },
  keySeparator: false,
  returnNull: false,
});

export default i18n;
