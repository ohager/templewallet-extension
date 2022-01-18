import { ApiComposer, ChainService, composeApi, Transaction } from '@signumjs/core';
import { localForger } from '@taquito/local-forging';
import { valueDecoder } from '@taquito/local-forging/dist/lib/michelson/codec';
import { Uint8ArrayConsumer } from '@taquito/local-forging/dist/lib/uint8array-consumer';
import { emitMicheline } from '@taquito/michel-codec';
import {
  TempleDAppErrorType,
  TempleDAppMessageType,
  TempleDAppSignRequest,
  TempleDAppSignResponse
} from '@temple-wallet/dapp/dist/types';
import { v4 as uuid } from 'uuid';

import { isSignumAddress } from '../../helpers';
import { TempleMessageType } from '../../types';
import { withUnlocked } from '../store';
import { getDApp, getNetworkRPC } from './dapp';
import { requestConfirm } from './requestConfirm';

const HEX_PATTERN = /^[0-9a-fA-F]+$/;

export async function requestSign(origin: string, req: TempleDAppSignRequest): Promise<TempleDAppSignResponse> {
  if (req?.payload?.startsWith('0x')) {
    req = { ...req, payload: req.payload.substring(2) };
  }

  if (![isSignumAddress(req?.sourcePkh), HEX_PATTERN.test(req?.payload)].every(Boolean)) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(TempleDAppErrorType.NotGranted);
  }

  if (req.sourcePkh !== dApp.pkh) {
    throw new Error(TempleDAppErrorType.NotFound);
  }

  return new Promise(async (resolve, reject) => {
    const id = uuid();
    const networkRpc = await getNetworkRPC(dApp.network);
    // TODO: use the newest "parseTransaction" method from rc.9
    const service = new ChainService({ nodeHost: networkRpc });
    let preview: any;
    try {
      const transaction = await service.query<Transaction>('parseTransaction', { transactionBytes: req?.payload });
      preview = JSON.stringify(transaction);
    } catch {
      preview = null;
    }

    await requestConfirm({
      id,
      payload: {
        type: 'sign',
        origin,
        networkRpc,
        appMeta: dApp.appMeta,
        sourcePkh: req.sourcePkh,
        payload: req.payload,
        preview
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppSignConfirmationRequest && confirmReq?.id === id) {
          if (confirmReq.confirmed) {
            const { prefixSig: signature } = await withUnlocked(({ vault }) => vault.sign(dApp.pkh, req.payload));
            resolve({
              type: TempleDAppMessageType.SignResponse,
              signature
            });
          } else {
            decline();
          }

          return {
            type: TempleMessageType.DAppSignConfirmationResponse
          };
        }
        return;
      }
    });
  });
}
