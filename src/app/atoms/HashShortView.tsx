import React, { memo } from 'react';

import { Address, AddressPrefix } from '@signumjs/core';

import { useNetwork } from '../../lib/temple/front';

type HashShortViewProps = {
  hash: string;
  isAccount?: boolean;
  trim?: boolean;
  trimAfter?: number;
  firstCharsCount?: number;
  lastCharsCount?: number;
};

const HashShortView = memo<HashShortViewProps>(
  ({ hash, isAccount = false, trim = true, trimAfter = 20, firstCharsCount = 7, lastCharsCount = 4 }) => {
    const network = useNetwork();
    if (!hash) return null;

    const trimmedHash = (() => {
      let address = hash;
      try {
        const prefix = network.type === 'test' ? AddressPrefix.TestNet : AddressPrefix.MainNet;
        address = isAccount ? Address.create(hash, prefix).getReedSolomonAddress() : hash;
      } catch (e) {
        // no op as no valid Signum Address
      }
      if (!trim) return address;
      const ln = hash.length;
      return ln > trimAfter ? (
        <>
          {address.slice(0, firstCharsCount)}
          <span className="opacity-75">...</span>
          {address.slice(ln - lastCharsCount, ln)}
        </>
      ) : (
        address
      );
    })();

    return <>{trimmedHash}</>;
  }
);

export default HashShortView;
