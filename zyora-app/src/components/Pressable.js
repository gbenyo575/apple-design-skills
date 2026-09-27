import React, { useState } from 'react';
import { Pressable } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { colors } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

// Feedback on press-in, commit on press-out. A 120 ms CSS transition on the
// transform is the whole implementation — no gesture, no shared value.
export function PressableScale({ scale = 0.97, disabled, style, children, hitSlop = 8, onPressIn, onPressOut, ...rest }) {
  const [pressed, setPressed] = useState(false);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={hitSlop}
      pressRetentionOffset={16}
      onPressIn={event => { setPressed(true); onPressIn?.(event); }}
      onPressOut={event => { setPressed(false); onPressOut?.(event); }}
      style={[
        style,
        {
          transform: [{ scale: pressed && !disabled ? scale : 1 }],
          transitionProperty: 'transform',
          transitionDuration: 120,
          transitionTimingFunction: EASE_OUT,
        },
      ]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

// List rows highlight instead of scaling: a whole row shrinking reads as a glitch.
export function PressableRow({ style, children, disabled, ...rest }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      pressRetentionOffset={16}
      style={({ pressed }) => [style, pressed && !disabled && { backgroundColor: colors.surface3 }]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
