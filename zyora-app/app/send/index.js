import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/AppContext';
import { EmptyState } from '../../src/components/EmptyState';
import { PressableRow, PressableScale } from '../../src/components/Pressable';
import { Avatar } from '../../src/components/Surface';
import { T } from '../../src/components/Text';
import { friends } from '../../src/data';
import { colors, gutter, radii, space, type } from '../../src/theme';

const normalize = value => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function ChooseRecipient() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, t } = useApp();
  const lang = state.lang;
  const [query, setQuery] = useState('');
  const nameOf = friend => (lang === 'en' ? friend.nameEn : friend.name);
  const filtered = useMemo(() => friends.filter(friend => normalize(`${friend.name} ${friend.nameEn}`).includes(normalize(query.trim()))), [query]);
  const recent = friends.filter(friend => friend.recent);
  const open = friend => router.push({ pathname: '/send/[friendId]', params: { friendId: friend.id } });

  return (
    <View style={styles.root}>
      <Stack.Screen options={{
        headerLeft: () => (
          <PressableScale onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('common.cancel')}>
            <T variant="callout" tone="accent">{t('common.cancel')}</T>
          </PressableScale>
        ),
      }} />
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('send.search')}
            placeholderTextColor={colors.textTertiary}
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
            accessibilityLabel={t('send.search')}
            maxFontSizeMultiplier={1.4}
          />
          {query ? (
            <PressableScale onPress={() => setQuery('')} hitSlop={12} accessibilityLabel={t('send.clear')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </PressableScale>
          ) : null}
        </View>

        {!query ? (
          <>
            <T variant="footnote" tone="secondary" weight="600" style={styles.label}>{t('send.recent')}</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recent} keyboardShouldPersistTaps="handled">
              {recent.map(friend => (
                <PressableScale key={friend.id} onPress={() => open(friend)} style={styles.recentItem} accessibilityLabel={t('send.sendTo', { name: nameOf(friend) })}>
                  <Avatar label={friend.first.charAt(0)} color={friend.color} size={56} />
                  <T variant="footnote" weight="500" numberOfLines={1}>{friend.first}</T>
                </PressableScale>
              ))}
            </ScrollView>
          </>
        ) : null}

        <T variant="footnote" tone="secondary" weight="600" style={styles.label}>{query ? t('send.results') : t('send.all')}</T>
        {filtered.length ? (
          <View style={styles.group}>
            {filtered.map((friend, index) => (
              <React.Fragment key={friend.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <PressableRow onPress={() => open(friend)} style={styles.row} accessibilityLabel={t('send.sendTo', { name: nameOf(friend) })}>
                  <Avatar label={friend.first.charAt(0)} color={friend.color} size={40} />
                  <View style={styles.flex}>
                    <T variant="callout" weight="500">{nameOf(friend)}</T>
                    <T variant="footnote" tone="secondary">{friend.last[lang === 'en' ? 'en' : 'hu']}</T>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
                </PressableRow>
              </React.Fragment>
            ))}
          </View>
        ) : (
          <EmptyState icon="person-outline" title={t('send.noResults', { query: query.trim() })} body={t('send.noResultsBody')} />
        )}
        <T variant="footnote" tone="tertiary" style={styles.demo}>{t('send.demoNote')}</T>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, height: 46, marginHorizontal: gutter, marginTop: space.md, paddingHorizontal: space.md, borderRadius: radii.md, backgroundColor: colors.surface2 },
  searchInput: { flex: 1, outlineWidth: 0, color: colors.text, ...type.body, lineHeight: undefined, paddingVertical: 0 },
  label: { marginHorizontal: gutter, marginTop: space.xl, marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 },
  recent: { gap: space.lg, paddingHorizontal: gutter },
  recentItem: { alignItems: 'center', gap: 6, width: 64 },
  group: { marginHorizontal: gutter, backgroundColor: colors.surface2, borderRadius: radii.lg, overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineStrong, marginLeft: 68 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 64 },
  demo: { marginHorizontal: gutter, marginTop: space.lg },
});
