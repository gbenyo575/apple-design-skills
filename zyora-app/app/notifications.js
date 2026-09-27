import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../src/AppContext';
import { EmptyState } from '../src/components/EmptyState';
import { PressableRow } from '../src/components/Pressable';
import { StackScreen } from '../src/components/Screen';
import { IconTile } from '../src/components/Surface';
import { T } from '../src/components/Text';
import { buildNotifications } from '../src/features/notifications';
import { formatRelativeDate } from '../src/format';
import { colors, radii, space } from '../src/theme';

// Every notification answers: what happened, where the money went, and —
// by tapping it — where to change it.
export default function NotificationsScreen() {
  const router = useRouter();
  const app = useApp();
  const { state, t, markNotificationsSeen } = app;
  const items = useMemo(() => buildNotifications(app), [app]);
  const seen = state.seenNotifications || [];
  const [unseenAtOpen] = React.useState(() => new Set(items.filter(item => !seen.includes(item.id)).map(item => item.id)));

  useFocusEffect(useCallback(() => {
    const ids = items.map(item => item.id).filter(id => !(state.seenNotifications || []).includes(id));
    if (ids.length) markNotificationsSeen(ids);
  }, [items, markNotificationsSeen, state.seenNotifications]));

  if (!items.length) {
    return (
      <StackScreen>
        <EmptyState icon="notifications-off-outline" title={t('notif.emptyTitle')} body={t('notif.emptyBody')} action={t('notif.emptyAction')} onAction={() => router.navigate('/profile')} />
      </StackScreen>
    );
  }

  return (
    <StackScreen>
      <View style={styles.group}>
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <PressableRow onPress={() => router.push(item.href)} style={styles.row} accessibilityLabel={`${item.title}. ${item.body}`}>
              <IconTile icon={item.icon} tone={item.tone} size={40} />
              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <T variant="callout" weight="600" style={styles.flex}>{item.title}</T>
                  {unseenAtOpen.has(item.id) ? <View style={styles.dot} accessibilityLabel={t('notif.new')} /> : null}
                </View>
                <T variant="footnote" tone="secondary" style={styles.body}>{item.body}</T>
                <T variant="caption" tone="tertiary" style={styles.time}>{formatRelativeDate(item.date, state.lang)}</T>
              </View>
            </PressableRow>
          </React.Fragment>
        ))}
      </View>
      <T variant="footnote" tone="tertiary" style={styles.footer}>{t('notif.footer')}</T>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineStrong, marginLeft: 68 },
  row: { flexDirection: 'row', gap: space.md, padding: space.lg },
  copy: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.purple },
  body: { marginTop: 2 },
  time: { marginTop: space.xs },
  footer: { marginTop: space.md, marginHorizontal: space.xs },
});
