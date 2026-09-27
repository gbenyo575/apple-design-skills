import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { currencyLabel, groupDigits } from '../format';
import { easing } from '../theme';
import { T } from './Text';

const currencyVariant = { display: 'title', largeTitle: 'headline', title: 'callout', headline: 'subhead' };

// When the number changes (after sending or saving money) the new value
// settles in from the direction it moved: up when it grew, down when it
// shrank. Never plays on mount; one persistent view, so layout never jumps.
export function Amount({ value, lang = 'hu', variant = 'display', tone = 'primary', sign = false, animate = true, style, accessibilityLabel }) {
  const reduced = useReducedMotion();
  const n = Math.round(Number(value) || 0);
  const progress = useSharedValue(1);
  const direction = useSharedValue(1);
  const previous = useRef(n);

  useEffect(() => {
    if (previous.current === n) return;
    direction.set(n > previous.current ? 1 : -1);
    previous.current = n;
    if (!animate) return;
    progress.set(0);
    progress.set(withTiming(1, { duration: 280, easing: easing.out }));
  }, [n, animate, direction, progress]);

  const animatedStyle = useAnimatedStyle(() => (reduced
    ? { opacity: 0.4 + 0.6 * progress.get() }
    : { opacity: 0.35 + 0.65 * progress.get(), transform: [{ translateY: (1 - progress.get()) * 10 * direction.get() }] }));

  const prefix = sign ? (n > 0 ? '+' : n < 0 ? '−' : '') : n < 0 ? '−' : '';
  const digits = groupDigits(n, lang);
  return (
    <View style={style} accessible accessibilityLabel={accessibilityLabel ? `${accessibilityLabel}: ${prefix}${digits} ${currencyLabel(lang)}` : undefined}>
      <Animated.View style={[styles.row, animatedStyle]}>
        <T variant={variant} tone={tone} tabular>{prefix}{digits}</T>
        <T variant={currencyVariant[variant] || 'subhead'} tone={tone === 'primary' ? 'secondary' : tone} weight="600" style={styles.currency}>{currencyLabel(lang)}</T>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  currency: { marginLeft: 6 },
});
