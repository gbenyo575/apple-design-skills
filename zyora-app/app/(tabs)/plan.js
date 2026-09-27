import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../../src/AppContext';
import { Button } from '../../src/components/Button';
import { MoneyInput, digitsToNumber } from '../../src/components/MoneyInput';
import { StackedBar } from '../../src/components/Progress';
import { PressableRow } from '../../src/components/Pressable';
import { TabScreen } from '../../src/components/Screen';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { Sheet } from '../../src/components/Sheet';
import { Banner, Card, IconTile, SectionHeader } from '../../src/components/Surface';
import { T } from '../../src/components/Text';
import { useToast } from '../../src/components/Toast';
import { goalName, goalStatusText } from '../../src/features/GoalSheets';
import { calculateMoney, emergencyGoal, planGoals } from '../../src/finance';
import { formatMoney, formatPercent } from '../../src/format';
import { haptic } from '../../src/haptics';
import { colors, radii, space } from '../../src/theme';

const RATE_MIN = 5;
const RATE_MAX = 40;

export default function PlanScreen() {
  const router = useRouter();
  const { state, t, setSalary, setSavingsRate, setOverspendRule } = useApp();
  const lang = state.lang;
  const [salaryDigits, setSalaryDigits] = useState(String(state.salary));
  const [salaryFocused, setSalaryFocused] = useState(false);
  const [previewRate, setPreviewRate] = useState(null);
  const [fixedOpen, setFixedOpen] = useState(false);
  const lastDetent = useRef(state.savingsRate);
  const salaryRef = useRef(salaryDigits);
  salaryRef.current = salaryDigits;
  const savedSalary = useRef(state.salary);
  savedSalary.current = state.salary;

  useEffect(() => { setSalaryDigits(String(state.salary)); }, [state.salary]);

  const commitSalary = useCallback(() => {
    const value = digitsToNumber(salaryRef.current);
    if (value !== savedSalary.current) setSalary(value);
    setSalaryDigits(String(value));
  }, [setSalary]);

  // Leaving the tab with the keyboard still up must not lose the new salary.
  useFocusEffect(useCallback(() => () => commitSalary(), [commitSalary]));

  // Everything below previews live while typing or dragging; the saved plan
  // only changes when the finger lifts or the keyboard closes.
  const rate = previewRate ?? state.savingsRate;
  const preview = useMemo(() => ({ ...state, salary: digitsToNumber(salaryDigits), savingsRate: rate }), [state, salaryDigits, rate]);
  const money = useMemo(() => calculateMoney(preview), [preview]);
  const plan = useMemo(() => planGoals(preview, money), [preview, money]);
  const reserve = emergencyGoal(state);
  const pct = value => (money.salary ? formatPercent(value / money.salary * 100) : '—');

  const modes = [
    { value: 10, label: t('plan.modeEasy'), detail: '10%' },
    { value: 20, label: t('plan.modeBalanced'), detail: '20%' },
    { value: 30, label: t('plan.modeTurbo'), detail: '30%' },
  ];

  return (
    <TabScreen title={t('plan.title')} subtitle={t('plan.subtitle')}>
      <MoneyInput
        label={t('plan.salaryLabel')}
        value={salaryDigits}
        onChangeText={setSalaryDigits}
        lang={lang}
        onFocus={() => setSalaryFocused(true)}
        onBlur={() => { setSalaryFocused(false); commitSalary(); }}
        onSubmitEditing={commitSalary}
        doneLabel={t('common.done')}
        helper={t('plan.salaryHelper')}
      />

      {!salaryFocused && money.planShortfall > 0 ? (
        <View style={styles.banner}>
          <Banner tone="critical" title={t('plan.shortfallTitle')} body={t('plan.shortfallBody', { amount: formatMoney(money.planShortfall, lang) })} />
        </View>
      ) : null}

      <Card style={styles.flowCard}>
        <T variant="headline">{t('plan.flowTitle')}</T>
        <View style={styles.flowBar}>
          <StackedBar height={12} segments={[
            { key: 'fixed', value: money.fixed, color: colors.fixed },
            { key: 'protected', value: money.savedTotal, color: colors.protected },
            { key: 'spendable', value: money.plannedSpendable, color: colors.spendable },
          ]} />
        </View>
        <FlowRow color={colors.fixed} title={t('plan.fixed')} subtitle={t('plan.fixedHint')} amount={formatMoney(money.fixed, lang)} share={pct(money.fixed)} onPress={() => setFixedOpen(true)} editLabel={t('plan.editFixed')} />
        <FlowRow color={colors.protected} icon="shield-checkmark" title={t('plan.protected')} subtitle={t('plan.protectedHint')} amount={formatMoney(money.savedTotal, lang)} share={pct(money.savedTotal)} />
        <FlowRow color={colors.spendable} title={t('plan.spendable')} subtitle={t('plan.spendableHint', { amount: formatMoney(Math.floor(money.plannedSpendable / 30), lang) })} amount={formatMoney(money.plannedSpendable, lang)} share={pct(money.plannedSpendable)} strong />
      </Card>

      <SectionHeader title={t('plan.savingsTitle')} />
      <Card>
        <View style={styles.rateRow}>
          <T variant="subhead" tone="secondary" style={styles.flex}>{t('plan.savingsQuestion')}</T>
          <T variant="largeTitle" tone="accent" tabular accessibilityLiveRegion="polite">{rate}%</T>
        </View>
        <SegmentedControl options={modes} value={rate} onChange={value => { setPreviewRate(null); setSavingsRate(value); }} accessibilityLabel={t('plan.savingsTitle')} style={styles.segmented} />
        <Slider
          accessibilityLabel={t('plan.savingsTitle')}
          style={styles.slider}
          minimumValue={RATE_MIN}
          maximumValue={RATE_MAX}
          step={1}
          value={state.savingsRate}
          onValueChange={value => {
            const next = Math.round(value);
            setPreviewRate(next);
            if (next % 5 === 0 && next !== lastDetent.current) { lastDetent.current = next; haptic.selection(); }
          }}
          onSlidingComplete={value => { setSavingsRate(Math.round(value)); setPreviewRate(null); }}
          minimumTrackTintColor={colors.purple}
          maximumTrackTintColor={colors.surface3}
          thumbTintColor={colors.purpleLight}
        />
        <View style={styles.sliderLimits}>
          <T variant="caption" tone="tertiary">{RATE_MIN}%</T>
          <T variant="caption" tone="tertiary">{RATE_MAX}%</T>
        </View>
        <T variant="footnote" tone="secondary" style={styles.result}>
          {t('plan.savingsResult', { monthly: formatMoney(money.savedTotal, lang), yearly: formatMoney(money.yearlySavings, lang) })}
        </T>
      </Card>

      <SectionHeader title={t('plan.distributionTitle')} />
      {plan.shortfall > 0 ? (
        <View style={styles.bannerTight}>
          <Banner tone="warning" title={t('plan.behindTitle')} body={t('plan.behindBody', { needed: formatMoney(plan.requiredTotal, lang), available: formatMoney(plan.pot, lang) })} />
        </View>
      ) : null}
      {state.goals.length ? (
        <View style={styles.group}>
          {state.goals.map((goal, index) => {
            const info = plan.byId[goal.id];
            return (
              <React.Fragment key={goal.id}>
                {index > 0 ? <View style={styles.separator} /> : null}
                <PressableRow onPress={() => router.push(`/goal/${goal.id}`)} style={styles.goalRow} accessibilityLabel={goalName(goal, lang)}>
                  <IconTile emoji={goal.emoji} size={40} />
                  <View style={styles.flex}>
                    <T variant="callout" weight="500" numberOfLines={1}>{goalName(goal, lang)}</T>
                    <T variant="footnote" tone={info.status === 'behind' ? 'warning' : 'secondary'} numberOfLines={2}>{goalStatusText(goal, info, t, lang)}</T>
                  </View>
                  <View style={styles.goalAmount}>
                    <T variant="subhead" weight="600" tabular>{formatMoney(info.monthly, lang)}</T>
                    <T variant="caption" tone="tertiary">{t('plan.perMonth')}</T>
                  </View>
                </PressableRow>
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        <Card>
          <T variant="subhead" tone="secondary">{t('plan.noGoals')}</T>
          <Button label={t('goals.createFirst')} variant="tinted" size="md" style={styles.noGoalsButton} onPress={() => router.navigate({ pathname: '/goals', params: { create: '1' } })} />
        </Card>
      )}
      {state.goals.length ? <T variant="footnote" tone="tertiary" style={styles.note}>{t('plan.distributionNote')}</T> : null}

      <SectionHeader title={t('plan.overspendTitle')} />
      <View style={styles.group}>
        <RuleRow active={state.overspendRule === 'ask'} icon="hand-left-outline" title={t('plan.ruleAsk')} body={t('plan.ruleAskBody')} onPress={() => { haptic.selection(); setOverspendRule('ask'); }} />
        <View style={styles.separator} />
        <RuleRow active={state.overspendRule === 'emergency'} icon="help-buoy-outline" title={t('plan.ruleEmergency')} body={reserve ? t('plan.ruleEmergencyBody', { goal: goalName(reserve, lang), amount: formatMoney(reserve.saved, lang) }) : t('plan.ruleNoReserve')} disabled={!reserve} onPress={() => { haptic.selection(); setOverspendRule('emergency'); }} />
      </View>
      <View style={styles.lockNote}>
        <Ionicons name="lock-closed" size={14} color={colors.textTertiary} />
        <T variant="footnote" tone="tertiary" style={styles.flex}>{t('plan.goalsLocked')}</T>
      </View>

      <FixedCostsSheet visible={fixedOpen} onClose={() => setFixedOpen(false)} />
    </TabScreen>
  );
}

function FlowRow({ color, icon, title, subtitle, amount, share, onPress, editLabel, strong }) {
  const content = (
    <View style={styles.flowRow}>
      <View style={[styles.flowDot, { backgroundColor: color }]} />
      <View style={styles.flex}>
        <View style={styles.flowTitle}>
          <T variant="callout" weight={strong ? '600' : '500'}>{title}</T>
          {icon ? <Ionicons name={icon} size={14} color={colors.textSecondary} /> : null}
          {onPress ? <Ionicons name="create-outline" size={15} color={colors.purpleLight} /> : null}
        </View>
        <T variant="footnote" tone="secondary">{subtitle}</T>
      </View>
      <View style={styles.flowAmount}>
        <T variant="callout" weight="600" tabular>{amount}</T>
        <T variant="caption" tone="tertiary" tabular>{share}</T>
      </View>
    </View>
  );
  if (!onPress) return content;
  return <PressableRow onPress={onPress} accessibilityLabel={editLabel} style={styles.flowPressable}>{content}</PressableRow>;
}

function RuleRow({ active, icon, title, body, onPress, disabled }) {
  return (
    <PressableRow onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityState={{ selected: active, disabled: Boolean(disabled) }} style={[styles.ruleRow, disabled && styles.disabled]}>
      <IconTile icon={icon} tone={active ? 'purple' : 'neutral'} size={36} />
      <View style={styles.flex}>
        <T variant="callout" weight="500">{title}</T>
        <T variant="footnote" tone="secondary" style={styles.ruleBody}>{body}</T>
      </View>
      <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
    </PressableRow>
  );
}

function FixedCostsSheet({ visible, onClose }) {
  const { state, money, t, setFixedCosts } = useApp();
  const toast = useToast();
  const [digits, setDigits] = useState('');
  useEffect(() => { if (visible) setDigits(String(money.fixed)); }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const value = digitsToNumber(digits);
  function save() {
    setFixedCosts(value);
    haptic.success();
    onClose();
    toast.show(t('plan.fixedSaved'), 'success');
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={t('plan.fixedSheetTitle')} closeLabel={t('common.close')} footer={<Button label={t('common.save')} onPress={save} />}>
      <MoneyInput value={digits} onChangeText={setDigits} lang={state.lang} onSubmitEditing={save} helper={t('plan.fixedSheetHelper')} accessibilityLabel={t('plan.fixed')} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: { marginTop: space.lg },
  bannerTight: { marginBottom: space.md },
  flowCard: { marginTop: space.xl, paddingBottom: space.sm },
  flowBar: { marginTop: space.md, marginBottom: space.sm },
  flowPressable: { marginHorizontal: -space.lg, paddingHorizontal: space.lg },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  flowDot: { width: 10, height: 10, borderRadius: 3 },
  flowTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flowAmount: { alignItems: 'flex-end' },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  segmented: { marginTop: space.lg },
  slider: { marginTop: space.md, height: 40 },
  sliderLimits: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  result: { marginTop: space.md },
  group: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineStrong, marginLeft: space.lg },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 64 },
  goalAmount: { alignItems: 'flex-end' },
  noGoalsButton: { marginTop: space.md, alignSelf: 'flex-start' },
  note: { marginTop: space.sm, marginHorizontal: space.xs },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md },
  ruleBody: { marginTop: 2 },
  disabled: { opacity: 0.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.textTertiary, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.purple },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.purple },
  lockNote: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm, marginHorizontal: space.xs },
});
