import * as React from "react";
import classNames from "clsx";
import BigNumber from "bignumber.js";
import { t } from "lib/i18n/react";
import useTippy from "lib/ui/useTippy";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";

type MoneyProps = {
  children: number | string | BigNumber;
  fiat?: boolean;
  cryptoDecimals?: number;
  roundingMode?: BigNumber.RoundingMode;
};

const DEFAULT_CRYPTO_DECIMALS = 4;

const Money = React.memo<MoneyProps>(
  ({
    children,
    fiat,
    cryptoDecimals = DEFAULT_CRYPTO_DECIMALS,
    roundingMode = BigNumber.ROUND_DOWN,
  }) => {
    const bn = new BigNumber(children);
    const decimals = fiat
      ? 2
      : (() => {
          const current = bn.decimalPlaces();
          return current > cryptoDecimals ? cryptoDecimals : current;
        })();
    const result = bn.toFormat(decimals, roundingMode);
    const indexOfDot = result.indexOf(".");

    switch (true) {
      case indexOfDot === -1:
        return <>{result}</>;

      case !fiat && bn.decimalPlaces() > decimals:
        return (
          <FullAmountTippy
            fullAmunt={bn}
            className={classNames(
              "px-px -mr-px",
              "rounded cursor-pointer",
              "hover:bg-black hover:bg-opacity-5",
              "transition ease-in-out duration-200"
            )}
          >
            {result.slice(0, indexOfDot + 1)}
            <span style={{ fontSize: "0.9em" }}>
              {result.slice(indexOfDot + 1, result.length)}
              <span className="opacity-75">...</span>
            </span>
          </FullAmountTippy>
        );

      default:
        return (
          <>
            {result.slice(0, indexOfDot + 1)}
            <span style={{ fontSize: "0.9em" }}>
              {result.slice(indexOfDot + 1, result.length)}
            </span>
          </>
        );
    }
  }
);

export default Money;

type FullAmountTippyProps = React.HTMLAttributes<HTMLButtonElement> & {
  fullAmunt: BigNumber;
};

const FullAmountTippy: React.FC<FullAmountTippyProps> = ({
  fullAmunt,
  onClick,
  ...rest
}) => {
  const fullAmountStr = React.useMemo(() => fullAmunt.toFixed(), [fullAmunt]);

  const { fieldRef, copy, copied, setCopied } = useCopyToClipboard();

  const tippyProps = React.useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: copied ? t("copiedHash") : fullAmountStr,
      animation: "shift-away-subtle",
      onHidden() {
        setCopied(false);
      },
    }),
    [fullAmountStr, copied, setCopied]
  );

  const ref = useTippy<HTMLSpanElement>(tippyProps);

  const handleClick = React.useCallback(
    (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      copy();
      if (onClick) onClick(evt);
    },
    [copy, onClick]
  );

  return (
    <>
      <span ref={ref} onClick={handleClick} {...rest} />
      <input
        ref={fieldRef}
        value={fullAmountStr}
        readOnly
        className="sr-only"
      />
    </>
  );
};
