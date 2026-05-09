import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {useUserContext} from '../context/UserContext';
import {PrimaryButton, Screen} from '../components/ui';
import {ArrowLeftIcon, CrownIcon} from '../components/Icons';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {
  determineLevel,
  determinePointLevel,
  levelXp,
} from '../utils/level';
import {sumFormat} from '../utils/fortune';
import type {RootStackParamList} from '../navigation/types';

function localeFormat(n: number): string {
  try {
    return Math.floor(n).toLocaleString(undefined, {maximumFractionDigits: 0});
  } catch {
    return String(Math.floor(n));
  }
}

type ProfileUser = {
  first_name?: string;
  last_name?: string;
  username?: string;
  hasVoucher?: boolean;
  pointLevel?: number | null;
  pointXp?: number;
  level?: number;
  points_earned?: number;
  points_spent?: number;
  balanceEarned?: number;
  balanceSpent?: number;
  stats?: {weekActive?: number; spin_count?: number};
};

export function ProfileScreen() {
  const {t} = useTranslation();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {userData, logout} = useUserContext();

  const u = userData as ProfileUser | null;

  const displayName = useMemo(() => {
    if (!u) {
      return '';
    }
    if (u.first_name && u.last_name) {
      return `${u.first_name} ${u.last_name}`;
    }
    return u.username ?? '—';
  }, [u]);

  const userLevel =
    typeof u?.pointLevel === 'number' && u.pointLevel > 0 ? u.pointLevel : 1;
  const pointXp = typeof u?.pointXp === 'number' ? u.pointXp : 0;
  const maxXp = levelXp(userLevel);
  const fillPct =
    maxXp === Infinity || maxXp <= 0
      ? 0
      : Math.min(100, (pointXp / maxXp) * 100);

  const tierLevel = typeof u?.level === 'number' ? u.level : 1;

  const premium = !!u?.hasVoucher;

  const initialFirst =
    u?.first_name && /^[a-zA-ZА-Яа-яЁё]$/.test(u.first_name[0]!)
      ? u.first_name[0]
      : '?';
  const initialLast =
    u?.last_name && /^[a-zA-ZА-Яа-яЁё]$/.test(u.last_name[0]!)
      ? u.last_name[0]
      : '';

  return (
    <Screen safeTop>
      {!userData ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.profileNavigation}>
            <TouchableOpacity
              style={styles.backRow}
              onPress={() => nav.goBack()}
              activeOpacity={0.7}>
              <ArrowLeftIcon size={20} color="#757F9C" />
              <Text style={styles.backText}>{t('Back')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroCol}>
            <View
              style={[
                styles.profileImage,
                premium && styles.profileImagePremium,
              ]}>
              <Text style={styles.initials}>
                {initialFirst}
                {initialLast}
              </Text>
              {premium ? (
                <View style={styles.crownPremium}>
                  <CrownIcon size={14} color="#000" />
                </View>
              ) : null}
            </View>

            <Text
              style={[
                styles.profileName,
                premium && styles.profileNamePremium,
              ]}
              numberOfLines={3}>
              {displayName}
            </Text>

            <Text style={styles.levelNameLabel}>
              {t(determinePointLevel(userLevel))}
            </Text>
            <View style={styles.levelBar}>
              <View style={styles.levelCircle}>
                <Text style={styles.levelCircleText}>{userLevel}</Text>
              </View>
              <View style={styles.barContainer}>
                <View style={[styles.barFill, {width: `${fillPct}%`}]} />
              </View>
              <View style={styles.levelCircle}>
                <Text style={styles.levelCircleText}>{userLevel + 1}</Text>
              </View>
            </View>
            <Text style={styles.xpSpan}>
              {localeFormat(pointXp)}/
              {localeFormat(maxXp === Infinity ? 0 : maxXp)}
            </Text>
          </View>

          <Text style={styles.h3Title}>{t('Statistics')}</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title={`${t('Tier')}:`}
              value={t(determineLevel(tierLevel))}
              capitalize
            />
            <StatCard
              title={`${t('Level')}:`}
              value={`${t(determinePointLevel(userLevel))} ${userLevel}/14`}
            />
            <StatCard
              title={`${t('Total points earned')}:`}
              value={sumFormatSafe(u?.points_earned)}
            />
            <StatCard
              title={`${t('Total points spent')}:`}
              value={sumFormatSafe(u?.points_spent)}
            />
            <StatCard
              title={`${t('Total balance earned')}:`}
              value={sumFormatSafe(u?.balanceEarned)}
            />
            <StatCard
              title={`${t('Total balance spent')}:`}
              value={sumFormatSafe(u?.balanceSpent)}
            />
            <StatCard
              title={`${t('Weekly rewards')}:`}
              value={
                u?.stats?.weekActive != null
                  ? String(u.stats.weekActive)
                  : '—'
              }
            />
            <StatCard
              title={`${t('Spins completed')}:`}
              value={
                u?.stats?.spin_count != null
                  ? String(u.stats.spin_count)
                  : '—'
              }
            />
          </View>

          <PrimaryButton
            title={t('Log out', {defaultValue: 'Log out'})}
            onPress={() => logout()}
          />
        </ScrollView>
      )}
    </Screen>
  );
}

function sumFormatSafe(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) {
    return '—';
  }
  return sumFormat(n);
}

function StatCard({
  title,
  value,
  capitalize,
}: {
  title: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text
        style={[styles.statValue, capitalize && styles.statValueCapitalize]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  /** App.css `.profile-navigation` */
  profileNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  /** `.back-roulette` */
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  backText: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  heroCol: {
    alignItems: 'center',
    marginBottom: 24,
  },
  /** `.profile-image` + `.premium` border */
  profileImage: {
    marginHorizontal: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230, 33, 89, 0.24)',
    borderRadius: 50,
    width: 100,
    height: 100,
    position: 'relative',
  },
  profileImagePremium: {
    borderWidth: 1,
    borderColor: '#feb425',
  },
  /** `.referral-initials` inside avatar */
  initials: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  /** `.crown-premium` */
  crownPremium: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#feb425',
    borderRadius: 100,
    padding: 3,
  },
  /** `.profile-name` */
  profileName: {
    color: colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    textTransform: 'capitalize',
    fontFamily: fontFamily.semibold,
    alignSelf: 'stretch',
  },
  profileNamePremium: {
    color: '#FEB425',
  },
  /** `.level-name` */
  levelNameLabel: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    textTransform: 'capitalize',
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  /** `.level-bar` */
  levelBar: {
    marginTop: 16,
    marginBottom: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.levelCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCircleText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  barContainer: {
    flex: 1,
    marginHorizontal: 10,
    height: 6,
    borderRadius: 10,
    backgroundColor: colors.barFill,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  xpSpan: {
    fontSize: 11,
    color: '#545e76',
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    alignSelf: 'center',
  },
  /** `.h3-title` */
  h3Title: {
    marginTop: 16,
    marginBottom: 12,
    color: colors.textPrimary,
    fontSize: 16,
    fontStyle: 'italic',
    fontWeight: '600',
    textTransform: 'capitalize',
    fontFamily: fontFamily.semibold,
  },
  /** `.stats-container` */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  /** `.stat-item` — градиент заменён на сплошной низ как в токенах */
  statItem: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '48%',
    flexDirection: 'column',
    backgroundColor: colors.surfaceMuted,
    padding: 8,
    borderRadius: radii.md,
  },
  statTitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  statValueCapitalize: {
    textTransform: 'capitalize',
  },
});
