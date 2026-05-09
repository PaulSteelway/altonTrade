import type {TonConnect, WalletInfoRemote} from '@tonconnect/sdk';
import type {WalletService} from '../WalletService';

export type TonWalletState = TonConnect['wallet'];

export type TonConnectConnectOptions = {
  /** Подключить конкретный кошелёк без показа общей модалки */
  wallet?: WalletInfoRemote;
};

export type TonConnectContextValue = {
  wallet: TonWalletState;
  /** User-friendly bounceable address (TEP-123), пустая строка если нет кошелька */
  address: string;
  connected: boolean;
  restoring: boolean;
  /** restoreConnection завершился (успех или ошибка) */
  ready: boolean;
  /** Открыть модалку выбора кошелька или подключить переданный wallet */
  connect: (options?: TonConnectConnectOptions) => void | Promise<void>;
  disconnect: () => Promise<void>;
  /** Модалка выбора открыта (глобально из провайдера) */
  walletPickerVisible: boolean;
  setWalletPickerVisible: (v: boolean) => void;
  /** Идёт открытие кошелька / загрузка списка в модалке */
  pickerBusy: boolean;
  setPickerBusy: (v: boolean) => void;
  walletService: WalletService;
};
