import React, { FC, useEffect, useState } from 'react';

import { Address } from '@signumjs/core';
import { HttpClientFactory } from '@signumjs/http';

import Alert from 'app/atoms/Alert';
import { Button } from 'app/atoms/Button';
import Spinner from 'app/atoms/Spinner';

import { T, t } from '../../../lib/i18n/react';
import { useRetryableSWR } from '../../../lib/swr';
import { useAccount, useNetwork, useSignum, useTempleClient } from '../../../lib/temple/front';

async function activateAccount(isTestnet: boolean, publicKey: string): Promise<void> {
  const activatorUrl = isTestnet
    ? process.env.XT_WALLET_ACTIVATOR_URL_TESTNET
    : process.env.XT_WALLET_ACTIVATOR_URL_MAINNET;

  if (!activatorUrl) {
    throw new Error("Require a 'XT_WALLET_ACTIVATOR_URL_TEST|MAINNET' environment variable to be set");
  }
  const accountId = Address.fromPublicKey(publicKey).getNumericId();
  const http = HttpClientFactory.createHttpClient(activatorUrl);
  const payload = {
    account: accountId,
    publickey: publicKey,
    ref: `xt-wallet-${process.env.VERSION}`
  };
  await http.post('/api/activate', payload);
}

export const ActivationSection: FC = () => {
  const { setAccountActivated, getSignumTransactionKeyPair } = useTempleClient();
  const account = useAccount();
  const signum = useSignum();
  const network = useNetwork();
  const [isActivating, setIsActivating] = useState(false);

  const { data: isActivatedAccount } = useRetryableSWR(
    ['getAccountActivationStatus', account.publicKeyHash, account.isActivated, signum],
    async () => {
      try {
        const acc = await signum.account.getAccount({
          accountId: account.publicKeyHash,
          includeCommittedAmount: false,
          includeEstimatedCommitment: false
        });
        // @ts-ignore
        return !!acc.publicKey;
      } catch (e) {
        console.log('acc', e);
        return false;
      }
    },
    {
      revalidateOnMount: true,
      refreshInterval: 10_000,
      dedupingInterval: 10_000
    }
  );

  useEffect(() => {
    if (isActivatedAccount && !account.isActivated) {
      console.log('activating account state...');
    }
  }, [account.isActivated, isActivatedAccount, setAccountActivated, network]);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const { publicKey } = await getSignumTransactionKeyPair(account.publicKeyHash);
      await activateAccount(network.type === 'test', publicKey);
      await setAccountActivated(account.publicKeyHash);
    } catch (e) {
      console.error(e);
      // setError(`Account Activation failed`);
    } finally {
      setIsActivating(false);
    }
  };

  return account.isActivated ? null : (
    <div className="w-full flex flex-col justify-center items-center p-4 mb-4 border rounded-md mt-4 mx-auto max-w-sm">
      <Alert
        type="warn"
        title={t('accountActivationAlertTitle')}
        description={t('accountActivationAlertDescription')}
      />
      {isActivating ? (
        <Spinner theme="gray" className="w-20" />
      ) : (
        <Button
          className="mt-4 w-1/2 justify-center border-none"
          style={{
            padding: '10px 2rem',
            background: '#4198e0',
            color: '#ffffff',
            borderRadius: 4
          }}
          onClick={handleActivate}
        >
          <T id={'activateAccount'} />
        </Button>
      )}
    </div>
  );
};
