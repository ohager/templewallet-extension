import {
  Api,
  getRecipientAmountsFromMultiOutPayment,
  Transaction,
  TransactionArbitrarySubtype,
  TransactionPaymentSubtype,
  TransactionType
} from '@signumjs/core';
import BigNumber from 'bignumber.js';

export type ParsedTransactionExpense = {
  tokenAddress?: string;
  tokenId?: string;
  amount: BigNumber;
  to: string;
};

export interface ParsedTransactionType {
  i18nKey: string;
  textIcon: string;
}

export type ParsedTransaction = {
  amount?: BigNumber;
  delegate?: string;
  type: ParsedTransactionType;
  isEntrypointInteraction: boolean;
  contractAddress?: string;
  expenses: ParsedTransactionExpense[];
  fee: BigNumber;
};

async function isContractInteraction(signumApi: Api, recipientId: string): Promise<boolean> {
  try {
    await signumApi.contract.getContract(recipientId);
    return true;
  } catch (e) {
    return false;
  }
}

/*
 * {"type":0,"subtype":0,"timestamp":234874675,"deadline":1440,"senderPublicKey":"c213e4144ba84af94aae2458308fae1f0cb083870c8f3012eea58147f3b09d4a","recipient":"6502115112683865257","recipientRS":"TS-K37B-9V85-FB95-793HN","amountNQT":"100000000","feeNQT":"735000","sender":"2402520554221019656","senderRS":"TS-QAJA-QW5Y-SWVP-4RVP4","height":2147483647,"version":1,"ecBlockId":"9556561047696549169","ecBlockHeight":384189,"verify":false,"requestProcessingTime":0}
 */

export async function parseSignumTransaction(
  transaction: string,
  accountAddress: string,
  signumApi: Api
): Promise<ParsedTransaction | null> {
  try {
    const tx = JSON.parse(transaction) as Transaction;
    const contractInteraction = await isContractInteraction(signumApi, tx.recipient || '');
    return {
      amount: new BigNumber(tx.amountNQT || 0),
      fee: new BigNumber(tx.feeNQT!),
      expenses: parseTransactionExpenses(tx, accountAddress),
      contractAddress: contractInteraction ? tx.recipient : undefined,
      delegate: undefined,
      isEntrypointInteraction: contractInteraction,
      type: parseTransactionType(tx)
    };
  } catch (e) {
    return Promise.resolve(null);
  }
}

function parseTransactionType(tx: Transaction): ParsedTransactionType {
  switch (tx.type) {
    case TransactionType.Payment:
    case TransactionType.Asset:
      return {
        i18nKey: 'transfer',
        textIcon: '➡'
      };
    case TransactionType.AT:
      return {
        i18nKey: 'contract',
        textIcon: '🤖'
      };
    case TransactionType.Arbitrary:
      return {
        i18nKey: 'messageTo',
        textIcon: '✉'
      };
    default:
      return {
        i18nKey: 'transaction',
        textIcon: '⚙'
      };
  }
}

function parseTransactionExpenses(tx: Transaction, senderAddress: string): ParsedTransactionExpense[] {
  switch (tx.type) {
    case TransactionType.Payment:
      return parsePaymentExpenses(tx);
    case TransactionType.Asset:
      return parseAssetExpenses(tx, senderAddress);
    case TransactionType.AT:
      return parseContractExpenses(tx);
    case TransactionType.Arbitrary:
      return parseArbitraryExpenses(tx);
    default:
      return [];
  }
}

function parseArbitraryExpenses(tx: Transaction): ParsedTransactionExpense[] {
  return [
    {
      to: tx.recipient as string,
      amount: new BigNumber(0)
    }
  ];
}

function parseContractExpenses(tx: Transaction): ParsedTransactionExpense[] {
  return [
    {
      to: tx.recipient as string,
      amount: new BigNumber(tx?.amountNQT || 0)
    }
  ];
}

function parseAssetExpenses(tx: Transaction, senderAddress: string): ParsedTransactionExpense[] {
  return [];
}

function parsePaymentExpenses(tx: Transaction): ParsedTransactionExpense[] {
  switch (tx.subtype) {
    case TransactionPaymentSubtype.MultiOut:
    case TransactionPaymentSubtype.MultiOutSameAmount: {
      const recipientAmounts = getRecipientAmountsFromMultiOutPayment(tx);
      return recipientAmounts.map(({ recipient, amountNQT }) => ({
        to: recipient,
        amount: new BigNumber(amountNQT)
      }));
    }
    default:
      return [
        {
          to: tx.recipient as string,
          amount: new BigNumber(tx?.amountNQT || 0)
        }
      ];
  }
}
