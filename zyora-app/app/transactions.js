import React, { useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../src/AppContext';
import { EmptyState } from '../src/components/EmptyState';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { T } from '../src/components/Text';
import { TransactionRow, TransactionSheet } from '../src/components/Transactions';
import { isSpending } from '../src/finance';
import { formatDayHeading, formatMoney, startOfDay } from '../src/format';
import { colors, gutter, radii, space } from '../src/theme';

const FILTERS = {
  all: () => true,
  spending: tx => isSpending(tx),
  income: tx => tx.amount > 0 && tx.kind === 'income',
  goals: tx => ['goal', 'release', 'coverage'].includes(tx.kind),
};

export default function TransactionsScreen() {
  const { state, t } = useApp();
  const lang = state.lang;
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState(null);

  const sections = useMemo(() => {
    const byDay = new Map();
    const sorted = state.transactions.filter(FILTERS[filter]).sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const tx of sorted) {
      const key = startOfDay(tx.date).toISOString();
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(tx);
    }
    return [...byDay.entries()].map(([key, data]) => ({
      key,
      title: formatDayHeading(key, lang),
      spent: data.filter(isSpending).reduce((s, tx) => s - tx.amount, 0),
      data,
    }));
  }, [state.transactions, filter, lang]);

  return (
    <View style={styles.root}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + space.xxxl }}
        ListHeaderComponent={(
          <SegmentedControl
            style={styles.filter}
            value={filter}
            onChange={setFilter}
            accessibilityLabel={t('transactions.filter')}
            options={[
              { value: 'all', label: t('transactions.all') },
              { value: 'spending', label: t('transactions.spending') },
              { value: 'income', label: t('transactions.income') },
              { value: 'goals', label: t('transactions.goals') },
            ]}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <T variant="footnote" tone="secondary" weight="600" style={styles.flex}>{section.title}</T>
            {section.spent > 0 ? <T variant="footnote" tone="tertiary" tabular>{formatMoney(-section.spent, lang)}</T> : null}
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View style={[styles.item, index === 0 && styles.first, index === section.data.length - 1 && styles.last]}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <TransactionRow tx={item} onPress={() => setSelectedTx(item)} />
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title={t('transactions.emptyTitle')} body={t('transactions.emptyBody')} />}
      />
      <TransactionSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  filter: { marginTop: space.md, marginBottom: space.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: space.xl, paddingBottom: space.sm, paddingHorizontal: space.xs },
  item: { backgroundColor: colors.surface, overflow: 'hidden', borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  first: { borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, borderTopWidth: StyleSheet.hairlineWidth },
  last: { borderBottomLeftRadius: radii.lg, borderBottomRightRadius: radii.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineStrong, marginLeft: 68 },
});
