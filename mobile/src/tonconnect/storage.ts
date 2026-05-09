import AsyncStorage from '@react-native-async-storage/async-storage';

const CONNECT_STORAGE_PREFIX = 'alton_ton_connect_';

/**
 * Реализация IStorage для @tonconnect/sdk.
 * Префикс изолирует ключи от остальных данных приложения.
 * При желании заменить на MMKV — сохраните тот же контракт (async API или обёртка).
 */
export function createTonConnectAsyncStorage() {
  return {
    async setItem(key: string, value: string) {
      await AsyncStorage.setItem(`${CONNECT_STORAGE_PREFIX}${key}`, value);
    },
    async getItem(key: string) {
      return AsyncStorage.getItem(`${CONNECT_STORAGE_PREFIX}${key}`);
    },
    async removeItem(key: string) {
      await AsyncStorage.removeItem(`${CONNECT_STORAGE_PREFIX}${key}`);
    },
  };
}
