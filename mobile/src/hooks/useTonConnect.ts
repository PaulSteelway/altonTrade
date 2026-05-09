import {useMemo} from 'react';

import {useTonConnectContext} from '../tonconnect/context/TonConnectContext';
import {getTonWalletAccount, shortTonAddress} from '../tonconnect/utils/account';

/**
 * @deprecated Используйте useTonWallet из `src/tonconnect`. Оставлено для совместимости с HomeScreen / WalletScreen.
 */
export function useTonConnect() {
  const {
    wallet,
    address: friendlyAddress,
    connected,
    disconnect,
    restoring,
    pickerBusy,
    connect,
  } = useTonConnectContext();

  const walletAccount = useMemo(() => getTonWalletAccount(wallet), [wallet]);
  const shortAddress = useMemo(
    () => shortTonAddress(friendlyAddress),
    [friendlyAddress],
  );

  return {
    walletAccount,
    shortAddress,
    /** User-friendly bounceable TON address (для Toncenter NFT и т.п.). */
    friendlyAddress,
    restoring,
    connected,
    disconnect,
    pickerBusy,
    connect,
  };
}
