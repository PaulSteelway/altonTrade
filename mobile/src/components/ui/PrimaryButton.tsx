import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';

import {colors, radii} from '../../theme/tokens';
import {fontFamily} from '../../theme/typography';

type Props = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
};

export function PrimaryButton({
  title,
  loading,
  disabled,
  style,
  ...rest
}: Props) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.btn, inactive && styles.btnDisabled, style]}
      disabled={inactive}
      activeOpacity={0.85}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnDisabled: {
    backgroundColor: colors.disabledBg,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
});
