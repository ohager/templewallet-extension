import { runtime } from 'webextension-polyfill';

import { init } from './core';
import { saveLocale } from './saving';

export const REFRESH_MSGTYPE = 'TEMPLE_I18N_REFRESH';

runtime.onMessage.addListener(msg => {
  if (msg?.type === REFRESH_MSGTYPE) {
    refresh();
  }
});

export function onInited(callback: () => void) {
  init().then(callback);
}

export function updateLocale(locale: string) {
  console.log('save locale', locale);
  saveLocale(locale);
  notifyOthers();
  refresh();
}

function notifyOthers() {
  runtime.sendMessage({ type: REFRESH_MSGTYPE });
}

function refresh() {
  window.location.reload();
}
