import type {WalletInfoRemote} from '@tonconnect/sdk';

import {walletService} from '../tonconnect/WalletService';

/**
 * @deprecated Предпочтительно walletService.connectRemote() из `src/tonconnect`.
 */
export async function connectToRemoteWallet(
  remote: WalletInfoRemote,
): Promise<void> {
  return walletService.connectRemote(remote);
}
