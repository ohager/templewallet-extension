import React, { memo } from 'react';

import { Address } from '@signumjs/core';

type HashShortViewProps = {
  hash: string;
  trim?: boolean;
  trimAfter?: number;
  firstCharsCount?: number;
  lastCharsCount?: number;
};

const HashShortView = memo<HashShortViewProps>(
  ({ hash, trim = true, trimAfter = 20, firstCharsCount = 7, lastCharsCount = 4 }) => {
    if (!hash) return null;

    const trimmedHash = (() => {
      let address = hash;
      try {
        address = Address.create(hash).getReedSolomonAddress();
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
