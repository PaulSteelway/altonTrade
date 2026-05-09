import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {
  AcademyGlobalLeaderboard,
} from '../components/AcademyLeaderboardViews';
import {BalanceCoinIcon, PointCoinIcon, TicketIcon} from '../components/Icons';
import {api} from '../api/client';
import type {AcademyStackParamList} from '../navigation/MainTabs';
import {Screen} from '../components/ui';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {getYouTubeThumbnail} from '../utils/youtube';
import {localeFormatNum} from '../utils/fortune';

type LangCode = 'en' | 'ru' | 'uk';

type AcademyRow = {
  _id?: string;
  lessonId: number;
  title: Partial<Record<LangCode, string>>;
  youtubeLinkRu?: string;
  youtubeLinkEnUk?: string;
  duration?: number;
  price?: number;
  result?: {completed?: boolean; points?: number};
};

function pointsResultColor(points: number): string {
  if (points >= 280000) {
    return '#1FCC8B';
  }
  if (points >= 250000) {
    return '#feb425';
  }
  if (points >= 220000) {
    return '#cd7f32';
  }
  return '#E62159';
}

export function AcademyScreen() {
  const {t, i18n} = useTranslation();
  const nav =
    useNavigation<NativeStackNavigationProp<AcademyStackParamList>>();
  const [tab, setTab] = useState<'lessons' | 'leaderboard'>('lessons');

  const lang: LangCode = ['ru', 'uk'].includes(i18n.language)
    ? (i18n.language.split('-')[0] as LangCode)
    : 'en';

  const {data: academies, isLoading, isError} = useQuery({
    queryKey: ['academies'],
    queryFn: async () => (await api.get<AcademyRow[]>('/api/academies')).data,
  });

  const {completed, active} = useMemo(() => {
    const list = academies ?? [];
    const done = list.filter(a => a.result?.completed === true);
    const act = list.filter(a => a.result?.completed !== true);
    return {completed: done, active: act};
  }, [academies]);

  const renderActiveCard = (academy: AcademyRow, index: number) => {
    const isFirst = index === 0;
    const hasResult = !!academy.result;
    const unlocked = isFirst || hasResult;
    const thumbUrl =
      lang === 'ru' || lang === 'uk'
        ? academy.youtubeLinkRu
        : academy.youtubeLinkEnUk;
    const uri =
      thumbUrl && getYouTubeThumbnail(thumbUrl)
        ? getYouTubeThumbnail(thumbUrl)
        : undefined;
    const title =
      academy.title[lang] ?? academy.title.en ?? academy.title.ru ?? '—';
    const price = typeof academy.price === 'number' ? academy.price : 0;
    const dur = academy.duration ?? 0;

    return (
      <TouchableOpacity
        key={academy.lessonId}
        style={[styles.academyItem, !unlocked && styles.academyItemDisabled]}
        activeOpacity={unlocked ? 0.85 : 1}
        disabled={!unlocked}
        onPress={() =>
          unlocked
            ? nav.navigate('AcademyDetail', {lessonId: academy.lessonId})
            : undefined
        }>
        <View style={styles.academyRow}>
          <View style={styles.thumbWrap}>
            {uri ? (
              <Image source={{uri}} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPh]} />
            )}
            <View style={styles.timingBadge}>
              <Text style={styles.timingText}>
                {dur} {t('m')}
              </Text>
            </View>
          </View>
          <View style={styles.content}>
            <View style={styles.lessonRow}>
              <Text style={styles.lessonLabel}>
                {t('Lesson')} {academy.lessonId}{' '}
              </Text>
              {unlocked ? (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>{t('Active')}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {title}
            </Text>
            <View style={styles.rewardRow}>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardTxt}>+{price * 2}</Text>
                <BalanceCoinIcon size={12} />
              </View>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardTxt}>
                  +{price * 10000 / 1000000}M
                </Text>
                <PointCoinIcon size={12} />
              </View>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardTxt}>+10</Text>
                <TicketIcon size={12} color="#7976E7" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCompletedCard = (academy: AcademyRow) => {
    const thumbUrl =
      lang === 'ru' || lang === 'uk'
        ? academy.youtubeLinkRu
        : academy.youtubeLinkEnUk;
    const uri =
      thumbUrl && getYouTubeThumbnail(thumbUrl)
        ? getYouTubeThumbnail(thumbUrl)
        : undefined;
    const title =
      academy.title[lang] ?? academy.title.en ?? academy.title.ru ?? '—';
    const pts =
      typeof academy.result?.points === 'number' ? academy.result.points : 0;

    return (
      <TouchableOpacity
        key={`done-${academy.lessonId}`}
        style={[styles.academyItem, styles.academyItemDone]}
        activeOpacity={0.85}
        onPress={() =>
          nav.navigate('AcademyDetail', {lessonId: academy.lessonId})
        }>
        <View style={styles.academyRow}>
          <View style={styles.thumbWrap}>
            {uri ? (
              <Image source={{uri}} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPh]} />
            )}
            <View style={styles.checkBadge}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <View style={styles.timingBadge}>
              <Text style={styles.timingText}>
                {academy.duration ?? 0} {t('m')}
              </Text>
            </View>
          </View>
          <View style={styles.content}>
            <Text style={styles.lessonLabel}>
              {t('Lesson')} {academy.lessonId}
            </Text>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.pointsLine, {color: pointsResultColor(pts)}]}>
              {t('Points')}: {localeFormatNum(pts, undefined, 0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.error}>{t('Error loading academies.')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.pageTitle}>{t('Academy')}</Text>
      <Text style={styles.subtitle}>
        {t('Complete lessons to gain access to the drop')}
      </Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'lessons' && styles.tabBtnOn]}
          onPress={() => setTab('lessons')}>
          <Text
            style={[styles.tabTxt, tab === 'lessons' && styles.tabTxtOn]}>
            {t('Lessons')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'leaderboard' && styles.tabBtnOn]}
          onPress={() => setTab('leaderboard')}>
          <Text
            style={[
              styles.tabTxt,
              tab === 'leaderboard' && styles.tabTxtOn,
            ]}>
            {t('Leaderboard')}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'lessons' ? (
        <ScrollView
          contentContainerStyle={styles.listPad}
          showsVerticalScrollIndicator={false}>
          {active.length > 0 ? (
            <Text style={styles.sectionTitle}>{t('New Lessons:')}</Text>
          ) : null}
          {active.map((a, i) => renderActiveCard(a, i))}

          {completed.length > 0 ? (
            <Text style={[styles.sectionTitle, styles.sectionCompleted]}>
              {t('Completed lessons:')}
            </Text>
          ) : null}
          {completed.map(renderCompletedCard)}
        </ScrollView>
      ) : (
        <AcademyGlobalLeaderboard />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {marginTop: 48},
  error: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: fontFamily.regular,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: fontFamily.regular,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.tabStrip,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  tabBtnOn: {
    backgroundColor: colors.tabPillActive,
  },
  tabTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily: fontFamily.semibold,
  },
  tabTxtOn: {
    color: colors.textPrimary,
  },
  listPad: {paddingBottom: 40},
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 12,
    fontFamily: fontFamily.semibold,
  },
  sectionCompleted: {
    marginTop: 20,
  },
  academyItem: {
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 10,
    overflow: 'hidden',
  },
  academyItemDisabled: {
    opacity: 0.45,
  },
  academyItemDone: {
    opacity: 1,
  },
  academyRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  thumbWrap: {
    width: 96,
    position: 'relative',
  },
  thumb: {
    width: 96,
    height: 72,
    borderRadius: radii.sm,
    backgroundColor: colors.barFill,
  },
  thumbPh: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timingBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  timingText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#39C73E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  content: {flex: 1, minWidth: 0},
  lessonRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'},
  lessonLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  activePill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginLeft: 4,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: fontFamily.semibold,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
    fontFamily: fontFamily.semibold,
  },
  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  pointsLine: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
});
