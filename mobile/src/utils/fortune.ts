/** Ported from frontend/src/utils/fortune.ts */

export function countDays(day: number) {
  switch (day) {
    case 1:
      return {point: 1000, fortuneSpin: 1};
    case 2:
      return {point: 2000, fortuneSpin: 2};
    case 3:
      return {point: 5000, fortuneSpin: 3};
    case 4:
      return {point: 10000, fortuneSpin: 4};
    case 5:
      return {point: 25000, fortuneSpin: 5};
    case 6:
      return {point: 50000, fortuneSpin: 6};
    case 7:
      return {point: 1000000, balance: 500, fortuneSpin: 7};
    default:
      return null;
  }
}

export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) {
    return false;
  }
  const utcToday = new Date();
  utcToday.setUTCHours(0, 0, 0, 0);
  const utcDate = new Date(String(date));
  utcDate.setUTCHours(0, 0, 0, 0);
  return (
    utcDate.getUTCDate() === utcToday.getUTCDate() &&
    utcDate.getUTCMonth() === utcToday.getUTCMonth() &&
    utcDate.getUTCFullYear() === utcToday.getUTCFullYear()
  );
}

export function isYesterday(date: Date | string | null | undefined): boolean {
  if (!date) {
    return false;
  }
  const utcYesterday = new Date();
  utcYesterday.setUTCDate(utcYesterday.getUTCDate() - 1);
  utcYesterday.setUTCHours(0, 0, 0, 0);
  const utcDate = new Date(String(date));
  utcDate.setUTCHours(0, 0, 0, 0);
  return (
    utcDate.getUTCDate() === utcYesterday.getUTCDate() &&
    utcDate.getUTCMonth() === utcYesterday.getUTCMonth() &&
    utcDate.getUTCFullYear() === utcYesterday.getUTCFullYear()
  );
}

export function sumFormat(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return String(Math.floor(n));
}

/** Compact locale number formatting (TWA `localeFormat`) */
export function localeFormatNum(
  n: number,
  locale?: string,
  fractionDigits = 2,
): string {
  try {
    return n.toLocaleString(locale ?? undefined, {
      maximumFractionDigits: fractionDigits,
    });
  } catch {
    return String(n);
  }
}
