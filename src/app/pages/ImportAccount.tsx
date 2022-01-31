import React, { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { validateMnemonic } from 'bip39';
import classNames from 'clsx';
import { useForm, Controller } from 'react-hook-form';
import useSWR from 'swr';

import Alert from 'app/atoms/Alert';
import FileInput, { FileInputProps } from 'app/atoms/FileInput';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import NoSpaceField from 'app/atoms/NoSpaceField';
import TabSwitcher from 'app/atoms/TabSwitcher';
import { formatMnemonic } from 'app/defaults';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import { ReactComponent as OkIcon } from 'app/icons/ok.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import {
  useTempleClient,
  useSetAccountPkh,
  validateDerivationPath,
  useTezos,
  ActivationStatus,
  useAllAccounts,
  isAddressValid,
  isDomainNameValid,
  useTezosDomainsClient,
  isKTAddress,
  confirmOperation,
  useNetwork,
  ImportAccountFormType
} from 'lib/temple/front';
import useSafeState from 'lib/ui/useSafeState';
import { navigate } from 'lib/woozie';

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
  const tezos = useTezos();
  const domainsClient = useTezosDomainsClient();
  const canUseDomainNames = domainsClient.isSupported;
  const formAnalytics = useFormAnalytics(ImportAccountFormType.WatchOnly);

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation } = useForm<WatchOnlyFormData>({
    mode: 'onChange'
  });
  const [error, setError] = useState<ReactNode>(null);

  const addressFieldRef = useRef<HTMLTextAreaElement>(null);

  const addressValue = watch('address');

  const domainAddressFactory = useCallback(
    (_k: string, _checksum: string, address: string) => domainsClient.resolver.resolveNameToAddress(address),
    [domainsClient]
  );
  const { data: resolvedAddress } = useSWR(['tzdns-address', tezos.checksum, addressValue], domainAddressFactory, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });

  const finalAddress = useMemo(() => resolvedAddress || addressValue, [resolvedAddress, addressValue]);

  const cleanToField = useCallback(() => {
    setValue('to', '');
    triggerValidation('to');
  }, [setValue, triggerValidation]);

  const validateAddressField = useCallback(
    async (value: any) => {
      if (!value?.length || value.length < 0) {
        return false;
      }

      if (!canUseDomainNames) {
        return validateAddress(value);
      }

      if (isDomainNameValid(value, domainsClient)) {
        const resolved = await domainsClient.resolver.resolveNameToAddress(value);
        if (!resolved) {
          return t('domainDoesntResolveToAddress', value);
        }

        value = resolved;
      }

      return isAddressValid(value) ? true : t('invalidAddressOrDomain');
    },
    [canUseDomainNames, domainsClient]
  );

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;

    setError(null);

    formAnalytics.trackSubmit();
    try {
      if (!isAddressValid(finalAddress)) {
        throw new Error(t('invalidAddress'));
      }

      let chainId: string | undefined;

      if (isKTAddress(finalAddress)) {
        try {
          await tezos.contract.at(finalAddress);
        } catch {
          throw new Error(t('contractNotExistOnNetwork'));
        }

        chainId = await tezos.rpc.getChainId();
      }

      await importWatchOnlyAccount(finalAddress, chainId);

      formAnalytics.trackSubmitSuccess();
    } catch (err: any) {
      formAnalytics.trackSubmitFail();

      console.error(err);

      // Human delay
      await new Promise(r => setTimeout(r, 300));
      setError(err.message);
    }
  }, [importWatchOnlyAccount, finalAddress, tezos, formState.isSubmitting, setError, formAnalytics]);

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
        labelDescription={
          <T id={canUseDomainNames ? 'addressInputDescriptionWithDomain' : 'addressInputDescription'} />
        }
        placeholder={t(canUseDomainNames ? 'recipientInputPlaceholderWithDomain' : 'recipientInputPlaceholder')}
        errorCaption={errors.address?.message}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4"
      />

      {resolvedAddress && (
        <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
          <span className="mr-1 whitespace-no-wrap">{t('resolvedAddress')}:</span>
          <span className="font-normal">{resolvedAddress}</span>
        </div>
      )}

      <FormSubmitButton loading={formState.isSubmitting}>{t('importAccount')}</FormSubmitButton>
    </form>
  );
};

function validateAddress(value: any) {
  switch (false) {
    case value?.length > 0:
      return true;

    case isAddressValid(value):
      return 'invalidAddress';

    default:
      return true;
  }
}
