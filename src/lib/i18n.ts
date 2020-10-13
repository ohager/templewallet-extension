import { browser } from "webextension-polyfill-ts";
import { enUS, enGB } from "date-fns/locale";

const {
  getAcceptLanguages: importedGetAcceptLanguages,
  getUILanguage: importedGetUILanguage,
} = browser.i18n;

export const supportedLocales = ["en", "ru"];
export const getAcceptLanguages = importedGetAcceptLanguages;
export const getUILanguage = importedGetUILanguage;
export const getUILanguageWithFallback = () => {
  const locale = getUILanguage();
  if (supportedLocales.includes(locale)) {
    return locale;
  }
  const localeWithoutCountry = locale.split("_")[0];
  if (supportedLocales.includes(localeWithoutCountry)) {
    return localeWithoutCountry;
  }
  return;
};

const dateFnsLocales: Record<string, Locale> = {
  en: enUS,
  en_US: enUS,
  en_GB: enGB,
};

export const getDateFnsLocale = () => dateFnsLocales[getUILanguage()] || enUS;
