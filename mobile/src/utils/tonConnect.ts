/**
 * @deprecated Импортируйте из `src/tonconnect` (getTonConnector, walletService).
 */
import {getTonConnector} from '../tonconnect/connector';
export {getTonWalletAccount, shortTonAddress} from '../tonconnect/utils/account';
export type {TonWalletAccount} from '../tonconnect/utils/account';

export const tonConnect = getTonConnector();
