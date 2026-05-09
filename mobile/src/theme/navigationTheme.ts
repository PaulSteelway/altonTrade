import {DarkTheme} from '@react-navigation/native';

import {colors} from './tokens';

/** React Navigation theme aligned with web TWA shell. */
export const AppNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};
