import React, { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { Address } from '@signumjs/core';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import { T, t } from '../../../lib/i18n/react';
import {
  isSignumAddress,
  useSignumAccountPrefix,
  useSignumAliasResolver,
  useTempleClient
} from '../../../lib/temple/front';
import { withErrorHumanDelay } from '../../../lib/ui/humanDelay';
import Alert from '../../atoms/Alert';
import FormSubmitButton from '../../atoms/FormSubmitButton';
import NoSpaceField from '../../atoms/NoSpaceField';

interface WatchOnlyFormData {
  address: string;
}

export const WatchOnlyForm: FC = () => {
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
  }, [addressValue, resolveAlias]);

  const cleanToField = useCallback(() => {
    setValue('address', '');
    triggerValidation('address');
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
  }, [importWatchOnlyAccount, formState.isSubmitting, setError, addressValue, resolveAlias]);

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title={t('error')} description={error} autoFocus className="mb-6" />}

      <Controller
        name="address"
        as={<NoSpaceField ref={addressFieldRef} />}
        control={control}
        rules={{
          required: t('required'),
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
