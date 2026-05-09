import React, {useCallback, useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {
  AcademyLessonLeaderboard,
} from '../components/AcademyLeaderboardViews';
import {
  BalanceCoinIcon,
  ClockIcon,
  PointCoinIcon,
  TicketIcon,
  VideoIcon,
} from '../components/Icons';
import {api} from '../api/client';
import type {AcademyStackParamList} from '../navigation/MainTabs';
import {useAppodealRewarded} from '../hooks/useAppodeal';
import {useUserContext} from '../context/UserContext';
import {AppModal, AppModalClose, Screen} from '../components/ui';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {getYouTubeThumbnail} from '../utils/youtube';

type LangCode = 'en' | 'ru' | 'uk';

type Localized = Partial<Record<LangCode, string>>;

type AcademyDetail = {
  lessonId: number;
  title: Localized;
  description?: Localized;
  youtubeLinkRu?: string;
  youtubeLinkEnUk?: string;
  duration?: number;
  price?: number;
  result?: {completed?: boolean};
};

const YT_KEY = (lessonId: number) => `youtubeOpened_${lessonId}`;
const TEST_GATE = (lessonId: number) => `academyTestGate_${lessonId}`;

export function AcademyDetailScreen() {
  const {t, i18n} = useTranslation();
  const queryClient = useQueryClient();
  const nav =
    useNavigation<NativeStackNavigationProp<AcademyStackParamList>>();
  const route = useRoute<RouteProp<AcademyStackParamList, 'AcademyDetail'>>();
  const {lessonId} = route.params;
  const {userData, refetchUser} = useUserContext();

  const lang: LangCode = ['ru', 'uk'].includes(i18n.language)
    ? (i18n.language.split('-')[0] as LangCode)
    : 'en';

  const [tab, setTab] = useState<'lesson' | 'leaderboard'>('lesson');
  const [youtubeOpened, setYoutubeOpened] = useState(false);
  const [adModal, setAdModal] = useState(false);
  const {data: academy, isLoading, isError} = useQuery({
    queryKey: ['academy', lessonId],
    queryFn: async () =>
      (await api.get<AcademyDetail>(`/api/academies/${lessonId}`)).data,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const v = await AsyncStorage.getItem(YT_KEY(lessonId));
      if (!cancelled && v === 'true') {
        setYoutubeOpened(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const titleStr = useMemo(() => {
    if (!academy?.title) {
      return `Lesson ${lessonId}`;
    }
    return (
      academy.title[lang] ??
      academy.title.en ??
      academy.title.ru ??
      `Lesson ${lessonId}`
    );
  }, [academy, lang, lessonId]);

  useLayoutEffect(() => {
    nav.setOptions({title: titleStr});
  }, [nav, titleStr]);

  const thumbUri = useMemo(() => {
    const raw =
      lang === 'ru' || lang === 'uk'
        ? academy?.youtubeLinkRu
        : academy?.youtubeLinkEnUk;
    return raw ? getYouTubeThumbnail(raw) : '';
  }, [academy, lang]);

  const youtubeUrl = useMemo(() => {
    if (!academy) {
      return '';
    }
    return lang === 'ru' || lang === 'uk'
      ? academy.youtubeLinkRu ?? ''
      : academy.youtubeLinkEnUk ?? '';
  }, [academy, lang]);

  const price = typeof academy?.price === 'number' ? academy.price : 0;
  const duration = academy?.duration ?? 0;
  const hasCompleted = academy?.result?.completed === true;

  const retryUnit = userData?.hasVoucher ? 10 : 20;
  const retryCount =
    typeof userData?.retryTest === 'number' && userData.retryTest > 0
      ? userData.retryTest
      : 1;
  const retryCost = retryCount * retryUnit;

  const balance = typeof userData?.balance === 'number' ? userData.balance : 0;

  const startMut = useMutation({
    mutationFn: async (payload: {lessonId: number; ad?: boolean}) => {
      const {data} = await api.post<{result?: unknown}>(
        '/api/academy-results/start',
        payload,
      );
      return data;
    },
  });

  const retryMut = useMutation({
    mutationFn: async (payload: {lessonId: number; ad: boolean}) => {
      const {data} = await api.post<{result?: unknown}>(
        '/api/academy-results/retry',
        payload,
      );
      return data;
    },
  });

  const runAfterSuccess = useCallback(
    async (payload: {result?: unknown} | undefined) => {
      await refetchUser();
      await queryClient.invalidateQueries({queryKey: ['academies']});
      if (payload?.result) {
        await AsyncStorage.setItem(TEST_GATE(lessonId), '1');
        nav.navigate('AcademyTest', {lessonId});
      }
    },
    [lessonId, nav, queryClient, refetchUser],
  );

  const executeExam = useCallback(
    async (opts: {withAd: boolean}) => {
      if (!academy) {
        return;
      }
      if (!youtubeOpened) {
        Alert.alert(
          t('Pay attention!'),
          t('Watch our short promo to see what Alton Academy is all about! Learn what\'s coming and get ready to dive into DeFi with us', {
            defaultValue:
              'Please open the lesson video on YouTube first (tap “Go to Youtube”).',
          }),
        );
        return;
      }

      const hasResult = !!academy.result;

      if (!opts.withAd) {
        if (hasResult) {
          if (
            typeof userData?.retryTest === 'number' &&
            userData.retryTest > 0 &&
            balance < retryCost
          ) {
            Alert.alert(t('Error'), t('Insufficient points'));
            return;
          }
        } else if (balance < price) {
          Alert.alert(t('Error'), t('Insufficient points'));
          return;
        }
      }

      try {
        if (hasResult) {
          const data = await retryMut.mutateAsync({
            lessonId,
            ad: opts.withAd,
          });
          await runAfterSuccess(data);
        } else {
          const data = await startMut.mutateAsync({
            lessonId,
            ad: opts.withAd || undefined,
          });
          await runAfterSuccess(data);
        }
      } catch {
        Alert.alert(t('Error'), t('An unexpected error occurred while updating the wallet.:', {defaultValue: 'Request failed'}));
      }
    },
    [
      academy,
      balance,
      lessonId,
      price,
      retryCost,
      retryMut,
      runAfterSuccess,
      startMut,
      t,
      userData?.retryTest,
      youtubeOpened,
    ],
  );

  const {showRewarded} = useAppodealRewarded({
    onReward: () => executeExam({withAd: true}),
    onFail: () => setAdModal(true),
  });

  const handleGoYoutube = useCallback(async () => {
    if (!youtubeUrl) {
      return;
    }
    const can = await Linking.canOpenURL(youtubeUrl);
    if (can) {
      await Linking.openURL(youtubeUrl);
      await AsyncStorage.setItem(YT_KEY(lessonId), 'true');
      setYoutubeOpened(true);
    }
  }, [lessonId, youtubeUrl]);

  const loadingExam = startMut.isPending || retryMut.isPending;

  const showVideoAdBtn =
    !!academy?.result &&
    typeof userData?.retryTest === 'number' &&
    userData.retryTest < 3;

  if (isLoading) {
    return (
      <Screen>
        <Text style={styles.muted}>{t('Loading...')}</Text>
      </Screen>
    );
  }

  if (isError || !academy) {
    return (
      <Screen>
        <Text style={styles.err}>{t('Error loading academies.')}</Text>
      </Screen>
    );
  }

  const desc =
    academy.description?.[lang] ??
    academy.description?.en ??
    academy.description?.ru ??
    '';

  return (
    <View style={styles.root}>
      {thumbUri ? (
        <Image source={{uri: thumbUri}} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPh]} />
      )}

      <Screen style={styles.sheet} padded={false}>
        <ScrollView
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'lesson' && styles.tabOn]}
              onPress={() => setTab('lesson')}>
              <Text
                style={[styles.tabTxt, tab === 'lesson' && styles.tabTxtOn]}>
                {t('Lesson')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'leaderboard' && styles.tabOn]}
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

          {tab === 'lesson' ? (
            <>
              <View style={styles.rewardGrid}>
                {hasCompleted ? (
                  <>
                    <View style={styles.rewardDone}>
                      <Text style={styles.checkDark}>✓</Text>
                      <Text style={styles.rewardAmt}>{price * 2}</Text>
                      <BalanceCoinIcon size={14} />
                    </View>
                    <View style={styles.rewardDone}>
                      <Text style={styles.checkDark}>✓</Text>
                      <Text style={styles.rewardAmt}>
                        {price * 10000 / 1000000}M
                      </Text>
                      <PointCoinIcon size={14} />
                    </View>
                    <View style={styles.rewardDone}>
                      <Text style={styles.checkDark}>✓</Text>
                      <Text style={styles.rewardAmt}>10</Text>
                      <TicketIcon size={14} color="#7976E7" />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.rewardOpen}>
                      <Text style={styles.rewardAmt}>+ {price * 2}</Text>
                      <BalanceCoinIcon size={14} />
                    </View>
                    <View style={styles.rewardOpen}>
                      <Text style={styles.rewardAmt}>
                        + {price * 10000 / 1000000}M
                      </Text>
                      <PointCoinIcon size={14} />
                    </View>
                    <View style={styles.rewardOpen}>
                      <Text style={styles.rewardAmt}>+ 10</Text>
                      <TicketIcon size={14} color="#7976E7" />
                    </View>
                  </>
                )}
              </View>

              <Text style={styles.h1}>{titleStr}</Text>

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleGoYoutube}
                activeOpacity={0.85}>
                <Text style={styles.btnPrimaryTxt}>{t('Go to Youtube')}</Text>
              </TouchableOpacity>

              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={[styles.btnExam, styles.btnExamFlex]}
                  disabled={!youtubeOpened || loadingExam}
                  onPress={() => executeExam({withAd: false})}
                  activeOpacity={0.85}>
                  <Text style={styles.btnExamTxt}>
                    {loadingExam
                      ? t('Loading...')
                      : academy.result
                        ? `${t('Re-Test')} ${retryCost} `
                        : `${t('Start exam')} `}
                  </Text>
                  {!academy.result ? (
                    <>
                      <BalanceCoinIcon size={16} />
                      <Text style={styles.btnExamTxt}> {price}</Text>
                    </>
                  ) : (
                    <BalanceCoinIcon size={16} />
                  )}
                </TouchableOpacity>
                {showVideoAdBtn ? (
                  <TouchableOpacity
                    style={styles.btnVideo}
                    disabled={!youtubeOpened || loadingExam}
                    onPress={() => showRewarded()}
                    activeOpacity={0.85}>
                    <VideoIcon size={22} color={colors.textPrimary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLesson}>
                  {t('Lesson')} {academy.lessonId}
                </Text>
                <View style={styles.metaTime}>
                  <ClockIcon size={16} color={colors.textMuted} />
                  <Text style={styles.metaTimeTxt}>
                    {' '}
                    {duration} {t('m')}
                  </Text>
                </View>
              </View>

              {desc ? <Text style={styles.body}>{desc}</Text> : null}
            </>
          ) : (
            <AcademyLessonLeaderboard lessonId={lessonId} />
          )}
        </ScrollView>
      </Screen>

      <AppModal
        visible={adModal}
        onClose={() => setAdModal(false)}
        variant="center"
        animationType="fade">
        <>
          <AppModalClose onPress={() => setAdModal(false)} />
          <Text style={styles.adTitle}>{t('Pay attention!')}</Text>
          <Text style={styles.adBody}>{t('Add not found')}</Text>
          <TouchableOpacity
            style={styles.adOk}
            onPress={() => setAdModal(false)}>
            <Text style={styles.adOkTxt}>OK</Text>
          </TouchableOpacity>
        </>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  hero: {
    width: '100%',
    height: 180,
    backgroundColor: colors.surface,
  },
  heroPh: {},
  sheet: {flex: 1},
  pad: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 12,
  },
  muted: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: fontFamily.regular,
  },
  err: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 24,
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
  tabOn: {
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
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  rewardDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(57, 199, 62, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  rewardOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  checkDark: {
    color: '#39C73E',
    fontWeight: '800',
    marginRight: 2,
  },
  rewardAmt: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  h1: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    fontFamily: fontFamily.bold,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryTxt: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
    marginBottom: 20,
  },
  btnExam: {
    backgroundColor: colors.tabStrip,
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  btnExamFlex: {
    flex: 1,
  },
  btnExamTxt: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  btnVideo: {
    width: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.tabStrip,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaLesson: {
    fontSize: 14,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  metaTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaTimeTxt: {
    fontSize: 14,
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    fontFamily: fontFamily.bold,
  },
  adBody: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
    fontFamily: fontFamily.regular,
  },
  adOk: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  adOkTxt: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
});
