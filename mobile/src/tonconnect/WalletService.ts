import {WalletAlreadyConnectedError} from '@tonconnect/sdk';
import type {TonConnect, WalletInfoRemote} from '@tonconnect/sdk';

import {getTonConnector} from './connector';
import {openTonConnectWalletLink} from './utils/openWalletLink';

export function isWalletAlreadyConnectedError(err: unknown): boolean {
  if (err instanceof WalletAlreadyConnectedError) {
    return true;
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    String((err as {constructor?: {name?: string}}).constructor?.name || '') ===
      'WalletAlreadyConnectedError'
  ) {
    return true;
  }
  return false;
}

/**
 * Абстракция над TonConnect: подключение, восстановление, подписки.
 * Для sendTransaction / signData позже: используйте getTonConnect().
 */
export class WalletService {
  constructor(private readonly client: TonConnect = getTonConnector()) {}

  getTonConnect(): TonConnect {
    return this.client;
  }

  get connected(): boolean {
    return this.client.connected;
  }

  get wallet(): TonConnect['wallet'] {
    return this.client.wallet;
  }

  onStatusChange(
    listener: Parameters<TonConnect['onStatusChange']>[0],
  ): ReturnType<TonConnect['onStatusChange']> {
    return this.client.onStatusChange(listener);
  }

  async restore(): Promise<void> {
    await this.client.restoreConnection().catch(() => undefined);
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  async getWallets() {
    return this.client.getWallets();
  }

  /**
   * Создаёт сессию Ton Connect и возвращает universal link (HTTPS или tc://) —
   * для QR и для кнопки «Открыть в кошельке». Вызывать один раз на попытку подключения.
   */
  createRemoteConnectLink(remote: WalletInfoRemote): string {
    if (this.client.connected) {
      throw new WalletAlreadyConnectedError();
    }
    const universalLink = (remote.universalLink || '').trim();
    const bridgeUrl = (remote.bridgeUrl || '').trim();
    if (!universalLink || !bridgeUrl) {
      throw new Error('Wallet is missing universal link or bridge URL');
    }
    return this.client.connect({
      universalLink,
      bridgeUrl,
    });
  }

  /** Открывает уже полученный universal link в кошельке (этот же телефон). */
  async openRemoteConnectLink(
    link: string,
    remote: WalletInfoRemote,
  ): Promise<void> {
    await openTonConnectWalletLink(link, remote);
  }

  /**
   * Подключение к выбранному remote-кошельку: создать ссылку и сразу открыть приложение кошелька.
   */
  async connectRemote(remote: WalletInfoRemote): Promise<void> {
    if (this.client.connected) {
      return;
    }
    try {
      const link = this.createRemoteConnectLink(remote);
      await this.openRemoteConnectLink(link, remote);
    } catch (e) {
      if (isWalletAlreadyConnectedError(e)) {
        return;
      }
      throw e;
    }
  }

  pauseConnection(): void {
    this.client.pauseConnection();
  }

  unPauseConnection(): Promise<void> {
    return this.client.unPauseConnection();
  }
}

export const walletService = new WalletService();
