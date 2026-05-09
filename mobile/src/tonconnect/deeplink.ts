/**
 * Схема возврата из кошелька в нативное приложение (TON Connect manifest `returnUrl`).
 *
 * На сервере в `tonconnect-manifest.json` (см. TON_MANIFEST_URL в config) добавьте, например:
 * `"returnUrl": { "ios": "alton://tonconnect", "android": "alton://tonconnect" }`
 * — значения должны совпадать с CFBundleURLTypes (iOS) и intent-filter (Android).
 *
 * Android: в `AndroidManifest.xml` у activity с `android:exported="true"`:
 * <intent-filter>
 *   <action android:name="android.intent.action.VIEW" />
 *   <category android:name="android.intent.category.DEFAULT" />
 *   <category android:name="android.intent.category.BROWSABLE" />
 *   <data android:scheme="alton" android:host="tonconnect" />
 * </intent-filter>
 *
 * Основной канал завершения connect в RN — HTTP-bridge (SSE), а не парсинг URL;
 * входящие ссылки обрабатываются на будущее и для returnUrl.
 */
export const TON_CONNECT_RETURN_SCHEME = 'alton';
export const TON_CONNECT_RETURN_HOST = 'tonconnect';

export const TON_CONNECT_RETURN_URL = `${TON_CONNECT_RETURN_SCHEME}://${TON_CONNECT_RETURN_HOST}`;
