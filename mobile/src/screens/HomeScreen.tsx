import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Dimensions,
  Animated,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useMutation, useQuery} from '@tanstack/react-query';

import {UserProfileHeader} from '../components/UserProfileHeader';
import {MiningBlock} from '../components/MiningBlock';
import {ComboBlock} from '../components/ComboBlock';
import {BullcoinLiquidFill} from '../components/BullcoinLiquidFill';
import {useUserContext} from '../context/UserContext';
import {api} from '../api/client';
import type {HomeStackParamList} from '../navigation/MainTabs';
import {AppModal, AppModalClose} from '../components/ui';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {isToday, isYesterday, countDays, sumFormat} from '../utils/fortune';
import {getMiningCycleFillPercent} from '../utils/miningProfit';
import {formatTonFriendlyShort} from '../utils/walletDisplay';
import {useTonConnect} from '../hooks/useTonConnect';
import {
  TicketIcon,
  PointCoinIcon,
  BalanceCoinIcon,
  DiamondIcon,
  BullcoinIcon,
  ClockIcon,
} from '../components/Icons';
const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
/** animation.css `.bullcoin` — width/height: 25vh; на узких экранах ограничиваем шириной */
const COIN_SIZE = Math.round(
  Math.min(SCREEN_HEIGHT * 0.25, SCREEN_WIDTH * 0.92),
);

function localeFormat(n: number) {
  try {
    return Math.floor(n).toLocaleString(undefined, {maximumFractionDigits: 0});
  } catch {
    return String(Math.floor(n));
  }
}

export function HomeScreen() {
  const {t} = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const insets = useSafeAreaInsets();
  const {userData, refetchUser} = useUserContext();
  const {walletAccount, connected, restoring, pickerBusy, connect} = useTonConnect();

  const coinFade = useRef(new Animated.Value(0)).current;

  // ── Mining percentage for liquid fill ──
  const [percentage, setPercentage] = useState(0);
  const claimDate = useMemo(() => {
    return userData && typeof userData.claim === 'string'
      ? userData.claim
      : null;
  }, [userData]);

  useEffect(() => {
    const calc = () =>
      claimDate ? getMiningCycleFillPercent(claimDate) : 0;
    setPercentage(calc());
    const iv = setInterval(() => setPercentage(calc()), 100);
    return () => clearInterval(iv);
  }, [claimDate]);

  useEffect(() => {
    coinFade.setValue(0);
    Animated.timing(coinFade, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [claimDate, coinFade]);

  // ── Fortune / Spins ──
  const fortune =
    userData && typeof userData.fortune === 'number' ? userData.fortune : 0;

  const miningSpeed =
    typeof userData?.miningSpeed === 'number' ? userData.miningSpeed : 0;

  const coinFilled = percentage >= 100;

  // ── Daily bonus modal ──
  const [dailyBonusOpen, setDailyBonusOpen] = useState(false);
  const [dailyReward, setDailyReward] = useState<{
    point?: number;
    balance?: number;
    fortuneSpin?: number;
  } | null>(null);

  const dailyBonusMut = useMutation({
    mutationFn: async () => {
      const {data} = await api.post('/api/users/daily-bonus');
      return data;
    },
    onSuccess: () => refetchUser(),
  });

  useEffect(() => {
    if (!userData?.lastBonusDate) {
      return;
    }
    if (!isToday(userData.lastBonusDate)) {
      let countDaysVal =
        typeof userData.countBonusDays === 'number'
          ? userData.countBonusDays
          : 1;
      if (!isYesterday(userData.lastBonusDate)) {
        countDaysVal = 1;
      } else {
        countDaysVal = (countDaysVal % 7) + 1;
      }
      const reward = countDays(countDaysVal);
      if (reward) {
        setDailyReward(reward);
        setDailyBonusOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.lastBonusDate]);

  const closeDailyBonus = async () => {
    dailyBonusMut.mutate();
    setDailyBonusOpen(false);
  };

  // ── Mission modal ──
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [missionNames, setMissionNames] = useState<any[]>([]);

  const missionsQuery = useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const {data} = await api.get('/api/missions');
      return data as any[];
    },
  });

  useEffect(() => {
    if (!missionsQuery.isSuccess || !userData?.missions) {
      return;
    }
    const lang = userData.language_code ?? 'en';
    const filtered = (missionsQuery.data ?? []).filter((m: any) => {
      if (!m.special) {
        return false;
      }
      if (!m.language) {
        return true;
      }
      if (lang === 'en') {
        return m.language === 'en';
      }
      return m.language === 'ru' || m.language === 'uk';
    });
    const incomplete = filtered.filter((m: any) => {
      const um = userData.missions?.find(
        (u: {id: string}) => u.id === m._id,
      );
      return um && um.status !== 'completed';
    });
    if (incomplete.length > 0 && (userData.miningSpeed ?? 0) > 1) {
      if (!dailyBonusOpen) {
        setMissionNames(incomplete);
        setMissionModalOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionsQuery.isSuccess, userData, dailyBonusOpen]);

  const closeMissionModal = () => setMissionModalOpen(false);

  const saveWalletMut = useMutation({
    mutationFn: async (payload: {address: string; publicKey: string}) => {
      await api.post('/api/users/wallet', payload);
    },
    onSuccess: () => {
      refetchUser();
    },
  });

  useEffect(() => {
    const address = walletAccount?.address ?? '';
    const publicKey = walletAccount?.publicKey ?? '';
    if (!address || saveWalletMut.isPending) {
      return;
    }
    const currentAddress =
      typeof userData?.wallet?.address === 'string' ? userData.wallet.address : '';
    const currentKey =
      typeof userData?.wallet?.publicKey === 'string' ? userData.wallet.publicKey : '';
    if (address === currentAddress && publicKey === currentKey) {
      return;
    }
    saveWalletMut.mutate({address, publicKey});
  }, [
    walletAccount?.address,
    walletAccount?.publicKey,
    userData?.wallet?.address,
    userData?.wallet?.publicKey,
    saveWalletMut,
  ]);

  /** Mirrors web `UserProfile.handleWalletConnect`: connect in place vs navigate to Wallet when already linked. */
  const handleWalletPress = async () => {
    if (restoring) {
      return;
    }
    if (pickerBusy) {
      return;
    }
    if (connected) {
      nav.navigate('Wallet');
      return;
    }
    void connect();
  };

  const walletButtonLabel = useMemo(() => {
    if (restoring) {
      return t('Wallet');
    }
    if (pickerBusy) {
      return t('Connecting...', {defaultValue: 'Connecting...'});
    }
    const addr =
      walletAccount?.address &&
      typeof walletAccount.address === 'string'
        ? walletAccount.address.trim()
        : '';
    return addr ? formatTonFriendlyShort(addr) : t('Wallet');
  }, [walletAccount?.address, pickerBusy, restoring, t]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        {paddingTop: Math.max(insets.top, 12)},
      ]}
      showsVerticalScrollIndicator={false}>
      <UserProfileHeader
        walletButtonLabel={walletButtonLabel}
        walletConnected={connected}
        walletRestoring={restoring}
        walletConnecting={pickerBusy}
        onWalletPress={handleWalletPress}
      />

      {/* App.css `.home-block` + `.home-container` + animation.css `.bullcoin` + `.liquid` */}
      <View style={styles.homeBlock}>
        <ComboBlock />
        <View style={styles.homeContainer}>
          <Animated.View
            style={[styles.bullcoinFade, {opacity: coinFade}]}
            pointerEvents="box-none">
            <View
              style={[
                styles.bullcoin,
                {
                  width: COIN_SIZE,
                  height: COIN_SIZE,
                  borderRadius: COIN_SIZE / 2,
                },
                coinFilled && styles.bullcoinFilled,
              ]}>
              <View style={styles.bullcoinGraphic}>
                <BullcoinIcon size={COIN_SIZE} />
              </View>
              <BullcoinLiquidFill size={COIN_SIZE} percentage={percentage} />
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Profit per hour */}
      <View style={styles.profitRow}>
        <Text style={styles.profitLabel}>{t('Profit Per Hour')}:</Text>
        <View style={styles.profitValueRow}>
          <PointCoinIcon size={12} />
          <Text style={styles.profitValue}>{localeFormat(miningSpeed)}</Text>
        </View>
      </View>

      {/* Mining block (Start/Claim/Timer) */}
      <View style={styles.miningWrap}>
        <MiningBlock />
      </View>

      {/* Spacer pushes grid to bottom */}
      <View style={styles.spacer} />

      {/* Grid: Roulette | Testnet */}
      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.tile, styles.rouletteTile]}
          onPress={() => nav.navigate('Roulette')}
          activeOpacity={0.85}>
          <View style={styles.rouletteContent}>
            <View style={styles.rouletteTextCol}>
              <Text style={styles.tileTitle}>{t('Roulette')}</Text>
              <View style={styles.tileDescRow}>
                <Text style={styles.tileDesc}>
                  {fortune || 0}/20
                </Text>
                <TicketIcon size={14} color="#7976E7" />
              </View>
            </View>
            <View style={styles.diamondWrap}>
              <DiamondIcon size={32} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={[styles.tile, styles.brandsTile, styles.testnetTile]}>
          <View style={styles.brandsTitleRow}>
            <Text style={styles.tileTitle}>{t('Testnet')}</Text>
            <ClockIcon size={16} />
          </View>
          <Text style={styles.tileDesc}>{t('Soon')}</Text>
        </View>
      </View>

      <AppModal
        visible={dailyBonusOpen}
        onClose={closeDailyBonus}
        variant="bottomSheet">
        <AppModalClose onPress={closeDailyBonus} />
            <Text style={styles.modalTitle}>
              {t('Claim your daily bonus and keep the rewards coming')}
            </Text>
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoLabel}>{t('Reward')}:</Text>
              {dailyReward && (
                <View style={styles.rewardItems}>
                  {dailyReward.point ? (
                    <View style={styles.rewardItem}>
                      <PointCoinIcon size={20} />
                      <Text style={styles.rewardItemText}>
                        {sumFormat(dailyReward.point)}
                      </Text>
                    </View>
                  ) : null}
                  {dailyReward.balance ? (
                    <View style={styles.rewardItem}>
                      <BalanceCoinIcon size={20} />
                      <Text style={styles.rewardItemText}>
                        {sumFormat(dailyReward.balance)}
                      </Text>
                    </View>
                  ) : null}
                  {dailyReward.fortuneSpin ? (
                    <View style={styles.rewardItem}>
                      <TicketIcon size={16} color="#7976E7" />
                      <Text style={styles.rewardItemText}>
                        {sumFormat(dailyReward.fortuneSpin)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={closeDailyBonus}
              activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('Claim')}</Text>
            </TouchableOpacity>
      </AppModal>

      <AppModal
        visible={missionModalOpen}
        onClose={closeMissionModal}
        variant="bottomSheet">
        <AppModalClose onPress={closeMissionModal} />
            <Text style={styles.modalTitle}>{t('Special missions')}</Text>
            <Text style={styles.modalDesc}>
              {t('You have uncompleted missions')}
            </Text>
            <View style={styles.missionList}>
              {missionNames.map((m: any, idx: number) => (
                <View key={idx} style={styles.missionRow}>
                  <PointCoinIcon size={20} />
                  <Text style={styles.missionText}>{t(m.title)}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                closeMissionModal();
                nav.getParent()?.navigate('Missions');
              }}
              activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>
                {t('Go To Missions')}
              </Text>
            </TouchableOpacity>
      </AppModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.bg},
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  /** App.css `.home-block` */
  homeBlock: {
    position: 'relative',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: 20,
  },
  /** App.css `.home-container` */
  homeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  /** animation.css `.bullcoin` — fadeIn задаётся через Animated */
  bullcoinFade: {
    backfaceVisibility: 'hidden',
  },
  /** animation.css `.bullcoin` */
  bullcoin: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  /** animation.css `.bullcoin.filled` — свечение как @keyframes glowing */
  bullcoinFilled: {
    shadowColor: '#e62159',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.75,
    shadowRadius: 18,
    elevation: 18,
  },
  /** SVG монеты (аналог background-image на TWA) */
  bullcoinGraphic: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },

  /* Profit per hour */
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  profitLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
    textTransform: 'capitalize',
    fontStyle: 'italic',
  },
  profitValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profitValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    textTransform: 'capitalize',
    fontStyle: 'normal',
  },

  /* Mining wrap */
  miningWrap: {
    width: '100%',
    marginBottom: 16,
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    overflow: 'hidden',
    height: 80,
    justifyContent: 'center',
  },
  rouletteTile: {
    flex: 3,
  },
  brandsTile: {
    flex: 1,
  },
  testnetTile: {
    justifyContent: 'center',
  },
  rouletteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rouletteTextCol: {
    flex: 1,
  },
  diamondWrap: {
    marginLeft: 8,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  tileDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tileDesc: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    textTransform: 'capitalize',
  },
  brandsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  /* Modal content (AppModal shell) */
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 8,
    fontFamily: fontFamily.bold,
  },
  modalDesc: {
    fontSize: 14,
    color: '#757f9c',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: fontFamily.regular,
  },
  modalInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: '#757f9c',
    fontWeight: '400',
    marginBottom: 8,
    fontFamily: fontFamily.regular,
  },
  rewardItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },

  /* Mission list */
  missionList: {
    marginTop: 24,
    marginBottom: 32,
    gap: 12,
  },
  missionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  missionText: {
    fontSize: 14,
    color: '#838898',
    fontFamily: fontFamily.regular,
    flex: 1,
  },
});
