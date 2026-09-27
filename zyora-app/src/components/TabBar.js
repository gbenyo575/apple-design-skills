import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, TAB_BAR_HEIGHT } from '../theme';
import { T } from './Text';

const icons = {
  index: ['home-outline', 'home'],
  plan: ['pie-chart-outline', 'pie-chart'],
  goals: ['flag-outline', 'flag'],
  insights: ['bar-chart-outline', 'bar-chart'],
  profile: ['person-circle-outline', 'person-circle'],
};

export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 8);
}

// Translucent material bar: content scrolls underneath it. Tabs are peers, so
// switching is instant — no slide, no animation (used 100+ times a day).
export function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { height: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8), paddingBottom: Math.max(insets.bottom, 8) }]}>
      {Platform.OS === 'ios' ? <BlurView intensity={60} tint="systemChromeMaterialDark" style={StyleSheet.absoluteFill} /> : null}
      <View style={[StyleSheet.absoluteFill, Platform.OS === 'ios' ? styles.tintIos : styles.tintSolid]} />
      <View style={styles.row} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const [outline, filled] = icons[route.name] || ['ellipse-outline', 'ellipse'];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.title}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <Ionicons name={focused ? filled : outline} size={24} color={focused ? colors.purpleLight : colors.textTertiary} />
              <T variant="caption" weight={focused ? '600' : '500'} style={[styles.label, { color: focused ? colors.purpleLight : colors.textTertiary }]} numberOfLines={1}>
                {options.title}
              </T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong, overflow: 'hidden' },
  tintIos: { backgroundColor: 'rgba(13,12,18,0.55)' },
  tintSolid: { backgroundColor: '#0F0E14' },
  row: { flex: 1, flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 6 },
  pressed: { opacity: 0.6 },
  label: { fontSize: 11, lineHeight: 14 },
});
