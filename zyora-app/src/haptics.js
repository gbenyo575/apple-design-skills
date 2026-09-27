import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// One haptic per user action, fired on the same frame as the visual change,
// and never the only feedback (see skills/animate-expo §8).
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';
const safe = fn => () => { if (enabled) fn().catch(() => {}); };

export const haptic = {
  selection: safe(() => Haptics.selectionAsync()),
  light: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
