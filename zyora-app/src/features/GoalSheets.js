import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useApp } from '../AppContext';
import { Button } from '../components/Button';
import { Chips, MoneyInput, TextField, digitsToNumber } from '../components/MoneyInput';
import { PressableRow, PressableScale } from '../components/Pressable';
import { Sheet } from '../components/Sheet';
import { Banner, Group, IconTile } from '../components/Surface';
import { T } from '../components/Text';
import { useToast } from '../components/Toast';
import { addMonthsKey, goalEmojis } from '../data';
import { monthsUntil } from '../finance';
import { formatMoney, formatMonthKey, formatReleaseTime, groupDigits } from '../format';
import { haptic } from '../haptics';
import { colors, radii, space } from '../theme';

export const SHIELD_OPTIONS = [0, 24, 48, 72];

export function goalName(goal, lang) {
  if (!goal) return '';
  return lang === 'en' ? goal.nameEn || goal.name : goal.name;
}

// One line that says where a goal stands in the plan.
export function goalStatusText(goal, info, t, lang) {
  if (info.status === 'complete') return t('goals.complete');
  if (info.status === 'paused') return t('plan.statusPaused');
  const eta = info.etaKey ? formatMonthKey(info.etaKey, lang) : '—';
  if (!goal.targetDate) return t('plan.statusNoDeadline', { eta });
  if (info.status === 'behind') return t('plan.statusBehind', { months: info.delayMonths, eta });
  return t('plan.statusOnTrack', { eta });
}

// Focus the amount once the sheet has finished sliding in, so the keyboard
// and the sheet don't fight over the same 300 ms.
function useDeferredFocus(visible, ref) {
  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => ref.current?.focus(), 360);
    return () => clearTimeout(timer);
  }, [visible, ref]);
}

export function ContributeSheet({ visible, goalId, onClose, onDone, toastOffset = 'tabs' }) {
  const router = useRouter();
  const { state, money, t, contribute } = useApp();
  const toast = useToast();
  const lang = state.lang;
  const inputRef = useRef(null);
  const activeGoals = state.goals.filter(goal => goal.saved < goal.target);
  const [selectedId, setSelectedId] = useState(goalId);
  const [digits, setDigits] = useState('');
  useDeferredFocus(visible, inputRef);

  useEffect(() => {
    if (visible) {
      setDigits('');
      setSelectedId(goalId || activeGoals[0]?.id || null);
    }
  }, [visible, goalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const goal = state.goals.find(item => item.id === selectedId);
  const amount = digitsToNumber(digits);
  const remaining = goal ? goal.target - goal.saved : 0;
  const error = !amount || !goal ? null
    : amount > money.spendable ? t('contribute.errorInsufficient', { amount: formatMoney(money.spendable, lang) })
    : amount > remaining ? t('contribute.errorExceeds', { amount: formatMoney(remaining, lang) })
    : null;
  const presets = [5000, 10000, 25000].filter(v => v < remaining).map(v => ({ value: String(v), label: groupDigits(v, lang) }));
  if (remaining > 0 && remaining <= money.spendable) presets.push({ key: 'rest', value: String(remaining), label: t('contribute.presetRest', { amount: groupDigits(remaining, lang) }) });

  function submit() {
    if (!goal || !amount || error) return;
    const result = contribute(goal.id, amount);
    if (!result.ok) { haptic.error(); return; }
    haptic.success();
    onClose();
    const name = goalName(goal, lang);
    toast.show(result.completed ? t('contribute.toastCompleted', { goal: name }) : t('contribute.toast', { amount: formatMoney(result.amount, lang), goal: name, xp: result.xp }), 'success', { offset: toastOffset });
    onDone?.(result);
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('contribute.title')}
      subtitle={goal && goalId ? `${goal.emoji} ${goalName(goal, lang)}` : null}
      closeLabel={t('common.close')}
      footer={goal ? <Button label={amount && !error ? t('contribute.cta', { amount: formatMoney(amount, lang) }) : t('contribute.ctaEmpty')} icon="shield-checkmark" disabled={!amount || Boolean(error)} onPress={submit} /> : null}
    >
      {!goalId ? (
        activeGoals.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalChips} style={styles.goalChipsWrap} keyboardShouldPersistTaps="handled">
            {activeGoals.map(item => {
              const active = item.id === selectedId;
              return (
                <PressableScale key={item.id} onPress={() => { haptic.selection(); setSelectedId(item.id); }} style={[styles.goalChip, active && styles.goalChipActive]} accessibilityState={{ selected: active }}>
                  <T style={styles.goalChipEmoji}>{item.emoji}</T>
                  <T variant="footnote" weight="600" tone={active ? 'primary' : 'secondary'} numberOfLines={1}>{goalName(item, lang)}</T>
                </PressableScale>
              );
            })}
          </ScrollView>
        ) : <Banner tone="info" body={t('contribute.noGoals')} action={t('goals.createFirst')} onAction={() => { onClose(); router.navigate({ pathname: '/goals', params: { create: '1' } }); }} />
      ) : null}
      {goal ? (
      <MoneyInput ref={inputRef} value={digits} onChangeText={setDigits} lang={lang} error={error} onSubmitEditing={submit}
        helper={goal ? t('contribute.helper', { spendable: formatMoney(money.spendable, lang), after: formatMoney(Math.max(0, money.spendable - amount), lang) }) : null}
        accessibilityLabel={t('contribute.amountLabel')} />
      ) : null}
      {goal && presets.length ? <View style={styles.presets}><Chips options={presets} selected={digits} onSelect={value => { haptic.selection(); setDigits(value); }} /></View> : null}
    </Sheet>
  );
}

export function WithdrawSheet({ visible, goal, onClose, toastOffset = 'tabs' }) {
  const { state, t, withdraw } = useApp();
  const toast = useToast();
  const lang = state.lang;
  const inputRef = useRef(null);
  const [digits, setDigits] = useState('');
  useDeferredFocus(visible, inputRef);
  useEffect(() => { if (visible) setDigits(''); }, [visible]);
  if (!goal) return null;
  const amount = digitsToNumber(digits);
  const shield = Number(goal.shield) || 0;
  const error = amount > goal.saved ? t('withdraw.errorExceeds', { amount: formatMoney(goal.saved, lang) }) : null;
  const releaseAt = new Date(Date.now() + shield * 3600000);
  const presets = [10000, 50000].filter(v => v < goal.saved).map(v => ({ value: String(v), label: groupDigits(v, lang) }));
  if (goal.saved > 0) presets.push({ key: 'all', value: String(goal.saved), label: t('withdraw.presetAll') });

  function submit() {
    if (!amount || error) return;
    const result = withdraw(goal.id, amount);
    if (!result.ok) { haptic.error(); return; }
    haptic.success();
    onClose();
    toast.show(result.pending
      ? t('withdraw.toastPending', { amount: formatMoney(amount, lang), time: formatReleaseTime(result.releaseAt, lang) })
      : t('withdraw.toastInstant', { amount: formatMoney(amount, lang) }), result.pending ? 'shield' : 'success', { offset: toastOffset });
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('withdraw.title')}
      subtitle={`${goal.emoji} ${goalName(goal, lang)} · ${t('withdraw.available', { amount: formatMoney(goal.saved, lang) })}`}
      closeLabel={t('common.close')}
      footer={<Button label={amount && !error ? t('withdraw.cta', { amount: formatMoney(amount, lang) }) : t('withdraw.ctaEmpty')} variant="primary" disabled={!amount || Boolean(error)} onPress={submit} />}
    >
      <MoneyInput ref={inputRef} value={digits} onChangeText={setDigits} lang={lang} error={error} onSubmitEditing={submit} accessibilityLabel={t('withdraw.amountLabel')} />
      {presets.length ? <View style={styles.presets}><Chips options={presets} selected={digits} onSelect={value => { haptic.selection(); setDigits(value); }} /></View> : null}
      <View style={styles.banner}>
        {shield > 0
          ? <Banner tone="info" icon="shield-checkmark" title={t('withdraw.shieldTitle', { hours: shield })} body={t('withdraw.shieldBody', { time: formatReleaseTime(releaseAt, lang) })} />
          : <Banner tone="neutral" icon="flash-outline" body={t('withdraw.instantBody')} />}
      </View>
    </Sheet>
  );
}

const DEADLINES = [null, 6, 12, 24];

export function GoalFormSheet({ visible, goal, onClose, onCreated, toastOffset = 'tabs' }) {
  const { state, t, addGoal, updateGoal } = useApp();
  const toast = useToast();
  const lang = state.lang;
  const editing = Boolean(goal);
  const nameRef = useRef(null);
  const targetRef = useRef(null);
  const [emoji, setEmoji] = useState('🎯');
  const [name, setName] = useState('');
  const [digits, setDigits] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [shield, setShield] = useState(24);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSubmitted(false);
    setEmoji(goal?.emoji || '🎯');
    setName(goal ? goalName(goal, lang) : '');
    setDigits(goal ? String(goal.target) : '');
    setDeadline(goal ? goal.targetDate : addMonthsKey(new Date(), 12));
    setShield(goal ? goal.shield ?? 24 : 24);
  }, [visible, goal]); // eslint-disable-line react-hooks/exhaustive-deps

  const target = digitsToNumber(digits);
  const nameError = submitted && !name.trim() ? t('goalForm.errorName') : null;
  const targetError = submitted && !target ? t('goalForm.errorTarget')
    : goal && target && target < goal.saved ? t('goalForm.errorBelowSaved', { amount: formatMoney(goal.saved, lang) })
    : null;

  const deadlineOptions = useMemo(() => {
    const now = new Date();
    const options = DEADLINES.map(months => ({ value: months ? addMonthsKey(now, months) : 'none', label: months ? t(`goalForm.in${months}`) : t('goalForm.noDeadline') }));
    if (deadline && !options.some(option => option.value === deadline)) options.push({ value: deadline, label: formatMonthKey(deadline, lang) });
    return options;
  }, [deadline, lang, t]);

  const saved = goal?.saved || 0;
  const monthsLeft = deadline ? Math.max(1, monthsUntil(deadline)) : null;
  const perMonth = monthsLeft && target > saved ? Math.ceil((target - saved) / monthsLeft) : null;

  function submit() {
    setSubmitted(true);
    if (!name.trim() || !target || (goal && target < goal.saved)) { haptic.error(); return; }
    const patch = { emoji, target, targetDate: deadline, shield };
    if (editing) {
      // Edit the name in the language it is shown in; a changed Hungarian
      // name drops the stale English one.
      const typed = name.trim();
      const namePatch = lang === 'en' && goal.nameEn ? { nameEn: typed } : typed !== goal.name ? { name: typed, nameEn: undefined } : {};
      updateGoal(goal.id, { ...patch, ...namePatch });
      haptic.success();
      onClose();
      toast.show(t('goalForm.toastSaved'), 'success', { offset: toastOffset });
      return;
    }
    const result = addGoal({ ...patch, name });
    haptic.success();
    onClose();
    toast.show(t('goalForm.toastCreated', { xp: result.xp }), 'success', { offset: onCreated ? 'none' : toastOffset });
    onCreated?.(result.id);
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      scroll
      title={editing ? t('goalForm.editTitle') : t('goalForm.newTitle')}
      closeLabel={t('common.close')}
      footer={<Button label={editing ? t('goalForm.save') : t('goalForm.create')} onPress={submit} />}
    >
      <T variant="footnote" tone="secondary" weight="500" style={styles.label}>{t('goalForm.icon')}</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiRow} keyboardShouldPersistTaps="handled" style={styles.emojiScroll}>
        {goalEmojis.map(item => (
          <PressableScale key={item} onPress={() => { haptic.selection(); setEmoji(item); }} style={[styles.emoji, item === emoji && styles.emojiActive]} accessibilityLabel={item} accessibilityState={{ selected: item === emoji }}>
            <T style={styles.emojiText}>{item}</T>
          </PressableScale>
        ))}
      </ScrollView>
      <TextField ref={nameRef} label={t('goalForm.name')} value={name} onChangeText={setName} placeholder={t('goalForm.namePlaceholder')} returnKeyType="next" onSubmitEditing={() => targetRef.current?.focus()} submitBehavior="submit" maxLength={32} error={nameError} style={styles.field} />
      <MoneyInput ref={targetRef} label={t('goalForm.target')} value={digits} onChangeText={setDigits} lang={lang} size="md" error={targetError} style={styles.field} />
      <T variant="footnote" tone="secondary" weight="500" style={[styles.label, styles.field]}>{t('goalForm.deadline')}</T>
      <Chips options={deadlineOptions} selected={deadline || 'none'} onSelect={value => { haptic.selection(); setDeadline(value === 'none' ? null : value); }} />
      <T variant="footnote" tone="secondary" style={styles.hint}>
        {deadline ? (perMonth ? t('goalForm.deadlineHint', { date: formatMonthKey(deadline, lang, true), amount: formatMoney(perMonth, lang) }) : formatMonthKey(deadline, lang, true)) : t('goalForm.noDeadlineHint')}
      </T>
      <T variant="footnote" tone="secondary" weight="500" style={[styles.label, styles.field]}>{t('goalForm.shield')}</T>
      <Chips options={SHIELD_OPTIONS.map(h => ({ value: h, label: h ? t('shield.hoursShort', { hours: h }) : t('shield.off') }))} selected={shield} onSelect={value => { haptic.selection(); setShield(value); }} />
      <T variant="footnote" tone="secondary" style={styles.hint}>{shield ? t('shield.explain', { hours: shield }) : t('shield.explainOff')}</T>
    </Sheet>
  );
}

export function ShieldSheet({ visible, goal, onClose }) {
  const { state, t, updateGoal } = useApp();
  if (!goal) return null;
  const current = Number(goal.shield) || 0;
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('shield.title')}
      subtitle={t('shield.subtitle', { goal: goalName(goal, state.lang) })}
      closeLabel={t('common.close')}
      footer={<Button label={t('common.done')} variant="secondary" onPress={onClose} />}
    >
      <Group>
        {SHIELD_OPTIONS.map(hours => {
          const active = current === hours;
          return (
            <PressableRow
              key={hours}
              onPress={() => { if (!active) { haptic.selection(); updateGoal(goal.id, { shield: hours }); } }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={styles.radioRow}
            >
              <IconTile icon={hours ? 'shield-checkmark' : 'shield-outline'} tone={active ? 'purple' : 'neutral'} size={32} />
              <View style={styles.radioCopy}>
                <T variant="callout" weight="500">{hours ? t('shield.optionHours', { hours }) : t('shield.optionOff')}</T>
                <T variant="footnote" tone="secondary">{t(`shield.desc${hours}`)}</T>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
            </PressableRow>
          );
        })}
      </Group>
      <T variant="footnote" tone="tertiary" style={styles.hint}>{t('shield.footnote')}</T>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  presets: { marginTop: space.md },
  banner: { marginTop: space.lg },
  goalChipsWrap: { marginBottom: space.lg, marginHorizontal: -space.xl },
  goalChips: { gap: space.sm, paddingHorizontal: space.xl },
  goalChip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.hairlineStrong },
  goalChipActive: { backgroundColor: colors.purpleTintStrong, borderColor: colors.purple },
  goalChipEmoji: { fontSize: 16, lineHeight: 20 },
  label: { marginBottom: space.sm, marginLeft: 2 },
  field: { marginTop: space.lg },
  hint: { marginTop: space.sm, marginLeft: 2 },
  emojiScroll: { marginHorizontal: -space.xl },
  emojiRow: { gap: space.sm, paddingHorizontal: space.xl },
  emoji: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  emojiActive: { borderColor: colors.purple, backgroundColor: colors.purpleTint },
  emojiText: { fontSize: 24, lineHeight: 30 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 64 },
  radioCopy: { flex: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.textTertiary, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.purple },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.purple },
});
