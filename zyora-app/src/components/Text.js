import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, type } from '../theme';

const tones = {
  primary: colors.text,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  accent: colors.purpleLight,
  positive: colors.green,
  negative: colors.red,
  warning: colors.orange,
  inverse: colors.white,
};

// One text primitive for the whole app: pick a role from the type scale and a
// tone, never an ad-hoc size. `tabular` keeps money columns aligned.
export function T({ variant = 'body', tone = 'primary', weight, tabular, align, style, children, ...rest }) {
  return (
    <Text
      maxFontSizeMultiplier={variant === 'display' || variant === 'largeTitle' ? 1.25 : 1.6}
      style={[
        type[variant],
        { color: tones[tone] || tone },
        weight && { fontWeight: weight },
        tabular && styles.tabular,
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
});
