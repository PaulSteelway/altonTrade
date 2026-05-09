import React from 'react';
import {Text, StyleSheet, type TextProps} from 'react-native';

import {colors} from '../../theme/tokens';
import {fontFamily} from '../../theme/typography';

export function MutedText({style, ...rest}: TextProps) {
  return <Text style={[styles.txt, style]} {...rest} />;
}

const styles = StyleSheet.create({
  txt: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
  },
});
