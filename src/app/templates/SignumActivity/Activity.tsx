import React, { memo, useCallback, useMemo, useRef, useLayoutEffect } from 'react';

import { Transaction } from '@signumjs/core';

import { ACTIVITY_PAGE_SIZE } from 'app/defaults';
import { useRetryableSWR } from 'lib/swr';
import { useSignum } from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';

import ActivityView from './ActivityView';

type ActivityProps = {
  accountId: string;
  className?: string;
};

const Activity = memo<ActivityProps>(({ accountId, className }) => {
  const signum = useSignum();
  const safeStateKey = useMemo(() => accountId, [accountId]);
  const [restTransactions, setRestTransactions] = useSafeState<Transaction[]>([], safeStateKey);
  const [loadingMore, setLoadingMore] = useSafeState(false, safeStateKey);

  const { data: latestTransactions, isValidating: fetching } = useRetryableSWR(
    ['getAccountTransactions', accountId, signum],
    () =>
      signum.account.getAccountTransactions({
        accountId,
        firstIndex: 0,
        lastIndex: ACTIVITY_PAGE_SIZE,
        includeIndirect: true
      }),
    {
      revalidateOnMount: true,
      refreshInterval: 30_000,
      dedupingInterval: 10_000
    }
  );

  const { data: unconfirmedTransactions, isValidating: fetchingUnconfirmed } = useRetryableSWR(
    ['getUnconfirmedAccountTransactions', accountId, signum],
    () => signum.account.getUnconfirmedAccountTransactions(accountId, true),
    {
      revalidateOnMount: true,
      refreshInterval: 10_000,
      dedupingInterval: 10_000
    }
  );

  const transactions = useMemo(() => {
    const pendingTransactions = unconfirmedTransactions?.unconfirmedTransactions || [];
    const confirmedTransactions = mergeTransactions(latestTransactions?.transactions, restTransactions);
    return [...pendingTransactions, ...confirmedTransactions];
  }, [unconfirmedTransactions, latestTransactions, restTransactions]);

  /**
   * Load more / Pagination
   */
  const hasMoreRef = useRef(true);
  useLayoutEffect(() => {
    hasMoreRef.current = true;
  }, [safeStateKey]);

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);

    try {
      const firstIndex = transactions?.length ?? 0;
      const { transactions: olderTransactions } = await signum.account.getAccountTransactions({
        accountId,
        firstIndex,
        lastIndex: firstIndex + ACTIVITY_PAGE_SIZE
      });
      if (olderTransactions.length === 0) {
        hasMoreRef.current = false;
      }

      setRestTransactions(tx => [...tx, ...olderTransactions]);
    } catch (err: any) {
      console.error(err);
    }

    setLoadingMore(false);
  }, [setLoadingMore, setRestTransactions, accountId, transactions]);

  const initialLoading = fetching || fetchingUnconfirmed || !transactions || transactions.length === 0;
  return (
    <ActivityView
      accountId={accountId}
      transactions={transactions}
      initialLoading={initialLoading}
      loadingMore={loadingMore}
      loadMoreDisplayed={hasMoreRef.current}
      loadMore={handleLoadMore}
      className={className}
    />
  );
});

export default Activity;

function mergeTransactions(base?: Transaction[], toAppend: Transaction[] = []) {
  if (!base) return [];

  const uniqueHashes = new Set<string>();
  const uniques: Transaction[] = [];
  for (const tx of [...base, ...toAppend]) {
    if (!uniqueHashes.has(tx.fullHash!)) {
      uniqueHashes.add(tx.fullHash!);
      uniques.push(tx);
    }
  }
  return uniques;
}
