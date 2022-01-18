import {
  TempleDAppErrorType,
  TempleDAppMessageType,
  TempleDAppPermissionRequest,
  TempleDAppPermissionResponse
} from '@temple-wallet/dapp/dist/types';
import { v4 as uuid } from 'uuid';

import { TempleMessageType } from '../../types';
import { getDApp, getNetworkRPC, setDApp } from './dapp';
import { isAllowedNetwork, isNetworkEquals } from './helpers';
import { requestConfirm } from './requestConfirm';

export async function requestPermission(
  origin: string,
  req: TempleDAppPermissionRequest
): Promise<TempleDAppPermissionResponse> {
  if (![isAllowedNetwork(req?.network), typeof req?.appMeta?.name === 'string'].every(Boolean)) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const networkRpc = await getNetworkRPC(req.network);
  const dApp = await getDApp(origin);

  if (!req.force && dApp && isNetworkEquals(req.network, dApp.network) && req.appMeta.name === dApp.appMeta.name) {
    return {
      type: TempleDAppMessageType.PermissionResponse,
      rpc: networkRpc,
      pkh: dApp.pkh,
      publicKey: dApp.publicKey
    };
  }

  return new Promise(async (resolve, reject) => {
    const id = uuid();

    await requestConfirm({
      id,
      payload: {
        type: 'connect',
        origin,
        networkRpc,
        appMeta: req.appMeta
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed, accountPublicKeyHash, accountPublicKey } = confirmReq;
          if (confirmed && accountPublicKeyHash && accountPublicKey) {
            await setDApp(origin, {
              network: req.network,
              appMeta: req.appMeta,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey
            });
            resolve({
              type: TempleDAppMessageType.PermissionResponse,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey,
              rpc: networkRpc
            });
          } else {
            decline();
          }

          return {
            type: TempleMessageType.DAppPermConfirmationResponse
          };
        }
        return;
      }
    });
  });
}
