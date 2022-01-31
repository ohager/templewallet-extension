import React, { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Address } from '@signumjs/core';
import { validateMnemonic } from 'bip39';
import classNames from 'clsx';
import { useForm, Controller } from 'react-hook-form';
import useSWR from 'swr';

import Alert from 'app/atoms/Alert';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import NoSpaceField from 'app/atoms/NoSpaceField';
import TabSwitcher from 'app/atoms/TabSwitcher';
import { formatMnemonic } from 'app/defaults';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import {
  useTempleClient,
  useSetAccountPkh,
  useAllAccounts,
  useNetwork,
  ImportAccountFormType,
  isSignumAddress,
  useSignumAliasResolver,
  useSignumAccountPrefix
} from 'lib/temple/front';
import { navigate } from 'lib/woozie';

import { withErrorHumanDelay } from '../../lib/ui/humanDelay';

type ImportAccountProps = {
  tabSlug: string | null;
};

type ImportTabDescriptor = {
  slug: string;
  i18nKey: string;
  Form: FC<{}>;
};

const ImportAccount: FC<ImportAccountProps> = ({ tabSlug }) => {
  const network = useNetwork();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();

  const prevAccLengthRef = useRef(allAccounts.length);
  const prevNetworkRef = useRef(network);
  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

  const allTabs = useMemo(
    () =>
      [
        {
          slug: 'mnemonic',
          i18nKey: 'mnemonic',
          Form: ByMnemonicForm
        },
        {
          slug: 'watch-only',
          i18nKey: 'watchOnlyAccount',
          Form: WatchOnlyForm
        }
      ].filter((x): x is ImportTabDescriptor => !!x),
    [network.type]
  );
  const { slug, Form } = useMemo(() => {
    const tab = tabSlug ? allTabs.find(currentTab => currentTab.slug === tabSlug) : null;
    return tab ?? allTabs[0];
  }, [allTabs, tabSlug]);
  useEffect(() => {
    const prevNetworkType = prevNetworkRef.current.type;
    prevNetworkRef.current = network;
    if (prevNetworkType !== 'main' && network.type === 'main' && slug === 'faucet') {
      navigate(`/import-account/private-key`);
    }
  }, [network, slug]);

  return (
    <PageLayout
      pageTitle={
        <>
          <DownloadIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="importAccount">{message => <span className="capitalize">{message}</span>}</T>
        </>
      }
    >
      <div className="py-4">
        <TabSwitcher className="mb-4" tabs={allTabs} activeTabSlug={slug} urlPrefix="/import-account" />
        <Form />
      </div>
    </PageLayout>
  );
};

export default ImportAccount;

const DERIVATION_PATHS = [
  {
    type: 'none',
    i18nKey: 'noDerivation'
  },
  {
    type: 'default',
    i18nKey: 'defaultAccount'
  },
  {
    type: 'another',
    i18nKey: 'anotherAccount'
  },
  {
    type: 'custom',
    i18nKey: 'customDerivationPath'
  }
];

interface ByMnemonicFormData {
  mnemonic: string;
  password?: string;
  customDerivationPath: string;
  accountNumber?: number;
}

const ByMnemonicForm: FC = () => {
  const { importMnemonicAccount } = useTempleClient();
  const formAnalytics = useFormAnalytics(ImportAccountFormType.Mnemonic);

  // TOOD: review these things, as we dont need anymore
  const { register, handleSubmit, errors, formState } = useForm<ByMnemonicFormData>({
    defaultValues: {
      customDerivationPath: "m/44'/1729'/0'/0'",
      accountNumber: 1
    }
  });
  const [error, setError] = useState<ReactNode>(null);
  const [derivationPath, setDerivationPath] = useState(DERIVATION_PATHS[0]);

  const onSubmit = useCallback(
    async ({ mnemonic, password, customDerivationPath, accountNumber }: ByMnemonicFormData) => {
      if (formState.isSubmitting) return;

      // formAnalytics.trackSubmit();
      setError(null);
      try {
        // TODO: use this to import a new account
        await importMnemonicAccount(
          formatMnemonic(mnemonic),
          password || undefined,
          (() => {
            switch (derivationPath.type) {
              case 'custom':
                return customDerivationPath;
              case 'default':
                return "m/44'/1729'/0'/0'";
              case 'another':
                return `m/44'/1729'/${accountNumber! - 1}'/0'`;
              default:
                return undefined;
            }
          })()
        );

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        console.error(err);

        // Human delay :eyes
        await new Promise(r => setTimeout(r, 300));
        setError(err.message);
      }
    },
    [formState.isSubmitting, setError, importMnemonicAccount, derivationPath, formAnalytics]
  );

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title={t('error')} autoFocus description={error} className="mb-6" />}

      <FormField
        secret
        textarea
        rows={4}
        name="mnemonic"
        ref={register({
          required: t('required')
        })}
        errorCaption={errors.mnemonic?.message}
        label={t('mnemonicInputLabel')}
        labelDescription={t('mnemonicInputDescription')}
        labelWarning={t('mnemonicInputWarning')}
        id="importfundacc-mnemonic"
        placeholder={t('mnemonicInputPlaceholder')}
        spellCheck={false}
        containerClassName="mb-4"
        className="resize-none"
      />

      <T id="importAccount">
        {message => (
          <FormSubmitButton loading={formState.isSubmitting} className="mt-8">
            {message}
          </FormSubmitButton>
        )}
      </T>
    </form>
  );
};

interface WatchOnlyFormData {
  address: string;
}

const WatchOnlyForm: FC = () => {
  const { importWatchOnlyAccount } = useTempleClient();
  const { resolveAliasToAccountId } = useSignumAliasResolver();
  const prefix = useSignumAccountPrefix();
  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation } = useForm<WatchOnlyFormData>({
    mode: 'onChange'
  });
  const [error, setError] = useState<ReactNode>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string>('');
  const addressFieldRef = useRef<HTMLTextAreaElement>(null);
  const addressValue = watch('address');
  const resolveAlias = useCallback(
    async (address: string) => {
      if (!isSignumAddress(address)) {
        const accountId = await resolveAliasToAccountId(address);
        if (!accountId) {
          // TODO: adjust the translations
          throw new Error(t('domainDoesntResolveToAddress', address));
        }
        return accountId;
      } else {
        return Address.create(address).getNumericId();
      }
    },
    [resolveAliasToAccountId]
  );

  useEffect(() => {
    resolveAlias(addressValue)
      .then(accountId => {
        setResolvedAddress(accountId);
      })
      .catch(() => {
        setResolvedAddress('');
      });
  }, [addressValue]);

  const cleanToField = useCallback(() => {
    setValue('to', '');
    triggerValidation('to');
  }, [setValue, triggerValidation]);

  const validateAddressField = useCallback(
    async (value: any) => {
      if (!value?.length || value.length < 0) {
        return false;
      }
      const accountId = await resolveAlias(value);
      return isSignumAddress(accountId) ? true : t('invalidAddressOrDomain');
    },
    [resolveAlias]
  );

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting || !addressValue) return;
    setError(null);
    try {
      const finalAddress = await resolveAlias(addressValue);
      if (!isSignumAddress(finalAddress)) {
        throw new Error(t('invalidAddress'));
      }
      await importWatchOnlyAccount(finalAddress);
    } catch (err: any) {
      console.error(err);
      await withErrorHumanDelay(err, () => {
        setError(err.message);
      });
    }
  }, [importWatchOnlyAccount, formState.isSubmitting, setError, addressValue]);

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title={t('error')} description={error} autoFocus className="mb-6" />}

      <Controller
        name="address"
        as={<NoSpaceField ref={addressFieldRef} />}
        control={control}
        rules={{
          required: 'Required',
          validate: validateAddressField
        }}
        onChange={([v]) => v}
        onFocus={() => addressFieldRef.current?.focus()}
        textarea
        rows={2}
        cleanable={Boolean(addressValue)}
        onClean={cleanToField}
        id="send-to"
        label={t('address')}
        labelDescription={<T id={'addressInputDescriptionWithDomain'} />}
        placeholder={t('recipientInputPlaceholderWithDomain')}
        errorCaption={errors.address?.message}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4"
      />

      {resolvedAddress && resolvedAddress !== addressValue && (
        <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
          <span className="mr-1 whitespace-no-wrap">{t('resolvedAddress')}:</span>
          <span className="font-normal">{Address.fromNumericId(resolvedAddress, prefix).getReedSolomonAddress()}</span>
        </div>
      )}

      <FormSubmitButton loading={formState.isSubmitting} disabled={!resolvedAddress}>
        {t('importAccount')}
      </FormSubmitButton>
    </form>
  );
};
