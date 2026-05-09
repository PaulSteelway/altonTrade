import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {api} from '../api/client';
import {useUserContext} from '../context/UserContext';
import {CrownIcon} from './Icons';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {localeFormatNum} from '../utils/fortune';

export type BoardEntry = {
  userId: number;
  firstName?: string;
  lastName?: string;
  points?: number;
  totalPoints?: number;
  hasVoucher?: boolean;
};

type BoardPayload = {
  topResults?: BoardEntry[];
};

function displayName(
  first?: string,
  last?: string | null,
  slice = 20,
): string {
  const name =
    first && last ? `${first} ${last}` : first || '';
  return name.length > slice ? `${name.slice(0, slice)}…` : name;
}

function InitialAvatar({
  firstName,
  lastName,
  hasVoucher,
  rankBadge,
}: {
  firstName?: string;
  lastName?: string;
  hasVoucher?: boolean;
  rankBadge?: number;
}) {
  const a =
    firstName && /^[a-zA-ZА-Яа-яЁё]$/u.test(firstName[0]!)
      ? firstName[0]
      : '?';
  const b =
    lastName && /^[a-zA-ZА-Яа-яЁё]$/u.test(lastName[0]!)
      ? lastName[0]
      : '';
  return (
    <View style={[styles.avatar, hasVoucher && styles.avatarPremium]}>
      <Text style={styles.avatarInitials}>
        {a}
        {b}
      </Text>
      {rankBadge != null ? (
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>{rankBadge}</Text>
        </View>
      ) : null}
      {hasVoucher ? (
        <View style={styles.crownWrap}>
          <CrownIcon size={11} color="#000" />
        </View>
      ) : null}
    </View>
  );
}

/** GET /api/academy-results — global XP totals */
export function AcademyGlobalLeaderboard() {
  const {t} = useTranslation();
  const {userData} = useUserContext();

  const {data, isLoading, isError} = useQuery({
    queryKey: ['academyGlobalTop'],
    queryFn: async () => (await api.get<BoardPayload>('/api/academy-results')).data,
  });

  if (isLoading) {
    return (
      <ActivityIndicator
        color={colors.primary}
        style={styles.loader}
      />
    );
  }
  if (isError) {
    return (
      <Text style={styles.err}>
        {t('Error loading leaderboard', {defaultValue: 'Error loading leaderboard'})}
      </Text>
    );
  }

  const top = data?.topResults ?? [];
  const topThree = top.slice(0, 3);
  const rest = top.slice(3);
  const myId = userData?.user_id;

  return (
    <ScrollView
      style={styles.boardScroll}
      showsVerticalScrollIndicator={false}>
      {topThree.length > 0 ? (
        <View style={styles.topThreeRow}>
          {topThree.map((entry, index) => {
            const isMe = myId != null && entry.userId === myId;
            const pts = entry.totalPoints ?? 0;
            return (
              <View
                key={`${entry.userId}-${index}`}
                style={[styles.topThreeEntry, styles[`pos${index + 1}`]]}>
                <InitialAvatar
                  firstName={entry.firstName}
                  lastName={entry.lastName}
                  hasVoucher={entry.hasVoucher}
                  rankBadge={index + 1}
                />
                <Text
                  style={[styles.lbName, isMe && styles.lbMe]}
                  numberOfLines={2}>
                  {displayName(entry.firstName, entry.lastName ?? null, 15)}
                </Text>
                <Text style={[styles.lbScore, isMe && styles.lbMe]}>
                  {localeFormatNum(pts)} XP
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {rest.map((entry, index) => {
        const isMe = myId != null && entry.userId === myId;
        const rank = index + 4;
        const pts = entry.totalPoints ?? 0;
        return (
          <View
            key={`${entry.userId}-r-${rank}`}
            style={[styles.row, isMe && styles.rowMe]}>
            <Text style={styles.rankNum}>{rank}</Text>
            <InitialAvatar
              firstName={entry.firstName}
              lastName={entry.lastName}
              hasVoucher={entry.hasVoucher}
            />
            <Text style={[styles.rowName, isMe && styles.lbMe]} numberOfLines={1}>
              {displayName(entry.firstName, entry.lastName)}
            </Text>
            <Text style={[styles.rowScore, isMe && styles.lbMe]}>
              {localeFormatNum(pts)} XP
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

/** GET /api/academy-results/:lessonId */
export function AcademyLessonLeaderboard({lessonId}: {lessonId: number}) {
  const {t} = useTranslation();
  const {userData} = useUserContext();

  const {data, isLoading, isError} = useQuery({
    queryKey: ['academyLessonTop', lessonId],
    queryFn: async () =>
      (await api.get<BoardPayload>(`/api/academy-results/${lessonId}`)).data,
  });

  if (isLoading) {
    return (
      <ActivityIndicator
        color={colors.primary}
        style={styles.loader}
      />
    );
  }
  if (isError) {
    return (
      <Text style={styles.err}>
        {t('Error loading leaderboard', {defaultValue: 'Error loading leaderboard'})}
      </Text>
    );
  }

  const top = data?.topResults ?? [];
  const topThree = top.slice(0, 3);
  const rest = top.slice(3);
  const myId = userData?.user_id;

  return (
    <ScrollView
      style={styles.boardScroll}
      showsVerticalScrollIndicator={false}>
      {topThree.length > 0 ? (
        <View style={styles.topThreeRow}>
          {topThree.map((entry, index) => {
            const isMe = myId != null && entry.userId === myId;
            const pts = entry.points ?? 0;
            return (
              <View
                key={`${entry.userId}-${index}`}
                style={[styles.topThreeEntry, styles[`pos${index + 1}`]]}>
                <InitialAvatar
                  firstName={entry.firstName}
                  lastName={entry.lastName}
                  hasVoucher={entry.hasVoucher}
                  rankBadge={index + 1}
                />
                <Text
                  style={[styles.lbName, isMe && styles.lbMe]}
                  numberOfLines={2}>
                  {displayName(entry.firstName, null, 15)}
                </Text>
                <Text style={[styles.lbScore, isMe && styles.lbMe]}>
                  {localeFormatNum(pts)} XP
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {rest.map((entry, index) => {
        const isMe = myId != null && entry.userId === myId;
        const rank = index + 4;
        const pts = entry.points ?? 0;
        return (
          <View
            key={`${entry.userId}-lr-${rank}`}
            style={[styles.row, isMe && styles.rowMe]}>
            <Text style={styles.rankNum}>{rank}</Text>
            <InitialAvatar
              firstName={entry.firstName}
              lastName={entry.lastName}
              hasVoucher={entry.hasVoucher}
            />
            <Text style={[styles.rowName, isMe && styles.lbMe]} numberOfLines={1}>
              {displayName(entry.firstName, entry.lastName)}
            </Text>
            <Text style={[styles.rowScore, isMe && styles.lbMe]}>
              {localeFormatNum(pts)} XP
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {marginVertical: 24},
  err: {
    color: colors.error,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
  },
  boardScroll: {marginTop: 8, marginBottom: 16},
  topThreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  topThreeEntry: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  pos1: {paddingTop: 0},
  pos2: {paddingTop: 12},
  pos3: {paddingTop: 12},
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.levelCircle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  avatarPremium: {
    borderWidth: 1,
    borderColor: colors.crownGold,
  },
  avatarInitials: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  crownWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.crownGold,
    borderRadius: 100,
    padding: 2,
  },
  lbName: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    marginBottom: 4,
  },
  lbScore: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  lbMe: {
    color: '#1FCC8B',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 8,
    gap: 8,
  },
  rowMe: {
    borderWidth: 1,
    borderColor: 'rgba(31, 204, 139, 0.4)',
  },
  rankNum: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
  },
  rowName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
  },
  rowScore: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
});
