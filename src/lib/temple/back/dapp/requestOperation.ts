import {
  TempleDAppErrorType,
  TempleDAppMessageType,
  TempleDAppOperationRequest,
  TempleDAppOperationResponse
} from '@temple-wallet/dapp/dist/types';
import { isAddressValid, loadChainId } from '../../helpers';
import { v4 as uuid } from 'uuid';
import { requestConfirm } from './requestConfirm';
import { TempleMessageType } from '../../types';
import { withUnlocked } from '../store';
import { buildFinalOpParmas } from '../dryrun';
import { addLocalOperation } from '../../activity';
import { TezosOperationError } from '@taquito/taquito';
import { getDApp, getNetworkRPC } from './dapp';

export async function requestOperation(
  origin: string,
  req: TempleDAppOperationRequest
): Promise<TempleDAppOperationResponse> {
  if (
    ![
      isAddressValid(req?.sourcePkh),
      req?.opParams?.length > 0,
      req?.opParams?.every(op => typeof op.kind === 'string')
    ].every(Boolean)
  ) {
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

    await requestConfirm({
      id,
      payload: {
        type: 'confirm_operations',
        origin,
        networkRpc,
        appMeta: dApp.appMeta,
        sourcePkh: req.sourcePkh,
        sourcePublicKey: dApp.publicKey,
        opParams: req.opParams
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppOpsConfirmationRequest && confirmReq?.id === id) {
          if (confirmReq.confirmed) {
            try {
              const op = await withUnlocked(({ vault }) =>
                vault.sendOperations(
                  dApp.pkh,
                  networkRpc,
                  buildFinalOpParmas(req.opParams, confirmReq.modifiedTotalFee, confirmReq.modifiedStorageLimit)
                )
              );

              try {
                const chainId = await loadChainId(networkRpc);
                await addLocalOperation(chainId, op.hash, op.results);
              } catch {}

              resolve({
                type: TempleDAppMessageType.OperationResponse,
                opHash: op.hash
              });
            } catch (err: any) {
              if (err instanceof TezosOperationError) {
                err.message = TempleDAppErrorType.TezosOperation;
                reject(err);
              } else {
                throw err;
              }
            }
          } else {
            decline();
          }

          return {
            type: TempleMessageType.DAppOpsConfirmationResponse
          };
        }
        return;
      }
    });
  });
}
