import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';
import type {WalletInfoRemote} from '@tonconnect/sdk';
import QRCode from 'react-native-qrcode-svg';

import {useTonConnectContext} from '../tonconnect/context/TonConnectContext';
import {
  isWalletAlreadyConnectedError,
} from '../tonconnect/WalletService';
import {listRemoteWalletsForPicker} from '../tonconnect/wallets';
import {AppModal, AppModalClose} from './ui/AppModal';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Пока грузится список или открывается выбранный кошелёк */
  onBusyChange?: (busy: boolean) => void;
};

type Step = 'pick' | 'qr';

export function TonConnectWalletModal({
  visible,
  onClose,
  onBusyChange,
}: Props) {
  const {t} = useTranslation();
  const {walletService, connected} = useTonConnectContext();
  const [step, setStep] = useState<Step>('pick');
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [openingAppName, setOpeningAppName] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletInfoRemote[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfoRemote | null>(
    null,
  );
  const [universalLink, setUniversalLink] = useState<string | null>(null);

  const setBusy = useCallback(
    (busy: boolean) => {
      onBusyChange?.(busy);
    },
    [onBusyChange],
  );

  const resetConnectUi = useCallback(() => {
    setStep('pick');
    setSelectedWallet(null);
    setUniversalLink(null);
    setOpening(false);
    setOpeningAppName(null);
  }, []);

  useEffect(() => {
    if (visible && connected && step === 'qr') {
      onClose();
    }
  }, [visible, connected, step, onClose]);

  useEffect(() => {
    if (!visible) {
      if (!walletService.connected) {
        void walletService.disconnect().catch(() => undefined);
      }
      resetConnectUi();
      return;
    }
    let cancelled = false;
    setLoadError(null);
    setWallets([]);
    setLoading(true);
    setBusy(true);

    (async () => {
      try {
        const list = await walletService.getWallets();
        if (cancelled) {
          return;
        }
        const remotes = listRemoteWalletsForPicker(list);
        if (!remotes.length) {
          setLoadError(
            t('No TON Connect wallets available', {
              defaultValue: 'No TON Connect wallets available',
            }),
          );
        } else {
          setWallets(remotes);
        }
      } catch {
        if (!cancelled) {
          setLoadError(
            t('Could not load wallet list', {
              defaultValue: 'Could not load wallet list',
            }),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, walletService, resetConnectUi, t, setBusy]);

  const handleBackFromQr = useCallback(async () => {
    if (!walletService.connected) {
      await walletService.disconnect().catch(() => undefined);
    }
    resetConnectUi();
  }, [walletService, resetConnectUi]);

  const onPickWallet = useCallback(
    (item: WalletInfoRemote) => {
      setBusy(true);
      try {
        const link = walletService.createRemoteConnectLink(item);
        setSelectedWallet(item);
        setUniversalLink(link);
        setStep('qr');
      } catch (err) {
        if (isWalletAlreadyConnectedError(err)) {
          onClose();
          return;
        }
        const detail =
          err instanceof Error && err.message.trim()
            ? err.message
            : t('Could not start TON Connect', {
                defaultValue: 'Could not start TON Connect',
              });
        Alert.alert(t('Error'), detail);
      } finally {
        setBusy(false);
      }
    },
    [onClose, t, setBusy, walletService],
  );

  const onOpenInWallet = useCallback(async () => {
    if (!selectedWallet || !universalLink) {
      return;
    }
    setOpening(true);
    setOpeningAppName(selectedWallet.appName);
    setBusy(true);
    try {
      await walletService.openRemoteConnectLink(universalLink, selectedWallet);
    } catch (err) {
      const detail =
        err instanceof Error && err.message.trim()
          ? err.message
          : t('Could not open TON wallet', {
              defaultValue: 'Could not open TON wallet',
            });
      Alert.alert(t('Error'), detail);
    } finally {
      setOpening(false);
      setOpeningAppName(null);
      setBusy(false);
    }
  }, [selectedWallet, universalLink, t, setBusy, walletService]);

  const onCopyLink = useCallback(async () => {
    if (!universalLink) {
      return;
    }
    try {
      await Clipboard.setString(universalLink);
      Alert.alert(
        t('Copied', {defaultValue: 'Copied'}),
        t('Connection link copied to clipboard', {
          defaultValue: 'Connection link copied to clipboard',
        }),
      );
    } catch {
      Alert.alert(
        t('Error'),
        t('Could not copy link', {defaultValue: 'Could not copy link'}),
      );
    }
  }, [universalLink, t]);

  return (
    <AppModal visible={visible} onClose={onClose} variant="bottomSheet">
      <AppModalClose onPress={onClose} />
      {step === 'qr' && selectedWallet && universalLink ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.qrScroll}>
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => void handleBackFromQr()}
            hitSlop={12}>
            <Text style={styles.backText}>
              {t('Back', {defaultValue: 'Back'})}
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {t('Scan QR with {{name}}', {
              name: selectedWallet.name,
              defaultValue: `Scan QR with ${selectedWallet.name}`,
            })}
          </Text>
          <Text style={styles.subtitle}>
            {t('Scan this code in your wallet app, or open the wallet on this phone.', {
              defaultValue:
                'Scan this code in your wallet app, or open the wallet on this phone.',
            })}
          </Text>
          <View style={styles.qrWrap}>
            <QRCode
              value={universalLink}
              size={220}
              color="#000000"
              backgroundColor="#FFFFFF"
              ecl="M"
            />
          </View>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => void onOpenInWallet()}
            disabled={opening}
            activeOpacity={0.85}>
            {opening ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {t('Open wallet on this device', {
                  defaultValue: 'Open wallet on this device',
                })}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => void onCopyLink()}
            disabled={opening}
            activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>
              {t('Copy connection link', {defaultValue: 'Copy connection link'})}
            </Text>
          </TouchableOpacity>
          {opening && openingAppName ? (
            <Text style={styles.openingHint} numberOfLines={1}>
              {t('Opening {{name}}…', {
                name: selectedWallet.name,
                defaultValue: `Opening ${selectedWallet.name}…`,
              })}
            </Text>
          ) : null}
        </ScrollView>
      ) : (
        <>
          <Text style={styles.title}>
            {t('Select wallet', {defaultValue: 'Select wallet'})}
          </Text>
          <Text style={styles.subtitle}>
            {t('Choose a wallet to connect with TON Connect', {
              defaultValue: 'Choose a wallet to connect with TON Connect',
            })}
          </Text>

          {loading ? (
            <ActivityIndicator
              style={styles.loader}
              color={colors.primary}
              size="large"
            />
          ) : loadError ? (
            <Text style={styles.error}>{loadError}</Text>
          ) : (
            <FlatList
              data={wallets}
              keyExtractor={w => w.appName}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.85}
                  onPress={() => onPickWallet(item)}>
                  <Image source={{uri: item.imageUrl}} style={styles.icon} />
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 6,
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: fontFamily.regular,
    paddingHorizontal: 8,
  },
  loader: {
    marginVertical: 32,
  },
  error: {
    color: '#EF1C58',
    textAlign: 'center',
    marginVertical: 24,
    fontFamily: fontFamily.medium,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  qrScroll: {
    paddingBottom: 24,
  },
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: fontFamily.semibold,
  },
  qrWrap: {
    alignSelf: 'center',
    padding: 12,
    marginBottom: 20,
    borderRadius: radii.md,
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    marginHorizontal: 4,
    marginBottom: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryBtn: {
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    fontSize: 14,
  },
  openingHint: {
    marginTop: 8,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fontFamily.regular,
  },
});
