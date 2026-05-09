import {toUserFriendlyAddress} from '@tonconnect/sdk';

/** Same shortening as frontend `formatPublicKey` (used for user-facing TON addresses). */
export function formatPublicKey(value: string): string {
  if (value.length > 6) {
    return `${value.slice(0, 2)}..${value.slice(-4)}`;
  }
  return value;
}

/**
 * User-friendly bounceable address (TEP-123), затем сокращение как в web `UserProfile`.
 * Не используем `tonweb`: он тянет Ledger/WebUSB и в Hermes падает на отсутствии `Buffer`.
 */
export function formatTonFriendlyShort(rawAddress?: string | null): string {
  if (!rawAddress?.trim()) {
    return '';
  }
  const s = rawAddress.trim();
  try {
    const friendly = toUserFriendlyAddress(s);
    return formatPublicKey(friendly);
  } catch {
    return formatPublicKey(s);
  }
}
