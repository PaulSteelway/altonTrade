import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';

import {api} from '../api/client';
import {useUserContext} from '../context/UserContext';
import {colors, radii} from '../theme/tokens';
import {fontFamily} from '../theme/typography';
import {
  WalletFullIcon,
  WalletEmptyIcon,
  BalanceCoinIcon,
} from './Icons';
import {AppModal, AppModalClose} from './ui';

export function ComboBlock() {
  const {t} = useTranslation();
  const {userData, refetchUser} = useUserContext();

  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [itemStatus, setItemStatus] = useState<(boolean | null)[]>([
    null,
    null,
    null,
  ]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [reward, setReward] = useState<number | null>(null);
  const [buttonState, setButtonState] = useState<'empty' | 'full'>('full');

  const {data: comboData, isLoading: comboLoading} = useQuery({
    queryKey: ['combo'],
    queryFn: async () => {
      const {data} = await api.get('/api/combo');
      return data as {words?: string[]; reward?: number; counter?: number};
    },
  });

  const checkComboMut = useMutation({
    mutationFn: async (combo: string[]) => {
      const {data} = await api.post('/api/combo/check', {combo});
      return data as {correct?: boolean[]; reward?: number};
    },
  });

  useEffect(() => {
    if (comboLoading || !userData) {
      return;
    }
    if (!userData.combo) {
      setButtonState('full');
      return;
    }
    if (
      userData.combo.reward &&
      userData.combo.counter === comboData?.counter
    ) {
      setButtonState('empty');
    } else {
      setButtonState('full');
    }
  }, [comboData, userData, comboLoading]);

  useEffect(() => {
    if (!userData?.combo?.date || !comboData) {
      return;
    }
    if (userData.combo.counter !== comboData.counter) {
      return;
    }
    const lastTime = new Date(userData.combo.date).getTime();
    const oneHourMs = 60 * 60 * 1000;
    const diff = Date.now() - lastTime;
    if (diff < oneHourMs) {
      setTimeLeft(Math.floor((oneHourMs - diff) / 1000));
      const iv = setInterval(() => {
        setTimeLeft(p => {
          if (p && p > 1) {
            return p - 1;
          }
          clearInterval(iv);
          return null;
        });
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [userData, comboData]);

  const handleComboClick = () => {
    if (buttonState === 'empty') {
      return;
    }
    setComboModalOpen(true);
  };

  const handleSelect = (item: string) => {
    if (selectedItems.includes(item)) {
      return;
    }
    const idx = selectedItems.findIndex(s => s === null);
    if (idx !== -1) {
      const next = [...selectedItems];
      next[idx] = item;
      setSelectedItems(next);
      setItemStatus([null, null, null]);
    }
  };

  const handleRemove = (idx: number) => {
    const next = [...selectedItems];
    next[idx] = null;
    setSelectedItems(next);
    setItemStatus([null, null, null]);
  };

  const checkOrder = () => {
    const combo = selectedItems.filter(Boolean) as string[];
    checkComboMut.mutate(combo, {
      onSuccess: data => {
        if (Array.isArray(data.correct)) {
          setItemStatus(data.correct);
        }
        if (data.reward) {
          setReward(data.reward);
          setTimeout(() => {
            setComboModalOpen(false);
            setRewardModalOpen(true);
            refetchUser();
          }, 1000);
        }
      },
    });
  };

  const closeComboModal = () => {
    setComboModalOpen(false);
    setSelectedItems([null, null, null]);
    setItemStatus([null, null, null]);
  };

  const closeRewardModal = () => {
    setRewardModalOpen(false);
    setReward(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  const words = comboData?.words ?? [];

  return (
    <>
      <TouchableOpacity
        style={[
          styles.comboBtn,
          buttonState === 'empty' && styles.comboBtnEmpty,
        ]}
        onPress={handleComboClick}
        activeOpacity={0.8}>
        {buttonState === 'empty' ? (
          <WalletEmptyIcon size={60} />
        ) : (
          <WalletFullIcon size={60} />
        )}
      </TouchableOpacity>

      {/* Combo selection modal */}
      <AppModal
        visible={comboModalOpen}
        onClose={closeComboModal}
        variant="bottomSheet">
        <AppModalClose onPress={closeComboModal} />
            <Text style={styles.modalTitle}>
              {t('Choose a secret phrase')}
            </Text>

            {timeLeft !== null && (
              <View style={styles.timerRow}>
                <Text style={styles.timerLabel}>{t('Next attempt')}:</Text>
                <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
              </View>
            )}

            <View style={styles.slotsRow}>
              {selectedItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.slot,
                    item ? styles.slotFilled : null,
                    itemStatus[idx] === true ? styles.slotCorrect : null,
                    itemStatus[idx] === false ? styles.slotIncorrect : null,
                  ]}
                  onPress={() => handleRemove(idx)}
                  activeOpacity={item ? 0.7 : 1}>
                  {item ? (
                    <Text style={styles.slotText}>{item}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.wordGrid}>
              {words.map((word: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.wordBtn,
                    selectedItems.includes(word) && styles.wordBtnDisabled,
                  ]}
                  onPress={() => handleSelect(word)}
                  disabled={selectedItems.includes(word)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.wordBtnText,
                      selectedItems.includes(word) &&
                        styles.wordBtnTextDisabled,
                    ]}>
                    {word}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.checkBtn,
                (selectedItems.includes(null) || timeLeft !== null) &&
                  styles.checkBtnDisabled,
              ]}
              onPress={checkOrder}
              disabled={
                selectedItems.includes(null) ||
                timeLeft !== null ||
                checkComboMut.isPending
              }
              activeOpacity={0.85}>
              {checkComboMut.isPending ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={styles.checkBtnText}>
                  {t('Check Phrase')}
                </Text>
              )}
            </TouchableOpacity>
      </AppModal>

      <AppModal
        visible={rewardModalOpen}
        onClose={closeRewardModal}
        variant="bottomSheet">
        <AppModalClose onPress={closeRewardModal} />
            <Text style={styles.modalTitle}>{t('Congratulations!')}</Text>
            <Text style={styles.modalDesc}>
              {t('You found the following in the forgotten wallet')}:
            </Text>
            {reward !== null && (
              <View style={styles.rewardRow}>
                <BalanceCoinIcon size={24} />
                <Text style={styles.rewardText}>{reward}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={closeRewardModal}
              activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('Close')}</Text>
            </TouchableOpacity>
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  /** Combo.css `.combo-button` — 72×73 */
  comboBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 72,
    height: 73,
    zIndex: 10,
  },
  comboBtnEmpty: {
    opacity: 0.4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 8,
    fontFamily: fontFamily.bold,
  },
  modalDesc: {
    fontSize: 14,
    color: '#757f9c',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: fontFamily.regular,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 15,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757f9c',
    fontFamily: fontFamily.medium,
  },
  timerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  slot: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#424e6f',
  },
  slotFilled: {
    backgroundColor: 'transparent',
  },
  slotCorrect: {
    borderBottomColor: '#39c73e',
  },
  slotIncorrect: {
    borderBottomColor: colors.primary,
  },
  slotText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: colors.tabPillActive,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    overflow: 'hidden',
    fontFamily: fontFamily.semibold,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  wordBtn: {
    width: '48%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.tabPillActive,
    alignItems: 'center',
  },
  wordBtnDisabled: {
    backgroundColor: '#202637',
  },
  wordBtnText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
  },
  wordBtnTextDisabled: {
    color: '#46506d',
  },
  checkBtn: {
    marginTop: 20,
    width: '100%',
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  checkBtnDisabled: {
    backgroundColor: '#677184',
  },
  checkBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  rewardRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  rewardText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fontFamily.semibold,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
});
