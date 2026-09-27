import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatMoney, useApp } from '../AppContext';
import { BottomSheet, Card, DemoBadge, PrimaryButton, ProgressBar, ScreenHeader } from '../components/UI';
import { colors, radii } from '../theme';

export default function GoalsScreen({ showToast }) {
  const { state, money, t, addGoal, updateGoal, contribute } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [shieldGoal, setShieldGoal] = useState(null);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [target, setTarget] = useState('');
  const [contribution, setContribution] = useState('10000');

  function createGoal() {
    const targetNumber = Number(target.replace(/\D/g, ''));
    if (!name.trim() || !targetNumber) { showToast(t('invalidAmount')); return; }
    addGoal({ name: name.trim(), emoji: emoji.trim() || '🎯', target: targetNumber });
    setName(''); setEmoji('🎯'); setTarget(''); setAddOpen(false);
    showToast(state.lang === 'en' ? '+25 XP · New goal created' : '+25 XP · Új cél létrehozva');
  }

  function saveContribution() {
    const amount = Number(contribution.replace(/\D/g, ''));
    if (!selectedGoal || !amount) { showToast(t('invalidAmount')); return; }
    if (amount > money.spendable) { showToast(t('insufficientFunds')); return; }
    const result = contribute(selectedGoal.id, amount);
    if (!result.ok) { showToast(state.lang === 'en' ? 'This goal is complete or the amount is not available.' : 'A cél már teljesült, vagy az összeg nem áll rendelkezésre.'); return; }
    setSelectedGoal(null); setContribution('10000');
    showToast(state.lang === 'en' ? `+20 XP · ${formatMoney(result.amount, state.lang)} added to demo goal` : `+20 XP · ${formatMoney(result.amount, state.lang)} a demócélhoz adva`);
  }

  function saveShield(hours) {
    if (!shieldGoal) return;
    updateGoal(shieldGoal.id, { shield: hours });
    setShieldGoal(null);
    showToast(state.lang === 'en' ? `Shield updated · ${hours ? `${hours}h` : 'off'}` : `Shield frissítve · ${hours ? `${hours} óra` : 'kikapcsolva'}`);
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader eyebrow={state.lang === 'en' ? 'GOALS' : 'CÉLOK'} title={t('goalsTitle')} right={<Pressable onPress={() => setAddOpen(true)} style={styles.addButton}><Ionicons name="add" size={24} color={colors.white} /></Pressable>} />

        <LinearGradient colors={['#725CF8', '#4C35D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.totalCard}>
          <View style={styles.totalTop}><Text style={styles.totalLabel}>{t('savedForGoals')}</Text><Pressable accessibilityRole="button" accessibilityLabel={state.lang === 'en' ? 'Open goal plan' : 'Célterv megnyitása'} onPress={() => setOverviewOpen(true)} style={({ pressed }) => [styles.totalIcon, pressed && styles.totalIconPressed]}><Ionicons name="flag" size={18} color={colors.white} /><View style={styles.totalIconDot}><Ionicons name="chevron-forward" size={9} color={colors.purple} /></View></Pressable></View>
          <Text style={styles.totalAmount}>{formatMoney(money.totalGoals, state.lang)}</Text>
          <Text style={styles.totalMonth}>{t('thisMonth')} +{formatMoney(money.goals, state.lang)}</Text>
          <View style={styles.totalStats}><Stat value={state.goals.length} label={state.lang === 'en' ? 'active goals' : 'aktív cél'} /><Stat value={`${state.savingsRate}%`} label="saving rate" /><Stat value={`${state.shieldHours}h`} label="Shield" /></View>
        </LinearGradient>

        <View style={styles.heading}><View><Text style={styles.headingTitle}>{t('goalsPreview')}</Text><Text style={styles.headingSubtitle}>{state.goals.length} {state.lang === 'en' ? 'active goals' : 'aktív cél'}</Text></View><Pressable onPress={() => setAddOpen(true)}><Text style={styles.headingAction}>+ {t('newGoal')}</Text></Pressable></View>

        <View style={styles.goalList}>
          {state.goals.map((goal, index) => {
            const pct = Math.min(100, Math.round(goal.saved / goal.target * 100));
            const accent = [colors.purple, colors.green, colors.blue, colors.orange][index % 4];
            return (
              <Card key={goal.id} style={styles.goalCard}>
                <View style={styles.goalTop}>
                  <View style={[styles.goalEmojiWrap, { backgroundColor: `${accent}1D` }]}><Text style={styles.goalEmoji}>{goal.emoji}</Text></View>
                  <View style={styles.goalTopCopy}><Text style={[styles.goalCategory, { color: accent }]}>{state.lang === 'en' ? (goal.categoryEn || goal.category) : goal.category}</Text><Text style={styles.goalName}>{state.lang === 'en' ? (goal.nameEn || goal.name) : goal.name}</Text></View>
                  <Text style={styles.goalPct}>{pct}%</Text>
                </View>
                <View style={styles.goalNumbers}><Text style={styles.goalNumberSaved}>{formatMoney(goal.saved, state.lang)}</Text><Text style={styles.goalNumberTarget}>{formatMoney(goal.target, state.lang)}</Text></View>
                <ProgressBar value={pct} color={accent} height={9} />
                <View style={styles.goalFooter}>
                  <Pressable onPress={() => setShieldGoal(goal)} style={({ pressed }) => [styles.goalMeta, styles.goalMetaButton, pressed && styles.pressed]}><Ionicons name="shield-checkmark-outline" size={14} color={colors.purple2} /><Text style={styles.goalMetaText}>Shield {(goal.shield ?? state.shieldHours) ? `${goal.shield ?? state.shieldHours}h` : t('off')}</Text><Ionicons name="pencil-outline" size={11} color={colors.purple2} /></Pressable>
                  <View style={styles.goalMeta}><Ionicons name="repeat-outline" size={14} color={colors.green} /><Text style={styles.goalMetaText}>{goal.monthly ? `${formatMoney(goal.monthly, state.lang)} / ${t('monthly')}` : t('continuous')}</Text></View>
                </View>
                <PrimaryButton label={t('addMoney')} icon="add" secondary onPress={() => { setSelectedGoal(goal); setContribution('10000'); }} style={styles.goalButton} />
              </Card>
            );
          })}
        </View>

        <Pressable onPress={() => setAddOpen(true)} style={({ pressed }) => [styles.newGoalDashed, pressed && styles.pressed]}>
          <View style={styles.newGoalIcon}><Ionicons name="add" size={22} color={colors.purple2} /></View><View><Text style={styles.newGoalTitle}>{t('newGoal')}</Text><Text style={styles.newGoalHint}>{state.lang === 'en' ? 'Give your next salary a purpose.' : 'Adj célt a következő fizetésednek.'}</Text></View>
        </Pressable>
        <DemoBadge />
      </ScrollView>

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)} title={t('createGoal')}>
        <View style={styles.formRow}>
          <View style={styles.emojiField}><Text style={styles.formLabel}>{t('emoji')}</Text><TextInput value={emoji} onChangeText={setEmoji} maxLength={2} style={[styles.input, styles.emojiInput]} /></View>
          <View style={styles.nameField}><Text style={styles.formLabel}>{t('goalName')}</Text><TextInput value={name} onChangeText={setName} placeholder={state.lang === 'en' ? 'E.g. Japan' : 'Pl. Japán'} placeholderTextColor={colors.muted2} style={styles.input} /></View>
        </View>
        <Text style={styles.formLabel}>{t('target')}</Text>
        <View style={styles.moneyInput}><TextInput value={target} onChangeText={value => setTarget(value.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="500000" placeholderTextColor={colors.muted2} style={styles.moneyText} /><Text style={styles.moneyCurrency}>{state.lang === 'en' ? 'HUF' : 'Ft'}</Text></View>
        <PrimaryButton label={t('create')} icon="sparkles" onPress={createGoal} style={styles.sheetButton} />
      </BottomSheet>

      <BottomSheet visible={Boolean(selectedGoal)} onClose={() => setSelectedGoal(null)} title={selectedGoal ? `${selectedGoal.emoji} ${selectedGoal.name}` : t('contribute')}>
        <Text style={styles.formLabel}>{t('amount')}</Text>
        <View style={styles.moneyInput}><TextInput value={contribution} onChangeText={value => setContribution(value.replace(/\D/g, ''))} keyboardType="number-pad" selectTextOnFocus style={styles.moneyText} /><Text style={styles.moneyCurrency}>{state.lang === 'en' ? 'HUF' : 'Ft'}</Text></View>
        <View style={styles.presets}>{[5000, 10000, 25000, 50000].map(value => <Pressable key={value} onPress={() => setContribution(String(value))} style={styles.preset}><Text style={styles.presetText}>{formatMoney(value, state.lang)}</Text></Pressable>)}</View>
        <PrimaryButton label={t('contribute')} icon="arrow-up" onPress={saveContribution} style={styles.sheetButton} />
      </BottomSheet>

      <BottomSheet visible={Boolean(shieldGoal)} onClose={() => setShieldGoal(null)} title={state.lang === 'en' ? 'Edit Goal Shield' : 'Cél Shield szerkesztése'}>
        {shieldGoal ? <Text style={styles.shieldSheetIntro}>{shieldGoal.emoji} {state.lang === 'en' ? (shieldGoal.nameEn || shieldGoal.name) : shieldGoal.name}</Text> : null}
        <Text style={styles.shieldSheetHelp}>{state.lang === 'en' ? 'Choose how long withdrawals from this goal should cool off. This setting only affects this goal.' : 'Válaszd ki, mennyi várakozási idő legyen a célból történő kivét előtt. Ez csak erre a célra vonatkozik.'}</Text>
        <View style={styles.shieldPicker}>
          {[0, 24, 48, 72].map(hours => {
            const active = (shieldGoal?.shield ?? state.shieldHours) === hours;
            return <Pressable key={hours} onPress={() => saveShield(hours)} style={[styles.shieldChoice, active && styles.shieldChoiceActive]}><Ionicons name={hours ? 'shield-checkmark-outline' : 'shield-outline'} size={18} color={active ? colors.white : colors.purple2} /><Text style={[styles.shieldChoiceText, active && styles.shieldChoiceTextActive]}>{hours ? `${hours}h` : t('off')}</Text></Pressable>;
          })}
        </View>
      </BottomSheet>

      <BottomSheet visible={overviewOpen} onClose={() => setOverviewOpen(false)} title={state.lang === 'en' ? 'Your goal plan' : 'Célterved'}>
        <View style={styles.overviewHero}><View style={styles.overviewIcon}><Ionicons name="flag" size={23} color={colors.white} /></View><View style={styles.overviewCopy}><Text style={styles.overviewLabel}>{state.lang === 'en' ? 'Automatic goal allocation this month' : 'Automatikus célkeret ebben a hónapban'}</Text><Text style={styles.overviewValue}>{formatMoney(money.goals, state.lang)}</Text></View></View>
        {state.goals.map(goal => {
          const pct = Math.min(100, Math.round(goal.saved / goal.target * 100));
          return <View key={goal.id} style={styles.overviewRow}><Text style={styles.overviewEmoji}>{goal.emoji}</Text><View style={styles.overviewGoalCopy}><Text style={styles.overviewGoalName}>{state.lang === 'en' ? (goal.nameEn || goal.name) : goal.name}</Text><ProgressBar value={pct} height={6} /></View><Text style={styles.overviewPct}>{pct}%</Text></View>;
        })}
        <PrimaryButton label={t('newGoal')} icon="add" onPress={() => { setOverviewOpen(false); setAddOpen(true); }} style={styles.sheetButton} />
      </BottomSheet>
    </>
  );
}

function Stat({ value, label }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 125 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  addButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  totalCard: { minHeight: 235, borderRadius: radii.xl, padding: 22, overflow: 'hidden' },
  totalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#E7E2FF', fontSize: 11, fontWeight: '800' },
  totalIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#FFFFFF20', alignItems: 'center', justifyContent: 'center' },
  totalIconPressed: { backgroundColor: '#FFFFFF3D', transform: [{ scale: 0.96 }] },
  totalIconDot: { position: 'absolute', right: -3, bottom: -3, width: 17, height: 17, borderRadius: 9, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  totalAmount: { color: colors.white, fontSize: 36, fontWeight: '900', letterSpacing: -1.4, marginTop: 15 },
  totalMonth: { color: '#E7E2FF', fontSize: 11, marginTop: 5 },
  totalStats: { flexDirection: 'row', backgroundColor: '#0E0B1833', borderRadius: 18, padding: 13, marginTop: 22 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.white, fontSize: 13, fontWeight: '900' },
  statLabel: { color: '#D6CFF4', fontSize: 11, marginTop: 3 },
  heading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 26, marginBottom: 13 },
  headingTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  headingSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  headingAction: { color: colors.purple2, fontSize: 11, fontWeight: '900' },
  goalList: { gap: 11 },
  goalCard: { padding: 16 },
  goalTop: { flexDirection: 'row', alignItems: 'center' },
  goalEmojiWrap: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  goalEmoji: { fontSize: 25 },
  goalTopCopy: { flex: 1, paddingHorizontal: 12 },
  goalCategory: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.9 },
  goalName: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  goalPct: { color: colors.text, fontSize: 18, fontWeight: '900' },
  goalNumbers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, marginBottom: 8 },
  goalNumberSaved: { color: colors.text, fontSize: 11, fontWeight: '800' },
  goalNumberTarget: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
  goalMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  goalMetaButton: { minHeight: 34, paddingHorizontal: 9, marginLeft: -9, borderRadius: 11, backgroundColor: '#2A234555' },
  goalMetaText: { color: colors.muted, fontSize: 10.5 },
  goalButton: { minHeight: 43, marginTop: 14 },
  newGoalDashed: { minHeight: 78, marginTop: 12, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: '#564A73', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  newGoalIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  newGoalTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  newGoalHint: { color: colors.muted, fontSize: 11, marginTop: 3 },
  formRow: { flexDirection: 'row', gap: 10 },
  emojiField: { width: 76 },
  nameField: { flex: 1 },
  formLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', marginBottom: 7, marginTop: 6 },
  input: { height: 50, borderRadius: 15, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, color: colors.text, fontSize: 14, fontWeight: '700' },
  emojiInput: { textAlign: 'center', fontSize: 22, paddingHorizontal: 4 },
  moneyInput: { height: 66, borderRadius: 18, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  moneyText: { flex: 1, color: colors.text, fontSize: 25, fontWeight: '900' },
  moneyCurrency: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  sheetButton: { marginTop: 18 },
  presets: { flexDirection: 'row', gap: 6, marginTop: 10 },
  preset: { flex: 1, height: 38, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  presetText: { color: colors.text, fontSize: 10.5, fontWeight: '800' },
  shieldSheetIntro: { color: colors.text, fontSize: 18, fontWeight: '900' },
  shieldSheetHelp: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  shieldPicker: { flexDirection: 'row', gap: 7, marginTop: 18 },
  shieldChoice: { flex: 1, minHeight: 60, borderRadius: 16, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 5 },
  shieldChoiceActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  shieldChoiceText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  shieldChoiceTextActive: { color: colors.white },
  overviewHero: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 18, backgroundColor: '#211A38', borderWidth: 1, borderColor: '#3B3260', marginBottom: 8 },
  overviewIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  overviewCopy: { flex: 1, paddingLeft: 12 },
  overviewLabel: { color: colors.muted, fontSize: 11 },
  overviewValue: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 3 },
  overviewRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  overviewEmoji: { fontSize: 22, width: 38 },
  overviewGoalCopy: { flex: 1, gap: 7 },
  overviewGoalName: { color: colors.text, fontSize: 11, fontWeight: '800' },
  overviewPct: { color: colors.purple2, fontSize: 11, fontWeight: '900', marginLeft: 12 },
});
