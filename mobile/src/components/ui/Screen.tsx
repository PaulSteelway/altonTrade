import React from 'react';
import {
  StyleSheet,
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {colors, space} from '../../theme/tokens';

type Props = ViewProps & {
  padded?: boolean;
  /** Add paddingTop equal to the top safe area inset (default: true). */
  safeTop?: boolean;
  /** Add paddingBottom equal to the bottom safe area inset (default: false — tab bar handles it). */
  safeBottom?: boolean;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Full-screen container with TWA background and safe-area support. */
export function Screen({
  padded = true,
  safeTop = true,
  safeBottom = false,
  style,
  contentStyle,
  children,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        padded && styles.pad,
        safeTop && {paddingTop: Math.max(insets.top, 12)},
        safeBottom && {paddingBottom: Math.max(insets.bottom, 12)},
        style,
        contentStyle,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  pad: {
    paddingHorizontal: space.md,
  },
});
