import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {SvgUri} from 'react-native-svg';

import {api} from '../api/client';
import {WEBAPP_URL} from '../config';
import {useUserContext} from '../context/UserContext';
import {PointCoinIcon, TicketIcon} from '../components/Icons';
import {navigationRef} from '../navigation/navigationRef';
import {AppModal, AppModalClose, Screen} from '../components/ui';
import {colors, radii, space} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {isToday, localeFormatNum} from '../utils/fortune';

type MissionCondition = {
  type?: string;
  con?: string | number;
};

export type MissionRow = {
  _id: string;
  title?: string;
  description?: string;
  mode?: string;
  daily?: boolean;
  /** Backend may store boolean or string */
  special?: boolean | string;
  language?: string;
  reward?: number;
  condition?: MissionCondition;
};

type UserMission = {
  id: string;
  status: string;
  completion_time?: string | Date | null;
};

type StartMissionResponse = {
  link?: string;
  message?: string;
  error?: string;
};

function isTruthySpecial(v: unknown): boolean {
  return v === true || v === 'true';
}

function isTruthyDaily(v: unknown): boolean {
  return v === true || v === 'true';
}

function missionMatchesUserLang(
  mission: MissionRow,
  languageCode?: string,
): boolean {
  if (!mission.language) {
    return true;
  }
  const lc = (languageCode ?? 'en').split('-')[0];
  if (lc === 'en') {
    return mission.language === 'en';
  }
  return mission.language !== 'en';
}

function missionIconUri(
  mission: MissionRow,
  status: string,
  daily: boolean,
  size: 'small' | 'medium',
): string {
  const color = daily ? 'red' : 'dark';
  const inactive = status === 'completed';
  const palette = inactive ? 'inactive' : color;
  const mode = mission.mode ?? 'profile';
  const condType = mission.condition?.type ?? 'default';
  const imageName = `${mode}_${condType}_${palette}_${size}`;
  return `${WEBAPP_URL}/icons-missions/${imageName}.svg`;
}

function MissionGlyph({
  uri,
  size,
}: {
  uri: string;
  size: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={[styles.glyphFallback, {width: size, height: size}]}>
        <Text style={styles.glyphFallbackTxt}>?</Text>
      </View>
    );
  }
  return (
    <SvgUri
      uri={uri}
      width={size}
      height={size}
      onError={() => setFailed(true)}
    />
  );
}

export function MissionsScreen() {
  const {t} = useTranslation();
  const {userData, refetchUser} = useUserContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMission, setModalMission] = useState<MissionRow | null>(null);
  const [modalDaily, setModalDaily] = useState(false);

  const userMissions: UserMission[] = useMemo(() => {
    const raw = userData?.missions;
    return Array.isArray(raw) ? (raw as UserMission[]) : [];
  }, [userData?.missions]);

  const getMissionStatus = useCallback(
    (missionId: string, daily = false): string => {
      const userMission = userMissions.find(m => m.id === missionId);
      if (daily && userMission?.completion_time) {
        return isToday(String(userMission.completion_time))
          ? userMission.status
          : 'not_started';
      }
      return userMission ? userMission.status : 'not_started';
    },
    [userMissions],
  );

  const {
    data: missions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['missions'],
    queryFn: async () => (await api.get<MissionRow[]>('/api/missions')).data,
  });

  const langCode =
    typeof userData?.language_code === 'string'
      ? userData.language_code
      : undefined;

  const completedMissions = useMemo(
    () =>
      missions.filter(mission => {
        const status = getMissionStatus(mission._id);
        return (
          status === 'completed' && missionMatchesUserLang(mission, langCode)
        );
      }),
    [getMissionStatus, langCode, missions],
  );

  const specialMissions = useMemo(
    () =>
      missions.filter(mission => {
        const status = getMissionStatus(mission._id);
        return (
          isTruthySpecial(mission.special) &&
          status !== 'completed' &&
          missionMatchesUserLang(mission, langCode)
        );
      }),
    [getMissionStatus, langCode, missions],
  );

  const ourMissions = useMemo(() => {
    const open = missions.filter(
      mission =>
        !isTruthyDaily(mission.daily) &&
        !isTruthySpecial(mission.special) &&
        getMissionStatus(mission._id) !== 'completed',
    );
    return [...open].sort((a, b) => {
      if (a.mode === 'youtube' && b.mode !== 'youtube') {
        return -1;
      }
      if (a.mode !== 'youtube' && b.mode === 'youtube') {
        return 1;
      }
      return 0;
    });
  }, [getMissionStatus, missions]);

  const allMissions = useMemo(
    () => ourMissions.filter(m => missionMatchesUserLang(m, langCode)),
    [langCode, ourMissions],
  );

  const dailyMissions = useMemo(
    () => missions.filter(m => isTruthyDaily(m.daily)),
    [missions],
  );

  const openModal = (mission: MissionRow, daily = false) => {
    setModalMission(mission);
    setModalDaily(daily);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMission(null);
  };

  const startMut = useMutation({
    mutationFn: async (missionId: string) => {
      const {data} = await api.post<StartMissionResponse>(
        '/api/missions/start',
        {mission_id: missionId},
      );
      return data;
    },
    onSuccess: () => refetchUser(),
  });

  const checkMut = useMutation({
    mutationFn: async (missionId: string) => {
      const {data} = await api.post<{reward?: number; message?: string}>(
        '/api/missions/check',
        {mission_id: missionId},
      );
      return data;
    },
    onSuccess: () => refetchUser(),
  });

  const openMissionAfterStart = useCallback(
    async (data: StartMissionResponse, mission: MissionRow) => {
      if (data.error) {
        Alert.alert(t('Error'), data.error);
        return;
      }

      if (mission.mode === 'profile' && mission.condition?.type === 'wallet') {
        navigationRef.navigate('Wallet');
        return;
      }

      if (
        mission.mode === 'telegram' &&
        mission.condition?.type === 'story'
      ) {
        const uid = userData?.user_id;
        const url = `${WEBAPP_URL}?startapp=${uid ?? ''}`;
        try {
          await Share.share({
            message: `${t('Join me to')} ${url}`,
            url,
          });
        } catch {
        Alert.alert(t('Error'), t('Could not open link', {defaultValue: 'Could not open link'}));
        }
        return;
      }

      let href = data.link;
      if (!href) {
        return;
      }

      if (href.startsWith('/') && !href.startsWith('//')) {
        href = `${WEBAPP_URL}${href}`;
      }

      if (mission.mode === 'telegram') {
        const can = await Linking.canOpenURL(href);
        if (can) {
          await Linking.openURL(href);
        } else {
          Alert.alert(
            t('Error'),
            t('Could not open link', {defaultValue: 'Could not open link'}),
          );
        }
        return;
      }

      const can = await Linking.canOpenURL(href);
      if (can) {
        await Linking.openURL(href);
      } else {
        Alert.alert(
          t('Error'),
          t('Could not open link', {defaultValue: 'Could not open link'}),
        );
      }
    },
    [t, userData?.user_id],
  );

  const handleStartMission = () => {
    if (!modalMission) {
      return;
    }
    const snap = modalMission;
    closeModal();
    startMut.mutate(snap._id, {
      onSuccess: resp => {
        openMissionAfterStart(resp, snap).catch(() => {});
      },
      onError: err => {
        const msg = axios.isAxiosError(err)
          ? (err.response?.data as {message?: string})?.message
          : undefined;
        Alert.alert(t('Error'), msg ?? String(err));
      },
    });
  };

  const handleCheckMission = () => {
    if (!modalMission) {
      return;
    }
    const id = modalMission._id;
    closeModal();
    checkMut.mutate(id, {
      onSuccess: res => {
        if (res.reward != null) {
          Alert.alert(
            t('OK', {defaultValue: 'OK'}),
            `+${localeFormatNum(res.reward, undefined, 0)} ${t('Points')}`,
          );
        }
      },
      onError: err => {
        const msg = axios.isAxiosError(err)
          ? (err.response?.data as {message?: string})?.message
          : undefined;
        Alert.alert(t('Error'), msg ?? t('Mission not completed', {defaultValue: 'Mission not completed'}));
      },
    });
  };

  const modalStatus = modalMission
    ? getMissionStatus(modalMission._id, modalDaily)
    : 'not_started';

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
          {t('Error loading missions', {defaultValue: 'Failed to load missions'})}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('Complete missions')}</Text>
        <Text style={styles.subtitle}>{t('To get more Points')}</Text>

        <Text style={styles.section}>{t('Daily missions')}:</Text>
        <View style={styles.list}>
          {dailyMissions.map(mission => {
            const st = getMissionStatus(mission._id, true);
            const done = st === 'completed';
            const uri = missionIconUri(mission, st, true, 'small');
            return (
              <TouchableOpacity
                key={mission._id}
                style={[styles.row, done && styles.rowChecked]}
                activeOpacity={done ? 1 : 0.85}
                disabled={done}
                onPress={() => !done && openModal(mission, true)}>
                <View style={styles.rowIcon}>
                  <MissionGlyph uri={uri} size={40} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>
                    {mission.title ? t(mission.title) : mission._id}
                  </Text>
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardWhite}>
                      +
                      {localeFormatNum(
                        typeof mission.reward === 'number' ? mission.reward : 0,
                        undefined,
                        0,
                      )}
                    </Text>
                    <PointCoinIcon size={14} />
                    <View style={styles.ticketChip}>
                      <Text style={styles.ticketTxt}>+3</Text>
                      <TicketIcon size={12} color="#7976E7" />
                    </View>
                  </View>
                </View>
                <Text style={styles.chevron}>{done ? '✓' : '›'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {specialMissions.length > 0 ? (
          <>
            <Text style={styles.section}>{t('Special missions')}:</Text>
            <View style={styles.list}>
              {specialMissions.map(mission => {
                const st = getMissionStatus(mission._id);
                const uri = missionIconUri(mission, st, false, 'small');
                return (
                  <TouchableOpacity
                    key={mission._id}
                    style={styles.row}
                    activeOpacity={0.85}
                    onPress={() => openModal(mission)}>
                    <View style={styles.rowIcon}>
                      <MissionGlyph uri={uri} size={40} />
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>
                        {mission.title ? t(mission.title) : mission._id}
                      </Text>
                      <View style={styles.rewardRow}>
                        <Text style={styles.rewardMuted}>
                          +
                          {localeFormatNum(
                            typeof mission.reward === 'number'
                              ? mission.reward
                              : 0,
                            undefined,
                            0,
                          )}
                        </Text>
                        <PointCoinIcon size={14} />
                        <View style={styles.ticketChip}>
                          <Text style={styles.ticketTxt}>+5</Text>
                          <TicketIcon size={12} color="#7976E7" />
                        </View>
                      </View>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={styles.section}>{t('All missions')}:</Text>
        <View style={styles.list}>
          {allMissions.map(mission => {
            const st = getMissionStatus(mission._id);
            const uri = missionIconUri(mission, st, false, 'small');
            return (
              <TouchableOpacity
                key={mission._id}
                style={styles.row}
                activeOpacity={0.85}
                onPress={() => openModal(mission)}>
                <View style={styles.rowIcon}>
                  <MissionGlyph uri={uri} size={40} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>
                    {mission.title ? t(mission.title) : mission._id}
                  </Text>
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardMuted}>
                      +
                      {localeFormatNum(
                        typeof mission.reward === 'number' ? mission.reward : 0,
                        undefined,
                        0,
                      )}
                    </Text>
                    <PointCoinIcon size={14} />
                    <View style={styles.ticketChip}>
                      <Text style={styles.ticketTxt}>+1</Text>
                      <TicketIcon size={12} color="#7976E7" />
                    </View>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.section}>{t('Completed missions')}:</Text>
        <View style={styles.list}>
          {completedMissions.map(mission => {
            const uri = missionIconUri(
              mission,
              'completed',
              false,
              'small',
            );
            return (
              <View key={mission._id} style={[styles.row, styles.rowChecked]}>
                <View style={styles.rowIcon}>
                  <MissionGlyph uri={uri} size={40} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>
                    {mission.title ? t(mission.title) : mission._id}
                  </Text>
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardMuted}>
                      +
                      {localeFormatNum(
                        typeof mission.reward === 'number' ? mission.reward : 0,
                        undefined,
                        0,
                      )}
                    </Text>
                    <PointCoinIcon size={14} />
                  </View>
                </View>
                <Text style={[styles.chevron, styles.checkDone]}>✓</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <AppModal
        visible={modalOpen}
        onClose={closeModal}
        variant="center"
        animationType="fade"
        maxHeightFraction={0.88}>
        {modalMission ? (
          <>
            <AppModalClose onPress={closeModal} />
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}>
              <View style={styles.modalImgWrap}>
                <MissionGlyph
                  uri={missionIconUri(
                    modalMission,
                    getMissionStatus(modalMission._id, modalDaily),
                    modalDaily,
                    'medium',
                  )}
                  size={72}
                />
              </View>
              <Text style={styles.modalTitle}>
                {modalMission.title
                  ? t(modalMission.title)
                  : modalMission._id}
              </Text>
              {modalMission.description ? (
                <Text style={styles.modalDesc}>
                  {t(modalMission.description)}
                </Text>
              ) : null}
              <TouchableOpacity
                style={styles.btnStart}
                onPress={handleStartMission}
                disabled={startMut.isPending}>
                <Text style={styles.btnStartTxt}>
                  {startMut.isPending ? t('Loading...') : t('Start')}
                </Text>
              </TouchableOpacity>
              {modalStatus !== 'not_started' ? (
                <TouchableOpacity
                  style={styles.btnCheck}
                  onPress={handleCheckMission}
                  disabled={checkMut.isPending}>
                  <Text style={styles.btnCheckTxt}>
                    {checkMut.isPending ? t('Loading...') : t('Check')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </>
        ) : null}
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {marginTop: 48},
  scroll: {paddingBottom: 40},
  err: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: fontFamily.regular,
  },
  title: {
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
    marginBottom: space.md,
    fontFamily: fontFamily.regular,
  },
  section: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 10,
    marginTop: 8,
    fontFamily: fontFamily.semibold,
  },
  list: {gap: 8, marginBottom: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: 12,
    gap: 12,
  },
  rowChecked: {
    opacity: 0.85,
  },
  rowIcon: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {flex: 1, minWidth: 0},
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    fontFamily: fontFamily.semibold,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  rewardMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
  },
  ticketChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  ticketTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  chevron: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '300',
    width: 28,
    textAlign: 'center',
  },
  checkDone: {
    color: colors.primary,
    fontWeight: '700',
  },
  glyphFallback: {
    borderRadius: radii.sm,
    backgroundColor: colors.barFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphFallbackTxt: {
    color: colors.textMuted,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  modalImgWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: fontFamily.bold,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
  },
  btnStart: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnStartTxt: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  btnCheck: {
    backgroundColor: colors.tabStrip,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  btnCheckTxt: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
});
