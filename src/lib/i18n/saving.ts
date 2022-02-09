import { storage } from 'webextension-polyfill';

export const STORAGE_KEY = 'locale';

export function getSavedLocale() {
  return storage.local.get(STORAGE_KEY);
}

export function saveLocale(locale: string) {
  return storage.local.set({ [STORAGE_KEY]: locale });
}
