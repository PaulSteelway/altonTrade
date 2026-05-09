import {api} from './client';

export async function loginWithTelegramIdToken(
  idToken: string,
  referrerId?: number | null,
): Promise<{token: string}> {
  const {data} = await api.post<{token: string}>('/api/login/telegram-sdk', {
    idToken,
    referrerId: referrerId ?? undefined,
  });
  return data;
}

/** Start OIDC flow — backend generates PKCE + auth URL. */
export async function initTelegramAuth(): Promise<{
  authUrl: string;
  sessionId: string;
  redirectUri: string;
}> {
  const {data} = await api.post('/api/auth/telegram/init');
  return data;
}

/** Exchange authorization code for app JWT. */
export async function exchangeTelegramCode(
  code: string,
  sessionId: string,
  referrerId?: number | null,
): Promise<{token: string}> {
  const {data} = await api.post<{token: string}>('/api/auth/telegram/exchange', {
    code,
    sessionId,
    referrerId: referrerId ?? undefined,
  });
  return data;
}
