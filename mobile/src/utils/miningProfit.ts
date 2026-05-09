/**
 * Совпадает с frontend MiningBlock.tsx — учёт смены miningSpeed по earnedProfit.
 */
export type EarnedProfitEntry = {date: string; profit: number};

export const MINING_CYCLE_MS = 6 * 60 * 60 * 1000;
export const MINING_CYCLE_SECONDS = MINING_CYCLE_MS / 1000;

/** Остаток 6ч цикла по полю claim — общий для MiningBlock и жидкости на HomeScreen. */
export function getRemainingSecondsFromClaim(
  claim: string | null | undefined,
): number {
  if (claim == null || claim === '') {
    return 0;
  }
  const ms = new Date(String(claim)).getTime();
  if (Number.isNaN(ms)) {
    return 0;
  }
  const rawSec = (ms + MINING_CYCLE_MS - Date.now()) / 1000;
  return Math.min(MINING_CYCLE_SECONDS, Math.max(0, rawSec));
}

/** 0–100: заполнение цикла майнинга (как progress-bar / жидкость). */
export function getMiningCycleFillPercent(
  claim: string | null | undefined,
): number {
  if (claim == null || claim === '') {
    return 0;
  }
  const remaining = getRemainingSecondsFromClaim(claim);
  const elapsed = MINING_CYCLE_SECONDS - remaining;
  return Math.min(100, Math.max(0, (elapsed / MINING_CYCLE_SECONDS) * 100));
}

export function calculateCoinsEarnedForClaimWindow(userData: {
  claim?: string | null;
  miningSpeed?: number;
  earnedProfit?: EarnedProfitEntry[];
} | null): number {
  if (!userData?.claim) {
    return 0;
  }
  const miningSpeed =
    typeof userData.miningSpeed === 'number' ? userData.miningSpeed : 0;
  const earnedProfit = Array.isArray(userData.earnedProfit)
    ? userData.earnedProfit
    : [];

  const claimDate = new Date(String(userData.claim));
  const now = new Date();
  const sixHoursLater = new Date(claimDate.getTime() + MINING_CYCLE_MS);
  const endTime = now < sixHoursLater ? now : sixHoursLater;

  const relevantProfits = earnedProfit
    .filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate > claimDate && entryDate <= endTime;
    })
    .map(entry => ({
      ...entry,
      date: new Date(entry.date),
    }));

  if (relevantProfits.length === 0) {
    const totalSeconds = (endTime.getTime() - claimDate.getTime()) / 1000;
    return (miningSpeed / 3600) * totalSeconds;
  }

  relevantProfits.sort((a, b) => a.date.getTime() - b.date.getTime());

  let totalProfit = 0;
  let previousDate = claimDate.getTime();
  let previousProfit = miningSpeed;

  for (const entry of relevantProfits) {
    const currentDate = entry.date.getTime();
    const timeDifference = currentDate - previousDate;
    if (timeDifference > 0) {
      totalProfit += (previousProfit / 3600) * (timeDifference / 1000);
    }
    previousDate = currentDate;
    previousProfit = entry.profit;
  }

  const finalPeriod = endTime.getTime() - previousDate;
  if (finalPeriod > 0) {
    totalProfit += (previousProfit / 3600) * (finalPeriod / 1000);
  }

  return totalProfit;
}
