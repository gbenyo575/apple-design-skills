import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme';
import { PressableScale } from './Pressable';
import { T } from './Text';

const variants = {
  primary: { bg: colors.purpleFill, fg: colors.white },
  secondary: { bg: colors.surface3, fg: colors.text },
  tinted: { bg: colors.purpleTint, fg: colors.purpleLight },
  destructive: { bg: colors.redTint, fg: colors.red },
  plain: { bg: 'transparent', fg: colors.purpleLight },
};

// Primary = the one action a screen is for. Secondary/tinted = alternatives.
// Plain = tertiary, text-only. Labels say what happens ("Add 10 000 Ft").
export function Button({ label, onPress, variant = 'primary', size = 'lg', icon, iconRight, disabled, loading, style, accessibilityLabel }) {
  const v = variants[variant];
  const height = size === 'lg' ? 54 : size === 'md' ? 46 : 36;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
      style={[
        styles.base,
        { height, backgroundColor: v.bg, borderRadius: size === 'sm' ? radii.pill : radii.md, paddingHorizontal: size === 'sm' ? 14 : 20 },
        variant === 'plain' && styles.plain,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={v.fg} /> : null}
          <T variant={size === 'sm' ? 'footnote' : 'callout'} weight="600" style={{ color: v.fg }} numberOfLines={1}>{label}</T>
          {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 15 : 18} color={v.fg} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

export function IconButton({ icon, onPress, accessibilityLabel, size = 44, tone = 'default', badge, style }) {
  const bg = tone === 'accent' ? colors.purpleFill : tone === 'ghost' ? 'transparent' : colors.surface2;
  return (
    <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel} scale={0.94} style={[styles.icon, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, style]}>
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={tone === 'accent' ? colors.white : colors.text} />
      {badge ? <View style={styles.badge} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plain: { paddingHorizontal: 8 },
  disabled: { opacity: 0.4 },
  icon: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.purple, borderWidth: 2, borderColor: colors.surface2 },
});
