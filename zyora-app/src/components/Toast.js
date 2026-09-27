import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, easing, radii, space, TAB_BAR_HEIGHT } from '../theme';
import { T } from './Text';

// Enter from the bottom, leave the same way, exit ~20% faster than entry.
const ENTER = FadeInDown.duration(260).easing(easing.out);
const EXIT = FadeOutDown.duration(200).easing(easing.out);
const ENTER_REDUCED = FadeIn.duration(200);
const EXIT_REDUCED = FadeOut.duration(160);

const tones = {
  success: { icon: 'checkmark-circle', color: colors.green },
  info: { icon: 'information-circle', color: colors.purpleLight },
  shield: { icon: 'shield-checkmark', color: colors.purpleLight },
  error: { icon: 'alert-circle', color: colors.red },
};

const ToastContext = createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const hide = useCallback(() => { clearTimeout(timer.current); setToast(null); }, []);
  const show = useCallback((message, tone = 'success', { offset = 'tabs' } = {}) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone, offset });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const value = useMemo(() => ({ show, hide }), [show, hide]);
  const bottom = (toast?.offset === 'tabs' ? TAB_BAR_HEIGHT : 0) + Math.max(insets.bottom, space.md) + space.md;
  const tone = tones[toast?.tone] || tones.info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View key={toast.id} entering={reduced ? ENTER_REDUCED : ENTER} exiting={reduced ? EXIT_REDUCED : EXIT} style={[styles.wrap, { bottom }]}>
          <Pressable onPress={hide} style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Ionicons name={tone.icon} size={20} color={tone.color} />
            <T variant="subhead" weight="500" style={styles.text}>{toast.message}</T>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg, pointerEvents: 'box-none' },
  toast: {
    minHeight: 52,
    borderRadius: radii.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
    boxShadow: '0 8px 18px rgba(0,0,0,0.35)',
  },
  text: { flex: 1 },
});
