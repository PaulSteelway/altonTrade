import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import {useInfiniteQuery, useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {api} from '../api/client';
import {WEBAPP_URL} from '../config';
import {useUserContext} from '../context/UserContext';
import {
  BalanceCoinIcon,
  PointCoinIcon,
} from '../components/Icons';
import {Screen} from '../components/ui';
import {colors, radii, space} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {sumFormat} from '../utils/fortune';

const PAGE_SIZE = 100;
/** TWA `.referral-earned` */
const EARN_BALANCE_COLOR = '#9694e2';
/** TWA `.copy-button` */
const COPY_BTN_BG = '#3f132a';

type ReferralRow = {
  username?: string;
  first_name?: string;
  last_name?: string;
  referrerEarned?: number;
  referrerEarnedBalance?: number;
};

async function copyInviteLink(text: string): Promise<void> {
  const mod = require('@react-native-clipboard/clipboard') as {
    default?: {setString: (s: string) => Promise<void>};
    setString?: (s: string) => Promise<void>;
  };
  const Clipboard = mod.default ?? mod;
  await Clipboard.setString(text);
}

function initials(first?: string, last?: string) {
  const a =
    first && /^[a-zA-ZА-Яа-яЁё]$/u.test(first[0]!) ? first[0] : '?';
  const b =
    last && /^[a-zA-ZА-Яа-яЁё]$/u.test(last[0]!) ? last[0] : '';
  return `${a}${b}`;
}

export function FriendsScreen() {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {userData, refetchUser} = useUserContext();
  const [copied, setCopied] = useState(false);

  const tabBarClearance = Math.max(insets.bottom, 16) + 56;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['referrals'],
    initialPageParam: 0,
    queryFn: async ({pageParam}: {pageParam: number}) => {
      const {data: body} = await api.get<{
        referredUsers?: ReferralRow[];
        total?: number;
      }>('/api/users/me/referrals', {
        params: {limit: PAGE_SIZE, skip: pageParam},
      });
      return body;
    },
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage.total ?? 0;
      const loaded = allPages.reduce(
        (n, p) => n + (p.referredUsers?.length ?? 0),
        0,
      );
      return loaded < total ? loaded : undefined;
    },
  });

  const referrals = useMemo(
    () => data?.pages.flatMap(p => p.referredUsers ?? []) ?? [],
    [data?.pages],
  );
  const totalReferrals = data?.pages[0]?.total ?? 0;

  const claimMut = useMutation({
    mutationFn: async () => api.post('/api/users/referrals/claim'),
    onSuccess: () => {
      void refetchUser();
      void refetch();
    },
  });

  const uid =
    userData && typeof userData.user_id === 'number'
      ? userData.user_id
      : null;

  const inviteLink = useMemo(() => {
    if (uid == null) {
      return '';
    }
    return `${WEBAPP_URL}?startapp=${uid}`;
  }, [uid]);

  const refBalance =
    typeof userData?.referralBalance === 'number'
      ? userData.referralBalance
      : 0;

  const openTelegramShare = () => {
    if (!inviteLink) {
      return;
    }
    const text = t(
      'Join to Alton Trader - let`s create the first exchange token on TON together!🤑',
    );
    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      void Share.share({message: `${text}\n${inviteLink}`, url: inviteLink});
    });
  };

  const onShareFallback = async () => {
    if (!inviteLink) {
      return;
    }
    await Share.share({
      message: t(
        'Join to Alton Trader - let`s create the first exchange token on TON together!🤑',
      ),
      url: inviteLink,
    });
  };

  const onCopyLink = async () => {
    if (!inviteLink) {
      return;
    }
    try {
      await copyInviteLink(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert(
        t('Error'),
        t('clipboard_rebuild_hint', {
          defaultValue:
            'Clipboard native module is missing. Rebuild the app.',
        }),
      );
    }
  };

  const openTelegramUser = (username?: string) => {
    if (!username) {
      return;
    }
    const u = username.replace(/^@/, '');
    Linking.openURL(`https://t.me/${u}`).catch(() => {});
  };

  const loadedCount = referrals.length;
  const showLoadMore =
    hasNextPage && totalReferrals > 0 && loadedCount < totalReferrals;

  const footer = (
    <View style={[styles.footer, {paddingBottom: tabBarClearance}]}>
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={openTelegramShare}
          activeOpacity={0.85}>
          <Text style={styles.inviteBtnTxt}>{t('Invite Friend')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.copyIconBtn, copied && styles.copyIconBtnDone]}
          onPress={onCopyLink}
          disabled={!inviteLink}
          activeOpacity={0.85}>
          <Text style={styles.copyGlyph}>{copied ? '✓' : '⎘'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onShareFallback} style={styles.shareLink}>
        <Text style={styles.shareLinkTxt}>{t('Share via…')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Text style={styles.err}>
          {t('Error loading referrals', {defaultValue: 'Failed to load'})}
        </Text>
      </Screen>
    );
  }

  const emptyOnboarding = totalReferrals === 0;

  return (
    <Screen padded={false}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {paddingHorizontal: space.md},
          ]}
          showsVerticalScrollIndicator={false}>
          {emptyOnboarding ? (
            <>
              <Text style={styles.heroTitle}>
                {t('Invite friends & earn from 10%')}
              </Text>
              <View style={styles.emptyGrid}>
                {[
                  {
                    n: 1,
                    title: t('Share your invitation link'),
                    desc: t('Invite friends and earn rewards!'),
                  },
                  {
                    n: 2,
                    title: t('Friends start farming'),
                    desc: t('Get benefits from active friends!'),
                  },
                  {
                    n: 3,
                    title: t('Earn 10% from friends'),
                    desc: t('Get 10% and extra spins!'),
                  },
                ].map(row => (
                  <View key={row.n} style={styles.emptyRow}>
                    <View style={styles.emptyCircle}>
                      <Text style={styles.emptyCircleTxt}>{row.n}</Text>
                    </View>
                    <View style={styles.emptyTextCol}>
                      <Text style={styles.emptyTitle}>{row.title}</Text>
                      <Text style={styles.emptyDesc}>{row.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.disclaimerCenter}>
                {t(
                  'Tier Hamster does not count to prevent abuse by bot farms',
                )}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.heroTitle}>{t('Your friends')}</Text>
              <Text style={styles.heroSubtitle}>
                {t('Score 10% from them')}
                {'\n'}
                {t(
                  'Tier Hamster does not count to prevent abuse by bot farms',
                )}
              </Text>

              <View style={styles.inviteDetails}>
                <View style={styles.balanceRow}>
                  <PointCoinIcon size={18} />
                  <Text style={styles.balanceNum}>
                    {sumFormat(refBalance)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.claimPill,
                    refBalance <= 0 && styles.claimPillDisabled,
                  ]}
                  disabled={refBalance <= 0 || claimMut.isPending}
                  onPress={() => claimMut.mutate()}>
                  {claimMut.isPending ? (
                    <ActivityIndicator color={colors.textPrimary} size="small" />
                  ) : (
                    <Text style={styles.claimPillTxt}>{t('Claim')}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.totalFriends}>
                <Text style={styles.totalFriendsLbl}>{t('Friends')}:</Text>
                <Text style={styles.totalFriendsCnt}>{totalReferrals}</Text>
              </View>

              <View style={styles.refGrid}>
                {referrals.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.username ?? ''}-${index}`}
                    style={styles.refItem}
                    activeOpacity={item.username ? 0.85 : 1}
                    disabled={!item.username}
                    onPress={() => openTelegramUser(item.username)}>
                    <View style={styles.refAvatar}>
                      <Text style={styles.refInitials}>
                        {initials(item.first_name, item.last_name)}
                      </Text>
                    </View>
                    <Text style={styles.refName} numberOfLines={1}>
                      {`${item.first_name ?? ''} ${item.last_name ?? ''}`.trim() ||
                        item.username ||
                        '—'}
                    </Text>
                    <View style={styles.refEarns}>
                      <View style={styles.earnPts}>
                        <PointCoinIcon size={14} />
                        <Text style={styles.earnPtsTxt}>
                          {sumFormat(item.referrerEarned ?? 0)}
                        </Text>
                      </View>
                      <View style={styles.earnBal}>
                        <BalanceCoinIcon size={14} />
                        <Text style={styles.earnBalTxt}>
                          {sumFormat(item.referrerEarnedBalance ?? 0)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {showLoadMore ? (
                <TouchableOpacity
                  style={styles.loadMore}
                  onPress={() => fetchNextPage()}
                  disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.loadMoreTxt}>{t('Load More')}</Text>
                  )}
                </TouchableOpacity>
              ) : null}

              <View style={{height: space.md}} />
            </>
          )}
        </ScrollView>
        {footer}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  loader: {marginTop: 48},
  err: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: fontFamily.regular,
  },
  scrollContent: {
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  heroTitle: {
    color: colors.textPrimary,
    maxWidth: 280,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 8,
    fontSize: 24,
    fontStyle: 'italic',
    fontWeight: '700',
    lineHeight: 38,
    textTransform: 'capitalize',
    fontFamily: fontFamily.bold,
  },
  heroSubtitle: {
    marginTop: 4,
    marginBottom: 16,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: fontFamily.medium,
  },
  emptyGrid: {
    gap: 16,
    marginBottom: 16,
  },
  emptyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  emptyCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2d3241',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircleTxt: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  emptyTextCol: {flex: 1},
  emptyTitle: {
    fontWeight: '500',
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fontFamily.medium,
    textAlign: 'left',
  },
  emptyDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: fontFamily.medium,
    textTransform: 'capitalize',
  },
  disclaimerCenter: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: fontFamily.medium,
    textTransform: 'capitalize',
  },
  inviteDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginBottom: 16,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: space.md,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceNum: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  claimPill: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    minWidth: 88,
    alignItems: 'center',
  },
  claimPillDisabled: {
    backgroundColor: colors.disabledBg,
  },
  claimPillTxt: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: fontFamily.semibold,
  },
  totalFriends: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  totalFriendsLbl: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fontFamily.regular,
  },
  totalFriendsCnt: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    textTransform: 'capitalize',
  },
  refGrid: {
    gap: 8,
    marginBottom: 12,
  },
  refItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: space.md,
    borderRadius: radii.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surfaceMuted,
    gap: 10,
  },
  refAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refInitials: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    fontFamily: fontFamily.bold,
  },
  refName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
  },
  refEarns: {
    alignItems: 'flex-end',
    gap: 4,
  },
  earnPts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earnPtsTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  earnBal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earnBalTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: EARN_BALANCE_COLOR,
    fontFamily: fontFamily.semibold,
  },
  loadMore: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  loadMoreTxt: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
    fontFamily: fontFamily.semibold,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingTop: 12,
    paddingHorizontal: space.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inviteBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnTxt: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
    fontFamily: fontFamily.semibold,
  },
  copyIconBtn: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: COPY_BTN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIconBtnDone: {
    opacity: 0.85,
  },
  copyGlyph: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  shareLink: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  shareLinkTxt: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fontFamily.medium,
  },
});
