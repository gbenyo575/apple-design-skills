import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { haptic } from '../haptics';
import { colors, easing, radii, space } from '../theme';
import { IconButton } from './Button';
import { T } from './Text';

// Where a flick would come to rest (Apple's exponential-decay projection).
function project(velocity, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// Past the top edge the sheet resists instead of stopping dead.
function rubberband(overshoot, dimension, constant = 0.55) {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

// Bottom sheet for short, focused tasks (add money, edit, details).
// Opens with the iOS sheet curve, follows the finger 1:1, dismisses on a flick
// or a drag past 40 %, and hands the release velocity to the spring.
export function Sheet({ visible, onClose, title, subtitle, children, footer, scroll = false, closeLabel = 'Close' }) {
  const [mounted, setMounted] = useState(visible);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const translateY = useSharedValue(windowHeight);
  const sheetHeight = useSharedValue(windowHeight);
  const context = useSharedValue(0);
  const opening = useRef(false);

  useEffect(() => {
    if (visible) {
      if (!mounted) {
        setMounted(true); // first layout starts the open animation
      } else {
        opening.current = true; // reopened mid-close: reverse from where it is
        translateY.set(withTiming(0, { duration: 300, easing: easing.sheet }));
      }
      return;
    }
    if (!mounted) return;
    opening.current = false;
    translateY.set(withTiming(sheetHeight.get(), { duration: 220, easing: easing.sheet }, finished => {
      if (finished) scheduleOnRN(setMounted, false);
    }));
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSheetLayout = useCallback(event => {
    const h = event.nativeEvent.layout.height;
    sheetHeight.set(h);
    if (visible && !opening.current) {
      opening.current = true;
      translateY.set(h);
      translateY.set(withTiming(0, { duration: 300, easing: easing.sheet }));
    }
  }, [visible, sheetHeight, translateY]);

  const requestClose = useCallback(() => onClose?.(), [onClose]);

  const pan = useMemo(() => Gesture.Pan()
    .activeOffsetY([-8, 8])
    .failOffsetX([-14, 14]) // horizontal chip rows keep scrolling
    .onStart(() => {
      context.set(translateY.get()); // grab mid-animation continues from where it is
    })
    .onUpdate(e => {
      const next = context.get() + e.translationY;
      translateY.set(next >= 0 ? next : rubberband(next, sheetHeight.get()));
    })
    .onEnd(e => {
      const projected = translateY.get() + project(e.velocityY);
      if (projected > sheetHeight.get() * 0.4) {
        translateY.set(withSpring(sheetHeight.get(), { duration: 300, dampingRatio: 1, velocity: e.velocityY, overshootClamping: true }, finished => {
          if (finished) scheduleOnRN(requestClose); // a re-grab mid-flight cancels the dismissal
        }));
      } else {
        translateY.set(withSpring(0, { duration: 300, dampingRatio: 0.8, velocity: e.velocityY }));
        if (Math.abs(translateY.get()) > 24) scheduleOnRN(haptic.light);
      }
    }), [requestClose, context, sheetHeight, translateY]);

  const sheetStyle = useAnimatedStyle(() => (reduced
    ? { opacity: interpolate(translateY.get(), [0, sheetHeight.get()], [1, 0], Extrapolation.CLAMP) }
    : { transform: [{ translateY: translateY.get() }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.get(), [0, sheetHeight.get()], [1, 0], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;

  const header = (
    <View style={styles.header} collapsable={false}>
      <View style={styles.grabber} />
      {title ? (
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <T variant="title" accessibilityRole="header">{title}</T>
            {subtitle ? <T variant="subhead" tone="secondary" style={styles.subtitle}>{subtitle}</T> : null}
          </View>
          <IconButton icon="close" size={34} onPress={requestClose} accessibilityLabel={closeLabel} />
        </View>
      ) : <IconButton icon="close" size={34} onPress={requestClose} accessibilityLabel={closeLabel} style={styles.floatingClose} />}
    </View>
  );

  const body = scroll ? (
    <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} style={styles.scroll}>
      {children}
    </ScrollView>
  ) : <View style={styles.content}>{children}</View>;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={requestClose}>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityRole="button" accessibilityLabel={closeLabel} />
        </Animated.View>
        <KeyboardAvoidingView behavior="padding" style={styles.avoider}>
          {/* Short sheets drag from anywhere; scrollable ones only by the header,
              so the drag never fights the list inside. */}
          <MaybeDetector gesture={pan} enabled={!scroll}>
            <Animated.View
              accessibilityViewIsModal
              onLayout={onSheetLayout}
              style={[styles.sheet, { maxHeight: windowHeight - insets.top - 12, paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }, sheetStyle]}
            >
              <MaybeDetector gesture={pan} enabled={scroll}>{header}</MaybeDetector>
              {body}
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </Animated.View>
          </MaybeDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

function MaybeDetector({ gesture, enabled, children }) {
  return enabled ? <GestureDetector gesture={gesture}>{children}</GestureDetector> : children;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { backgroundColor: colors.scrim },
  avoider: { flex: 1, justifyContent: 'flex-end', pointerEvents: 'box-none' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: colors.hairlineStrong,
  },
  header: { paddingHorizontal: space.xl, paddingTop: space.sm },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.surface3, marginBottom: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.lg },
  titleCopy: { flex: 1, paddingTop: 2 },
  subtitle: { marginTop: 4 },
  floatingClose: { position: 'absolute', top: space.md, right: space.xl, zIndex: 1 },
  content: { paddingHorizontal: space.xl },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: space.xl },
  footer: { paddingHorizontal: space.xl, paddingTop: space.lg },
});
