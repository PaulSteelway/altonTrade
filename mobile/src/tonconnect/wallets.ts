import {Platform} from 'react-native';
import {
  isWalletInfoRemote,
  type WalletInfo,
  type WalletInfoRemote,
} from '@tonconnect/sdk';

/** tg: / t.me universal links — в standalone RN обычно открывают Telegram, не WebView кошелька. */
export function isTelegramMiniAppUniversalLink(link: string): boolean {
  try {
    const u = new URL(link.trim());
    if (u.protocol === 'tg:') {
      return true;
    }
    return u.hostname === 't.me';
  } catch {
    return false;
  }
}

function tonkeeperRank(w: WalletInfoRemote): number {
  const name = `${w.name}`.toLowerCase();
  const app = `${w.appName}`.toLowerCase();
  if (name.includes('tonkeeper') || app.includes('tonkeeper')) {
    return 0;
  }
  return 1;
}

function myTonWalletRank(w: WalletInfoRemote): number {
  const name = `${w.name}`.toLowerCase();
  const app = `${w.appName}`.toLowerCase();
  if (name.includes('mytonwallet') || app.includes('mytonwallet')) {
    return 0;
  }
  return 1;
}

function walletPickerSortKey(w: WalletInfoRemote): number {
  const tk = tonkeeperRank(w);
  const mw = myTonWalletRank(w);
  return Math.min(tk, mw);
}

/**
 * Список remote-кошельков для модалки (аналог Ton Connect UI).
 * Сначала не-t.me ссылки, затем Telegram / tg; Tonkeeper и MyTonWallet выше в группе.
 */
export function listRemoteWalletsForPicker(
  wallets: WalletInfo[],
): WalletInfoRemote[] {
  let remotes = wallets.filter(isWalletInfoRemote).filter(w => {
    const bridgeUrl =
      typeof w.bridgeUrl === 'string' ? w.bridgeUrl.trim() : '';
    const universalLink =
      typeof w.universalLink === 'string' ? w.universalLink.trim() : '';
    return bridgeUrl.length > 0 && universalLink.length > 0;
  });

  const mobilePlat = Platform.OS === 'ios' ? 'ios' : 'android';
  const nativeCapable = remotes.filter(
    w => Array.isArray(w.platforms) && w.platforms.includes(mobilePlat),
  );
  if (nativeCapable.length > 0) {
    remotes = nativeCapable;
  }

  const nonTg = remotes.filter(
    w => !isTelegramMiniAppUniversalLink(w.universalLink),
  );
  const tg = remotes.filter(w =>
    isTelegramMiniAppUniversalLink(w.universalLink),
  );

  const sortGroup = (arr: WalletInfoRemote[]) =>
    [...arr].sort((a, b) => {
      const ra = walletPickerSortKey(a);
      const rb = walletPickerSortKey(b);
      if (ra !== rb) {
        return ra - rb;
      }
      return a.name.localeCompare(b.name, undefined, {sensitivity: 'base'});
    });

  return [...sortGroup(nonTg), ...sortGroup(tg)];
}

/**
 * Подмножество «рекомендуемых» кошельков (Tonkeeper, MyTonWallet, при наличии — Telegram Wallet).
 * Для UI «быстрый выбор»; полный список по-прежнему через listRemoteWalletsForPicker.
 */
export function listFeaturedRemoteWallets(
  wallets: WalletInfo[],
): WalletInfoRemote[] {
  const all = listRemoteWalletsForPicker(wallets);
  return all.filter(w => {
    const n = `${w.name}`.toLowerCase();
    const a = `${w.appName}`.toLowerCase();
    const isTk = n.includes('tonkeeper') || a.includes('tonkeeper');
    const isMw = n.includes('mytonwallet') || a.includes('mytonwallet');
    const isTgWallet =
      n.includes('telegram') ||
      a.includes('telegram') ||
      isTelegramMiniAppUniversalLink(w.universalLink);
    return isTk || isMw || isTgWallet;
  });
}
