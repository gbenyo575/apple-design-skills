import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../../src/AppContext';
import { Amount } from '../../src/components/Amount';
import { EmptyState } from '../../src/components/EmptyState';
import { PaceChart } from '../../src/components/PaceChart';
import { ProgressBar } from '../../src/components/Progress';
import { PressableRow } from '../../src/components/Pressable';
import { TabScreen } from '../../src/components/Screen';
import { Sheet } from '../../src/components/Sheet';
import { Card, Divider, Group, IconTile, Row, SectionHeader } from '../../src/components/Surface';
import { T } from '../../src/components/Text';
import { TransactionList, TransactionSheet, categoryLabel } from '../../src/components/Transactions';
import { categories, previousMonth } from '../../src/data';
import { categoryBreakdown, cumulativeByDay, isSpending, isThisMonth, monthFlow } from '../../src/finance';
import { formatMoney, monthIn, monthName } from '../../src/format';
import { colors, radii, space } from '../../src/theme';

export default function InsightsScreen() {
  const router = useRouter();
  const { state, money, month, t } = useApp();
  const lang = state.lang;
  const now = new Date();
  const [category, setCategory] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);

  const breakdown = useMemo(() => categoryBreakdown(state.transactions, previousMonth), [state.transactions]);
  const points = useMemo(() => cumulativeByDay(state.transactions), [state.transactions]);
  const flow = useMemo(() => monthFlow(state, money), [state, money]);
  const prevSoFar = Math.round(previousMonth.total * (month.day / month.daysInMonth));
  const change = prevSoFar ? Math.round((month.spent - prevSoFar) / prevSoFar * 100) : 0;
  const maxCategory = breakdown[0]?.total || 1;
  const goalsTarget = state.goals.reduce((s, g) => s + g.target, 0);
  const categoryTxs = useMemo(() => (category ? state.transactions.filter(tx => isThisMonth(tx) && isSpending(tx) && (category === 'transfer' ? tx.kind === 'transfer' : tx.category === category && tx.kind !== 'transfer')).sort((a, b) => new Date(b.date) - new Date(a.date)) : []), [category, state.transactions]);
  const monthLabel = monthName(now.getMonth(), lang);

  return (
    <TabScreen title={t('insights.title')} subtitle={monthLabel}>
      <Card>
        <T variant="subhead" tone="secondary">{t('insights.spentSoFar', { month: monthIn(now.getMonth(), lang) })}</T>
        <Amount value={month.spent} lang={lang} variant="largeTitle" style={styles.bigAmount} accessibilityLabel={t('insights.spentSoFar', { month: monthIn(now.getMonth(), lang) })} />
        <View style={styles.compare}>
          <Ionicons name={change <= 0 ? 'trending-down' : 'trending-up'} size={16} color={change <= 0 ? colors.green : colors.orange} />
          <T variant="footnote" tone={change <= 0 ? 'positive' : 'warning'} weight="500" style={styles.flex}>
            {change <= 0 ? t('insights.lessThanLast', { pct: Math.abs(change) }) : t('insights.moreThanLast', { pct: change })}
          </T>
        </View>
      </Card>

      <SectionHeader title={t('insights.paceTitle')} />
      <Card>
        <PaceChart
          points={points}
          budget={month.budget}
          daysInMonth={month.daysInMonth}
          lang={lang}
          labels={{
            actual: t('insights.legendActual'),
            pace: t('insights.legendPace'),
            budget: t('insights.budget'),
            day: d => (lang === 'en' ? String(d) : `${d}.`),
            a11y: t('insights.chartA11y', { spent: formatMoney(month.spent, lang), budget: formatMoney(month.budget, lang) }),
          }}
        />
        <Divider style={styles.divider} />
        <View style={styles.projection}>
          <Ionicons name={month.projectedLeft >= 0 ? 'checkmark-circle' : 'alert-circle'} size={18} color={month.projectedLeft >= 0 ? colors.green : colors.orange} />
          <T variant="subhead" style={styles.flex}>
            {month.projectedLeft >= 0
              ? t('insights.projectionLeft', { amount: formatMoney(month.projectedLeft, lang) })
              : t('insights.projectionOver', { amount: formatMoney(-month.projectedLeft, lang) })}
          </T>
        </View>
      </Card>

      <SectionHeader title={t('insights.categoriesTitle')} />
      {breakdown.length ? (
        <View style={styles.group}>
          {breakdown.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <PressableRow onPress={() => setCategory(item.id)} style={styles.catRow} accessibilityLabel={`${categoryLabel(item.id, lang)}, ${formatMoney(item.total, lang)}`}>
                <IconTile icon={categories[item.id]?.icon || 'ellipse-outline'} size={36} />
                <View style={styles.flex}>
                  <View style={styles.catTop}>
                    <T variant="callout" weight="500" style={styles.flex} numberOfLines={1}>{categoryLabel(item.id, lang)}</T>
                    <T variant="callout" weight="600" tabular>{formatMoney(item.total, lang)}</T>
                  </View>
                  <View style={styles.catBar}><ProgressBar value={item.total / maxCategory * 100} color={colors.spendable} height={5} /></View>
                  <View style={styles.catTop}>
                    <T variant="caption" tone="tertiary" style={styles.flex}>{t('insights.items', { count: item.count })}</T>
                    {item.change != null ? (
                      <T variant="caption" tone={item.change > 10 ? 'warning' : item.change < -10 ? 'positive' : 'tertiary'} tabular>
                        {item.change > 0 ? '↑' : item.change < 0 ? '↓' : ''}{Math.abs(item.change)}% {t('insights.vsLast')}
                      </T>
                    ) : null}
                  </View>
                </View>
              </PressableRow>
            </React.Fragment>
          ))}
        </View>
      ) : (
        <EmptyState icon="receipt-outline" title={t('insights.emptyTitle')} body={t('insights.emptyBody')} />
      )}

      <SectionHeader title={t('insights.flowTitle', { month: monthLabel })} />
      <Group footer={t('insights.flowFooter')}>
        <Row title={t('insights.flowIncome')} value={formatMoney(flow.income, lang, { sign: true })} valueTone="positive" />
        <Row title={t('insights.flowFixed')} value={formatMoney(-flow.fixed, lang)} />
        <Row title={t('insights.flowAutoSaved')} subtitle={t('insights.flowAutoSavedHint')} value={formatMoney(-flow.autoSaved, lang)} valueTone="accent" />
        {flow.contributions > 0 ? <Row title={t('insights.flowManual')} value={formatMoney(-flow.contributions, lang)} valueTone="accent" /> : null}
        {flow.releases > 0 ? <Row title={t('insights.flowReleases')} value={formatMoney(flow.releases, lang, { sign: true })} valueTone="accent" /> : null}
        {flow.coverage > 0 ? <Row title={t('insights.flowCoverage')} value={formatMoney(flow.coverage, lang, { sign: true })} valueTone="warning" /> : null}
        {flow.other !== 0 ? <Row title={t('insights.flowOther')} value={formatMoney(flow.other, lang, { sign: true })} /> : null}
        <Row title={t('insights.flowSpent')} value={formatMoney(-flow.spent, lang)} />
        <View style={styles.totalRow}>
          <T variant="headline" style={styles.flex}>{t('insights.flowLeft')}</T>
          <T variant="headline" tabular tone={flow.left < 0 ? 'negative' : 'primary'}>{formatMoney(flow.left, lang)}</T>
        </View>
      </Group>

      <SectionHeader title={t('insights.savingsTitle')} />
      <Card onPress={() => router.navigate('/goals')} accessibilityLabel={t('insights.savingsTitle')}>
        <View style={styles.savingsTop}>
          <View style={styles.flex}>
            <T variant="footnote" tone="secondary">{t('insights.savingsRate')}</T>
            <T variant="title" tabular>{state.savingsRate}%</T>
          </View>
          <View style={styles.flexEnd}>
            <T variant="footnote" tone="secondary">{t('insights.savingsTotal')}</T>
            <T variant="title" tabular>{formatMoney(money.totalGoals, lang)}</T>
          </View>
        </View>
        <View style={styles.savingsBar}><ProgressBar value={goalsTarget ? money.totalGoals / goalsTarget * 100 : 0} color={colors.protected} height={6} /></View>
        <T variant="footnote" tone="secondary">{t('insights.savingsProgress', { pct: goalsTarget ? Math.round(money.totalGoals / goalsTarget * 100) : 0, target: formatMoney(goalsTarget, lang) })}</T>
      </Card>

      <Group style={styles.proRow}>
        <Row icon="sparkles-outline" iconTone="purple" title={t('insights.proTitle')} subtitle={t('insights.proSubtitle')} onPress={() => router.push('/pro')} />
      </Group>

      <Sheet visible={Boolean(category)} onClose={() => setCategory(null)} title={category ? categoryLabel(category, lang) : ''} subtitle={category ? t('insights.categorySheetSubtitle', { month: monthIn(now.getMonth(), lang) }) : null} scroll closeLabel={t('common.close')}>
        <View style={styles.sheetList}><TransactionList transactions={categoryTxs} onSelect={tx => { setCategory(null); setTimeout(() => setSelectedTx(tx), 260); }} /></View>
      </Sheet>
      <TransactionSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexEnd: { alignItems: 'flex-end' },
  bigAmount: { marginTop: space.xs },
  compare: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm },
  divider: { marginVertical: space.lg },
  projection: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  group: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineStrong, marginLeft: space.lg },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  catTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  catBar: { marginVertical: 6 },
  totalRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.lg, backgroundColor: colors.surface2 },
  savingsTop: { flexDirection: 'row', alignItems: 'flex-end' },
  savingsBar: { marginTop: space.lg, marginBottom: space.sm },
  proRow: { marginTop: space.xxl },
  sheetList: { marginHorizontal: -space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong },
});
