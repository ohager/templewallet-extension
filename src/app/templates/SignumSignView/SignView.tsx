import React, { FC, useEffect, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as CodeAltIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import { ReactComponent as HashIcon } from 'app/icons/hash.svg';
import OperationsBanner from 'app/templates/OperationsBanner';
import RawPayloadView from 'app/templates/RawPayloadView';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { T, t } from 'lib/i18n/react';
import { TempleDAppSignPayload, useSignum } from 'lib/temple/front';
import { parseSignumTransaction, ParsedTransaction } from 'lib/temple/front/parseSignumTransaction';

import TransactionView from './TransactionView';

type OperationViewProps = {
  payload: TempleDAppSignPayload;
  networkRpc?: string;
  mainnet?: boolean;
};

const SigningViewFormats = [
  {
    key: 'preview',
    name: t('preview'),
    Icon: EyeIcon
  },
  {
    key: 'raw',
    name: t('raw'),
    Icon: CodeAltIcon
  },
  {
    key: 'bytes',
    name: t('bytes'),
    Icon: HashIcon
  }
];

const SignView: FC<OperationViewProps> = ({ payload, networkRpc, mainnet = false }) => {
  const signum = useSignum();
  // const {} = useSignumAssetMetadata()
  const [parsedTransaction, setParsedTransaction] = useState<ParsedTransaction | null>(null);
  const [signViewFormat, setSignViewFormat] = useState(SigningViewFormats[0]);

  useEffect(() => {
    if (!payload) return;
    parseSignumTransaction(payload.preview, payload.sourcePkh, signum).then(setParsedTransaction);
  }, [payload]);

  if (!parsedTransaction) return null;

  return (
    <div className="flex flex-col w-full">
      <h2 className="mb-3 leading-tight flex items-center">
        <T id="payloadToSign">
          {message => <span className="mr-2 text-base font-semibold text-gray-700">{message}</span>}
        </T>

        <div className="flex-1" />

        <ViewsSwitcher activeItem={signViewFormat} items={SigningViewFormats} onChange={setSignViewFormat} />
      </h2>

      <OperationsBanner
        opParams={payload.preview}
        className={classNames(signViewFormat.key !== 'raw' && 'hidden')}
        jsonViewStyle={{ height: '11rem', maxHeight: '100%', overflow: 'auto' }}
      />

      <RawPayloadView
        payload={payload.payload}
        className={classNames(signViewFormat.key !== 'bytes' && 'hidden')}
        style={{ marginBottom: 0, height: '11rem' }}
      />

      <div className={classNames(signViewFormat.key !== 'preview' && 'hidden')}>
        <TransactionView transaction={parsedTransaction} />
      </div>
    </div>
  );
};

export default SignView;
