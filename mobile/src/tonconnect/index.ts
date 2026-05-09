export {TonConnectProvider} from './provider/TonConnectProvider';
export {useTonConnectContext} from './context/TonConnectContext';
export {useTonWallet} from './hooks/useTonWallet';
export type {UseTonWalletResult} from './hooks/useTonWallet';
export {useTonConnectStatus} from './hooks/useTonConnectStatus';
export {
  walletService,
  WalletService,
  isWalletAlreadyConnectedError,
} from './WalletService';
export {getTonConnector} from './connector';
export {createTonConnectAsyncStorage} from './storage';
export {
  listRemoteWalletsForPicker,
  listFeaturedRemoteWallets,
  isTelegramMiniAppUniversalLink,
} from './wallets';
export {openTonConnectWalletLink} from './utils/openWalletLink';
export {
  getTonWalletAccount,
  shortTonAddress,
  getUserFriendlyTonAddress,
} from './utils/account';
export type {TonWalletAccount} from './utils/account';
export {
  TON_CONNECT_RETURN_SCHEME,
  TON_CONNECT_RETURN_HOST,
  TON_CONNECT_RETURN_URL,
} from './deeplink';
export type {
  TonConnectContextValue,
  TonConnectConnectOptions,
  TonWalletState,
} from './types/context';
