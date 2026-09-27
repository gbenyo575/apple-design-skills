import { Alert, Platform } from 'react-native';

// Native destructive-action dialog; falls back to window.confirm on web,
// where React Native's Alert has no implementation.
export function confirmDestructive({ title, message, confirmLabel, cancelLabel, onConfirm }) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
