import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useApp } from '../../src/AppContext';
import { Amount } from '../../src/components/Amount';
import { IconButton } from '../../src/components/Button';
import { ProgressBar, StackedBar } from '../../src/components/Progress';
import { PressableScale } from '../../src/components/Pressable';
import { TabScreen } from '../../src/components/Screen';
import { Avatar, Card, SectionHeader, StatusBadge } from '../../src/components/Surface';
import { T } from '../../src/components/Text';
import { TransactionList, TransactionSheet } from '../../src/components/Transactions';
import { ContributeSheet, goalName } from '../../src/features/GoalSheets';
import { buildNotifications } from '../../src/features/notifications';
import { isThisMonth } from '../../src/finance';
import { formatMoney, formatReleaseTime, formatToday } from '../../src/format';
import { haptic } from '../../src/haptics';
import { colors, easing, gutter, radii, space } from '../../src/theme';

const REVEAL = FadeIn.duration(220).easing(easing.out);
const HIDE = FadeOut.duration(140);
const REFLOW = LinearTransition.duration(240).easing(easing.out);
const EASE_OUT_CSS = cubicBezier(0.23, 1, 0.32, 1);

export default function HomeScreen() {
  const router = useRouter();
  const app = useApp();
  const { state, money, month, goalPlan, t, profile } = app;
  const lang = state.lang;
  const reduced = useReducedMotion();
  const [wealthOpen, setWealthOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const notifications = useMemo(() => buildNotifications(app), [app]);
  const unread = notifications.some(item => !(state.seenNotifications || []).includes(item.id));
  const recent = useMemo(() => [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4), [state.transactions]);
  const coveredThisMonth = useMemo(() => state.transactions.filter(tx => tx.kind === 'coverage' && isThisMonth(tx)).reduce((sum, tx) => sum + tx.amount, 0), [state.transactions]);
  const nextRelease = [...(state.pendingReleases || [])].sort((a, b) => new Date(a.releaseAt) - new Date(b.releaseAt))[0];
  const pace = { good: ['good', t('home.paceGood')], fast: ['warning', t('home.paceFast')], over: ['critical', t('home.paceOver')] }[month.pace];

  const header = (
    <View style={styles.header}>
      <PressableScale onPress={() => router.navigate('/profile')} accessibilityLabel={t('home.openProfile')} scale={0.94}>
        <Avatar label={profile.first.charAt(0)} size={42} />
      </PressableScale>
      <View style={styles.headerCopy}>
        <T variant="headline">{t('home.greeting', { name: profile.first })}</T>
        <T variant="footnote" tone="secondary">{formatToday(lang)}</T>
      </View>
      <IconButton icon="notifications-outline" onPress={() => router.push('/notifications')} accessibilityLabel={unread ? t('home.notificationsUnread') : t('nav.notifications')} badge={unread} />
    </View>
  );

  return (
    <>
      <TabScreen header={header}>
        {/* 1 — the answer to "how much can I spend?" */}
        <View style={styles.hero}>
          <T variant="subhead" tone="secondary" weight="500">{t('home.spendable')}</T>
          <Amount value={money.spendable} lang={lang} variant="display" accessibilityLabel={t('home.spendable')} style={styles.heroAmount} />
          {money.overspent > 0 || (money.spendable === 0 && coveredThisMonth > 0) ? (
            <View style={styles.heroLine}>
              <Ionicons name="alert-circle" size={15} color={colors.red} />
              <T variant="footnote" tone="negative" weight="500" style={styles.flexShrink}>
                {money.overspent > 0 ? t('home.overspent', { amount: formatMoney(money.overspent, lang) }) : t('home.covered', { amount: formatMoney(coveredThisMonth, lang) })}
              </T>
            </View>
          ) : (
            <T variant="footnote" tone="secondary" style={styles.heroSub}>
              {t('home.daily', { amount: formatMoney(money.daily, lang), days: money.daysLeft })}
            </T>
          )}
          {nextRelease ? (
            <PressableScale onPress={() => router.push(state.goals.some(g => g.id === nextRelease.goalId) ? `/goal/${nextRelease.goalId}` : '/notifications')} style={styles.heroLine} accessibilityLabel={t('home.pendingA11y')}>
              <Ionicons name="time-outline" size={15} color={colors.purpleLight} />
              <T variant="footnote" tone="accent" weight="500">{t('home.pending', { amount: formatMoney(money.pendingTotal, lang), time: formatReleaseTime(nextRelease.releaseAt, lang) })}</T>
            </PressableScale>
          ) : null}
        </View>

        {/* 2 — total wealth, one tap away and explained, instead of a hidden swipe */}
        <Animated.View layout={reduced ? undefined : REFLOW} style={styles.wealthCard}>
          <PressableScale
            scale={0.985}
            onPress={() => { haptic.selection(); setWealthOpen(open => !open); }}
            accessibilityRole="button"
            accessibilityState={{ expanded: wealthOpen }}
            accessibilityLabel={`${t('home.totalWealth')}: ${formatMoney(money.totalWealth, lang)}`}
            accessibilityHint={t('home.wealthHint')}
            style={styles.wealthHead}
          >
            <View style={styles.wealthRow}>
              <T variant="subhead" tone="secondary" style={styles.flex}>{t('home.totalWealth')}</T>
              <T variant="callout" weight="600" tabular>{formatMoney(money.totalWealth, lang)}</T>
              <Animated.View style={[styles.chevron, { transform: [{ rotate: wealthOpen ? '180deg' : '0deg' }], transitionProperty: 'transform', transitionDuration: 200, transitionTimingFunction: EASE_OUT_CSS }]}>
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </Animated.View>
            </View>
            <StackedBar height={8} segments={[
              { key: 'spendable', value: Math.max(0, money.spendableRaw), color: colors.spendable },
              { key: 'protected', value: money.protectedTotal, color: colors.protected },
            ]} />
          </PressableScale>
          {wealthOpen ? (
            <Animated.View entering={REVEAL} exiting={HIDE} style={styles.wealthBody}>
              <LegendRow color={colors.spendable} label={t('home.legendSpendable')} value={formatMoney(money.spendable, lang)} />
              <LegendRow color={colors.protected} icon="shield-checkmark" label={t('home.legendProtected')} value={formatMoney(money.totalGoals, lang)} />
              {money.pendingTotal > 0 ? <LegendRow color={colors.purpleLight} icon="time-outline" label={t('home.legendPending')} value={formatMoney(money.pendingTotal, lang)} /> : null}
              <T variant="footnote" tone="secondary" style={styles.explainer}>{t('home.wealthExplainer')}</T>
              <PressableScale onPress={() => router.navigate('/goals')} hitSlop={10} style={styles.inlineLink}>
                <T variant="footnote" tone="accent" weight="600">{t('home.openGoals')}</T>
                <Ionicons name="chevron-forward" size={14} color={colors.purpleLight} />
              </PressableScale>
            </Animated.View>
          ) : null}
        </Animated.View>

        <Animated.View layout={reduced ? undefined : REFLOW}>
          {/* 3 — the three things people actually do from here */}
          <View style={styles.actions}>
            <QuickAction icon="paper-plane-outline" label={t('home.actionSend')} onPress={() => router.push('/send')} />
            <QuickAction icon="shield-checkmark-outline" label={t('home.actionSave')} onPress={() => setContributeOpen(true)} />
            <QuickAction icon="pie-chart-outline" label={t('home.actionPlan')} onPress={() => router.navigate('/plan')} />
          </View>

          {/* 4 — pace: am I spending faster than the month is passing? */}
          <Card onPress={() => router.navigate('/insights')} accessibilityLabel={t('home.budgetA11y')} style={styles.budget}>
            <View style={styles.budgetTop}>
              <T variant="headline" style={styles.flex}>{t('home.budgetTitle')}</T>
              <StatusBadge tone={pace[0]} label={pace[1]} />
            </View>
            <View style={styles.budgetNumbers}>
              <T variant="title" tabular>{formatMoney(month.spent, lang)}</T>
              <T variant="subhead" tone="secondary" tabular> / {formatMoney(month.budget, lang)}</T>
            </View>
            <ProgressBar value={month.budgetUsage} marker={month.monthProgress * 100} color={month.pace === 'over' ? colors.red : month.pace === 'fast' ? colors.orange : colors.purple} height={8} accessibilityLabel={t('home.budgetTitle')} />
            <T variant="footnote" tone="secondary" style={styles.budgetCaption}>
              {t('home.budgetCaption', { used: Math.min(999, month.budgetUsage), elapsed: Math.round(month.monthProgress * 100) })}
            </T>
          </Card>

          <SectionHeader title={t('home.recent')} action={t('common.seeAll')} onAction={() => router.push('/transactions')} />
          <View style={styles.listCard}>
            <TransactionList transactions={recent} onSelect={setSelectedTx} />
          </View>

          <SectionHeader title={t('home.goals')} action={t('common.seeAll')} onAction={() => router.navigate('/goals')} />
        </Animated.View>
        <Animated.View layout={reduced ? undefined : REFLOW}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalRow} style={styles.goalScroll}>
            {state.goals.map(goal => {
              const plan = goalPlan.byId[goal.id];
              return (
                <Card key={goal.id} onPress={() => router.push(`/goal/${goal.id}`)} accessibilityLabel={`${goalName(goal, lang)}, ${plan.progress}%`} style={styles.goalCard}>
                  <T style={styles.goalEmoji}>{goal.emoji}</T>
                  <T variant="callout" weight="600" numberOfLines={1} style={styles.goalName}>{goalName(goal, lang)}</T>
                  <T variant="footnote" tone="secondary" tabular>{formatMoney(goal.saved, lang)}</T>
                  <View style={styles.goalBar}><ProgressBar value={plan.progress} color={colors.protected} height={5} /></View>
                  <T variant="caption" tone={plan.status === 'complete' ? 'positive' : 'tertiary'}>{plan.status === 'complete' ? t('goals.complete') : `${plan.progress}%`}</T>
                </Card>
              );
            })}
            <PressableScale onPress={() => router.navigate({ pathname: '/goals', params: { create: '1' } })} style={styles.newGoal} accessibilityLabel={t('goals.new')}>
              <Ionicons name="add" size={26} color={colors.purpleLight} />
              <T variant="footnote" tone="accent" weight="600">{t('goals.new')}</T>
            </PressableScale>
          </ScrollView>
        </Animated.View>
      </TabScreen>

      <ContributeSheet visible={contributeOpen} onClose={() => setContributeOpen(false)} />
      <TransactionSheet tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </>
  );
}

function LegendRow({ color, icon, label, value }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <T variant="subhead" style={styles.flex}>{label}</T>
      {icon ? <Ionicons name={icon} size={14} color={colors.textSecondary} style={styles.legendIcon} /> : null}
      <T variant="subhead" weight="600" tabular>{value}</T>
    </View>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <PressableScale onPress={onPress} style={styles.action} accessibilityLabel={label}>
      <View style={styles.actionIcon}><Ionicons name={icon} size={21} color={colors.purpleLight} /></View>
      <T variant="footnote" weight="600" align="center" numberOfLines={1}>{label}</T>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.md },
  headerCopy: { flex: 1 },
  hero: { paddingTop: space.xxxl, paddingBottom: space.xl },
  heroAmount: { marginTop: space.xs },
  heroSub: { marginTop: space.xs },
  heroLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.sm, alignSelf: 'flex-start' },
  wealthCard: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, overflow: 'hidden' },
  wealthHead: { padding: space.lg, gap: space.md },
  wealthRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  chevron: { width: 20, alignItems: 'center' },
  wealthBody: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.md },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendIcon: { marginRight: 2 },
  explainer: { marginTop: space.xs },
  inlineLink: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  action: { flex: 1, alignItems: 'center', gap: space.sm, paddingVertical: space.md, paddingHorizontal: space.xs, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  actionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.purpleTint, alignItems: 'center', justifyContent: 'center' },
  budget: { marginTop: space.md },
  budgetTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  budgetNumbers: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.md, marginBottom: space.md, flexWrap: 'wrap' },
  budgetCaption: { marginTop: space.md },
  listCard: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, overflow: 'hidden' },
  goalScroll: { marginHorizontal: -gutter },
  goalRow: { gap: space.md, paddingHorizontal: gutter },
  goalCard: { width: 158, padding: space.lg },
  goalEmoji: { fontSize: 26, lineHeight: 32 },
  goalName: { marginTop: space.sm },
  goalBar: { marginTop: space.md, marginBottom: space.sm },
  newGoal: { width: 110, minHeight: 150, borderRadius: radii.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.purpleTintStrong, alignItems: 'center', justifyContent: 'center', gap: space.xs },
});
