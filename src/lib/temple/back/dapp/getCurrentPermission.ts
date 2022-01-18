import { TempleDAppGetCurrentPermissionResponse, TempleDAppMessageType } from '@temple-wallet/dapp/dist/types';

import { getDApp, getNetworkRPC } from './dapp';

export async function getCurrentPermission(origin: string): Promise<TempleDAppGetCurrentPermissionResponse> {
  const dApp = await getDApp(origin);
  const permission = dApp
    ? {
        rpc: await getNetworkRPC(dApp.network),
        pkh: dApp.pkh,
        publicKey: dApp.publicKey
      }
    : null;
  return {
    type: TempleDAppMessageType.GetCurrentPermissionResponse,
    permission
  };
}
