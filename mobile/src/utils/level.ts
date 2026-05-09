/** Ported from frontend/src/utils/level.ts for parity with TWA. */

export function determineLevel(id: number) {
  switch (id) {
    case 1:
      return 'hamster';
    case 2:
      return 'altcoiner';
    case 3:
      return 'hodler';
    case 4:
      return 'quarantino';
    case 5:
      return 'geek';
    case 6:
      return 'pioneer';
    default:
      return 'unknown';
  }
}

export function levelXp(level: number) {
  switch (level) {
    case 1:
      return 100;
    case 2:
      return 5000;
    case 3:
      return 10000;
    case 4:
      return 25000;
    case 5:
      return 50000;
    case 6:
      return 100000;
    case 7:
      return 500000;
    case 8:
      return 1000000;
    case 9:
      return 2500000;
    case 10:
      return 10000000;
    case 11:
      return 25000000;
    case 12:
      return 100000000;
    case 13:
      return 1000000000;
    default:
      return Infinity;
  }
}

export function determinePointLevel(level: number) {
  switch (level) {
    case 1:
      return 'Newbie';
    case 2:
      return 'Student';
    case 3:
      return 'Analyst';
    case 4:
      return 'Trader';
    case 5:
      return 'Strategist';
    case 6:
      return 'Investor';
    case 7:
      return 'Risk manager';
    case 8:
      return 'Hedge-fund manager';
    case 9:
      return 'Market veteran';
    case 10:
      return 'Crypto-tycoon';
    case 11:
      return 'Market Driver';
    case 12:
      return 'Legend';
    case 13:
      return 'Market Maker';
    default:
      return 'Unknown';
  }
}
