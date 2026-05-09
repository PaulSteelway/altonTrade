import {useMemo} from 'react';

import {useTonConnectContext} from '../context/TonConnectContext';
import type {TonConnectConnectOptions} from '../types/context';

export type UseTonWalletResult = {
  wallet: ReturnType<typeof useTonConnectContext>['wallet'];
  address: string;
  connected: boolean;
  connect: (options?: TonConnectConnectOptions) => void | Promise<void>;
  disconnect: () => Promise<void>;
  /** Пока выполняется restoreConnection при старте */
  restoring: boolean;
  /** После завершения restore (для гейтов UI) */
  ready: boolean;
  /** Состояние модалки / открытия кошелька */
  pickerBusy: boolean;
};

/**
 * Основной хук: адрес в user-friendly формате, connect открывает модалку выбора кошелька.
 */
export function useTonWallet(): UseTonWalletResult {
  const {
    wallet,
    address,
    connected,
    connect,
    disconnect,
    restoring,
    ready,
    pickerBusy,
  } = useTonConnectContext();

  return useMemo(
    () => ({
      wallet,
      address,
      connected,
      connect,
      disconnect,
      restoring,
      ready,
      pickerBusy,
    }),
    [
      wallet,
      address,
      connected,
      connect,
      disconnect,
      restoring,
      ready,
      pickerBusy,
    ],
  );
}
