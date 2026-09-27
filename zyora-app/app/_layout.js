import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '../src/AppContext';
import { ToastProvider } from '../src/components/Toast';
import { logScreenView } from '../src/services/logger';
import { colors } from '../src/theme';

// Keep the native splash up until the saved demo is restored, then fade
// straight into Home — no second, JS-drawn splash on every launch.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 250, fade: true });

const navigationTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, primary: colors.purpleLight, text: colors.text, border: colors.hairline },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <ThemeProvider value={navigationTheme}>
            <ToastProvider>
              <StatusBar style="light" />
              <RootStack />
            </ToastProvider>
          </ThemeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { loaded, t } = useApp();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <Stack
      screenListeners={{ focus: event => logScreenView(event.target?.split('-')[0] || 'unknown') }}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.purpleLight,
        headerTitleStyle: { color: colors.text, fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
        animation: reduced ? 'fade' : 'default',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="goal/[id]" options={{ title: '' }} />
      <Stack.Screen name="transactions" options={{ title: t('nav.transactions') }} />
      <Stack.Screen name="notifications" options={{ title: t('nav.notifications') }} />
      <Stack.Screen name="levels" options={{ title: t('nav.levels') }} />
      <Stack.Screen name="pro" options={{ title: 'Zyora Pro' }} />
      <Stack.Screen name="send" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
