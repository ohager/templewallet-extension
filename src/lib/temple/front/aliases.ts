import { useCallback } from 'react';

import { Alias } from '@signumjs/core';

import { useSignum } from './ready';

interface AliasList {
  aliases: Alias[];
}

export function useSignumAliasResolver() {
  const signum = useSignum();

  return useCallback(
    async accountId => {
      const { aliases } = await signum.service.query<AliasList>('getAliases', { account: accountId });
      return aliases.find(({ account }) => account === accountId)?.aliasName;
    },
    [signum]
  );
}
