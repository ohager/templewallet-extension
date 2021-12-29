import React, { FC, HTMLAttributes } from 'react';

import { Hashicon } from '@emeraldpay/hashicon-react';
import classNames from 'clsx';

type IdenticonProps = HTMLAttributes<HTMLDivElement> & {
  accountId: string;
  size?: number;
};

const IdenticonSignum: FC<IdenticonProps> = ({ accountId, size = 100, className, style = {}, ...rest }) => {
  return (
    <div
      className={classNames('inline-block', 'bg-gray-100', 'bg-no-repeat bg-center', 'overflow-hidden', className)}
      style={{
        width: size,
        height: size,
        padding: '4px',
        borderRadius: Math.round(size / 10),
        ...style
      }}
      {...rest}
    >
      <Hashicon value={accountId} />
    </div>
  );
};

export default IdenticonSignum;
