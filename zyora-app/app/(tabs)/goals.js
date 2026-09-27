import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../../src/AppContext';
import { Amount } from '../../src/components/Amount';
import { Button, IconButton } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { ProgressBar } from '../../src/components/Progress';
import { TabScreen } from '../../src/components/Screen';
import { Card, IconTile } from '../../src/components/Surface';
import { T } from '../../src/components/Text';
import { GoalFormSheet, goalName, goalStatusText } from '../../src/features/GoalSheets';
import { formatMoney } from '../../src/format';
import { colors, space } from '../../src/theme';

export default function GoalsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state, money, goalPlan, t } = useApp();
  const lang = state.lang;
  const [formOpen, setFormOpen] = useState(false);

  // Home and Plan deep-link here with ?create=1 to open the new-goal form.
  useEffect(() => {
    if (params.create) {
      setFormOpen(true);
      router.setParams({ create: undefined });
    }
  }, [params.create, router]);

  const addButton = <IconButton icon="add" tone="accent" onPress={() => setFormOpen(true)} accessibilityLabel={t('goals.new')} />;

  return (
    <TabScreen title={t('goals.title')} right={addButton}>
      {state.goals.length ? (
        <>
          <Card style={styles.summary}>
            <T variant="subhead" tone="secondary">{t('goals.totalLabel')}</T>
            <Amount value={money.totalGoals} lang={lang} variant="largeTitle" style={styles.summaryAmount} accessibilityLabel={t('goals.totalLabel')} />
            <View style={styles.summaryLine}>
              <Ionicons name="shield-checkmark" size={15} color={colors.green} />
              <T variant="footnote" tone="secondary" style={styles.flex}>{t('goals.autoLine', { amount: formatMoney(goalPlan.pot, lang) })}</T>
            </View>
            {money.pendingTotal > 0 ? (
              <View style={styles.summaryLine}>
                <Ionicons name="time-outline" size={15} color={colors.purpleLight} />
                <T variant="footnote" tone="accent" style={styles.flex}>{t('goals.pendingLine', { amount: formatMoney(money.pendingTotal, lang) })}</T>
              </View>
            ) : null}
          </Card>

          <View style={styles.list}>
            {state.goals.map(goal => {
              const info = goalPlan.byId[goal.id];
              const shield = Number(goal.shield) || 0;
              return (
                <Card key={goal.id} onPress={() => router.push(`/goal/${goal.id}`)} accessibilityLabel={`${goalName(goal, lang)}, ${info.progress}%`}>
                  <View style={styles.top}>
                    <IconTile emoji={goal.emoji} size={44} />
                    <View style={styles.flex}>
                      <T variant="headline" numberOfLines={1}>{goalName(goal, lang)}</T>
                      <T variant="footnote" tone={info.status === 'behind' ? 'warning' : info.status === 'complete' ? 'positive' : 'secondary'} numberOfLines={1}>{goalStatusText(goal, info, t, lang)}</T>
                    </View>
                    <T variant="headline" tabular tone={info.status === 'complete' ? 'positive' : 'primary'}>{info.progress}%</T>
                  </View>
                  <View style={styles.bar}><ProgressBar value={info.progress} color={colors.protected} height={6} /></View>
                  <View style={styles.bottom}>
                    <T variant="footnote" tone="secondary" tabular style={styles.flex}>{formatMoney(goal.saved, lang)} / {formatMoney(goal.target, lang)}</T>
                    <View style={styles.shield}>
                      <Ionicons name={shield ? 'shield-checkmark' : 'shield-outline'} size={13} color={shield ? colors.purpleLight : colors.textTertiary} />
                      <T variant="caption" tone={shield ? 'accent' : 'tertiary'}>{shield ? t('shield.hoursShort', { hours: shield }) : t('shield.off')}</T>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
          <Button label={t('goals.new')} icon="add" variant="tinted" onPress={() => setFormOpen(true)} style={styles.newButton} />
        </>
      ) : (
        <EmptyState icon="flag-outline" title={t('goals.emptyTitle')} body={t('goals.emptyBody')} action={t('goals.createFirst')} onAction={() => setFormOpen(true)} />
      )}

      <GoalFormSheet visible={formOpen} onClose={() => setFormOpen(false)} onCreated={id => router.push(`/goal/${id}`)} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  summary: {},
  summaryAmount: { marginTop: space.xs, marginBottom: space.sm },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.xs },
  list: { gap: space.md, marginTop: space.xl },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  bar: { marginTop: space.lg },
  bottom: { flexDirection: 'row', alignItems: 'center', marginTop: space.md, gap: space.sm },
  shield: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newButton: { marginTop: space.xl },
});
