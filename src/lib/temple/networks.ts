import { getMessage } from 'lib/i18n';
import { TempleChainId, TempleNetwork } from 'lib/temple/types';

export const KNOWN_LAMBDA_CONTRACTS = new Map([
  [TempleChainId.Mainnet, 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE'],
  [TempleChainId.Granadanet, 'KT1VhtTGAyh7AVVwyH2ExNhaXvQq2rAJ6DNs'],
  [TempleChainId.Hangzhounet, 'KT19ewhnhaCcCuoF1Ly2pxXAFRiF3UtgaY9U'],
  [TempleChainId.Idiazabalnet, 'KT1VCXUAQC6bky8LKjSaTvM9wwTXe9YQ7N4s']
]);

export const NETWORK_IDS = new Map<string, string>([
  [TempleChainId.Mainnet, 'mainnet'],
  [TempleChainId.Granadanet, 'granadanet'],
  [TempleChainId.Hangzhounet, 'hangzhounet'],
  [TempleChainId.Idiazabalnet, 'idiazabalnet']
]);

export const SIGNUM_NETWORKS: TempleNetwork[] = [
  {
    id: 'signum-europe',
    name: 'Signum Network Europe',
    description: 'Reliable Node from Europe',
    type: 'main',
    rpcBaseURL: 'https://europe.signum.network',
    color: '#00309a',
    disabled: false
  },
  {
    id: 'signum-brazil',
    name: 'Signum Network Latin America',
    description: 'Reliable Node from Latin America',
    type: 'main',
    rpcBaseURL: 'https://brazil.signum.network',
    color: '#009c37',
    disabled: false
  },
  {
    id: 'signum-canada',
    name: 'Signum Network Canada',
    description: 'Reliable Node from Canada',
    type: 'main',
    rpcBaseURL: 'https://canada.signum.network',
    color: '#d62718',
    disabled: false
  },
  {
    id: 'signum-australia',
    name: 'Signum Network Australia',
    description: 'Reliable Node from Australia',
    type: 'main',
    rpcBaseURL: 'https://australia.signum.network',
    color: '#001b69',
    disabled: false
  },
  {
    id: 'signum-testnet-europe',
    name: 'Signum Testnet Europe ',
    description: 'Public Testnet node Europe',
    type: 'test',
    rpcBaseURL: 'https://europe3.testnet.signum.network/',
    color: '#E8F3FF',
    disabled: false
  },
  {
    id: 'signum-testnet-local',
    name: 'localhost:6876',
    description: 'Local Testnet',
    type: 'test',
    rpcBaseURL: 'http://localhost:6876',
    color: '#EAF0F6',
    disabled: false
  }
];

export const NETWORKS: TempleNetwork[] = [
  {
    id: 'mainnet',
    name: getMessage('tezosMainnet'),
    nameI18nKey: 'tezosMainnet',
    description: 'Tezos mainnet',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://mainnet-node.madfish.solutions',
    color: '#83b300',
    disabled: false
  },
  {
    id: 'giganode-mainnet',
    name: 'Mainnet @giganode.io',
    description: 'Highly available Tezos Mainnet nodes operated by Giganode',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://mainnet-tezos.giganode.io',
    color: '#059669',
    disabled: false
  },
  {
    id: 'smartpy-mainnet',
    name: 'Mainnet @smartpy.io',
    description: 'SmartPy Mainnet',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://mainnet.smartpy.io',
    color: '#34D399',
    disabled: false
  },
  {
    id: 'tzbeta-mainnet',
    name: 'Mainnet @tzbeta.net',
    description: 'Highly available Tezos Mainnet nodes operated by Blockscale',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://rpc.tzbeta.net',
    color: '#10B981',
    disabled: false
  },
  {
    id: 'tezie-mainnet',
    name: 'Mainnet @api.tez.ie',
    description: 'Highly available Tezos Mainnet nodes operated by ECAD Labs',
    lambdaContract: 'KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE',
    type: 'main',
    rpcBaseURL: 'https://mainnet.api.tez.ie',
    color: '#047857',
    disabled: false
  },
  {
    id: 'granadanet',
    name: 'Granada Testnet',
    description: 'Granada testnet',
    lambdaContract: 'KT1VhtTGAyh7AVVwyH2ExNhaXvQq2rAJ6DNs',
    type: 'test',
    rpcBaseURL: 'https://granadanet.smartpy.io',
    color: '#667eea',
    disabled: false
  },
  {
    id: 'hangzhounet',
    name: 'Hangzhounet Testnet',
    description: 'Hangzhounet testnet',
    lambdaContract: 'KT19ewhnhaCcCuoF1Ly2pxXAFRiF3UtgaY9U',
    type: 'test',
    rpcBaseURL: 'https://hangzhounet.smartpy.io',
    color: '#b83280',
    disabled: false
  },
  {
    id: 'idiazabalnet',
    name: 'Idiazabalnet Testnet',
    description: 'Idiazabalnet testnet',
    lambdaContract: 'KT1VCXUAQC6bky8LKjSaTvM9wwTXe9YQ7N4s',
    type: 'test',
    rpcBaseURL: 'https://rpc.tzkt.io/idiazabalnet',
    color: '#131380',
    disabled: false
  },
  {
    id: 'sandbox',
    name: 'localhost:8732',
    description: 'Local Sandbox',
    type: 'test',
    rpcBaseURL: 'http://localhost:8732',
    color: '#e9e1cc',
    disabled: false
  },
  {
    id: 'signum-testnet-local',
    name: 'localhost:6876',
    description: 'Local Testnet',
    type: 'test',
    rpcBaseURL: 'http://localhost:6876',
    color: '#EAF0F6',
    disabled: false
  },
  // Hidden
  {
    id: 'tzbeta-rpczero',
    name: 'Edo Testnet @rpczero.tzbeta.net',
    description: 'Highly available Edo Testnet nodes operated by Blockscale',
    type: 'test',
    rpcBaseURL: 'https://rpczero.tzbeta.net',
    color: '#FBBF24',
    disabled: false,
    hidden: true
  }
];
