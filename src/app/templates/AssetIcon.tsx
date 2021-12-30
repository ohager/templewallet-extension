import React, { CSSProperties, memo, useCallback, useState } from 'react';

import classNames from 'clsx';

import Identicon from 'app/atoms/Identicon';
import { AssetTypesEnum } from 'lib/temple/assets';
import { useAssetMetadata, getAssetSymbol, getThumbnailUri, useSignumAssetMetadata } from 'lib/temple/front';
import useImageLoader from 'lib/ui/useImageLoader';

export type AssetIconProps = {
  assetSlug: string;
  className?: string;
  style?: CSSProperties;
  size?: number;
  assetType?: string;
};

const AssetIcon = memo((props: AssetIconProps) => {
  const { assetSlug, className, style, size, assetType } = props;

  const [fallbackIcon, setFallbackIcon] = useState<Boolean>(false);
  const metadata = useSignumAssetMetadata(assetSlug);
  // const nftSrc = useImageLoader(assetSlug);
  let thumbnailUri;
  // const isNft = assetType === AssetTypesEnum.Collectibles && !fallbackIcon;
  // if (isNft) {
  //   thumbnailUri = nftSrc;
  // } else {
  thumbnailUri = getThumbnailUri(metadata);
  // }

  console.log('AssetIcon', props, metadata);
  const [imageDisplayed, setImageDisplayed] = useState(true);
  const handleImageError = useCallback(() => {
    // if (isNft) {
    //   setFallbackIcon(true);
    // } else {
    setImageDisplayed(false);
    // }
  }, [setImageDisplayed]);

  if (thumbnailUri && imageDisplayed) {
    return (
      <img
        src={thumbnailUri}
        alt={metadata?.name}
        className={classNames('overflow-hidden', className)}
        style={{
          width: size,
          height: size,
          ...style
        }}
        onError={handleImageError}
      />
    );
  }

  return <Identicon type="initials" hash={getAssetSymbol(metadata)} className={className} style={style} size={size} />;
});

export default AssetIcon;
