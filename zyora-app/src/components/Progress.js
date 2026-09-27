import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, easing, radii } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Renders at its value on mount (no entrance replay every visit) and animates
// only when the value actually changes — e.g. right after adding money.
function useProgressValue(value) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const progress = useSharedValue(pct);
  const mounted = useRef(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    progress.set(reduced ? pct : withTiming(pct, { duration: 300, easing: easing.out }));
  }, [pct, progress, reduced]);
  return progress;
}

export function ProgressBar({ value, color = colors.purple, track = colors.surface3, height = 6, marker, accessibilityLabel }) {
  const progress = useProgressValue(value);
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get()}%` }));
  const markerPct = marker != null ? Math.max(0, Math.min(100, marker)) : null;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.max(0, Math.min(100, value))) }}
      style={[styles.track, { height, backgroundColor: track, borderRadius: height }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color, borderRadius: height }, fillStyle]} />
      {markerPct != null ? <View style={[styles.marker, { left: `${markerPct}%`, height: height + 8, top: -4 }]} /> : null}
    </View>
  );
}

export function ProgressRing({ value, size = 168, stroke = 12, color = colors.purple, track = colors.surface3, children }) {
  const progress = useProgressValue(value);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.get() / 100) }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.ringCenter]}>{children}</View>
    </View>
  );
}

// Part-to-whole bar: segments separated by a 2px surface gap.
export function StackedBar({ segments, height = 10, gap = 2 }) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0) || 1;
  const visible = segments.filter(s => s.value > 0);
  return (
    <View style={[styles.stack, { height, gap }]}>
      {visible.map((segment, index) => (
        <View
          key={segment.key}
          style={{
            flex: Math.max(0, segment.value) / total,
            backgroundColor: segment.color,
            borderTopLeftRadius: index === 0 ? height / 2 : 2,
            borderBottomLeftRadius: index === 0 ? height / 2 : 2,
            borderTopRightRadius: index === visible.length - 1 ? height / 2 : 2,
            borderBottomRightRadius: index === visible.length - 1 ? height / 2 : 2,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'visible', borderRadius: radii.pill },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  marker: { position: 'absolute', width: 2, marginLeft: -1, borderRadius: 1, backgroundColor: colors.text },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  stack: { flexDirection: 'row', width: '100%' },
});
