import { useCallback } from 'react';

import { Amount } from '@signumjs/util';
import BigNumber from 'bignumber.js';

import { useRetryableSWR } from 'lib/swr';
import { useTezos, ReactiveTezosToolkit, useSignum } from 'lib/temple/front';
import { responseInterface } from 'swr';

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

export function useBalance(assetSlug: string, accountId: string, opts: UseBalanceOptions = {}) {
  // FUTURE: accept assetSlugs to get the tokens amounts also
  const signum = useSignum();
  const fetchBalanceLocal = useCallback(async () => {
    const { balanceNQT } = await signum.account.getAccountBalance(accountId);
    return new BigNumber(Amount.fromPlanck(balanceNQT).getSigna());
  }, [accountId]);
  const displayed = opts.displayed ?? true;
  return useRetryableSWR(displayed ? `balance-${accountId}` : null, fetchBalanceLocal, {
    suspense: opts.suspense ?? true,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
    refreshInterval: 30_000,
    // @ts-ignore
    initialData: opts.initial
  });
}

export function useBalanceSWRKey(assetSlug: string, address: string) {
  const tezos = useTezos();
  return getBalanceSWRKey(tezos, assetSlug, address);
}

export function getBalanceSWRKey(tezos: ReactiveTezosToolkit, assetSlug: string, address: string) {
  return ['balance', tezos.checksum, assetSlug, address];
}
