// @ts-ignore
import React, { createRef, FC, HTMLAttributes, useEffect } from 'react';

import classNames from 'clsx';
// @ts-ignore
import hashicon from 'hashicon';

type IdenticonProps = HTMLAttributes<HTMLDivElement> & {
  accountId: string;
  size?: number;
};

const IdenticonSignum: FC<IdenticonProps> = ({ accountId, size = 100, className, style = {}, ...rest }) => {
  const ref = createRef<HTMLCanvasElement>();
  useEffect(() => {
    if (!ref.current) return;
    hashicon(accountId, {
      size: size - 8,
      createCanvas: () => ref.current!
    });
  }, [accountId]);

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
      <canvas ref={ref} />
    </div>
  );
};

export default IdenticonSignum;
