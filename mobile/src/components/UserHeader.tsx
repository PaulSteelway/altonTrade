import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';

import {navigationRef} from '../navigation/navigationRef';
import {colors, radii} from '../theme/tokens';

type Props = {
  firstName?: string;
  points?: number;
};

export function UserHeader({firstName, points}: Props) {
  const {t} = useTranslation();
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.name}>{firstName ?? '—'}</Text>
        <Text style={styles.points}>
          {t('Reward')}: {points ?? 0}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => navigationRef.navigate('Wallet')}
          style={styles.link}>
          <Text style={styles.linkText}>TON</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigationRef.navigate('Profile')}
          style={styles.link}>
          <Text style={styles.linkText}>{t('Profile')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  points: {color: colors.textSecondary, marginTop: 4, fontSize: 14},
  actions: {flexDirection: 'row', gap: 10},
  link: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  linkText: {color: colors.primary, fontWeight: '600', fontSize: 13},
});
