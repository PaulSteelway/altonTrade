import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useMutation} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {api} from '../api/client';
import {navigationRef} from '../navigation/navigationRef';
import {useUserContext} from '../context/UserContext';
import {Card, Screen, MutedText} from '../components/ui';
import {AppModal, AppModalClose} from '../components/ui/AppModal';
import {
  AltonGemIcon,
  Info20Icon,
  TonRoundIcon,
  WalletIcon,
} from '../components/Icons';
import {useTonConnect} from '../hooks/useTonConnect';
import {useAltonNfts, sumVoucherAmountFromNfts} from '../hooks/useAltonNfts';
import {formatPublicKey} from '../utils/walletDisplay';
import {colors, space} from '../theme/tokens';
import {fontFamily} from '../theme/typography';

/** Сетка NFT: 3 колонки и gap как `.nft-collection` в App.css. */
const SCREEN_W = Dimensions.get('window').width;
const NFT_GALLERY_H_PAD = 16;
const NFT_GAP = 10;
const NFT_ITEM_W = Math.floor(
  (SCREEN_W - NFT_GALLERY_H_PAD * 2 - NFT_GAP * 2) / 3,
);

export function WalletScreen() {
  const {t} = useTranslation();
  const {refetchUser, userData} = useUserContext();
  const {
    walletAccount,
    friendlyAddress,
    connected,
    restoring,
    disconnect,
    pickerBusy,
    connect,
  } = useTonConnect();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [benefitsModalOpen, setBenefitsModalOpen] = useState(false);
  const [disconnectBusy, setDisconnectBusy] = useState(false);

  const {
    data: nftPayload,
    isLoading: nftsLoading,
    isError: nftsError,
    isSuccess: nftsSuccess,
  } = useAltonNfts(connected && friendlyAddress ? friendlyAddress : null);

  const voucherSum = useMemo(
    () => sumVoucherAmountFromNfts(nftPayload?.nft_items ?? []),
    [nftPayload],
  );

  const nft_items = nftPayload?.nft_items ?? [];

  const formattedWalletBtn = useMemo(
    () =>
      connected && friendlyAddress ? formatPublicKey(friendlyAddress) : '',
    [connected, friendlyAddress],
  );

  const saveMut = useMutation({
    mutationFn: async (payload: {address: string; publicKey: string}) => {
      await api.post('/api/users/wallet', payload);
    },
    onSuccess: () => {
      refetchUser();
      Alert.alert(
        t('OK', {defaultValue: 'OK'}),
        t('Wallet saved', {defaultValue: 'Wallet saved'}),
      );
    },
    onError: () =>
      Alert.alert(
        t('Error'),
        t('Could not save wallet', {defaultValue: 'Could not save wallet'}),
      ),
  });

  const voucherMut = useMutation({
    mutationFn: async (hasVoucher: boolean) => {
      await api.post('/api/users/vouchers', {hasVoucher});
    },
    onSuccess: () => {
      refetchUser().catch(() => undefined);
    },
  });

  useEffect(() => {
    const address = walletAccount?.address ?? '';
    const publicKey = walletAccount?.publicKey ?? '';
    if (!address || saveMut.isPending) {
      return;
    }
    const currentAddress =
      typeof userData?.wallet?.address === 'string' ? userData.wallet.address : '';
    const currentKey =
      typeof userData?.wallet?.publicKey === 'string' ? userData.wallet.publicKey : '';
    if (address === currentAddress && publicKey === currentKey) {
      return;
    }
    saveMut.mutate({address, publicKey});
  }, [
    walletAccount?.address,
    walletAccount?.publicKey,
    userData?.wallet?.address,
    userData?.wallet?.publicKey,
    saveMut,
  ]);

  useEffect(() => {
    if (!connected || !nftsSuccess || !userData) {
      return;
    }
    const hasVoucherInNfts = nft_items.length > 0;
    if (userData.hasVoucher === hasVoucherInNfts) {
      return;
    }
    voucherMut.mutate(hasVoucherInNfts);
  }, [connected, nftsSuccess, userData, nft_items.length, voucherMut]);

  const handleConnect = () => {
    Promise.resolve(connect()).catch(() => undefined);
  };

  const handleDisconnect = async () => {
    setDisconnectBusy(true);
    try {
      await api.post('/api/users/wallet', {address: '', publicKey: ''});
      await disconnect();
      await refetchUser();
      setWalletModalOpen(false);
    } finally {
      setDisconnectBusy(false);
    }
  };

  const openGetgems = () => {
    Linking.openURL('https://getgems.io/alton').catch(() => undefined);
  };

  const openBullrunners = () => {
    Linking.openURL('https://t.me/altonHolders').catch(() => undefined);
  };

  const openConnectDemo = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('ConnectWalletExample');
    }
  };

  return (
    <Screen
      safeTop
      padded={!connected}
      style={connected && !restoring ? styles.screenWalletPage : undefined}>
      {!connected ? (
        <>
          <Card style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t('Wallet')}</Text>
              <WalletIcon size={22} color={colors.textMuted} />
            </View>
            <MutedText style={styles.hint}>
              {t('Connect TON wallet to use blockchain features.', {
                defaultValue: 'Connect TON wallet to use blockchain features.',
              })}
            </MutedText>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{t('Address')}</Text>
              <Text style={styles.value}>
                {t('Not connected', {defaultValue: 'Not connected'})}
              </Text>
            </View>

            {restoring ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.connectWalletWrap}>
                <TouchableOpacity
                  style={styles.connectWalletBtn}
                  onPress={handleConnect}
                  disabled={pickerBusy || saveMut.isPending}
                  activeOpacity={0.88}>
                  <Text style={styles.connectWalletBtnText}>
                    {pickerBusy
                      ? t('Connecting...', {defaultValue: 'Connecting...'})
                      : t('Connect Wallet')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          <TouchableOpacity onPress={openConnectDemo} style={styles.demoLink}>
            <MutedText style={styles.demoLinkText}>
              {t('TON Connect demo screen', {defaultValue: 'TON Connect demo screen'})}
            </MutedText>
          </TouchableOpacity>
        </>
      ) : restoring ? (
        <View style={styles.restoringWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.walletScroll}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.walletInfoBleed}>
            <TouchableOpacity
              style={styles.walletButton}
              onPress={() => setWalletModalOpen(true)}
              activeOpacity={0.88}>
              <TonRoundIcon size={24} />
              <Text style={styles.walletButtonText} numberOfLines={1}>
                {formattedWalletBtn}
              </Text>
              <Text style={styles.walletButtonCaret}>▼</Text>
            </TouchableOpacity>

            <View style={styles.altonCountRow}>
              <AltonGemIcon size={32} />
              <Text style={styles.voucherCount}>
                {voucherSum.toLocaleString()}
              </Text>
            </View>

            <View style={styles.voucherActions}>
              <TouchableOpacity
                style={styles.getgemsBtn}
                onPress={openGetgems}
                activeOpacity={0.88}>
                <Text style={styles.getgemsBtnText}>{t('Go to Getgems')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bullrunnersBtn}
                onPress={openBullrunners}
                activeOpacity={0.88}>
                <Text style={styles.bullrunnersBtnText}>
                  {t('Bullrunners chat')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.nftGallery}>
            <View style={styles.collectionHeader}>
              <TouchableOpacity
                style={styles.collectionInfoBtn}
                onPress={() => setBenefitsModalOpen(true)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('Benefits for Voucher Holders')}>
                <Info20Icon size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.collectionTitle}>{t('Your collection')}</Text>
            </View>

            {nftsLoading ? (
              <View style={styles.nftsLoader}>
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : nftsError ? (
              <Text style={styles.nftError}>
                {t('Error loading Vouchers', {
                  defaultValue: 'Error loading Vouchers',
                })}
              </Text>
            ) : nft_items.length === 0 ? (
              <View style={styles.emptyNfts}>
                <Text style={styles.notFoundText}>{t('No Vouchers found')}</Text>
                <Text style={styles.notFoundText}>
                  {t(
                    'Buy Alton  vouchers to secure token allocation and access premium features that boost your drop! Join the Bullrunners chat to get all your questions answered!',
                  )}
                </Text>
              </View>
            ) : (
              <View style={styles.nftGrid}>
                {nft_items.map((nft, index) => (
                  <View
                    key={`nft-${index}`}
                    style={[styles.nftItem, {width: NFT_ITEM_W}]}>
                    {nft.content?.image ? (
                      <Image
                        source={{uri: nft.content.image}}
                        style={[styles.nftImage, {width: NFT_ITEM_W}]}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.nftNoImage,
                          {width: NFT_ITEM_W, height: NFT_ITEM_W},
                        ]}>
                        <Text style={styles.nftNoImageText}>
                          {t('No image available')}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.nftName} numberOfLines={2}>
                      {nft.content?.name ? t(nft.content.name) : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <AppModal
        visible={benefitsModalOpen}
        onClose={() => setBenefitsModalOpen(false)}
        variant="center">
        <View style={styles.modalInner}>
          <AppModalClose onPress={() => setBenefitsModalOpen(false)} />
          <Text style={styles.modalTitle}>
            {t('Benefits for Voucher Holders')}:
          </Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitBullet}>
              {'\u2022 '}
              {t('pay 50% for academy re-test')}
            </Text>
            <Text style={styles.benefitBullet}>
              {'\u2022 '}
              {t('X2 combo reward')}
            </Text>
            <Text style={styles.benefitBullet}>
              {'\u2022 '}
              {t('X2 roulette reward')}
            </Text>
          </View>
        </View>
      </AppModal>

      <AppModal
        visible={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        variant="center">
        <View style={styles.modalInner}>
          <AppModalClose onPress={() => setWalletModalOpen(false)} />
          <Text style={styles.modalTitle}>{t('Wallet')}:</Text>
          <View style={styles.walletAccountRow}>
            <Text style={styles.walletAccountAddr} numberOfLines={1}>
              {formattedWalletBtn}
            </Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeDot}>•</Text>
              <Text style={styles.activeText}>{t('Active')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={() => {
              handleDisconnect().catch(() => undefined);
            }}
            disabled={disconnectBusy}>
            <Text style={styles.disconnectBtnText}>
              {disconnectBusy ? t('Loading...') : t('Disconnect')}
            </Text>
          </TouchableOpacity>
        </View>
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenWalletPage: {
    backgroundColor: '#202634',
  },
  walletScroll: {
    flex: 1,
    backgroundColor: '#202634',
  },
  scrollContent: {
    paddingBottom: space.xl,
    flexGrow: 1,
    backgroundColor: '#202634',
  },
  restoringWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
    backgroundColor: '#202634',
  },
  walletInfoBleed: {
    backgroundColor: colors.bg,
    paddingHorizontal: NFT_GALLERY_H_PAD,
    paddingTop: space.sm,
    paddingBottom: 44,
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    height: 36,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
    borderRadius: 8,
    backgroundColor: '#161c2c',
    maxWidth: SCREEN_W - NFT_GALLERY_H_PAD * 2,
  },
  walletButtonText: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    fontWeight: '400',
  },
  walletButtonCaret: {
    color: colors.textPrimary,
    fontSize: 12,
    marginLeft: 2,
    lineHeight: 14,
  },
  altonCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
  },
  voucherCount: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    fontSize: 40,
    fontWeight: '600',
    lineHeight: 44,
    textTransform: 'capitalize',
  },
  voucherActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
  },
  getgemsBtn: {
    height: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getgemsBtnText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bullrunnersBtn: {
    height: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: '#2e364c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bullrunnersBtnText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  nftGallery: {
    backgroundColor: '#202634',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: NFT_GALLERY_H_PAD,
    paddingTop: 16,
    paddingBottom: space.lg,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: space.md,
  },
  collectionInfoBtn: {
    padding: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textTransform: 'capitalize',
  },
  nftsLoader: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  nftError: {
    color: colors.error,
    textAlign: 'center',
    fontFamily: fontFamily.medium,
    paddingVertical: 20,
  },
  emptyNfts: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  notFoundText: {
    color: '#757f9c',
    textAlign: 'center',
    fontFamily: fontFamily.regular,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  nftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: NFT_GAP,
    justifyContent: 'flex-start',
  },
  nftItem: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#161a25',
  },
  nftImage: {
    aspectRatio: 1,
    backgroundColor: colors.surface,
  },
  nftNoImage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: colors.surface,
  },
  nftNoImageText: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  nftName: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textTransform: 'capitalize',
    textAlign: 'left',
    paddingHorizontal: 6,
    paddingBottom: 6,
    paddingTop: 4,
  },
  modalInner: {
    position: 'relative',
    paddingTop: 8,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: space.md,
    paddingRight: 36,
  },
  benefitsList: {
    gap: 8,
    alignSelf: 'stretch',
  },
  benefitBullet: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
  },
  walletAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#2b3348',
    marginTop: 24,
    marginBottom: space.md,
    gap: 10,
  },
  walletAccountAddr: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    color: '#39c73e',
    fontSize: 14,
    marginRight: 6,
  },
  activeText: {
    color: '#39c73e',
    fontFamily: fontFamily.medium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    textTransform: 'capitalize',
  },
  disconnectBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  disconnectBtnText: {
    color: colors.primary,
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  card: {marginBottom: 20, padding: 16},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {marginBottom: 16},
  infoRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 6,
    fontFamily: fontFamily.semibold,
  },
  value: {
    marginTop: 6,
    color: colors.textPrimary,
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
  loader: {
    marginTop: 14,
    marginBottom: 8,
  },
  connectWalletWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  connectWalletBtn: {
    height: 40,
    minWidth: 200,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectWalletBtnText: {
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  demoLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  demoLinkText: {
    textDecorationLine: 'underline',
  },
});
