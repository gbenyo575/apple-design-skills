import { Stack } from 'expo-router';
import React from 'react';
import { useApp } from '../../src/AppContext';
import { colors } from '../../src/theme';

// Sending money is a self-contained task, so it lives in its own modal stack:
// pick a person → enter an amount → done. Back works at every step.
export default function SendLayout() {
  const { t } = useApp();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.purpleLight,
        headerTitleStyle: { color: colors.text, fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('send.title') }} />
      <Stack.Screen name="[friendId]" options={{ title: t('send.amountTitle') }} />
    </Stack>
  );
}
