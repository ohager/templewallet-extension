import { browser } from 'webextension-polyfill-ts';

import { NETWORKS } from '../../networks';
import { ExtensionNetwork } from './typings';

export async function getCurrentTempleNetwork() {
  const { network_id: networkId, custom_networks_snapshot: customNetworksSnapshot } = await browser.storage.local.get([
    'network_id',
    'custom_networks_snapshot'
  ]);

  return [...NETWORKS, ...(customNetworksSnapshot ?? [])].find(n => n.id === networkId) ?? NETWORKS[0];
}

export function isAllowedNetwork(net: ExtensionNetwork) {
  return typeof net === 'string' ? NETWORKS.some(n => !n.disabled && n.id === net) : Boolean(net?.rpc);
}

export function isNetworkEquals(fNet: ExtensionNetwork, sNet: ExtensionNetwork) {
  return typeof fNet !== 'string' && typeof sNet !== 'string'
    ? removeLastSlash(fNet.rpc) === removeLastSlash(sNet.rpc)
    : fNet === sNet;
}

export function removeLastSlash(str: string) {
  return str.endsWith('/') ? str.slice(0, -1) : str;
}
