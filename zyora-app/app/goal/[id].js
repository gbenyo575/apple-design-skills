import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../../src/AppContext';
import { confirmDestructive } from '../../src/confirm';
import { Amount } from '../../src/components/Amount';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { ProgressRing } from '../../src/components/Progress';
import { PressableScale } from '../../src/components/Pressable';
import { StackScreen } from '../../src/components/Screen';
import { Group, Row, SectionHeader, StatusBadge } from '../../src/components/Surface';
import { T } from '../../src/components/Text';
import { useToast } from '../../src/components/Toast';
import { TransactionList, TransactionSheet } from '../../src/components/Transactions';
import { ContributeSheet, GoalFormSheet, ShieldSheet, WithdrawSheet, goalName } from '../../src/features/GoalSheets';
import { formatMoney, formatMonthKey, formatReleaseTime } from '../../src/format';
import { haptic } from '../../src/haptics';
import { colors, space } from '../../src/theme';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { state, goalPlan, t, cancelRelease, deleteGoal } = useApp();
  const lang = state.lang;
  const goal = state.goals.find(item => item.id === id);
  const [sheet, setSheet] = useState(null); // 'add' | 'withdraw' | 'edit' | 'shield'
  const [selectedTx, setSelectedTx] = useState(null);
  const history = useMemo(() => state.transactions.filter(tx => tx.goalId === id).sort((a, b) => new Date(b.date) - new Date(a.date)), [state.transactions, id]);
  const pending = (state.pendingReleases || []).filter(item => item.goalId === id);

  if (!goal) {
    return (
      <StackScreen>
        <Stack.Screen options={{ title: '' }} />
        <EmptyState icon="flag-outline" title={t('goal.missingTitle')} body={t('goal.missingBody')} action={t('goal.backToGoals')} onAction={() => router.back()} />
      </StackScreen>
    );
  }

  const info = goalPlan.byId[goal.id];
  const shield = Number(goal.shield) || 0;
  const name = goalName(goal, lang);
  const statusBadge = {
    complete: ['good', t('goals.complete')],
    onTrack: ['good', t('goal.onTrack')],
    behind: ['warning', t('goal.behind', { months: info.delayMonths })],
    paused: ['neutral', t('goal.paused')],
  }[info.status];

  function confirmDelete() {
    const moneyNote = goal.saved > 0
      ? shield ? t('goal.deleteBodyShield', { amount: formatMoney(goal.saved, lang), hours: shield }) : t('goal.deleteBodyInstant', { amount: formatMoney(goal.saved, lang) })
      : t('goal.deleteBodyEmpty');
    confirmDestructive({
      title: t('goal.deleteTitle', { goal: name }),
      message: moneyNote,
      cancelLabel: t('common.cancel'),
      confirmLabel: t('goal.deleteConfirm'),
      onConfirm: () => {
        // Leave first, then delete, so the screen never flashes "goal not found" mid-transition.
        haptic.medium();
        router.back();
        setTimeout(() => {
          deleteGoal(goal.id);
          toast.show(t('goal.deletedToast', { goal: name }), 'info', { offset: 'tabs' });
        }, 350);
      },
    });
  }

  function onCancelRelease(item) {
    const result = cancelRelease(item.id);
    if (result.ok) {
      haptic.success();
      toast.show(t('goal.releaseCancelled', { amount: formatMoney(item.amount, lang) }), 'shield', { offset: 'none' });
    }
  }

  return (
    <StackScreen>
      <Stack.Screen options={{
        title: name,
        headerRight: () => (
          <PressableScale onPress={() => setSheet('edit')} hitSlop={12} accessibilityLabel={t('goal.edit')}>
            <T variant="callout" tone="accent" weight="600">{t('goal.edit')}</T>
          </PressableScale>
        ),
      }} />

      <View style={styles.hero}>
        <ProgressRing value={info.progress} size={176} stroke={12} color={colors.protected}>
          <T style={styles.emoji}>{goal.emoji}</T>
          <T variant="headline" tabular>{info.progress}%</T>
        </ProgressRing>
        <Amount value={goal.saved} lang={lang} variant="largeTitle" style={styles.saved} accessibilityLabel={t('goal.saved')} />
        <T variant="subhead" tone="secondary">{t('goal.ofTarget', { amount: formatMoney(goal.target, lang) })}</T>
        <View style={styles.badge}><StatusBadge tone={statusBadge[0]} label={statusBadge[1]} /></View>
      </View>

      <View style={styles.actions}>
        <Button label={t('goal.addMoney')} icon="add" onPress={() => setSheet('add')} disabled={info.status === 'complete'} style={styles.flex} />
        <Button label={t('goal.withdraw')} variant="secondary" onPress={() => setSheet('withdraw')} disabled={goal.saved <= 0} style={styles.flex} />
      </View>

      {pending.length ? (
        <Group title={t('goal.pendingTitle')} style={styles.section}>
          {pending.map(item => (
            <Row
              key={item.id}
              icon="time-outline"
              iconTone="purple"
              title={formatMoney(item.amount, lang)}
              subtitle={t('goal.pendingRow', { time: formatReleaseTime(item.releaseAt, lang) })}
              accessory={<Button label={t('goal.cancelRelease')} variant="tinted" size="sm" onPress={() => onCancelRelease(item)} />}
            />
          ))}
        </Group>
      ) : null}

      <Group title={t('goal.planTitle')} style={styles.section}>
        <Row icon="repeat-outline" iconTone="green" title={t('goal.monthly')} value={info.monthly ? formatMoney(info.monthly, lang) : '—'} onPress={() => router.navigate('/plan')} />
        <Row icon="calendar-outline" title={t('goal.deadline')} value={goal.targetDate ? formatMonthKey(goal.targetDate, lang) : t('goal.noDeadline')} onPress={() => setSheet('edit')} />
        <Row icon="flag-outline" title={t('goal.eta')} value={info.status === 'complete' ? t('goals.complete') : info.etaKey ? formatMonthKey(info.etaKey, lang) : '—'} />
        <Row icon={shield ? 'shield-checkmark' : 'shield-outline'} iconTone={shield ? 'purple' : 'neutral'} title={t('goal.shield')} subtitle={shield ? t('goal.shieldOn', { hours: shield }) : t('goal.shieldOffHint')} value={shield ? t('shield.hoursShort', { hours: shield }) : t('shield.off')} onPress={() => setSheet('shield')} />
      </Group>

      <SectionHeader title={t('goal.history')} />
      {history.length ? (
        <View style={styles.listCard}><TransactionList transactions={history} onSelect={setSelectedTx} /></View>
      ) : (
        <T variant="subhead" tone="secondary">{t('goal.historyEmpty')}</T>
      )}

      <Button label={t('goal.delete')} variant="destructive" size="md" onPress={confirmDelete} style={styles.delete} />

      <ContributeSheet visible={sheet === 'add'} goalId={goal.id} onClose={() => setSheet(null)} toastOffset="none" />
      <WithdrawSheet visible={sheet === 'withdraw'} goal={goal} onClose={() => setSheet(null)} toastOffset="none" />
      <GoalFormSheet visible={sheet === 'edit'} goal={goal} onClose={() => setSheet(null)} toastOffset="none" />
      <ShieldSheet visible={sheet === 'shield'} goal={goal} onClose={() => setSheet(null)} />
      <TransactionSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center', paddingTop: space.md },
  emoji: { fontSize: 34, lineHeight: 42 },
  saved: { marginTop: space.xl },
  badge: { marginTop: space.md },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.xxl },
  section: { marginTop: space.xxl },
  listCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, overflow: 'hidden' },
  delete: { marginTop: space.xxxl, alignSelf: 'center' },
});
