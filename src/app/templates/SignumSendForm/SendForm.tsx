import React, { Dispatch, FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Address, TransactionId } from '@signumjs/core';
import { Amount, FeeQuantPlanck } from '@signumjs/util';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import Alert from 'app/atoms/Alert';
import AssetField from 'app/atoms/AssetField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Money from 'app/atoms/Money';
import NoSpaceField from 'app/atoms/NoSpaceField';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import {
  isSignumAddress,
  useAccount,
  useBalance,
  useSignum,
  useSignumAccountPrefix,
  useSignumAliasResolver,
  useSignumAssetMetadata,
  useTempleClient
} from 'lib/temple/front';
import { useFilteredContacts } from 'lib/temple/front/use-filtered-contacts.hook';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';
import useSafeState from 'lib/ui/useSafeState';

import { toLocalFixed } from '../../../lib/i18n/numbers';
import { useAppEnv } from '../../env';
import ContactsDropdown from './ContactsDropdown';
import FeeInput from './FeeInput';
import FilledContact from './FilledContact';
import SendErrorAlert from './SendErrorAlert';

interface FormData {
  to: string;
  amount: string;
  fee: string;
}

type FormProps = {
  // assetSlug: string;
  setOperation: Dispatch<any>;
  onAddContactRequested: (address: string) => void;
};

const MinimumFee = Amount.fromPlanck(FeeQuantPlanck).getSigna();

export const SendForm: FC<FormProps> = ({ setOperation, onAddContactRequested }) => {
  const { registerBackHandler } = useAppEnv();
  const assetMetadata = useSignumAssetMetadata();
  const { resolveAliasToAccountId } = useSignumAliasResolver();
  const formAnalytics = useFormAnalytics('SendForm');
  const { allContacts } = useFilteredContacts();
  const acc = useAccount();
  const signum = useSignum();
  const prefix = useSignumAccountPrefix();
  const client = useTempleClient();

  const assetSymbol = assetMetadata.symbol;
  const accountPkh = acc.publicKeyHash;
  const { data: balanceData } = useBalance(assetMetadata.name, accountPkh);
  const balance = balanceData && Amount.fromSigna(balanceData.toNumber());

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation, reset } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      fee: MinimumFee
    }
  });

  const toValue = watch('to');
  const amountValue = watch('amount');
  const feeValue = watch('fee');

  const toFieldRef = useRef<HTMLTextAreaElement>(null);
  const amountFieldRef = useRef<HTMLInputElement>(null);

  const toFilledWithAddress = useMemo(() => Boolean(toValue && isSignumAddress(toValue)), [toValue]);

  const toFilledWithAlias = useMemo(() => toValue && !isSignumAddress(toValue), [toValue]);

  const addressResolver = useCallback(
    async (_k: string, address: string) => resolveAliasToAccountId(address),
    [resolveAliasToAccountId]
  );
  const { data: resolvedAddress } = useSWR(['resolveAlias', toValue], addressResolver, {
    shouldRetryOnError: false,
    revalidateOnFocus: false
  });

  const toFilled = useMemo(
    () => (resolvedAddress ? toFilledWithAlias : toFilledWithAddress),
    [toFilledWithAddress, toFilledWithAlias, resolvedAddress]
  );

  const toResolved = useMemo(() => {
    if (resolvedAddress) {
      return resolvedAddress;
    }
    try {
      return Address.create(toValue).getNumericId();
    } catch (e) {
      return '';
    }
  }, [resolvedAddress, toValue]);

  const filledContact = useMemo(
    () => (toResolved && allContacts.find(c => c.address === toResolved)) || null,
    [allContacts, toResolved]
  );

  const cleanToField = useCallback(() => {
    setValue('to', '');
    triggerValidation('to');
  }, [setValue, triggerValidation]);

  useLayoutEffect(() => {
    if (toFilled) {
      toFieldRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [toFilled]);

  useLayoutEffect(() => {
    if (!toFilled) return;

    return registerBackHandler(() => {
      cleanToField();
      window.scrollTo(0, 0);
    });
  }, [toFilled, registerBackHandler, cleanToField]);

  const maxAmount = useMemo(() => {
    if (!feeValue) return;
    return balance ? balance.subtract(Amount.fromSigna(feeValue)) : Amount.Zero();
  }, [balance, feeValue]);

  const totalAmount = useMemo(() => {
    if (!amountValue) return;
    return Amount.fromSigna(amountValue).add(Amount.fromSigna(feeValue || MinimumFee));
  }, [amountValue, feeValue]);

  const validateAmount = useCallback(
    (v?: number) => {
      if (v === undefined) return t('required');
      if (v < 0) return t('amountMustBePositive');
      if (!maxAmount) return true;
      try {
        return Amount.fromSigna(v).lessOrEqual(maxAmount)
          ? true
          : t('maximalAmount', toLocalFixed(maxAmount.getSigna()));
      } catch (e) {
        return t('error'); // WHAT MESSAGE?
      }
    },
    [maxAmount]
  );

  const maxAmountStr = maxAmount?.toString();
  useEffect(() => {
    if (formState.dirtyFields.has('amount')) {
      triggerValidation('amount');
    }
  }, [formState.dirtyFields, triggerValidation, maxAmountStr]);

  const handleSetMaxAmount = useCallback(() => {
    if (maxAmount) {
      setValue('amount', maxAmount.getSigna());
      triggerValidation('amount');
    }
  }, [setValue, maxAmount, triggerValidation]);

  const handleAmountFieldFocus = useCallback(evt => {
    evt.preventDefault();
    amountFieldRef.current?.focus({ preventScroll: true });
  }, []);

  const [submitError, setSubmitError] = useSafeState<any>(null);

  const validateRecipient = useCallback(
    async (value: any) => {
      if (!value?.length || value.length < 0) {
        return false;
      }
      let address = value;
      if (!isSignumAddress(address)) {
        address = await resolveAliasToAccountId(address);
      }
      return isSignumAddress(address) ? true : t('invalidAddressOrDomain');
    },
    [resolveAliasToAccountId]
  );

  const onSubmit = useCallback(
    async ({ amount, fee }: FormData) => {
      if (formState.isSubmitting) return;
      setSubmitError(null);
      setOperation(null);
      try {
        const { signingKey, publicKey } = await client.getSignumTransactionKeyPair(acc.publicKeyHash);
        const { transaction, fullHash } = (await signum.transaction.sendAmountToSingleRecipient({
          amountPlanck: Amount.fromSigna(amount).getPlanck(),
          feePlanck: Amount.fromSigna(fee).getPlanck(),
          recipientId: toResolved,
          senderPrivateKey: signingKey,
          senderPublicKey: publicKey
        })) as TransactionId;
        setOperation({
          txId: transaction,
          hash: fullHash
        });
        reset({ to: '', fee: '', amount: '0' });

        formAnalytics.trackSubmitSuccess();
      } catch (err) {
        formAnalytics.trackSubmitFail();
        if (err.message === 'Declined') {
          return;
        }
        await withErrorHumanDelay(err, () => {
          setSubmitError(err);
        });
      }
    },
    [
      client,
      signum.transaction,
      acc,
      formState.isSubmitting,
      setSubmitError,
      setOperation,
      reset,
      toResolved,
      formAnalytics
    ]
  );

  const handleAccountSelect = useCallback(
    (recipient: string) => {
      setValue('to', recipient);
      triggerValidation('to');
    },
    [setValue, triggerValidation]
  );

  const restFormDisplayed = Boolean(toFilled) && Boolean(amountValue);

  const [toFieldFocused, setToFieldFocused] = useState(false);

  const handleToFieldFocus = useCallback(() => {
    toFieldRef.current?.focus();
    setToFieldFocused(true);
  }, [setToFieldFocused]);

  const handleToFieldBlur = useCallback(() => {
    setToFieldFocused(false);
  }, [setToFieldFocused]);

  const allContactsWithoutCurrent = useMemo(
    () => allContacts.filter(c => c.address !== accountPkh),
    [allContacts, accountPkh]
  );

  return (
    <form style={{ minHeight: '24rem' }} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="to"
        as={
          <NoSpaceField
            ref={toFieldRef}
            onFocus={handleToFieldFocus}
            dropdownInner={
              allContactsWithoutCurrent.length > 0 && (
                <ContactsDropdown
                  contacts={allContactsWithoutCurrent}
                  opened={!toFilled ? toFieldFocused : false}
                  onSelect={handleAccountSelect}
                  searchTerm={toValue}
                />
              )
            }
          />
        }
        control={control}
        rules={{
          validate: validateRecipient
        }}
        onChange={([v]) => v}
        onBlur={handleToFieldBlur}
        cleanable={Boolean(toValue)}
        onClean={cleanToField}
        id="send-to"
        label={t('recipient')}
        labelDescription={
          filledContact ? (
            <FilledContact contact={filledContact} assetSymbol={assetSymbol} />
          ) : (
            <T id="tokensRecepientInputDescriptionWithDomain" substitutions={assetSymbol} />
          )
        }
        placeholder={t('recipientInputPlaceholderWithDomain')}
        errorCaption={!toFieldFocused ? errors.to?.message : null}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4 mt-3"
      />

      {toResolved && (
        <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
          <span className="mr-1 whitespace-no-wrap">{t('resolvedAddress')}:</span>
          <span className="font-normal">{Address.create(toResolved, prefix).getReedSolomonAddress()}</span>
        </div>
      )}

      {toFilled && !filledContact && (
        <div className={classNames('mb-4 -mt-3', 'text-xs font-light text-gray-600', 'flex flex-wrap items-center')}>
          <button
            type="button"
            className="text-xs font-light text-gray-600 underline"
            onClick={() => onAddContactRequested(toResolved)}
          >
            <T id="addThisAddressToContacts" />
          </button>
        </div>
      )}

      <Controller
        name="amount"
        as={<AssetField ref={amountFieldRef} onFocus={handleAmountFieldFocus} />}
        control={control}
        rules={{
          validate: validateAmount
        }}
        onChange={([v]) => v}
        onFocus={() => amountFieldRef.current?.focus()}
        id="send-amount"
        assetSymbol={assetSymbol}
        assetDecimals={assetMetadata?.decimals ?? 0}
        label={t('amount')}
        labelDescription={
          restFormDisplayed &&
          maxAmount && (
            <>
              <T id="availableToSend" />{' '}
              <button type="button" className={classNames('underline')}>
                <span className={classNames('text-xs leading-none')}>
                  <Money onClick={handleSetMaxAmount}>{maxAmount.getSigna()}</Money>{' '}
                  <span style={{ fontSize: '0.75em' }}>{assetSymbol}</span>
                </span>
              </button>
            </>
          )
        }
        placeholder={t('amountPlaceholder')}
        errorCaption={restFormDisplayed && errors.amount?.message}
        autoFocus={Boolean(maxAmount)}
      />
      {totalAmount && (
        <div className={'flex flex-row items-center justify-start text-gray-600 mb-4'}>
          <T id="totalAmount" />
          {': '}
          <span className={'text-xs leading-none ml-1'}>
            <Money>{totalAmount.getSigna()}</Money> <span style={{ fontSize: '0.75em' }}>{assetSymbol}</span>
          </span>
        </div>
      )}
      {restFormDisplayed ? (
        <>
          {(() => {
            if (Boolean(submitError)) {
              return <SendErrorAlert type="submit" error={submitError} />;
            } else if (toResolved === accountPkh) {
              return (
                <Alert
                  type="warn"
                  title={t('attentionExclamation')}
                  description={<T id="tryingToTransferToYourself" />}
                  className="mt-6 mb-4"
                />
              );
            }
            return null;
          })()}

          <FeeInput
            name="fee"
            control={control}
            assetSymbol={assetSymbol}
            onChange={([v]) => v}
            error={errors.fee}
            id="send-fee"
          />

          {totalAmount && errors.amount === undefined && (
            <div className={'flex flex-row items-center justify-center'}>
              <T id="send">
                {message => <FormSubmitButton loading={formState.isSubmitting}>{message}</FormSubmitButton>}
              </T>
            </div>
          )}
        </>
      ) : null}
    </form>
  );
};
