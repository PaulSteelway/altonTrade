import {toUserFriendlyAddress} from '@tonconnect/sdk';
import type {TonConnect} from '@tonconnect/sdk';

export type TonWalletAccount = {
  address?: string;
  publicKey?: string;
};

export function getTonWalletAccount(wallet: unknown): TonWalletAccount | null {
  if (!wallet || typeof wallet !== 'object') {
    return null;
  }
  const account = (wallet as {account?: TonWalletAccount}).account;
  if (!account || typeof account !== 'object') {
    return null;
  }
  return {
    address: account.address,
    publicKey: account.publicKey,
  };
}

/** Короткая подпись для UI (сырой или friendly адрес). */
export function shortTonAddress(address?: string | null): string {
  if (!address) {
    return '';
  }
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

/** TEP-123 user-friendly bounceable mainnet address для отображения и API. */
export function getUserFriendlyTonAddress(
  wallet: TonConnect['wallet'],
): string {
  if (!wallet?.account?.address) {
    return '';
  }
  try {
    return toUserFriendlyAddress(wallet.account.address);
  } catch {
    return wallet.account.address;
  }
}
