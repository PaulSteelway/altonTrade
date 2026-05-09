import React from 'react';
import {StyleSheet, View, type ViewProps} from 'react-native';

import {colors, radii} from '../../theme/tokens';

type Props = ViewProps & {
  children: React.ReactNode;
};

export function Card({style, children, ...rest}: Props) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 16,
  },
});
