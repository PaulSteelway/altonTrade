import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native';

import {colors, radii} from '../../theme/tokens';
import {fontFamily} from '../../theme/typography';

type Props = TouchableOpacityProps & {
  title: string;
};

export function SecondaryButton({title, style, ...rest}: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      activeOpacity={0.85}
      {...rest}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: 'transparent',
  },
  text: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fontFamily.semibold,
  },
});
