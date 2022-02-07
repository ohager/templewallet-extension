import { Transaction } from '@signumjs/core';
import { Amount } from '@signumjs/util';

interface AmountDiffs {
  diff: string;
}

export function parseAmountDiffs(tx: Transaction, accountId: string): AmountDiffs[] {
  // TODO: we do not need stacked diffs here
  const amount = Amount.fromPlanck(tx.amountNQT || '0');
  const result = {
    diff: Amount.Zero().getSigna()
  };
  if (tx.sender === accountId && tx.recipient !== accountId) {
    result.diff = amount.multiply(-1).getSigna();
  } else if (tx.recipient === accountId) {
    result.diff = amount.getSigna();
  }
  return [result];
}
