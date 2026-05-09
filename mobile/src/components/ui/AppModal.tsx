import React from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {DismissIcon} from '../Icons';
import {colors, radii} from '../../theme/tokens';

/** Matches Home / Combo bottom sheets */
export const MODAL_SHEET_BG = '#222A41';

const {height: SCREEN_H} = Dimensions.get('window');
const TOP_RADIUS = 40;
const H_PAD = 16;

type Variant = 'bottomSheet' | 'center';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: Variant;
  animationType?: 'fade' | 'slide' | 'none';
  dismissOnBackdrop?: boolean;
  maxHeightFraction?: number;
  contentStyle?: ViewStyle;
};

export function AppModal({
  visible,
  onClose,
  children,
  variant = 'bottomSheet',
  animationType,
  dismissOnBackdrop = true,
  maxHeightFraction = 0.92,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const anim =
    animationType ?? (variant === 'bottomSheet' ? 'slide' : 'fade');

  const padBottom =
    variant === 'bottomSheet'
      ? Math.max(insets.bottom, 12) + 8
      : Math.max(insets.bottom, 16);

  const centerMaxH = SCREEN_H * maxHeightFraction;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={anim}
      onRequestClose={onClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.root,
          variant === 'bottomSheet'
            ? styles.rootAlignBottom
            : styles.rootAlignCenter,
        ]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissOnBackdrop ? onClose : undefined}
        />
        {variant === 'bottomSheet' ? (
          <View style={styles.sheetOuter} pointerEvents="box-none">
            <View
              style={[
                styles.sheet,
                {paddingBottom: padBottom},
                contentStyle,
              ]}>
              {children}
            </View>
          </View>
        ) : (
          <View
            style={[styles.centerOuter, {paddingHorizontal: H_PAD}]}
            pointerEvents="box-none">
            <View
              style={[
                styles.centerCard,
                {paddingBottom: padBottom, maxHeight: centerMaxH},
                contentStyle,
              ]}>
              {children}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function AppModalClose({
  onPress,
  color = '#D9D9D9',
}: {
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      style={styles.closeBtn}
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Close">
      <DismissIcon size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  rootAlignBottom: {
    justifyContent: 'flex-end',
  },
  rootAlignCenter: {
    justifyContent: 'center',
  },
  sheetOuter: {
    width: '100%',
  },
  sheet: {
    backgroundColor: MODAL_SHEET_BG,
    borderTopLeftRadius: TOP_RADIUS,
    borderTopRightRadius: TOP_RADIUS,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(204,204,204,0.35)',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  centerOuter: {
    width: '100%',
    alignItems: 'center',
  },
  centerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 400,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 18,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
