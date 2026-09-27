import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatMoney, useApp } from '../AppContext';
import { Card, DemoBadge, SavingsSlider, ScreenHeader } from '../components/UI';
import { colors, radii } from '../theme';

export default function SplitScreen() {
  const { state, money, t, setSalary, setSavingsRate, update } = useApp();
  const [salaryText, setSalaryText] = useState(String(state.salary));
  const savingPositive = money.delta >= 0;

  useEffect(() => setSalaryText(String(state.salary)), [state.salary]);

  function commitSalary() {
    const salary = Number(salaryText.replace(/\D/g, '')) || 0;
    setSalary(salary);
    setSalaryText(String(salary));
    Keyboard.dismiss();
  }

  const modes = [
    { value: 10, icon: 'leaf-outline', label: t('relaxed') },
    { value: 20, icon: 'flash-outline', label: t('balanced') },
    { value: 30, icon: 'rocket-outline', label: t('turbo') },
  ];
  const allocations = [
    { key: 'fixed', label: t('fixed'), hint: t('fixedHint'), value: money.fixed, pct: state.fixedRate, color: '#2E2A34', icon: 'home-outline' },
    { key: 'goals', label: t('goalPocket'), hint: t('goalHint'), value: money.goals, pct: state.savingsRate * 0.7, color: colors.purple, icon: 'flag-outline' },
    { key: 'emergency', label: t('emergency'), hint: t('emergencyHint'), value: money.emergency, pct: state.savingsRate * 0.3, color: colors.green, icon: 'shield-checkmark-outline' },
    { key: 'spend', label: t('spendable'), hint: '', value: money.plannedSpendable, pct: 100 - state.fixedRate - state.savingsRate, color: colors.purple2, icon: 'wallet-outline' },
  ];
  let position = 0;

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <ScreenHeader eyebrow={t('smartSplit')} title={t('splitTitle')} />

      <View style={styles.intro}><Text style={styles.introTitle}>{t('howMuch')}</Text><Text style={styles.introText}>{t('splitHelp')}</Text></View>

      <Card style={styles.salaryCard}>
        <Text style={styles.inputLabel}>{t('incomingSalary')}</Text>
        <View style={styles.salaryInputRow}>
          <View style={styles.salaryField}>
            <TextInput
              value={salaryText}
              onChangeText={value => setSalaryText(value.replace(/[^0-9]/g, ''))}
              onBlur={commitSalary}
              onSubmitEditing={commitSalary}
              returnKeyType="done"
              blurOnSubmit
              keyboardType="number-pad"
              selectTextOnFocus
              style={styles.salaryInput}
              placeholder="0"
              placeholderTextColor={colors.muted2}
            />
            <Text style={styles.currency}>{state.lang === 'en' ? 'HUF' : 'Ft'}</Text>
          </View>
          <Pressable onPress={commitSalary} style={({ pressed }) => [styles.applySalary, pressed && styles.pressed]}>
            <Ionicons name="checkmark" size={18} color={colors.white} />
            <Text style={styles.applySalaryText}>{state.lang === 'en' ? 'Apply' : 'Beállít'}</Text>
          </Pressable>
        </View>
      </Card>

      <View style={styles.modeRow}>
        {modes.map(mode => {
          const active = state.savingsRate === mode.value;
          return (
            <Pressable key={mode.value} onPress={() => setSavingsRate(mode.value)} style={({ pressed }) => [styles.mode, active && styles.modeActive, pressed && styles.pressed]}>
              <Ionicons name={mode.icon} size={18} color={active ? colors.purple2 : colors.muted} />
              <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{mode.label}</Text><Text style={styles.modeRate}>{mode.value}%</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.sliderCard}>
        <View style={styles.sliderTitleRow}><Text style={styles.sliderTitle}>{t('savingsRate')}</Text><Text style={styles.sliderValue}>{state.savingsRate}%</Text></View>
        <SavingsSlider value={state.savingsRate} onChange={setSavingsRate} />
        <Text style={styles.sliderHelp}>{state.lang === 'en' ? `${formatMoney(money.savedTotal, state.lang)} automatically saved each month` : `${formatMoney(money.savedTotal, state.lang)} / hó automatikusan félretéve`}</Text>
      </Card>

      <LinearGradient colors={['#201A30', '#15121B']} style={styles.resultCard}>
        <Text style={styles.resultEyebrow}>{t('spendableRemains')}</Text>
        <Text style={styles.resultAmount}>{formatMoney(money.plannedSpendable, state.lang)}</Text>
        <Text style={styles.daily}>≈ {formatMoney(money.plannedSpendable / 30, state.lang)} / {t('perDay')} · {state.lang === 'en' ? 'before example spending' : 'a példaköltések előtt'}</Text>

        <View style={styles.distributionBar}>{allocations.map(item => <View key={item.key} style={{ width: `${item.pct}%`, backgroundColor: item.color }} />)}</View>
        <View style={styles.distributionLabels}>
          {allocations.map(item => {
            const left = position + item.pct / 2;
            position += item.pct;
            return <Text key={item.key} numberOfLines={1} style={[styles.distributionLabel, { left: `${left}%`, color: item.key === 'spend' ? colors.purple2 : item.color === '#2E2A34' ? colors.muted : item.color }]}>{item.label}</Text>;
          })}
        </View>
      </LinearGradient>

      <View style={[styles.comparison, savingPositive ? styles.comparisonPositive : styles.comparisonNegative]}>
        <Ionicons name={savingPositive ? 'trending-up' : 'trending-down'} size={22} color={savingPositive ? colors.green : colors.red} />
        <View style={styles.comparisonCopy}><Text style={[styles.comparisonAmount, { color: savingPositive ? colors.green : colors.red }]}>{money.delta >= 0 ? '+' : '−'}{formatMoney(Math.abs(money.delta), state.lang)}</Text><Text style={styles.comparisonText}>{savingPositive ? t('savedVsLast') : t('spentVsLast')}</Text></View>
      </View>

      <View style={styles.allocationList}>
        {allocations.slice(0, 3).map(item => (
          <Card key={item.key} style={styles.allocation}>
            <View style={[styles.allocationIcon, { backgroundColor: `${item.color}28` }]}><Ionicons name={item.icon} size={20} color={item.key === 'fixed' ? colors.muted : item.color} /></View>
            <View style={styles.allocationCopy}><Text style={styles.allocationTitle}>{item.label}</Text><Text style={styles.allocationHint}>{item.hint}</Text></View>
            <Text style={styles.allocationValue}>{formatMoney(item.value, state.lang)}</Text>
          </Card>
        ))}
      </View>

      <Card style={styles.yearCard}>
        <View style={styles.yearIcon}><Ionicons name="calendar-outline" size={22} color={colors.purple2} /></View>
        <View style={styles.yearCopy}><Text style={styles.yearLabel}>{t('yearlyImpact')}</Text><Text style={styles.yearValue}>{formatMoney(money.yearlySavings, state.lang)}</Text><Text style={styles.yearHelp}>{t('yearlyHelp')}</Text></View>
      </Card>

      <Card style={styles.shieldCard}>
        <View style={styles.shieldHead}><View style={styles.shieldIcon}><Ionicons name="shield-checkmark-outline" size={22} color={colors.purple2} /></View><View style={styles.shieldCopy}><Text style={styles.shieldTitle}>{t('shield')}</Text><Text style={styles.shieldHint}>{t('shieldHelp')}</Text></View></View>
        <View style={styles.shieldOptions}>
          {[0, 24, 48, 72].map(hours => {
            const active = state.shieldHours === hours;
            return <Pressable key={hours} onPress={() => update({ shieldHours: hours })} style={[styles.shieldOption, active && styles.shieldOptionActive]}><Text style={[styles.shieldOptionText, active && styles.shieldOptionTextActive]}>{hours ? `${hours}h` : t('off')}</Text></Pressable>;
          })}
        </View>
        <Text style={styles.shieldDescription}>{state.shieldHours ? t('shieldHours', { hours: state.shieldHours }) : t('shieldOff')}</Text>
      </Card>

      <DemoBadge />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 125 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  intro: { paddingVertical: 10, paddingBottom: 18 },
  introTitle: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  introText: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7, maxWidth: 330 },
  salaryCard: { padding: 16 },
  inputLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  salaryInputRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 },
  salaryField: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'baseline' },
  salaryInput: { flex: 1, color: colors.text, fontSize: 31, fontWeight: '900', letterSpacing: -1.2, paddingVertical: 2 },
  currency: { color: colors.text, fontSize: 15, fontWeight: '900' },
  applySalary: { height: 43, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.purple, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  applySalaryText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  modeRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  mode: { flex: 1, minHeight: 78, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 3 },
  modeActive: { borderColor: colors.purple, backgroundColor: '#211A38' },
  modeLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  modeLabelActive: { color: colors.text },
  modeRate: { color: colors.purple2, fontSize: 10.5, fontWeight: '900' },
  sliderCard: { marginBottom: 12 },
  sliderTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  sliderTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  sliderValue: { color: colors.purple2, fontSize: 20, fontWeight: '900' },
  sliderHelp: { color: colors.muted, fontSize: 11, marginTop: 8 },
  resultCard: { minHeight: 210, borderRadius: radii.xl, borderWidth: 1, borderColor: '#3B3260', padding: 22, overflow: 'hidden' },
  resultEyebrow: { color: colors.purple2, fontSize: 10.5, fontWeight: '900', letterSpacing: 1.1 },
  resultAmount: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1.3, marginTop: 8 },
  daily: { color: colors.green, fontSize: 11, fontWeight: '800', marginTop: 3 },
  distributionBar: { height: 10, flexDirection: 'row', borderRadius: 6, overflow: 'hidden', marginTop: 25 },
  distributionLabels: { position: 'relative', height: 26, marginTop: 7 },
  distributionLabel: { position: 'absolute', width: 64, marginLeft: -32, textAlign: 'center', fontSize: 11, fontWeight: '800' },
  comparison: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 14, gap: 12, marginTop: 12 },
  comparisonPositive: { backgroundColor: colors.greenBg, borderColor: '#24523E' },
  comparisonNegative: { backgroundColor: colors.redBg, borderColor: '#63303B' },
  comparisonCopy: { flex: 1 },
  comparisonAmount: { fontSize: 13, fontWeight: '900' },
  comparisonText: { color: colors.muted, fontSize: 11, marginTop: 2 },
  allocationList: { gap: 8, marginTop: 12 },
  allocation: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  allocationIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  allocationCopy: { flex: 1, paddingHorizontal: 11 },
  allocationTitle: { color: colors.text, fontSize: 12.5, fontWeight: '900' },
  allocationHint: { color: colors.muted, fontSize: 10.5, marginTop: 3 },
  allocationValue: { color: colors.text, fontSize: 11, fontWeight: '900' },
  yearCard: { flexDirection: 'row', marginTop: 12 },
  yearIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  yearCopy: { flex: 1, paddingLeft: 13 },
  yearLabel: { color: colors.purple2, fontSize: 10.5, fontWeight: '900', letterSpacing: 0.8 },
  yearValue: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 4 },
  yearHelp: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 5 },
  shieldCard: { marginTop: 12 },
  shieldHead: { flexDirection: 'row', alignItems: 'center' },
  shieldIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  shieldCopy: { flex: 1, paddingLeft: 11 },
  shieldTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  shieldHint: { color: colors.muted, fontSize: 11, marginTop: 3 },
  shieldOptions: { flexDirection: 'row', gap: 7, marginTop: 16 },
  shieldOption: { flex: 1, height: 38, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  shieldOptionActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  shieldOptionText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  shieldOptionTextActive: { color: colors.white },
  shieldDescription: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 12 },
});
