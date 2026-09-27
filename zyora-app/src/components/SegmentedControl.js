import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { haptic } from '../haptics';
import { colors, easing, radii } from '../theme';
import { T } from './Text';

// Segments are measured once; the pill then moves with transforms (plus the
// sanctioned width animation on an absolute, childless element).
export function SegmentedControl({ options, value, onChange, style, accessibilityLabel }) {
  const [layouts, setLayouts] = useState({});
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const placed = useRef(false);
  const reduced = useReducedMotion();
  const activeIndex = options.findIndex(option => option.value === value);

  useEffect(() => {
    const layout = layouts[activeIndex];
    if (!layout) return;
    if (!placed.current || reduced) {
      placed.current = true;
      x.set(layout.x);
      w.set(layout.width);
      return;
    }
    x.set(withTiming(layout.x, { duration: 250, easing: easing.inOut }));
    w.set(withTiming(layout.width, { duration: 250, easing: easing.inOut }));
  }, [activeIndex, layouts, reduced, w, x]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }], width: w.get() }));

  return (
    <View style={[styles.track, style]} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {activeIndex >= 0 && layouts[activeIndex] ? <Animated.View style={[styles.pill, pillStyle]} /> : null}
      {options.map((option, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.accessibilityLabel || option.label}
            onLayout={event => {
              const { x: lx, width } = event.nativeEvent.layout;
              setLayouts(current => ({ ...current, [index]: { x: lx, width } }));
            }}
            onPress={() => {
              if (active) return;
              haptic.selection();
              onChange(option.value);
            }}
            style={styles.segment}
          >
            <T variant="footnote" weight={active ? '600' : '500'} tone={active ? 'primary' : 'secondary'} numberOfLines={1}>{option.label}</T>
            {option.detail ? <T variant="caption" tone={active ? 'accent' : 'tertiary'} tabular>{option.detail}</T> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: radii.md, padding: 3 },
  pill: { position: 'absolute', top: 3, bottom: 3, left: 0, borderRadius: radii.md - 3, backgroundColor: colors.surface3, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairlineStrong },
  segment: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 4 },
});
