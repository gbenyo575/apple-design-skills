import { useScrollToTop } from 'expo-router';
import React, { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gutter, space } from '../theme';
import { useTabBarInset } from './TabBar';
import { T } from './Text';

// Root screen of a tab: large title, content scrolls under the translucent
// tab bar, tapping the active tab scrolls back to the top.
export function TabScreen({ title, subtitle, right, header, children, scrollRef, contentStyle }) {
  const ownRef = useRef(null);
  const ref = scrollRef || ownRef;
  useScrollToTop(ref);
  const bottom = useTabBarInset();
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={[styles.content, { paddingBottom: bottom + space.xxxl }, contentStyle]}
        scrollIndicatorInsets={{ bottom }}
      >
        {header || (
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <T variant="largeTitle" accessibilityRole="header">{title}</T>
              {subtitle ? <T variant="subhead" tone="secondary" style={styles.subtitle}>{subtitle}</T> : null}
            </View>
            {right}
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// A pushed screen: the native header handles title and back.
export function StackScreen({ children, contentStyle, scroll = true }) {
  const insets = useSafeAreaInsets();
  if (!scroll) return <View style={[styles.stack, contentStyle]}>{children}</View>;
  return (
    <ScrollView
      style={styles.stack}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingTop: space.lg, paddingBottom: insets.bottom + space.xxxl }, contentStyle]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  stack: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: gutter },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: space.lg, paddingBottom: space.xl, gap: space.md },
  headerCopy: { flex: 1 },
  subtitle: { marginTop: space.xs },
});
