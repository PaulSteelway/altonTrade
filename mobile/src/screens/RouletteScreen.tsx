import React from 'react';
import {
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {api} from '../api/client';
import {useUserContext} from '../context/UserContext';
import {useAppodealRewarded} from '../hooks/useAppodeal';
import {Card, PrimaryButton, Screen, SectionTitle, MutedText} from '../components/ui';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';

export function RouletteScreen() {
  const {t} = useTranslation();

  const {refetchUser, userData} = useUserContext();

  const spinMut = useMutation({
    mutationFn: async () => (await api.get('/api/users/fortune')).data,
    onSuccess: () => refetchUser(),
  });

  const claimMut = useMutation({
    mutationFn: async () => (await api.post('/api/users/fortune')).data,
    onSuccess: () => refetchUser(),
  });

  const addSpinMut = useMutation({
    mutationFn: async () => (await api.get('/api/users/fortune/add')).data,
    onSuccess: () => refetchUser(),
  });

  const {showRewarded} = useAppodealRewarded({
    onReward: () => addSpinMut.mutate(),
    onFail: () => Alert.alert(t('Error'), 'Ad not available'),
  });

  const fortuneLeft =
    userData && typeof userData === 'object' && 'fortune' in userData
      ? (userData as {fortune?: number}).fortune
      : undefined;

  const lastSpin =
    spinMut.data != null &&
    typeof spinMut.data === 'object' &&
    'lastFortune' in spinMut.data
      ? String((spinMut.data as {lastFortune?: unknown}).lastFortune)
      : null;

  return (
    <Screen>
      <SectionTitle>{t('Roulette')}</SectionTitle>
      <Card style={styles.hero}>
        <MutedText>{t('Spins left')}</MutedText>
        <Text style={styles.big}>{fortuneLeft ?? '—'}</Text>
      </Card>
      <PrimaryButton
        title="Spin"
        onPress={() => spinMut.mutate()}
        disabled={spinMut.isPending}
        loading={spinMut.isPending}
        style={styles.btn}
      />
      <TouchableOpacity
        style={styles.secondary}
        onPress={() => claimMut.mutate()}
        activeOpacity={0.85}>
        <Text style={styles.secondaryText}>{t('Claim')} reward</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.outline}
        onPress={() => showRewarded()}
        disabled={addSpinMut.isPending}
        activeOpacity={0.85}>
        {addSpinMut.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.outlineText}>{`${t('Add Spin')} (Appodeal)`}</Text>
        )}
      </TouchableOpacity>
      {lastSpin != null ? (
        <MutedText style={styles.result}>
          {t('Result')}: {lastSpin}
        </MutedText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  big: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 8,
    fontFamily: fontFamily.bold,
  },
  btn: {marginBottom: 12},
  secondary: {
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.tabStrip,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  outline: {
    paddingVertical: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  outlineText: {
    color: colors.primary,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  result: {marginTop: 8, textAlign: 'center'},
});
