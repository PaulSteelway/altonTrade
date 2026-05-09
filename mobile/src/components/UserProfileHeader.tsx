import React, {useMemo} from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';

import {useUserContext} from '../context/UserContext';
import {colors, radii, space} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {determinePointLevel} from '../utils/level';
import {
  CrownIcon,
  WalletIcon,
  PointCoinIcon,
  BalanceCoinIcon,
} from './Icons';

function sumFormat(n: number) {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(2)}K`;
  }
  return String(Math.floor(n));
}

function initials(first?: string, last?: string) {
  const a =
    first && /^[a-zA-ZА-Яа-яЁё]/.test(first[0] ?? '') ? first[0] : '?';
  const b = last && /^[a-zA-ZА-Яа-яЁё]/.test(last[0] ?? '') ? last[0] : '';
  return `${a}${b}`.toUpperCase();
}

/** Mirrors web `UserProfile` wallet control: label from TonConnect / “Wallet”; tap = open modal-like connect vs navigate to Wallet. */
export type UserProfileHeaderProps = {
  walletButtonLabel: string;
  walletConnected: boolean;
  walletRestoring: boolean;
  walletConnecting: boolean;
  onWalletPress: () => void;
};

export function UserProfileHeader({
  walletButtonLabel,
  walletConnected,
  walletRestoring,
  walletConnecting,
  onWalletPress,
}: UserProfileHeaderProps) {
  const {t} = useTranslation();
  const nav = useNavigation<any>();
  const {userData} = useUserContext();

  const displayName = useMemo(() => {
    if (!userData) {
      return '—';
    }
    const fn =
      typeof userData.first_name === 'string' ? userData.first_name : '';
    const ln =
      typeof userData.last_name === 'string' ? userData.last_name : '';
    if (fn || ln) {
      const full = `${fn} ${ln}`.trim();
      return full.length > 16 ? `${full.slice(0, 16)}…` : full;
    }
    const un =
      typeof userData.username === 'string' ? userData.username : '';
    return un ? (un.length > 16 ? `${un.slice(0, 16)}…` : un) : '—';
  }, [userData]);

  const userLevel =
    typeof userData?.pointLevel === 'number' && userData.pointLevel > 0
      ? userData.pointLevel
      : 1;
  const hasVoucher = userData?.hasVoucher === true;
  const initialsLabel = initials(
    typeof userData?.first_name === 'string' ? userData.first_name : undefined,
    typeof userData?.last_name === 'string' ? userData.last_name : undefined,
  );
  const points = typeof userData?.points === 'number' ? userData.points : 0;
  const balance = typeof userData?.balance === 'number' ? userData.balance : 0;

  return (
    <View style={styles.root}>
      {/* Top row: Avatar + Name | Wallet */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.infoTap}
          activeOpacity={0.8}
          onPress={() => nav.navigate('Profile')}>
          <View style={styles.avatarWrap}>
            <View
              style={[styles.avatar, hasVoucher && styles.avatarPremium]}>
              <Text
                style={[
                  styles.avatarText,
                  hasVoucher && styles.avatarTextPremium,
                ]}>
                {initialsLabel}
              </Text>
            </View>
            {hasVoucher && (
              <View style={styles.crownBadge}>
                <CrownIcon size={12} />
              </View>
            )}
          </View>
          <View style={styles.nameCol}>
            <Text
              style={[styles.name, hasVoucher && styles.namePremium]}
              numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.levelLine}>
              {determinePointLevel(userLevel)} {userLevel}/14
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.walletBtn, walletConnected && styles.walletBtnActive]}
          activeOpacity={0.85}
          disabled={walletRestoring || walletConnecting}
          onPress={onWalletPress}>
          {walletRestoring || walletConnecting ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <WalletIcon
              size={20}
              color={walletConnected ? '#EF1C58' : colors.textPrimary}
            />
          )}
          <Text style={styles.walletLabel} numberOfLines={1}>
            {walletRestoring ? t('Wallet') : walletButtonLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Balance row */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceBlock}>
          <PointCoinIcon size={16} />
          <Text style={styles.balanceNum}>{sumFormat(points)}</Text>
        </View>
        <View style={styles.balanceBlock}>
          <BalanceCoinIcon size={16} />
          <Text style={styles.balanceNum}>{sumFormat(balance)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  infoTap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: space.sm,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.levelCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPremium: {
    borderWidth: 1,
    borderColor: colors.crownGold,
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  avatarTextPremium: {
    color: colors.crownGold,
  },
  crownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.crownGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
    textTransform: 'capitalize',
  },
  namePremium: {
    color: colors.crownGold,
  },
  levelLine: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    textTransform: 'capitalize',
  },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.tabPillActive,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    maxWidth: '42%',
    minWidth: 0,
  },
  walletBtnActive: {
    borderColor: '#EF1C58',
  },
  walletLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: space.xs,
  },
  balanceBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  balanceNum: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    textTransform: 'capitalize',
  },
});
