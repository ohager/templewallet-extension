import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import { useAppEnv } from 'app/env';
import InUSD from 'app/templates/InUSD';
import { useAssetMetadata, getAssetSymbol, useSignumAssetMetadata } from 'lib/temple/front';

type MoneyDiffViewProps = {
  assetId: string;
  diff: string;
  pending?: boolean;
  className?: string;
};

const MoneyDiffView = memo<MoneyDiffViewProps>(({ assetId: assetSlug, diff, pending = false, className }) => {
  const { popup } = useAppEnv();
  const metadata = useSignumAssetMetadata(assetSlug);

  // const diffBN = useMemo(() => new BigNumber(diff).div(metadata ? 10 ** metadata.decimals : 1), [diff, metadata]);

  return metadata ? (
    <div className={classNames('inline-flex flex-wrap justify-end items-baseline', className)}>
      <div
        className={classNames(
          popup ? 'text-xs' : 'text-sm',
          pending ? 'text-yellow-600' : diff.startsWith('-') ? 'text-red-700' : 'text-green-500'
        )}
      >
        <Money>{diff}</Money> {getAssetSymbol(metadata, true)}
      </div>

      {/*{assetSlug && (*/}
      {/*  <InUSD volume={diffBN.abs()} assetSlug={assetSlug}>*/}
      {/*    {usdVolume => (*/}
      {/*      <div className="text-xs text-gray-500 ml-1">*/}
      {/*        <span className="mr-px">$</span>*/}
      {/*        {usdVolume}*/}
      {/*      </div>*/}
      {/*    )}*/}
      {/*  </InUSD>*/}
      {/*)}*/}
    </div>
  ) : null;
});

export default MoneyDiffView;
