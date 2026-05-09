import {useCallback, useEffect, useRef} from 'react';

type Options = {
  onReward?: () => void;
  onFail?: () => void;
};

/** FIFO callbacks — one rewarded completion consumes one pending handler */
const pendingRewards: (() => void)[] = [];

let listenerAttached = false;
let Appodeal: any;
let AppodealAdType: any;
let AppodealRewardedEvents: any;

try {
  const mod = require('react-native-appodeal');
  Appodeal = mod.default;
  AppodealAdType = mod.AppodealAdType;
  AppodealRewardedEvents = mod.AppodealRewardedEvents;
} catch {
  // TurboModule not available (e.g. missing native build)
}

function attachRewardListenerOnce() {
  if (listenerAttached || !Appodeal) {
    return;
  }
  listenerAttached = true;
  Appodeal.addEventListener(AppodealRewardedEvents.REWARD, () => {
    const next = pendingRewards.shift();
    next?.();
  });
}

export function useAppodealRewarded({onReward, onFail}: Options) {
  const onRewardRef = useRef(onReward);
  onRewardRef.current = onReward;

  useEffect(() => {
    attachRewardListenerOnce();
  }, []);

  const showRewarded = useCallback(() => {
    if (!Appodeal) {
      onFail?.();
      return;
    }
    try {
      const can = Appodeal.canShow(AppodealAdType.REWARDED_VIDEO);
      if (!can) {
        onFail?.();
        return;
      }
      pendingRewards.push(() => onRewardRef.current?.());
      Appodeal.show(AppodealAdType.REWARDED_VIDEO);
    } catch {
      onFail?.();
    }
  }, [onFail]);

  return {showRewarded};
}
