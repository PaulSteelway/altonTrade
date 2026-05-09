# Alton Mobile (React Native)

Bare React Native app mirroring the Telegram Mini App: mining, roulette, boosts, academy, missions, friends, profile, wallet.

## Prerequisites

- Node 18+, Xcode (iOS), Android Studio (Android)
- Backend running (`backend`, default `http://localhost:3000`). Emulators: Android uses `10.0.2.2:3000`, iOS uses `localhost:3000` — see `src/config.ts`.

## Install

```bash
cd mobile
npm install
```

### iOS

Используйте Bundler из `ios/Gemfile` (голый `pod install` на Ruby 3.2+ часто падает на `ActiveSupport::Logger`).

```bash
cd ios && bundle install && bundle exec pod install && cd ..
npx react-native run-ios
```

Или из каталога `mobile`: `npm run ios:pods`, затем `npx react-native run-ios`.

### Android

```bash
npx react-native run-android
```

## Environment / secrets

| Item | Where |
|------|--------|
| **API** | `src/config.ts` → `API_BASE_URL` for production |
| **Appodeal** | `src/config.ts` → `APPODEAL_APP_KEY` |
| **Telegram OIDC** | Backend `TELEGRAM_CLIENT_ID` (see `backend/.env.example`) |
| **Telegram Login SDK (Android)** | GitHub Packages Maven + `GITHUB_TOKEN` — [telegram-login-android](https://github.com/TelegramMessenger/telegram-login-android). Replace stub in `TelegramLoginModule.kt` with `TelegramLogin.startLogin` / `handleLoginResponse`. |
| **Telegram Login SDK (iOS)** | Add SPM `https://github.com/TelegramMessenger/telegram-login-ios`, replace stub in `TelegramLoginModule.m`, Universal Links |

Until native SDKs return a real `id_token`, use **Login** screen **Dev login** (debug builds): paste JWT from Telegram OAuth and call `POST /api/login/telegram-sdk`.

## Backend

New endpoint: `POST /api/login/telegram-sdk` with `{ idToken, referrerId? }`. Requires `TELEGRAM_CLIENT_ID` in backend `.env`.

## Ads

Appodeal Rewarded Video is initialized in `App.tsx`. Mining ×2, roulette extra spin, academy retry use `src/hooks/useAppodeal.ts` (FIFO reward callbacks).
