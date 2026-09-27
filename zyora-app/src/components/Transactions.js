import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../AppContext';
import { categories } from '../data';
import { formatFullDate, formatMoney, formatRelativeDate } from '../format';
import { space } from '../theme';
import { Amount } from './Amount';
import { PressableRow } from './Pressable';
import { Sheet } from './Sheet';
import { Group, IconTile, Row } from './Surface';
import { T } from './Text';

// Money moving between spendable and goals is not spending, so it reads in
// the brand colour with a shield, never as a red/green expense.
export function txAppearance(tx) {
  if (tx.kind === 'income') return { icon: 'arrow-down', tone: 'green', amountTone: 'positive' };
  if (tx.kind === 'goal') return { icon: 'shield-checkmark-outline', tone: 'purple', amountTone: 'accent' };
  if (tx.kind === 'release') return { icon: 'arrow-undo-outline', tone: 'purple', amountTone: 'accent' };
  if (tx.kind === 'coverage') return { icon: 'help-buoy-outline', tone: 'orange', amountTone: 'warning' };
  if (tx.kind === 'transfer') return { icon: 'paper-plane-outline', tone: 'neutral', amountTone: 'primary' };
  return { icon: categories[tx.category]?.icon || 'card-outline', tone: 'neutral', amountTone: 'primary' };
}

export function txTitle(tx, lang) {
  return lang === 'en' ? tx.merchantEn || tx.merchant : tx.merchant;
}

export function categoryLabel(id, lang) {
  const c = categories[id];
  return c ? c[lang === 'en' ? 'en' : 'hu'] : id;
}

export function TransactionRow({ tx, onPress }) {
  const { state } = useApp();
  const lang = state.lang;
  const look = txAppearance(tx);
  return (
    <PressableRow onPress={onPress} style={styles.row} accessibilityLabel={`${txTitle(tx, lang)}, ${formatMoney(tx.amount, lang, { sign: true })}`}>
      <IconTile icon={look.icon} tone={look.tone} size={40} />
      <View style={styles.copy}>
        <T variant="callout" weight="500" numberOfLines={1}>{txTitle(tx, lang)}</T>
        <T variant="footnote" tone="secondary" numberOfLines={1} style={styles.meta}>{categoryLabel(tx.category, lang)} · {formatRelativeDate(tx.date, lang)}</T>
      </View>
      <T variant="callout" weight="600" tone={look.amountTone} tabular>{formatMoney(tx.amount, lang, { sign: tx.amount > 0 })}</T>
    </PressableRow>
  );
}

export function TransactionList({ transactions, onSelect }) {
  return (
    <View style={styles.list}>
      {transactions.map((tx, index) => (
        <React.Fragment key={tx.id}>
          {index > 0 ? <View style={styles.separator} /> : null}
          <TransactionRow tx={tx} onPress={() => onSelect(tx)} />
        </React.Fragment>
      ))}
    </View>
  );
}

export function TransactionSheet({ tx, onClose }) {
  const { state, t } = useApp();
  const lang = state.lang;
  const look = tx ? txAppearance(tx) : null;
  const goal = tx?.goalId ? state.goals.find(g => g.id === tx.goalId) : null;
  const goalName = goal ? (lang === 'en' ? goal.nameEn || goal.name : goal.name) : tx ? txTitle(tx, lang) : '';
  const flow = !tx ? null
    : tx.kind === 'goal' ? t('tx.flowToGoal', { goal: goalName })
    : tx.kind === 'release' ? t('tx.flowFromGoal', { goal: goalName })
    : tx.kind === 'coverage' ? t('tx.flowCoverage')
    : tx.kind === 'income' ? t('tx.flowIncome')
    : t('tx.flowSpendable');
  return (
    <Sheet visible={Boolean(tx)} onClose={onClose} closeLabel={t('common.close')}>
      {tx ? (
        <View>
          <View style={styles.hero}>
            <IconTile icon={look.icon} tone={look.tone} size={56} />
            <T variant="headline" style={styles.heroTitle} align="center">{txTitle(tx, lang)}</T>
            <Amount value={tx.amount} lang={lang} variant="largeTitle" sign={tx.amount > 0} tone={look.amountTone} animate={false} style={styles.heroAmount} />
          </View>
          <Group>
            <Row title={t('tx.category')} value={categoryLabel(tx.category, lang)} />
            <Row title={t('tx.date')} value={formatFullDate(tx.date, lang)} />
            <Row title={t('tx.effect')} subtitle={flow} />
            {tx.note ? <Row title={t('tx.note')} value={tx.note} /> : null}
            <Row title={t('tx.status')} value={t('tx.statusDemo')} />
          </Group>
          {tx.kind === 'coverage' ? <T variant="footnote" tone="secondary" style={styles.explain}>{t('tx.coverageExplain')}</T> : null}
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 64 },
  copy: { flex: 1 },
  meta: { marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.10)', marginLeft: 68 },
  hero: { alignItems: 'center', paddingBottom: space.xl },
  heroTitle: { marginTop: space.md },
  heroAmount: { marginTop: space.xs },
  explain: { marginTop: space.md, marginHorizontal: space.xs },
});
