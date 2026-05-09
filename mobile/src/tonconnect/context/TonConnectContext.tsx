import {createContext, useContext} from 'react';

import type {TonConnectContextValue} from '../types/context';

export const TonConnectReactContext =
  createContext<TonConnectContextValue | null>(null);

export function useTonConnectContext(): TonConnectContextValue {
  const ctx = useContext(TonConnectReactContext);
  if (!ctx) {
    throw new Error(
      'useTonConnectContext must be used within TonConnectProvider',
    );
  }
  return ctx;
}
