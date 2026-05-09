import {NativeModules, Platform} from 'react-native';

type NativeTelegramLogin = {
  login: () => Promise<{idToken: string}>;
};

const Native = NativeModules.TelegramLoginModule as NativeTelegramLogin | undefined;

/**
 * Starts Telegram Login SDK flow (native). Returns OIDC id_token for POST /api/login/telegram-sdk.
 * Until SDK is wired (see mobile/README.md), this rejects with E_TELEGRAM_SDK.
 */
export async function loginWithTelegramNative(): Promise<{idToken: string}> {
  if (!Native?.login) {
    throw new Error(
      `TelegramLoginModule not available on ${Platform.OS}. Add native SDK per README.`,
    );
  }
  return Native.login();
}
