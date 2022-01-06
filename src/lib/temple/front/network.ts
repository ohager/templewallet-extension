import { AddressPrefix } from '@signumjs/core';

import { useNetwork } from './ready';

export function useSignumAccountPrefix() {
  const network = useNetwork();
  return (network.type === 'test' ? AddressPrefix.TestNet : AddressPrefix.MainNet).toString();
}
