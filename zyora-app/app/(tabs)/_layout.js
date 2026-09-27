import { Tabs } from 'expo-router';
import React from 'react';
import { useApp } from '../../src/AppContext';
import { TabBar } from '../../src/components/TabBar';
import { logScreenView } from '../../src/services/logger';
import { colors } from '../../src/theme';

// Five peers, each named for what it contains. Levels, Friends and Pro moved
// out of the tab bar: they are occasional destinations, not daily ones.
export default function TabsLayout() {
  const { t } = useApp();
  return (
    <Tabs
      tabBar={props => <TabBar {...props} />}
      screenListeners={{ focus: event => logScreenView(event.target?.split('-')[0] || 'tab') }}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, animation: 'none' }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="plan" options={{ title: t('tabs.plan') }} />
      <Tabs.Screen name="goals" options={{ title: t('tabs.goals') }} />
      <Tabs.Screen name="insights" options={{ title: t('tabs.insights') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
