import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AppState, Linking, type AppStateStatus} from 'react-native';

import {TonConnectReactContext} from '../context/TonConnectContext';
import {walletService} from '../WalletService';
import {getUserFriendlyTonAddress} from '../utils/account';
import type {
  TonConnectConnectOptions,
  TonConnectContextValue,
} from '../types/context';
import {TonConnectWalletModal} from '../../components/TonConnectWalletModal';

export function TonConnectProvider({children}: {children: React.ReactNode}) {
  const client = walletService.getTonConnect();
  const [wallet, setWallet] = useState(client.wallet);
  const [restoring, setRestoring] = useState(true);
  const [ready, setReady] = useState(false);
  const [walletPickerVisible, setWalletPickerVisible] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const address = useMemo(() => getUserFriendlyTonAddress(wallet), [wallet]);
  const connected = !!wallet?.account?.address;

  useEffect(() => {
    let mounted = true;
    walletService
      .restore()
      .finally(() => {
        if (mounted) {
          setWallet(walletService.getTonConnect().wallet);
          setRestoring(false);
          setReady(true);
        }
      });

    const unsub = walletService.onStatusChange(next => {
      setWallet(next);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  /** Входящие ссылки (returnUrl из манифеста, tc:// и т.д.) — резерв под расширения; мост обычно достаточен. */
  useEffect(() => {
    const handleUrl = (event: {url: string}) => {
      if (__DEV__) {
        console.log('[TonConnect] incoming url:', event.url);
      }
    };

    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl({url});
      }
    });

    return () => sub.remove();
  }, []);

  /**
   * После долгого фона iOS может «заморозить» JS; unPause восстанавливает SSE к мосту.
   */
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        walletService.unPauseConnection().catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, []);

  const disconnect = useCallback(async () => {
    await walletService.disconnect();
  }, []);

  const connect = useCallback(async (options?: TonConnectConnectOptions) => {
    if (options?.wallet) {
      setPickerBusy(true);
      try {
        await walletService.connectRemote(options.wallet);
      } finally {
        setPickerBusy(false);
      }
      setWalletPickerVisible(false);
      return;
    }
    setWalletPickerVisible(true);
  }, []);

  const value = useMemo<TonConnectContextValue>(
    () => ({
      wallet,
      address,
      connected,
      restoring,
      ready,
      connect,
      disconnect,
      walletPickerVisible,
      setWalletPickerVisible,
      pickerBusy,
      setPickerBusy,
      walletService,
    }),
    [
      wallet,
      address,
      connected,
      restoring,
      ready,
      connect,
      disconnect,
      walletPickerVisible,
      pickerBusy,
    ],
  );

  return (
    <TonConnectReactContext.Provider value={value}>
      {children}
      <TonConnectWalletModal
        visible={walletPickerVisible}
        onClose={() => setWalletPickerVisible(false)}
        onBusyChange={setPickerBusy}
      />
    </TonConnectReactContext.Provider>
  );
}
