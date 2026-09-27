import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatMoney, useApp } from '../AppContext';
import { Card, ProgressBar } from './UI';
import { colors } from '../theme';

const palette = [colors.purple, colors.blue, colors.orange, colors.green, colors.purple2];

export default function AnalysisPanel() {
  const { state, money, month } = useApp();
  const en = state.lang === 'en';
  const categories = useMemo(() => {
    const totals = new Map();
    for (const tx of state.transactions) {
      if (tx.amount >= 0 || tx.kind === 'goal') continue;
      const id = tx.category || 'Egyéb';
      const found = totals.get(id) || { name: id, nameEn: tx.categoryEn || id, total: 0, count: 0 };
      found.total += -tx.amount;
      found.count++;
      totals.set(id, found);
    }
    return [...totals.values()].sort((a, b) => b.total - a.total);
  }, [state.transactions]);

  return (
    <View>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>{en ? 'LIVE DEMO INSIGHTS' : 'ÉLŐ DEMÓELEMZÉS'}</Text>
        <Text style={styles.title}>{en ? 'Your spending, clearly.' : 'Értsd a költéseidet.'}</Text>
        <Text style={styles.subtitle}>{en ? 'Calculated from the example transactions on this device. Try a simulated transfer to see the numbers update.' : 'A készüléken lévő példatranzakciókból számolva. Szimulálj pénzküldést, és figyeld a változást.'}</Text>
      </View>

      <Card style={styles.overview}>
        <View style={styles.heading}><Ionicons name="pie-chart-outline" size={20} color={colors.purple2} /><Text style={styles.headingText}>{en ? 'SPENDING SNAPSHOT' : 'KÖLTÉSI PILLANATKÉP'}</Text></View>
        <Text style={styles.bigNumber}>{formatMoney(month.spent, state.lang)}</Text>
        <Text style={styles.overviewCaption}>{en ? 'spent from your example monthly budget' : 'elköltve a példa havi keretből'}</Text>
        <ProgressBar value={month.budgetUsage} color={month.budgetUsage >= 90 ? colors.red : colors.purple} height={8} />
        <View style={styles.budgetRow}><Text style={styles.budgetText}>{month.budgetUsage}% {en ? 'used' : 'felhasználva'}</Text><Text style={styles.budgetText}>{formatMoney(month.remaining, state.lang)} {en ? 'left' : 'maradt'}</Text></View>
      </Card>

      <View style={styles.metrics}>
        <Card style={styles.metric}><Text style={styles.metricLabel}>{en ? 'Planned savings / month' : 'Tervezett megtakarítás / hó'}</Text><Text style={styles.metricValue}>{formatMoney(money.savedTotal, state.lang)}</Text></Card>
        <Card style={styles.metric}><Text style={styles.metricLabel}>{en ? 'Savings rate' : 'Megtakarítási arány'}</Text><Text style={styles.metricValue}>{state.savingsRate}%</Text></Card>
      </View>

      <Text style={styles.sectionTitle}>{en ? 'Where the example money went' : 'Mire ment el a példapénz?'}</Text>
      <Card style={styles.categories}>
        {categories.length ? categories.map((cat, index) => {
          const color = palette[index % palette.length];
          return <View key={cat.name} style={styles.category}>
            <View style={styles.categoryRow}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={styles.categoryName}>{en ? cat.nameEn : cat.name}</Text><Text style={styles.categoryAmount}>{formatMoney(cat.total, state.lang)}</Text></View>
            <ProgressBar value={month.spent ? cat.total / month.spent * 100 : 0} color={color} height={5} />
            <Text style={styles.categoryDetail}>{Math.round(month.spent ? cat.total / month.spent * 100 : 0)}% · {cat.count} {en ? 'items' : 'tétel'}</Text>
          </View>;
        }) : <Text style={styles.subtitle}>{en ? 'No spending yet.' : 'Még nincs költés.'}</Text>}
      </Card>
      <Text style={styles.note}>{en ? 'Illustrative figures only. No bank statements, accounts or real payments are connected.' : 'Csak szemléltető számok. Nincs összekötött bankszámla, kivonat vagy valódi fizetés.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { paddingTop: 18, paddingBottom: 22 },
  eyebrow: { color: colors.purple2, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -.6, marginTop: 5 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  overview: { backgroundColor: '#211B32', borderColor: '#44385B' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingText: { color: colors.purple2, fontSize: 10, fontWeight: '800', letterSpacing: .7 },
  bigNumber: { color: colors.text, fontSize: 31, fontWeight: '900', marginTop: 18, marginBottom: 3 },
  overviewCaption: { color: colors.muted, fontSize: 12, marginBottom: 18 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 },
  budgetText: { color: colors.muted, fontSize: 11 },
  metrics: { flexDirection: 'row', gap: 9, marginTop: 10 },
  metric: { flex: 1, minHeight: 91, padding: 13, justifyContent: 'center' },
  metricLabel: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  metricValue: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 9 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 28, marginBottom: 12 },
  categories: { paddingHorizontal: 16, paddingVertical: 4 },
  category: { paddingVertical: 15, borderBottomColor: colors.line, borderBottomWidth: 1 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  categoryName: { color: colors.text, fontSize: 13, fontWeight: '700', flex: 1 },
  categoryAmount: { color: colors.text, fontSize: 12, fontWeight: '700' },
  categoryDetail: { color: colors.muted, fontSize: 10, marginTop: 7 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 18 },
});
