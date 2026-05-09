/**
 * Inter TTF linked via `assets/fonts` + `react-native.config.js` + `npx react-native-asset`.
 * Use the base name (without .ttf) for `fontFamily` on iOS and Android.
 */
export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const typography = {
  titleLarge: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    fontFamily: fontFamily.bold,
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: fontFamily.bold,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: fontFamily.semibold,
  },
  body: {fontSize: 15, fontWeight: '400' as const, fontFamily: fontFamily.regular},
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: fontFamily.medium,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: fontFamily.medium,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    fontFamily: fontFamily.medium,
  },
};
