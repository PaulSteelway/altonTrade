import React from 'react';
import {Text, StyleSheet, type TextProps} from 'react-native';

import {colors} from '../../theme/tokens';
import {typography} from '../../theme/typography';

type Props = TextProps & {
  subtitle?: string;
};

/** Matches `.profit-title` / section headings on TWA. */
export function SectionTitle({style, children, subtitle, ...rest}: Props) {
  return (
    <>
      <Text style={[styles.title, style]} {...rest}>
        {children}
      </Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
});
