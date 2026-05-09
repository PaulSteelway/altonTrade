import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';

import {useTonWallet} from '../tonconnect/hooks/useTonWallet';
import {Screen, MutedText} from '../components/ui';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';

/**
 * Минимальный пример: connect → модалка провайдера, address / disconnect из useTonWallet.
 */
export function ConnectWalletExampleScreen() {
  const {t} = useTranslation();
  const {
    wallet,
    address,
    connected,
    connect,
    disconnect,
    restoring,
    ready,
    pickerBusy,
  } = useTonWallet();

  return (
    <Screen safeTop={false} padded>
      <Text style={styles.title}>
        {t('TON Connect example', {defaultValue: 'TON Connect example'})}
      </Text>
      <MutedText style={styles.hint}>
        {t('Read-only wallet link for dApp-style apps.', {
          defaultValue: 'Read-only wallet link for dApp-style apps.',
        })}
      </MutedText>

      {restoring ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>{t('Status')}</Text>
            <Text style={styles.value}>
              {connected
                ? t('Connected', {defaultValue: 'Connected'})
                : t('Not connected', {defaultValue: 'Not connected'})}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('Address')}</Text>
            <Text style={styles.value} selectable>
              {address || '—'}
            </Text>
          </View>
          {wallet?.device?.appName ? (
            <View style={styles.row}>
              <Text style={styles.label}>{t('Wallet app')}</Text>
              <Text style={styles.value}>{wallet.device.appName}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>ready</Text>
            <Text style={styles.value}>{ready ? 'yes' : 'no'}</Text>
          </View>
        </>
      )}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => void connect()}
        disabled={!ready || restoring || pickerBusy || connected}>
        <Text style={styles.primaryBtnText}>
          {pickerBusy
            ? t('Connecting...', {defaultValue: 'Connecting...'})
            : t('Connect wallet', {defaultValue: 'Connect wallet'})}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => void disconnect()}
        disabled={!connected || pickerBusy}>
        <Text style={styles.secondaryBtnText}>{t('Disconnect')}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    marginBottom: 8,
  },
  hint: {marginBottom: 20},
  loader: {marginVertical: 24},
  row: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fontFamily.medium,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
  },
  primaryBtn: {
    marginTop: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
  },
  secondaryBtn: {
    marginTop: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.tabStrip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
});
