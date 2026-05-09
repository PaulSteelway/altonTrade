import {Linking} from 'react-native';
import type {WalletInfoRemote} from '@tonconnect/sdk';

/**
 * Открывает ссылку от `tonConnect.connect()` для remote-кошелька.
 * Сначала HTTPS universal link; при ошибке (симулятор / политики) — нативный `deepLink` кошелька.
 */
export async function openTonConnectWalletLink(
  httpsLinkFromSdk: string,
  wallet: WalletInfoRemote,
): Promise<void> {
  const tryHttps = async () => Linking.openURL(httpsLinkFromSdk);

  try {
    await tryHttps();
    return;
  } catch {
    // fall through to native deep link
  }

  const deep = wallet.deepLink?.trim();
  if (!deep) {
    throw new Error(
      'HTTPS universal link failed to open and wallet has no deepLink fallback',
    );
  }

  let nativeUrl: string;
  try {
    const sdkUrl = new URL(httpsLinkFromSdk);
    if (!sdkUrl.protocol.startsWith('http')) {
      nativeUrl = httpsLinkFromSdk;
    } else {
      const pathAndQuery =
        sdkUrl.pathname.replace(/^\/+/u, '') + (sdkUrl.search || '');
      nativeUrl = deep.endsWith('://')
        ? `${deep}${pathAndQuery}`
        : `${deep}/${pathAndQuery}`;
    }
  } catch {
    nativeUrl = httpsLinkFromSdk;
  }

  await Linking.openURL(nativeUrl);
}
