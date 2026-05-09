import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {api} from '../api/client';
import {useUserContext} from '../context/UserContext';
import {useAppodealRewarded} from '../hooks/useAppodeal';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {levelXp} from '../utils/level';
import type {HomeStackParamList} from '../navigation/MainTabs';
import {VideoIcon, PointCoinIcon} from './Icons';
import {AppModal, AppModalClose} from './ui';
import {
  calculateCoinsEarnedForClaimWindow,
  getRemainingSecondsFromClaim,
  MINING_CYCLE_SECONDS,
} from '../utils/miningProfit';

/** frontend/src/assets/css/App.css — блок таймера майнинга */
const WEB_TIMER_BORDER_RADIUS_PX = 100;

function localeFormat(n: number) {
  try {
    return Math.floor(n).toLocaleString(undefined, {maximumFractionDigits: 0});
  } catch {
    return String(Math.floor(n));
  }
}

function sumFormat(n: number) {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return localeFormat(n);
}

export function MiningBlock() {
  const {t} = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const {refetchUser, userData} = useUserContext();
  /** Пустой тик раз в 100 ms — перерисовка, `timeLeft` / profit из `claim` и часов. */
  const [, setRenderTick] = useState(0);
  const [modalClaimOpen, setModalClaimOpen] = useState(false);
  const [modalNextStageOpen, setModalNextStageOpen] = useState(false);
  const [modalBannerNotFound, setModalBannerNotFound] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [nextStage, setNextStage] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [stopClaimTimer, setStopClaimTimer] = useState(false);
  const [claimAdUnavailable, setClaimAdUnavailable] = useState(false);
  /** Remount TimerBar when opening modal or after ad error so countdown restarts */
  const [claimModalKey, setClaimModalKey] = useState(0);
  /** Как TWA: кнопка появляется с fade-in после инициализации */
  const [showButton, setShowButton] = useState(false);
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const claimMut = useMutation({
    mutationFn: async (params: {claim_date: Date; rewarded_ad?: boolean}) => {
      const {data} = await api.post('/api/users/claim', params);
      return data;
    },
    onSuccess: () => refetchUser(),
  });

  const calculateCoinsEarned = useCallback(() => {
    return calculateCoinsEarnedForClaimWindow(userData);
  }, [userData]);

  const timeLeft = getRemainingSecondsFromClaim(
    userData?.claim != null ? String(userData.claim) : null,
  );

  const isMining = timeLeft > 0;

  const profit = calculateCoinsEarnedForClaimWindow(userData);

  useEffect(() => {
    if (!userData) {
      return;
    }
    setIsInitialized(true);
  }, [userData]);

  useEffect(() => {
    const id = setInterval(() => setRenderTick(n => n + 1), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    const delayId = setTimeout(() => setShowButton(true), 100);
    return () => clearTimeout(delayId);
  }, [isInitialized]);

  useEffect(() => {
    if (showButton && !isMining) {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [showButton, isMining, buttonOpacity]);

  const handleStartMining = useCallback(() => {
    if (claimMut.isPending) {
      return;
    }
    const remaining = getRemainingSecondsFromClaim(
      userData?.claim != null ? String(userData.claim) : null,
    );

    if (userData?.claim && remaining <= 0) {
      const earned = calculateCoinsEarned() * 2;
      const maxXp = levelXp(
        typeof userData?.pointLevel === 'number' ? userData.pointLevel : 1,
      );
      const toLevel = earned + (typeof userData?.pointXp === 'number' ? userData.pointXp : 0);
      const fortune =
        typeof userData?.fortune === 'number' ? userData.fortune : 0;

      if (fortune > 20 && !nextStage) {
        setModalNextStageOpen(true);
      } else if (toLevel >= maxXp && !nextStage && fortune > 0) {
        setModalNextStageOpen(true);
      } else {
        setClaimAdUnavailable(false);
        setStopClaimTimer(false);
        setAdLoading(false);
        setClaimModalKey(k => k + 1);
        setModalClaimOpen(true);
      }
    } else {
      if (userData?.claim && remaining > 0) {
        return;
      }
      claimMut.mutate({claim_date: new Date()});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, calculateCoinsEarned, nextStage]);

  useEffect(() => {
    if (nextStage) {
      handleStartMining();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextStage]);

  const simpleCloseNextStage = () => {
    setNextStage(true);
    setModalNextStageOpen(false);
  };

  const claimWithoutAd = useCallback(() => {
    const remaining = getRemainingSecondsFromClaim(
      userData?.claim != null ? String(userData.claim) : null,
    );
    if (remaining <= 0) {
      claimMut.mutate({claim_date: new Date()});
      setNextStage(false);
    }
    setStopClaimTimer(true);
    setModalClaimOpen(false);
    setClaimAdUnavailable(false);
    setAdLoading(false);
  }, [claimMut, userData?.claim]);

  const simpleCloseClaim = () => {
    claimWithoutAd();
  };

  const onAdReward = useCallback(() => {
    setAdLoading(false);
    setStopClaimTimer(false);
    claimMut.mutate({claim_date: new Date(), rewarded_ad: true});
    setClaimAdUnavailable(false);
    setModalClaimOpen(false);
  }, [claimMut]);

  const {showRewarded} = useAppodealRewarded({
    onReward: onAdReward,
    onFail: () => {
      setAdLoading(false);
      setStopClaimTimer(false);
      setClaimAdUnavailable(true);
      setClaimModalKey(k => k + 1);
    },
  });

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const percentagePassed =
    ((MINING_CYCLE_SECONDS - timeLeft) / MINING_CYCLE_SECONDS) * 100;

  const buttonLabel = useMemo(() => {
    if (!userData?.claim) {
      return t('Start');
    }
    if (claimMut.isPending) {
      return `${t('Claiming...')}`;
    }
    return t('Claim');
  }, [userData?.claim, claimMut.isPending, t]);

  if (!isInitialized) {
    return (
      <View style={styles.miningRoot}>
        <View style={styles.startBtnPlaceholder}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.miningRoot}>
      {isMining ? (
        <View style={styles.timerBox}>
          <View style={styles.timerProgressBar} pointerEvents="none">
            <View
              style={[
                styles.timerProgressBarFill,
                {width: `${Math.min(100, Math.max(0, percentagePassed))}%`},
              ]}
            />
          </View>
          <View style={styles.timerCol}>
            <Text style={styles.timerProfit} numberOfLines={1}>
              {localeFormat(profit)}
            </Text>
          </View>
          <View style={[styles.timerCol, styles.timerColCenter]}>
            <Text style={styles.timerText} numberOfLines={1}>
              {percentagePassed.toFixed(2)}%
            </Text>
          </View>
          <View style={[styles.timerCol, styles.timerColLast]}>
            <Text style={styles.timerTime} numberOfLines={1}>
              {hours}
              {t('h')} {minutes}
              {t('m')}
            </Text>
          </View>
        </View>
      ) : (
        <Animated.View
          style={[styles.startBtnWrap, {opacity: buttonOpacity}]}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStartMining}
            disabled={claimMut.isPending || !showButton}
            activeOpacity={0.5}>
            {claimMut.isPending ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.startBtnText}>{buttonLabel}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Claim x2 modal */}
      <AppModal
        visible={modalClaimOpen}
        onClose={simpleCloseClaim}
        variant="center"
        animationType="fade">
        <AppModalClose onPress={simpleCloseClaim} color={colors.textMuted} />
            <Text style={styles.modalTitle}>
              {t('You can claim x2 of your points')}
            </Text>
            <Text style={styles.modalDesc}>
              {t('look the ad')}
              {'\n'}
              {t('Reward points add to your XP and increase your level')}
            </Text>
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>{t('Reward')}:</Text>
              <View style={styles.modalPriceRow}>
                <Text style={styles.modalPriceOld}>
                  {sumFormat(calculateCoinsEarned())}
                </Text>
                <View style={styles.modalCoinRow}>
                  <PointCoinIcon size={16} />
                  <Text style={styles.modalPriceNew}>
                    {sumFormat(calculateCoinsEarned() * 2)}
                  </Text>
                </View>
              </View>
            </View>
            {claimAdUnavailable ? (
              <Text style={styles.modalAdHint}>{t('Ad not found')}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.modalBtnGray}
              onPress={() => {
                setClaimAdUnavailable(false);
                setStopClaimTimer(true);
                setAdLoading(true);
                showRewarded();
                setTimeout(() => setAdLoading(false), 5000);
              }}>
              {adLoading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <>
                  <VideoIcon size={18} color={colors.textPrimary} />
                  <Text style={styles.modalBtnGrayText}>
                    {t('Get X2')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtnPrimary, styles.modalBtnClaimBase]}
              onPress={claimWithoutAd}
              disabled={claimMut.isPending}
              activeOpacity={0.85}>
              {claimMut.isPending ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={styles.modalBtnPrimaryText}>{t('Claim')}</Text>
              )}
            </TouchableOpacity>
            <TimerBar
              key={claimModalKey}
              stopTimer={stopClaimTimer}
              onComplete={simpleCloseClaim}
            />
      </AppModal>

      <AppModal
        visible={modalNextStageOpen}
        onClose={simpleCloseNextStage}
        variant="center"
        animationType="fade">
        <AppModalClose onPress={simpleCloseNextStage} color={colors.textMuted} />
            <Text style={styles.modalTitle}>{t('Pay attention!')}</Text>
            <Text style={styles.modalDesc}>
              {t('Spins reset after each point claim.')}
            </Text>
            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={() => {
                setModalNextStageOpen(false);
                nav.navigate('Roulette');
              }}>
              <Text style={styles.modalBtnPrimaryText}>
                {t('Go to roulette')}
              </Text>
            </TouchableOpacity>
      </AppModal>

      <AppModal
        visible={modalBannerNotFound}
        onClose={() => setModalBannerNotFound(false)}
        variant="center"
        animationType="fade">
        <AppModalClose
          onPress={() => setModalBannerNotFound(false)}
          color={colors.textMuted}
        />
            <Text style={styles.modalTitle}>{t('Pay attention!')}</Text>
            <Text style={styles.modalDesc}>{t('Ad not found')}</Text>
            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={() => setModalBannerNotFound(false)}>
              <Text style={styles.modalBtnPrimaryText}>OK</Text>
            </TouchableOpacity>
      </AppModal>
    </View>
  );
}

function TimerBar({
  onComplete,
  stopTimer,
}: {
  onComplete: () => void;
  stopTimer: boolean;
}) {
  const [secs, setSecs] = useState(5);
  const [fill, setFill] = useState(100);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stopTimer && ref.current) {
      clearInterval(ref.current);
      return;
    }
    ref.current = setInterval(() => {
      setSecs(p => (p > 0 ? p - 0.1 : 0));
      setFill(p => (p > 0 ? p - 2 : 0));
    }, 100);
    return () => {
      if (ref.current) {
        clearInterval(ref.current);
      }
    };
  }, [stopTimer]);

  useEffect(() => {
    if (secs <= 0) {
      if (ref.current) {
        clearInterval(ref.current);
      }
      onComplete();
    }
  }, [secs, onComplete]);

  return (
    <View style={styles.timerBarOuter}>
      <View style={[styles.timerBarFill, {width: `${fill}%`}]} />
      <Text style={styles.timerBarLabel}>0:0{Math.ceil(secs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  miningRoot: {
    width: '100%',
    alignSelf: 'stretch',
  },
  /** `.timer-box` — App.css */
  timerBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: WEB_TIMER_BORDER_RADIUS_PX,
    backgroundColor: 'rgba(230, 33, 89, 0.16)',
    overflow: 'hidden',
  },
  /** `.progress-bar` — слой под текстом */
  timerProgressBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(230, 33, 89, 0.2)',
    borderRadius: WEB_TIMER_BORDER_RADIUS_PX,
    overflow: 'hidden',
    zIndex: 0,
  },
  /** `.progress-bar-fill` */
  timerProgressBarFill: {
    height: '100%',
    borderRadius: WEB_TIMER_BORDER_RADIUS_PX,
    backgroundColor: 'rgba(230, 33, 89, 0.08)',
  },
  /** `.timer-box > div` — три колонки поверх бара */
  timerCol: {
    flex: 1,
    zIndex: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 0,
  },
  timerColCenter: {
    alignItems: 'center',
  },
  /** `.timer-box div:last-child` */
  timerColLast: {
    alignItems: 'flex-end',
  },
  /** базовый текст `.timer-box` + `.timer-profit` */
  timerProfit: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(126, 50, 71, 1)',
    fontFamily: fontFamily.semibold,
    textAlign: 'left',
  },
  /** `.timer-text` — процент */
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(230, 33, 89, 1)',
    fontFamily: fontFamily.semibold,
    textAlign: 'center',
  },
  timerTime: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(126, 50, 71, 1)',
    fontFamily: fontFamily.semibold,
    textAlign: 'right',
    width: '100%',
  },
  startBtnWrap: {
    width: '100%',
  },
  startBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  startBtnPlaceholder: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  startBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
    fontFamily: fontFamily.semibold,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    fontFamily: fontFamily.bold,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
  },
  modalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalPriceOld: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    fontFamily: fontFamily.regular,
  },
  modalPriceNew: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  modalBtnGray: {
    backgroundColor: colors.tabPillActive,
    borderRadius: radii.pill,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalBtnGrayText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnClaimBase: {
    marginTop: 10,
  },
  modalAdHint: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
  },
  modalBtnPrimaryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  timerBarOuter: {
    height: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
    width: 240,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  timerBarLabel: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
});
