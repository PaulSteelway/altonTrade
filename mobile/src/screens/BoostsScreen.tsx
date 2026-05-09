import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';

import {api} from '../api/client';
import {useUserContext} from '../context/UserContext';
import type {UserData} from '../context/UserContext';
import {Screen, AppModal, AppModalClose} from '../components/ui';
import {LockClosedIcon, PointCoinIcon} from '../components/Icons';
import {WEBAPP_URL} from '../config';
import {colors, radii, space} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {sumFormat} from '../utils/fortune';

const GAP = 3;

type Condition = {type: string; con: number};

type ApiCard = {
  _id: string;
  name?: string;
  description?: string;
  image?: string;
  mining?: number;
  ratio?: number;
  price?: number;
  condition?: Condition;
};

type SelectedCard = ApiCard & {
  level: number;
  price: number;
  mining: number;
  miningNext: number;
};

function cardImageUri(image: string | undefined): string | null {
  if (!image || typeof image !== 'string') {
    return null;
  }
  return `${WEBAPP_URL}/cards-image/${encodeURIComponent(image)}.png`;
}

function getUserCard(
  user: UserData | null,
  cardId: string,
): {level?: number; price?: number; mining?: number} | null {
  const list = user?.cards;
  if (!Array.isArray(list)) {
    return null;
  }
  return list.find(c => c.id === cardId) ?? null;
}

function getButtonState(
  card: {price: number; condition?: Condition},
  user: UserData | null,
  t: TFunction,
): {
  disabled: boolean;
  title: string;
  mode: 'pay' | 'locked_level' | 'insufficient';
  payAmount?: number;
} {
  const pointLevel =
    typeof user?.pointLevel === 'number' ? user.pointLevel : 0;
  const points = typeof user?.points === 'number' ? user.points : 0;

  if (
    card.condition?.type === 'level' &&
    typeof card.condition.con === 'number' &&
    card.condition.con > pointLevel
  ) {
    return {
      disabled: true,
      title: `${t('Level')} ${card.condition.con} ${t('Required')}`,
      mode: 'locked_level',
    };
  }
  if (points < card.price) {
    return {
      disabled: true,
      title: t('Insufficient points'),
      mode: 'insufficient',
    };
  }
  return {
    disabled: false,
    title: t('Pay'),
    mode: 'pay',
    payAmount: card.price,
  };
}

export function BoostsScreen() {
  const {t} = useTranslation();
  const {userData, refetchUser} = useUserContext();
  const [selected, setSelected] = useState<SelectedCard | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {width: winW} = Dimensions.get('window');
  const cardWidth = useMemo(
    () => (winW - space.md * 2 - GAP) / 2,
    [winW],
  );

  const {data: cards, isLoading, isError} = useQuery({
    queryKey: ['cards'],
    queryFn: async () => (await api.get<ApiCard[]>('/api/cards')).data,
  });

  const boostMut = useMutation({
    mutationFn: async (cardId: string) =>
      api.post('/api/cards/boost', {card_id: cardId}),
    onSuccess: async () => {
      await refetchUser();
      setModalOpen(false);
      setSelected(null);
    },
    onError: () =>
      Alert.alert(t('Error'), t('Boost failed', {defaultValue: 'Boost failed'})),
  });

  const openModal = useCallback(
    (card: ApiCard) => {
      const uc = getUserCard(userData, card._id);
      const ratio = typeof card.ratio === 'number' ? card.ratio : 1;
      const basePrice = typeof card.price === 'number' ? card.price : 0;
      const ucPrice = uc?.price;
      const price =
        typeof ucPrice === 'number' ? ucPrice * ratio || basePrice : basePrice;
      const mining =
        typeof uc?.mining === 'number' ? uc.mining : card.mining ?? 0;
      const nextTemplate =
        typeof card.mining === 'number' ? card.mining : 0;

      setSelected({
        ...card,
        level: uc?.level ?? 0,
        price,
        mining,
        miningNext: nextTemplate,
      });
      setModalOpen(true);
    },
    [userData],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelected(null);
  }, []);

  const modalBtnState = selected
    ? getButtonState(selected, userData, t)
    : null;

  const boostingThis =
    boostMut.isPending &&
    selected &&
    boostMut.variables === selected._id;

  const modalImageUriStr = selected ? cardImageUri(selected.image) : null;

  const renderCard = useCallback(
    ({item}: {item: ApiCard}) => {
      const uc = getUserCard(userData, item._id);
      const cardLevel = uc?.level;
      const ratio = typeof item.ratio === 'number' ? item.ratio : 1;
      const basePrice = typeof item.price === 'number' ? item.price : 0;
      const ucPrice = uc?.price;
      const cardPrice =
        typeof ucPrice === 'number' ? ucPrice * ratio || basePrice : basePrice;
      const cardMining =
        typeof uc?.mining === 'number' ? uc.mining : item.mining ?? 0;
      const levelLocked =
        item.condition?.type === 'level' &&
        typeof item.condition.con === 'number' &&
        typeof userData?.pointLevel === 'number' &&
        item.condition.con > userData.pointLevel;
      const uri = cardImageUri(item.image);

      return (
        <TouchableOpacity
          style={[styles.cardCell, {width: cardWidth}]}
          activeOpacity={0.85}
          onPress={() => openModal(item)}>
          <View style={styles.cardInner}>
            <View
              style={[
                styles.levelBadge,
                cardLevel == null || cardLevel === 0
                  ? styles.levelBadgeMuted
                  : null,
              ]}>
              <Text style={styles.levelBadgeText}>
                {t('lvl')} {cardLevel ?? 0}
              </Text>
            </View>

            {uri ? (
              <Image
                source={{uri}}
                style={[
                  styles.cardImage,
                  levelLocked ? styles.cardImageLocked : null,
                ]}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
            )}

            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name ? t(item.name, {defaultValue: item.name}) : item._id}
            </Text>
            <Text style={styles.cardLabel}>{t('Points per hour')}:</Text>
            <View style={styles.coinsRow}>
              <PointCoinIcon size={14} />
              <Text style={styles.coinsText}>{sumFormat(cardMining)}</Text>
            </View>

            <View
              style={[
                styles.cardBuyBtn,
                levelLocked ? styles.cardBuyBtnDisabled : null,
              ]}>
              {levelLocked ? (
                <View style={styles.cardBuyInner}>
                  <LockClosedIcon size={18} color="#161C2C" />
                  <Text style={styles.cardBuyTextDark}>
                    {t('lvl')} {item.condition!.con}
                  </Text>
                </View>
              ) : (
                <View style={styles.cardBuyInner}>
                  <PointCoinIcon size={16} />
                  <Text style={styles.cardBuyText}>{sumFormat(cardPrice)}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [cardWidth, openModal, t, userData],
  );

  return (
    <Screen>
      <FlatList
        data={isLoading ? [] : cards ?? []}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={styles.profitTitle}>{t('Boost Cards')}</Text>
            <Text style={styles.profitSubtitle}>
              {t('And get more points')}
            </Text>
            {isLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.listLoader}
              />
            ) : null}
            {isError ? (
              <Text style={styles.errorText}>
                {t('Error loading cards')}…
              </Text>
            ) : null}
            {!isLoading && !isError && cards?.length === 0 ? (
              <Text style={styles.emptyText}>{t('No cards found')}</Text>
            ) : null}
          </View>
        }
        renderItem={renderCard}
        ListFooterComponent={<View style={{height: space.lg}} />}
      />

      <AppModal
        visible={modalOpen}
        onClose={closeModal}
        variant="center"
        animationType="fade"
        maxHeightFraction={0.92}>
        {selected && modalBtnState ? (
          <>
            <AppModalClose onPress={closeModal} />
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}>
                {modalImageUriStr ? (
                  <Image
                    source={{uri: modalImageUriStr}}
                    style={[
                      styles.modalImage,
                      modalBtnState.disabled ? styles.cardImageLocked : null,
                    ]}
                    resizeMode="contain"
                  />
                ) : null}

                <View style={styles.modalLevelWrap}>
                  <View
                    style={[
                      styles.levelBadge,
                      styles.levelBadgeCenter,
                      modalBtnState.disabled ? styles.levelBadgeMuted : null,
                    ]}>
                    <Text
                      style={[
                        styles.levelBadgeText,
                        modalBtnState.disabled
                          ? styles.levelBadgeTextDark
                          : null,
                      ]}>
                      {t('lvl')} {selected.level}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalTitle}>
                  {selected.name
                    ? t(selected.name, {defaultValue: selected.name})
                    : selected._id}
                </Text>
                {selected.description ? (
                  <Text style={styles.modalDesc}>
                    {t(selected.description, {
                      defaultValue: selected.description,
                    })}
                  </Text>
                ) : null}

                <View style={styles.modalCardsRow}>
                  <View style={styles.modalInfoCol}>
                    <Text style={styles.modalProfitLabel}>
                      {t('Per Hour')}:
                    </Text>
                    <View style={styles.modalPriceRow}>
                      <PointCoinIcon size={16} />
                      <Text style={styles.modalPriceNum}>
                        {sumFormat(selected.mining)}
                      </Text>
                    </View>
                  </View>
                  {selected.level > 0 ? (
                    <View style={styles.modalInfoCol}>
                      <Text style={styles.modalProfitLabel}>
                        {t('Next Level')}:
                      </Text>
                      <View style={styles.modalPriceRow}>
                        <PointCoinIcon size={16} />
                        <Text style={styles.modalPriceNum}>
                          {sumFormat(selected.mining + selected.miningNext)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {modalBtnState.mode === 'pay' ? (
                  <TouchableOpacity
                    style={styles.modalBuyBtn}
                    activeOpacity={0.85}
                    disabled={!!boostingThis}
                    onPress={() => boostMut.mutate(selected._id)}>
                    {boostingThis ? (
                      <ActivityIndicator color={colors.textPrimary} />
                    ) : (
                      <View style={styles.modalBuyInner}>
                        <Text style={styles.modalBuyText}>{t('Pay')} </Text>
                        <PointCoinIcon size={18} />
                        <Text style={styles.modalBuyText}>
                          {' '}
                          {sumFormat(modalBtnState.payAmount ?? 0)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalBuyBtn, styles.modalBuyBtnDisabled]}
                    activeOpacity={1}
                    disabled>
                    <Text style={styles.modalBuyTextDark}>
                      {modalBtnState.title}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
          </>
        ) : null}
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: space.sm,
  },
  profitTitle: {
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 24,
    fontStyle: 'italic',
    fontWeight: '700',
    marginBottom: 0,
    lineHeight: 38,
    textTransform: 'capitalize',
    fontFamily: fontFamily.bold,
  },
  profitSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: space.md,
    fontFamily: fontFamily.medium,
  },
  listLoader: {
    marginVertical: 32,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: space.md,
    fontFamily: fontFamily.regular,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: space.md,
    fontFamily: fontFamily.regular,
  },
  listContent: {
    paddingBottom: space.xl,
  },
  columnWrap: {
    gap: GAP,
    marginBottom: GAP,
  },
  cardCell: {},
  cardInner: {
    borderRadius: radii.lg + 8,
    padding: space.md,
    backgroundColor: colors.surfaceMuted,
    minHeight: 220,
  },
  levelBadge: {
    position: 'absolute',
    right: space.md,
    top: 15,
    backgroundColor: '#414f78',
    borderRadius: radii.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
    zIndex: 2,
  },
  levelBadgeMuted: {
    backgroundColor: '#677184',
  },
  levelBadgeCenter: {
    position: 'relative',
    right: undefined,
    top: undefined,
    alignSelf: 'center',
    marginTop: space.md,
  },
  levelBadgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  levelBadgeTextDark: {
    color: '#161c2c',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: radii.sm,
    marginBottom: 8,
  },
  cardImagePlaceholder: {
    backgroundColor: colors.barFill,
  },
  cardImageLocked: {
    opacity: 0.45,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 0,
    fontFamily: fontFamily.semibold,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
    fontFamily: fontFamily.regular,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  coinsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  cardBuyBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  cardBuyBtnDisabled: {
    backgroundColor: '#677184',
  },
  cardBuyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardBuyText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  cardBuyTextDark: {
    color: '#161C2C',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  modalImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    borderRadius: radii.sm,
    marginBottom: 8,
  },
  modalLevelWrap: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: fontFamily.bold,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
  },
  modalCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 12,
    marginBottom: 8,
    gap: space.sm,
  },
  modalInfoCol: {
    alignItems: 'center',
    flex: 1,
  },
  modalProfitLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
    fontFamily: fontFamily.regular,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalPriceNum: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  modalBuyBtn: {
    marginTop: space.md,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalBuyBtnDisabled: {
    backgroundColor: colors.disabledBg,
  },
  modalBuyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBuyText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
  modalBuyTextDark: {
    color: '#161C2C',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: fontFamily.semibold,
  },
});
