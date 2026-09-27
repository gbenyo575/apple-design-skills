import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatMoney, useApp } from '../AppContext';
import { BottomSheet, BrandHeader, Card, DemoBadge, ProgressBar, SectionHeader, TransactionRow } from '../components/UI';
import { colors, radii } from '../theme';

export default function HomeScreen({ onNavigate, onProfile, onNotifications, showToast }) {
  const { state, money, month, t } = useApp();
  const [wealthVisible, setWealthVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [allTransactionsOpen, setAllTransactionsOpen] = useState(false);
  const [overspendOpen, setOverspendOpen] = useState(false);
  const wealthDrag = useRef(new Animated.Value(0)).current;
  const deltaPositive = money.delta >= 0;
  const deltaText = money.delta === 0 ? t('noChange') : `${money.delta > 0 ? '+' : '−'}${formatMoney(Math.abs(money.delta), state.lang)}`;
  const wealthResponder = useMemo(() => PanResponder.create({
    // Claim the wealth handle immediately so the parent ScrollView cannot steal
    // a slow, deliberate iOS swipe before PanResponder sees enough movement.
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 2 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderGrant: () => {
      wealthDrag.stopAnimation();
      wealthDrag.setValue(0);
    },
    onPanResponderMove: (_, gesture) => {
      const distance = Math.max(-34, Math.min(34, gesture.dy));
      wealthDrag.setValue(distance);
    },
    onPanResponderRelease: (_, gesture) => {
      const isTap = Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5;
      const openGesture = gesture.dy >= 12 || gesture.vy >= 0.22;
      const closeGesture = gesture.dy <= -12 || gesture.vy <= -0.22;

      if (isTap) setWealthVisible(current => !current);
      else if (openGesture) setWealthVisible(true);
      else if (closeGesture) setWealthVisible(false);

      Animated.spring(wealthDrag, { toValue: 0, damping: 14, stiffness: 180, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(wealthDrag, { toValue: 0, useNativeDriver: true }).start(),
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  }), [wealthDrag]);

  const quickActions = [
    { icon: 'sparkles-outline', label: t('split'), color: colors.purple2, action: () => onNavigate('split') },
    { icon: 'flag-outline', label: t('goals'), color: colors.purple2, action: () => onNavigate('goals') },
    { icon: 'people-outline', label: t('friends'), color: colors.purple2, action: () => onNavigate('friends') },
    { icon: 'trophy-outline', label: t('levels'), color: colors.purple2, action: () => onNavigate('levels') },
  ];

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <BrandHeader onProfile={onProfile} onNotifications={onNotifications} />

        <Animated.View accessible accessibilityRole="button" accessibilityLabel={wealthVisible ? t('hideWealth') : t('showWealth')} onAccessibilityTap={() => setWealthVisible(value => !value)} {...wealthResponder.panHandlers} style={[styles.wealthToggle, { transform: [{ translateY: wealthDrag }] }]}>
          <View style={styles.wealthHandle}><View style={styles.wealthHandleBar} /><Ionicons name={wealthVisible ? 'chevron-up' : 'chevron-down'} size={16} color={colors.purple2} /></View>
          <View style={styles.wealthToggleCopy}><Text style={styles.wealthToggleLabel}>{wealthVisible ? t('hideWealth') : t('showWealth')}</Text><Text style={styles.wealthToggleHint}>{state.lang === 'en' ? (wealthVisible ? 'Swipe up to hide' : 'Swipe down to reveal') : (wealthVisible ? 'Húzd fel az elrejtéshez' : 'Húzd le a megnyitáshoz')}</Text></View>
          <Ionicons name="finger-print-outline" size={20} color={colors.purple2} />
        </Animated.View>

        {wealthVisible ? (
          <Card style={styles.wealthCard}>
            <Text style={styles.wealthEyebrow}>{t('totalWealth')}</Text>
            <Text style={styles.wealthAmount}>{formatMoney(money.totalWealth, state.lang)}</Text>
            <View style={styles.wealthGrid}>
              <WealthStat label={t('spendable')} value={money.spendable} lang={state.lang} color={colors.purple2} />
              <WealthStat label={t('goalPocket')} value={money.totalGoals} lang={state.lang} color={colors.green} />
              {money.investments > 0 ? <WealthStat label={state.lang === 'en' ? 'Investments' : 'Befektetés'} value={money.investments} lang={state.lang} color={colors.orange} /> : null}
            </View>
          </Card>
        ) : null}

        <View style={styles.balanceHero}>
          <Text style={styles.balanceLabel}>{t('spendable')}</Text>
          <Text style={styles.balance}>{formatMoney(money.spendable, state.lang)}</Text>
          <View style={[styles.delta, deltaPositive ? styles.deltaPositive : styles.deltaNegative]}>
            <Ionicons name={deltaPositive ? 'trending-up' : 'trending-down'} size={15} color={deltaPositive ? colors.green : colors.red} />
            <Text style={[styles.deltaValue, { color: deltaPositive ? colors.green : colors.red }]}>{deltaText}</Text>
            <Text style={styles.deltaLabel}>{deltaPositive ? t('savedVsLast') : t('spentVsLast')}</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          {quickActions.map(item => (
            <Pressable key={item.label} onPress={item.action} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
              <View style={[styles.quickIcon, { backgroundColor: `${item.color}1C` }]}><Ionicons name={item.icon} size={22} color={item.color} /></View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => onNavigate('split')} style={({ pressed }) => pressed && styles.pressed}>
          <LinearGradient colors={['#6750F5', '#8A73FF', '#4E38D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.splitBanner}>
            <View style={styles.splitOrb}><Ionicons name="sparkles" size={22} color={colors.white} /></View>
            <View style={styles.splitCopy}><Text style={styles.splitEyebrow}>{t('smartSplit')}</Text><Text style={styles.splitTitle}>{t('salaryArrived')}</Text><Text style={styles.splitHint}>{t('tryAmount')}</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </LinearGradient>
        </Pressable>

        <Card style={styles.pulseCard}>
          <View style={styles.pulseTop}><View><Text style={styles.pulseEyebrow}>{state.lang === 'en' ? 'MONTHLY SPENDING BUDGET' : 'HAVI KÖLTÉSI KERET'}</Text><Text style={styles.pulseTitle}>{formatMoney(month.remaining, state.lang)} {state.lang === 'en' ? 'left' : 'maradt'}</Text></View><View style={[styles.pulseScore, month.budgetUsage > 100 && styles.pulseScoreDanger]}><Text style={[styles.pulseScoreText, month.budgetUsage > 100 && styles.pulseScoreDangerText]}>{month.budgetUsage}%</Text></View></View>
          <View style={styles.budgetNumbers}><Text style={styles.pulseBody}>{formatMoney(month.spent, state.lang)} {state.lang === 'en' ? 'spent' : 'elköltve'}</Text><Text style={styles.pulseBody}>{formatMoney(month.budget, state.lang)} {state.lang === 'en' ? 'budget' : 'keret'}</Text></View>
          <ProgressBar value={month.budgetUsage} color={month.budgetUsage >= 90 ? colors.red : colors.green} track="#22302B" height={7} />
          <Text style={styles.budgetHint}>{state.lang === 'en' ? 'Illustrative spending plan; the proposed fee model is a concept.' : 'Példa költési terv; a díjmodell jelenleg koncepció.'}</Text>
        </Card>

        <Card onPress={() => setOverspendOpen(true)} style={styles.overspendCard}>
          <View style={styles.overspendIcon}><Ionicons name="git-branch-outline" size={21} color={colors.orange} /></View>
          <View style={styles.overspendCopy}><Text style={styles.overspendEyebrow}>{state.lang === 'en' ? 'IF YOU OVERSPEND' : 'HA TÚLKÖLTESZ'}</Text><Text style={styles.overspendTitle}>{state.lang === 'en' ? 'See which pocket pays next' : 'Nézd meg, melyik zseb fizet tovább'}</Text><Text style={styles.overspendHint}>{state.overspendSource === 'approval' ? (state.lang === 'en' ? 'Spendable → your approval' : 'Elkölthető → a te jóváhagyásod') : (state.lang === 'en' ? 'Spendable → emergency fund → approval' : 'Elkölthető → vésztartalék → jóváhagyás')}</Text></View>
          <Ionicons name="chevron-forward" size={19} color={colors.muted} />
        </Card>

        <SectionHeader title={t('transactions')} subtitle={state.lang === 'en' ? 'Example transactions' : 'Példatranzakciók'} action={t('seeAll')} onAction={() => setAllTransactionsOpen(true)} />
        <Card style={styles.listCard}>{state.transactions.slice(0, 5).map(item => <TransactionRow key={item.id} item={item} onPress={() => setSelectedTransaction(item)} />)}</Card>

        <SectionHeader title={t('goalsPreview')} action={t('seeAll')} onAction={() => onNavigate('goals')} />
        <View style={styles.goalRow}>
          {state.goals.slice(0, 2).map(goal => {
            const pct = Math.round(goal.saved / goal.target * 100);
            return (
              <Card key={goal.id} onPress={() => onNavigate('goals')} style={styles.goalMini}>
                <View style={styles.goalMiniTop}><Text style={styles.goalEmoji}>{goal.emoji}</Text><Text style={styles.goalPct}>{pct}%</Text></View>
                <Text style={styles.goalCategory}>{state.lang === 'en' ? (goal.categoryEn || goal.category) : goal.category}</Text><Text style={styles.goalName} numberOfLines={1}>{state.lang === 'en' ? (goal.nameEn || goal.name) : goal.name}</Text>
                <ProgressBar value={pct} height={6} color={goal.id === 'bali' ? colors.purple : colors.green} />
                <Text style={styles.goalAmount}>{formatMoney(goal.saved, state.lang)} / {formatMoney(goal.target, state.lang)}</Text>
              </Card>
            );
          })}
        </View>

        <Pressable onPress={() => onNavigate('levels')} style={({ pressed }) => [styles.levelCard, pressed && styles.pressed]}>
          <LinearGradient colors={['#1E1930', '#17131D']} style={StyleSheet.absoluteFill} />
          <View style={styles.levelRing}><Text style={styles.levelNumber}>{state.level}</Text><Text style={styles.levelSmall}>LVL</Text></View>
          <View style={styles.levelCopy}><Text style={styles.levelEyebrow}>{t('level')}</Text><Text style={styles.levelTitle}>Momentum</Text><Text style={styles.levelXp}>{state.xp} / 1000 XP</Text><ProgressBar value={state.xp / 10} height={6} /></View>
          <Ionicons name="chevron-forward" size={20} color={colors.purple2} />
        </Pressable>

        <DemoBadge />
      </ScrollView>

      <BottomSheet visible={Boolean(selectedTransaction)} onClose={() => setSelectedTransaction(null)} title={selectedTransaction?.merchant || ''}>
        {selectedTransaction ? (
          <View style={styles.txSheet}>
            <View style={[styles.txSheetIcon, { backgroundColor: `${selectedTransaction.color}22` }]}><Ionicons name={selectedTransaction.icon} size={30} color={selectedTransaction.color} /></View>
            <Text style={[styles.txSheetAmount, selectedTransaction.amount > 0 && { color: colors.green }]}>{formatMoney(selectedTransaction.amount, state.lang, true)}</Text>
            <InfoRow label={t('category')} value={state.lang === 'en' ? (selectedTransaction.categoryEn || selectedTransaction.category) : selectedTransaction.category} />
            <InfoRow label={t('date')} value={state.lang === 'en' ? (selectedTransaction.dateEn || selectedTransaction.date) : selectedTransaction.date} />
            <InfoRow label={state.lang === 'en' ? 'Source' : 'Forrás'} value={state.lang === 'en' ? 'Example / local demo' : 'Példa / helyi demó'} />
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet visible={allTransactionsOpen} onClose={() => setAllTransactionsOpen(false)} title={t('transactions')}>
        <ScrollView style={{ maxHeight: 560 }} showsVerticalScrollIndicator={false}>
          {state.transactions.map(item => <TransactionRow key={item.id} item={item} onPress={() => { setAllTransactionsOpen(false); setSelectedTransaction(item); }} />)}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={overspendOpen} onClose={() => setOverspendOpen(false)} title={state.lang === 'en' ? 'Overspending route' : 'Túlköltési sorrend'}>
        <Text style={styles.routeIntro}>{state.lang === 'en' ? 'Illustration: a future banking partner would decide how to handle overspending.' : 'Szemléltetés: egy későbbi banki partnerrel dőlhet el a túlköltés kezelése.'}</Text>
        <RouteStep index="1" icon="wallet-outline" title={state.lang === 'en' ? 'Spendable pocket' : 'Elkölthető zseb'} body={state.lang === 'en' ? 'Every card transaction starts here.' : 'Minden kártyás tranzakció innen indul.'} active />
        <RouteStep index="2" icon={state.overspendSource === 'approval' ? 'hand-left-outline' : 'shield-outline'} title={state.overspendSource === 'approval' ? (state.lang === 'en' ? 'Your approval' : 'A te jóváhagyásod') : (state.lang === 'en' ? 'Emergency fund' : 'Vésztartalék')} body={state.overspendSource === 'approval' ? (state.lang === 'en' ? 'The transaction pauses and asks you what to do next.' : 'A tranzakció megáll, és megkérdezi, hogyan menjen tovább.') : (state.lang === 'en' ? 'Used only after the spendable pocket is empty.' : 'Csak akkor nyílik meg, ha az elkölthető zseb elfogyott.')} />
        <RouteStep index="3" icon="lock-closed-outline" title={state.lang === 'en' ? 'Protected goals stay closed' : 'A védett célok zárva maradnak'} body={state.lang === 'en' ? 'Goal money requires separate approval and the Shield waiting time still applies.' : 'A célpénzhez külön jóváhagyás kell, és a Shield várakozási ideje is megmarad.'} />
        <View style={styles.routeSafety}><Ionicons name="lock-closed" size={16} color={colors.green} /><Text style={styles.routeSafetyText}>{state.lang === 'en' ? 'Goals are never an automatic funding source.' : 'A célok soha nem automatikus fedezeti zsebek.'}</Text></View>
      </BottomSheet>
    </>
  );
}

function WealthStat({ label, value, lang, color }) {
  return <View style={styles.wealthStat}><View style={[styles.wealthDot, { backgroundColor: color }]} /><Text style={styles.wealthStatLabel}>{label}</Text><Text style={styles.wealthStatValue}>{formatMoney(value, lang)}</Text></View>;
}

function InfoRow({ label, value }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function RouteStep({ index, icon, title, body, active = false }) {
  return <View style={styles.routeStep}><View style={[styles.routeIndex, active && styles.routeIndexActive]}><Text style={[styles.routeIndexText, active && styles.routeIndexTextActive]}>{index}</Text></View><View style={styles.routeIcon}><Ionicons name={icon} size={20} color={active ? colors.purple2 : colors.muted} /></View><View style={styles.routeCopy}><Text style={styles.routeTitle}>{title}</Text><Text style={styles.routeBody}>{body}</Text></View></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 125 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  wealthToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, minHeight: 62, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  wealthHandle: { width: 28, alignItems: 'center', gap: 2, marginRight: 10 },
  wealthHandleBar: { width: 24, height: 4, borderRadius: 2, backgroundColor: colors.purple },
  wealthToggleCopy: { flex: 1 },
  wealthToggleLabel: { color: colors.text, fontSize: 12, fontWeight: '800' },
  wealthToggleHint: { color: colors.muted2, fontSize: 10.5, marginTop: 2 },
  wealthCard: { marginTop: 10, backgroundColor: '#181421' },
  wealthEyebrow: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  wealthAmount: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.2, marginTop: 6 },
  wealthGrid: { gap: 9, marginTop: 17 },
  wealthStat: { flexDirection: 'row', alignItems: 'center' },
  wealthDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  wealthStatLabel: { flex: 1, color: colors.muted, fontSize: 11 },
  wealthStatValue: { color: colors.text, fontSize: 11, fontWeight: '800' },
  balanceHero: { paddingVertical: 28 },
  balanceLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  balance: { color: colors.text, fontSize: 38, lineHeight: 46, fontWeight: '900', letterSpacing: -1.8, marginVertical: 5 },
  delta: { alignSelf: 'flex-start', maxWidth: '100%', minHeight: 32, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.pill, borderWidth: 1 },
  deltaPositive: { backgroundColor: colors.greenBg, borderColor: '#24523E' },
  deltaNegative: { backgroundColor: colors.redBg, borderColor: '#63303B' },
  deltaValue: { fontSize: 10.5, fontWeight: '900' },
  deltaLabel: { color: colors.muted, fontSize: 11 },
  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  quickAction: { flex: 1, alignItems: 'center', gap: 7, borderRadius: 17, paddingVertical: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  quickIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: colors.text, fontSize: 11, fontWeight: '800' },
  splitBanner: { minHeight: 96, borderRadius: radii.lg, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  splitOrb: { width: 45, height: 45, borderRadius: 16, backgroundColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' },
  splitCopy: { flex: 1 },
  splitEyebrow: { color: '#E5E0FF', fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  splitTitle: { color: colors.white, fontSize: 14, fontWeight: '900', marginTop: 3 },
  splitHint: { color: '#E7E2FF', fontSize: 11, marginTop: 3 },
  pulseCard: { marginTop: 12, backgroundColor: '#131A18', borderColor: '#263D35' },
  pulseTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pulseEyebrow: { color: colors.green, fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  pulseTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  pulseScore: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, backgroundColor: '#1E392E' },
  pulseScoreText: { color: colors.green, fontSize: 11, fontWeight: '900' },
  pulseBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 11 },
  pulseScoreDanger: { backgroundColor: colors.redBg },
  pulseScoreDangerText: { color: colors.red },
  budgetNumbers: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  budgetHint: { color: colors.muted2, fontSize: 10.5, lineHeight: 14, marginTop: 11 },
  overspendCard: { marginTop: 10, flexDirection: 'row', alignItems: 'center', padding: 14 },
  overspendIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#3A2922', alignItems: 'center', justifyContent: 'center' },
  overspendCopy: { flex: 1, paddingHorizontal: 11 },
  overspendEyebrow: { color: colors.orange, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  overspendTitle: { color: colors.text, fontSize: 12.5, fontWeight: '900', marginTop: 3 },
  overspendHint: { color: colors.muted, fontSize: 10.5, marginTop: 3 },
  listCard: { paddingVertical: 2, paddingHorizontal: 14 },
  goalRow: { flexDirection: 'row', gap: 10 },
  goalMini: { flex: 1, padding: 14 },
  goalMiniTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalEmoji: { fontSize: 24 },
  goalPct: { color: colors.purple2, fontSize: 13, fontWeight: '900' },
  goalCategory: { color: colors.muted2, fontSize: 11, fontWeight: '900', letterSpacing: 0.7, marginTop: 10 },
  goalName: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 3, marginBottom: 12 },
  goalAmount: { color: colors.muted, fontSize: 10.5, marginTop: 9 },
  levelCard: { position: 'relative', overflow: 'hidden', minHeight: 112, marginTop: 24, borderRadius: radii.lg, borderWidth: 1, borderColor: '#3B3260', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  levelRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 6, borderColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  levelNumber: { color: colors.text, fontSize: 23, fontWeight: '900', lineHeight: 24 },
  levelSmall: { color: colors.purple2, fontSize: 7, fontWeight: '900' },
  levelCopy: { flex: 1 },
  levelEyebrow: { color: colors.purple2, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  levelTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 3 },
  levelXp: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 9 },
  txSheet: { alignItems: 'center', paddingBottom: 4 },
  txSheetIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txSheetAmount: { color: colors.text, fontSize: 30, fontWeight: '900', marginVertical: 16 },
  infoRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line },
  infoLabel: { color: colors.muted, fontSize: 12 },
  infoValue: { color: colors.text, fontSize: 12, fontWeight: '800' },
  routeIntro: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 10 },
  routeStep: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  routeIndex: { width: 25, height: 25, borderRadius: 13, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  routeIndexActive: { backgroundColor: colors.purple },
  routeIndexText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  routeIndexTextActive: { color: colors.white },
  routeIcon: { width: 43, alignItems: 'center' },
  routeCopy: { flex: 1 },
  routeTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  routeBody: { color: colors.muted, fontSize: 10.5, lineHeight: 14, marginTop: 3 },
  routeSafety: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13, borderRadius: 15, backgroundColor: colors.greenBg, marginTop: 13 },
  routeSafetyText: { flex: 1, color: colors.green, fontSize: 11, fontWeight: '800' },
});
