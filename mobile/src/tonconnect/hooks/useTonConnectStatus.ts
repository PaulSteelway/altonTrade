import {useEffect, useRef} from 'react';

import type {TonConnect} from '@tonconnect/sdk';

import {useTonConnectContext} from '../context/TonConnectContext';

/**
 * Подписка на смену статуса кошелька (аналог прямого onStatusChange на TonConnect).
 * Колбэк не должен сильно меняться без useCallback — иначе переподписка на каждом рендере.
 */
export function useTonConnectStatus(
  listener: (wallet: TonConnect['wallet']) => void,
): void {
  const {walletService} = useTonConnectContext();
  const ref = useRef(listener);
  ref.current = listener;

  useEffect(() => {
    return walletService.onStatusChange(w => {
      ref.current(w);
    });
  }, [walletService]);
}
