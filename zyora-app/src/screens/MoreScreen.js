import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatMoney, useApp } from '../AppContext';
import AnalysisPanel from '../components/AnalysisPanel';
import { BottomSheet, Card, DemoBadge, PrimaryButton, ProgressBar, ScreenHeader } from '../components/UI';
import { friends } from '../data';
import { exportStructuredLogs } from '../services/logger';
import { colors, radii } from '../theme';

export default function MoreScreen({ showToast, onNavigate, initialSection = 'month' }) {
  const { state, money, month, t, update, sendMoney, resetLocalFinancialData } = useApp();
  const [section, setSection] = useState(initialSection);
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [feeInfoOpen, setFeeInfoOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [sendAmount, setSendAmount] = useState('5000');

  const filteredFriends = useMemo(() => {
    const match = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('hu-HU');
    return friends.filter(friend => match(friend.name).includes(match(query.trim())));
  }, [query]);
  const sections = [
    { id: 'month', icon: 'stats-chart-outline', label: state.lang === 'en' ? 'My month' : 'Hónapom' },
    { id: 'analysis', icon: 'analytics-outline', label: state.lang === 'en' ? 'Insights' : 'Elemzés' },
    { id: 'friends', icon: 'people-outline', label: t('friends') },
    { id: 'pro', icon: 'diamond-outline', label: t('pro') },
    { id: 'settings', icon: 'settings-outline', label: t('settings') },
  ];

  function confirmSend() {
    const amount = Number(sendAmount.replace(/\D/g, ''));
    if (!selectedFriend || !amount) { showToast(t('invalidAmount')); return; }
    if (amount > money.spendable) { showToast(t('insufficientFunds')); return; }
    if (!sendMoney(selectedFriend, amount)) { showToast(t('insufficientFunds')); return; }
    setSelectedFriend(null); setSendAmount('5000');
    showToast(state.lang === 'en' ? `${formatMoney(amount, state.lang)} simulated · ${selectedFriend.first}` : `${formatMoney(amount, state.lang)} szimulálva · ${selectedFriend.first}`);
  }

  function doReset() {
    Alert.alert(
      state.lang === 'en' ? 'Reset demo?' : 'Visszaállítod a demót?',
      state.lang === 'en' ? 'Your demo goals, XP, settings and simulated transfers will return to the starting example.' : 'A demócélok, XP, beállítások és szimulált küldések visszaállnak a kiinduló példára.',
      [
        { text: state.lang === 'en' ? 'Cancel' : 'Mégse', style: 'cancel' },
        { text: state.lang === 'en' ? 'Delete' : 'Törlés', style: 'destructive', onPress: async () => { await resetLocalFinancialData(); showToast(t('resetDone')); } },
      ],
    );
  }

  async function doExportLogs() {
    try {
      const result = await exportStructuredLogs();
      showToast(state.lang === 'en' ? `${result.eventCount} log events prepared.` : `${result.eventCount} naplóesemény előkészítve.`);
    } catch (error) {
      showToast(error?.message || (state.lang === 'en' ? 'Log export failed.' : 'A napló exportálása nem sikerült.'));
    }
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <ScreenHeader eyebrow={state.lang === 'en' ? 'EXPLORE' : 'FEDEZD FEL'} title={t('more')} />

        <Card onPress={() => setProfileExpanded(value => !value)} style={styles.profileCard}>
          <LinearGradient colors={['#8A73FF', '#5F45F3']} style={styles.profileAvatar}><Text style={styles.profileInitial}>B</Text></LinearGradient>
          <View style={styles.profileCopy}><Text style={styles.profileName}>{state.profile?.fullName || 'Demóprofil'}</Text><Text style={styles.profileMeta}>{state.lang === 'en' ? 'Zyora · interactive demo' : state.profile?.plan} · LVL {state.level} · Momentum</Text></View>
          <View style={styles.profileXp}><Ionicons name="flash" size={13} color={colors.purple2} /><Text style={styles.profileXpText}>{state.xp} XP</Text></View>
          <Ionicons name={profileExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
        </Card>

        {profileExpanded ? (
          <Card style={styles.profileDetails}>
            <ProfileDetail icon="mail-outline" label={state.lang === 'en' ? 'Email' : 'E-mail'} value={state.profile?.email} />
            <ProfileDetail icon="call-outline" label={state.lang === 'en' ? 'Phone' : 'Telefon'} value={state.profile?.phone} />
            <ProfileDetail icon="school-outline" label={state.lang === 'en' ? 'Student status' : 'Hallgatói státusz'} value={state.profile?.studentVerified ? (state.lang === 'en' ? 'Verified' : 'Hitelesítve') : (state.lang === 'en' ? 'Not verified' : 'Nincs hitelesítve')} success={state.profile?.studentVerified} />
            <ProfileDetail icon="calendar-outline" label={state.lang === 'en' ? 'Member since' : 'Regisztráció'} value={state.lang === 'en' ? 'Demo profile' : state.profile?.joined} />
            
          </Card>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabs}>
          {sections.map(item => {
            const active = section === item.id;
            return <Pressable key={item.id} onPress={() => setSection(item.id)} style={[styles.sectionTab, active && styles.sectionTabActive]}><Ionicons name={item.icon} size={18} color={active ? colors.purple2 : colors.muted} /><Text style={[styles.sectionTabLabel, active && styles.sectionTabLabelActive]}>{item.label}</Text></Pressable>;
          })}
        </ScrollView>

        {section === 'month' ? (
          <View>
            <View style={styles.sectionIntro}><Text style={styles.sectionEyebrow}>{state.lang === 'en' ? 'DEMO OVERVIEW' : 'DEMÓÁTTEKINTÉS'}</Text><Text style={styles.sectionTitle}>{state.lang === 'en' ? 'Your month at a glance' : 'A hónapod egyben'}</Text></View>
            <LinearGradient colors={month.feeFreeEligible ? ['#163D2E', '#121A17'] : ['#2A2048', '#15121B']} style={styles.feeHero}>
              <View style={styles.feeTop}><View style={[styles.feeIcon, month.feeFreeEligible && styles.feeIconDone]}><Ionicons name={month.feeFreeEligible ? 'checkmark' : 'sparkles'} size={22} color={colors.white} /></View><View style={styles.feeCopy}><Text style={styles.feeEyebrow}>{state.lang === 'en' ? 'FEE MODEL · CONCEPT' : 'DÍJMODELL · KONCEPCIÓ'}</Text><Text style={styles.feeTitle}>{month.feeFreeEligible ? (state.lang === 'en' ? '0 HUF' : '0 Ft') : `${month.completedCriteria}/4 ${state.lang === 'en' ? 'criteria complete' : 'feltétel kész'}`}</Text></View><Pressable onPress={() => setFeeInfoOpen(true)} style={styles.feeInfo}><Ionicons name="information" size={17} color={colors.purple2} /></Pressable></View>
              <ProgressBar value={month.feeFreeProgress} color={month.feeFreeEligible ? colors.green : colors.purple2} track="#FFFFFF16" height={8} />
              <Text style={styles.feeHint}>{month.feeFreeEligible ? (state.lang === 'en' ? 'All four example conditions are met. No real account fee applies.' : 'Mind a négy példafeltétel teljesült. Az app nem vezet valódi számlát.') : (state.lang === 'en' ? `Complete ${4 - month.completedCriteria} more condition to unlock 0 HUF.` : `Még ${4 - month.completedCriteria} feltétel, és a következő hónap 0 Ft.`)}</Text>
            </LinearGradient>

            <View style={styles.monthMetrics}>
              <MonthMetric icon="cart-outline" color={colors.orange} label={state.lang === 'en' ? 'Spent' : 'Elköltve'} value={formatMoney(month.spent, state.lang)} />
              <MonthMetric icon="wallet-outline" color={colors.green} label={state.lang === 'en' ? 'Budget left' : 'Keret maradt'} value={formatMoney(month.remaining, state.lang)} />
              <MonthMetric icon="flag-outline" color={colors.purple2} label={state.lang === 'en' ? 'For goals' : 'Célokra'} value={formatMoney(money.goals, state.lang)} />
              <MonthMetric icon="trophy-outline" color={colors.blue} label={state.lang === 'en' ? 'Missions' : 'Küldetések'} value={`${month.completedMissions}/${state.missions.length}`} />
            </View>

            <Card style={styles.criteriaCard}>
              <Text style={styles.criteriaTitle}>{state.lang === 'en' ? 'Proposed fee model' : 'Tervezett díjmodell'}</Text>
              {month.criteria.map(item => <View key={item.id} style={styles.criteriaRow}><View style={[styles.criteriaCheck, item.done && styles.criteriaCheckDone]}><Ionicons name={item.done ? 'checkmark' : 'ellipse-outline'} size={14} color={item.done ? colors.white : colors.muted2} /></View><Text style={[styles.criteriaText, item.done && styles.criteriaTextDone]}>{state.lang === 'en' ? item.labelEn : item.labelHu}</Text></View>)}
            </Card>

            <Card style={styles.goalLinkCard} onPress={() => onNavigate('goals')}>
              <View style={styles.goalLinkIcon}><Ionicons name="git-merge-outline" size={21} color={colors.purple2} /></View><View style={styles.goalLinkCopy}><Text style={styles.goalLinkTitle}>{state.lang === 'en' ? 'Goals are connected' : 'A célokkal összekötve'}</Text><Text style={styles.goalLinkBody}>{state.lang === 'en' ? 'Savings rate, goal contributions and missions update this monthly status.' : 'A megtakarítási arány, a célbefizetések és a küldetések frissítik ezt a havi státuszt.'}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Card>
          </View>
        ) : null}

        {section === 'analysis' ? <AnalysisPanel /> : null}

        {section === 'friends' ? (
          <View>
            <View style={styles.sectionIntro}><Text style={styles.sectionEyebrow}>{state.lang === 'en' ? 'FRIENDS' : 'BARÁTOK'}</Text><Text style={styles.sectionTitle}>{t('friendsHelp')}</Text></View>
            <View style={styles.search}><Ionicons name="search" size={18} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder={t('search')} placeholderTextColor={colors.muted2} style={styles.searchInput} /></View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favorites}>
              {friends.slice(0, 4).map(friend => <Pressable key={friend.id} onPress={() => setSelectedFriend(friend)} style={styles.friendChip}><View style={[styles.friendAvatar, { backgroundColor: friend.color }]}><Text style={styles.friendAvatarText}>{friend.first.charAt(0)}</Text></View><Text style={styles.friendFirst}>{friend.first}</Text></Pressable>)}
            </ScrollView>

            <View style={styles.listHead}><Text style={styles.listTitle}>{t('friends')}</Text><Text style={styles.listMeta}>{t('recentActivity')}</Text></View>
            <Card style={styles.friendList}>
              {filteredFriends.map(friend => (
                <Pressable key={friend.id} onPress={() => setSelectedFriend(friend)} style={({ pressed }) => [styles.friendRow, pressed && styles.pressed]}>
                  <View style={[styles.friendAvatar, { backgroundColor: friend.color }]}><Text style={styles.friendAvatarText}>{friend.first.charAt(0)}</Text></View>
                  <View style={styles.friendCopy}><Text style={styles.friendName}>{friend.name}</Text><Text style={styles.friendActivity}>{state.lang === 'en' ? friend.activityEn : friend.activity}</Text></View>
                  <View style={styles.sendIcon}><Ionicons name="paper-plane-outline" size={16} color={colors.purple2} /></View>
                </Pressable>
              ))}
            </Card>
          </View>
        ) : null}

        {section === 'pro' ? (
          <View>
            <LinearGradient colors={['#211838', '#121018']} style={styles.proHero}>
              <View style={styles.proMark}><Text style={styles.proMarkText}>Z+</Text></View><Text style={styles.proEyebrow}>ZYORA PRO · CONCEPT</Text><Text style={styles.proTitle}>{t('proTitle')}</Text><Text style={styles.proBody}>{t('proHelp')}</Text>
              <Text style={styles.proConcept}>{state.lang === 'en' ? 'Concept preview. These features are not enabled in this demo.' : 'Koncepcióelőnézet. Ezek a funkciók még nem érhetők el a demóban.'}</Text>
            </LinearGradient>
            <View style={styles.proList}>
              <ProFeature icon="sparkles-outline" title="AI Money Copilot" body={state.lang === 'en' ? 'Recognises your money patterns, forecasts ahead and recommends a concrete next step.' : 'Felismeri a pénzügyi mintáidat, előre jelez és konkrét következő lépést ajánl.'} />
              <ProFeature icon="analytics-outline" title={state.lang === 'en' ? 'Cash-flow forecast' : 'Cash-flow előrejelzés'} body={state.lang === 'en' ? 'See upcoming bills, subscriptions and potentially risky days.' : 'Előre látod a számlákat, előfizetéseket és a kockázatos napokat.'} />
              <ProFeature icon="git-branch-outline" title="Smart Rules+" body={state.lang === 'en' ? 'Your own automations for salary, spending, categories and goals.' : 'Saját automatizmusok fizetésre, költésre, kategóriákra és célokra.'} />
              <ProFeature icon="layers-outline" title={state.lang === 'en' ? 'Complete financial aggregation' : 'Teljes pénzügyi aggregáció'} body={state.lang === 'en' ? 'Bank accounts, savings and investments in one view.' : 'Bankszámlák, megtakarítások és befektetések egy nézetben.'} />
            </View>

          </View>
        ) : null}

        {section === 'settings' ? (
          <View>
            <View style={styles.sectionIntro}><Text style={styles.sectionEyebrow}>{state.lang === 'en' ? 'SETTINGS' : 'BEÁLLÍTÁSOK'}</Text><Text style={styles.sectionTitle}>{t('settings')}</Text></View>
            <Card style={styles.settingCard}>
              <View style={styles.settingHead}><View style={styles.settingIcon}><Ionicons name="language-outline" size={20} color={colors.purple2} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>{t('language')}</Text><Text style={styles.settingHint}>{state.lang === 'en' ? 'Language of the complete app interface.' : 'Az alkalmazás teljes felületének nyelve.'}</Text></View></View>
              <View style={styles.languageRow}>
                <Pressable onPress={() => update({ lang: 'hu' })} style={[styles.language, state.lang === 'hu' && styles.languageActive]}><Text style={styles.flag}>🇭🇺</Text><Text style={[styles.languageText, state.lang === 'hu' && styles.languageTextActive]}>{t('hungarian')}</Text></Pressable>
                <Pressable onPress={() => update({ lang: 'en' })} style={[styles.language, state.lang === 'en' && styles.languageActive]}><Text style={styles.flag}>🇬🇧</Text><Text style={[styles.languageText, state.lang === 'en' && styles.languageTextActive]}>{t('english')}</Text></Pressable>
              </View>
            </Card>
            <Card style={styles.settingCard}>
              <View style={styles.settingHead}><View style={styles.settingIcon}><Ionicons name="code-download-outline" size={20} color={colors.purple2} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>{state.lang === 'en' ? 'Structured diagnostic log' : 'Strukturált diagnosztikai napló'}</Text><Text style={styles.settingHint}>{state.lang === 'en' ? 'Export technical events without personal or financial data.' : 'Technikai események exportja személyes és pénzügyi adatok nélkül.'}</Text></View></View>
              <PrimaryButton label={state.lang === 'en' ? 'Export .jsonl log' : '.jsonl napló exportálása'} icon="share-outline" secondary onPress={doExportLogs} style={styles.resetButton} />
            </Card>
            <Card style={styles.settingCard}>
              <View style={styles.settingHead}><View style={[styles.settingIcon, { backgroundColor: colors.redBg }]}><Ionicons name="trash-outline" size={20} color={colors.red} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>{t('demoData')}</Text><Text style={styles.settingHint}>{state.lang === 'en' ? 'Restore demo goals, transactions and settings to their starting values.' : 'Demócélok, tranzakciók és beállítások visszaállítása a kiinduló értékekre.'}</Text></View></View>
              <PrimaryButton label={t('reset')} icon="trash-outline" secondary onPress={doReset} style={styles.resetButton} />
            </Card>
            <Card style={styles.aboutCard}><Text style={styles.aboutMark}>zyora</Text><Text style={styles.aboutVersion}>MVP 0.4.0 · INTERACTIVE DEMO</Text><Text style={styles.aboutText}>Money, but finally on your side.</Text></Card>
          </View>
        ) : null}

        <DemoBadge />
      </ScrollView>

      <BottomSheet visible={Boolean(selectedFriend)} onClose={() => setSelectedFriend(null)} title={selectedFriend ? `${t('sending')} · ${selectedFriend.first}` : t('sending')}>
        {selectedFriend ? <View style={styles.sheetFriend}><View style={[styles.sheetAvatar, { backgroundColor: selectedFriend.color }]}><Text style={styles.sheetAvatarText}>{selectedFriend.first.charAt(0)}</Text></View><Text style={styles.sheetFriendName}>{selectedFriend.name}</Text></View> : null}
        <View style={styles.amountInput}><TextInput value={sendAmount} onChangeText={value => setSendAmount(value.replace(/\D/g, ''))} keyboardType="number-pad" selectTextOnFocus style={styles.amountText} /><Text style={styles.amountCurrency}>{state.lang === 'en' ? 'HUF' : 'Ft'}</Text></View>
        <View style={styles.presets}>{[2000, 5000, 10000, 25000].map(value => <Pressable key={value} onPress={() => setSendAmount(String(value))} style={styles.preset}><Text style={styles.presetText}>{formatMoney(value, state.lang)}</Text></Pressable>)}</View>
        <Text style={styles.sendDisclaimer}>{state.lang === 'en' ? 'Simulation only — no money will be transferred.' : 'Csak szimuláció — valódi pénz nem kerül átutalásra.'}</Text>
        <PrimaryButton label={state.lang === 'en' ? 'Simulate transfer →' : 'Küldés szimulálása →'} icon={null} onPress={confirmSend} style={styles.confirmButton} />
      </BottomSheet>

      <BottomSheet visible={feeInfoOpen} onClose={() => setFeeInfoOpen(false)} title={state.lang === 'en' ? 'Fee-free account rules' : 'Díjmentességi feltételek'}>
        <Text style={styles.feeSheetIntro}>{state.lang === 'en' ? 'Illustrative fee model only. No account is provided and no fees are charged. Split, Goals and Levels update these four example conditions.' : 'Kizárólag bemutató díjmodell. Az app nem vezet számlát és nem számít fel díjat. A Split, a Célok és a Szintek frissítik a négy példafeltételt.'}</Text>
        {month.criteria.map(item => <View key={item.id} style={styles.feeSheetRow}><Ionicons name={item.done ? 'checkmark-circle' : 'time-outline'} size={22} color={item.done ? colors.green : colors.orange} /><Text style={styles.feeSheetText}>{state.lang === 'en' ? item.labelEn : item.labelHu}</Text><Text style={[styles.feeSheetState, { color: item.done ? colors.green : colors.orange }]}>{item.done ? (state.lang === 'en' ? 'Done' : 'Kész') : (state.lang === 'en' ? 'In progress' : 'Folyamatban')}</Text></View>)}
      </BottomSheet>
    </>
  );
}

function ProFeature({ icon, title, body }) {
  return <Card style={styles.proFeature}><View style={styles.proFeatureIcon}><Ionicons name={icon} size={21} color={colors.purple2} /></View><View style={styles.proFeatureCopy}><Text style={styles.proFeatureTitle}>{title}</Text><Text style={styles.proFeatureBody}>{body}</Text></View></Card>;
}

function Metric({ value, label }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function MonthMetric({ icon, color, label, value }) {
  return <View style={styles.monthMetric}><View style={[styles.monthMetricIcon, { backgroundColor: `${color}20` }]}><Ionicons name={icon} size={18} color={color} /></View><Text style={styles.monthMetricLabel}>{label}</Text><Text style={styles.monthMetricValue}>{value}</Text></View>;
}

function ProfileDetail({ icon, label, value, success }) {
  return <View style={styles.profileDetail}><Ionicons name={icon} size={17} color={success ? colors.green : colors.purple2} /><View style={styles.profileDetailCopy}><Text style={styles.profileDetailLabel}>{label}</Text><Text style={[styles.profileDetailValue, success && { color: colors.green }]}>{value}</Text></View></View>;
}

function ProfileAction({ icon, label, onPress }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.profileAction, pressed && styles.pressed]}><Ionicons name={icon} size={17} color={colors.purple2} /><Text style={styles.profileActionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 125 },
  sendDisclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 4 },
  profileAvatar: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  profileInitial: { color: colors.white, fontSize: 19, fontWeight: '900' },
  profileCopy: { flex: 1, paddingHorizontal: 12 },
  profileName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  profileMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  profileXp: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2A2345', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 12 },
  profileXpText: { color: colors.purple2, fontSize: 10.5, fontWeight: '900' },
  profileDetails: { marginTop: 8, paddingVertical: 4, paddingHorizontal: 14 },
  profileDetail: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, gap: 10 },
  profileDetailCopy: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileDetailLabel: { color: colors.muted, fontSize: 11 },
  profileDetailValue: { color: colors.text, fontSize: 11, fontWeight: '800' },
  profileActions: { flexDirection: 'row', gap: 7, paddingVertical: 12 },
  profileAction: { flex: 1, minHeight: 55, borderRadius: 14, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', gap: 4 },
  profileActionText: { color: colors.text, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  sectionTabs: { flexDirection: 'row', gap: 7, paddingVertical: 12, paddingRight: 12 },
  sectionTab: { width: 88, height: 62, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 4 },
  sectionTabActive: { backgroundColor: '#211A38', borderColor: colors.purple },
  sectionTabLabel: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  sectionTabLabelActive: { color: colors.text },
  sectionIntro: { paddingVertical: 17 },
  sectionEyebrow: { color: colors.purple2, fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  feeHero: { borderRadius: radii.xl, padding: 19, borderWidth: 1, borderColor: '#44366E', overflow: 'hidden' },
  feeTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 17 },
  feeIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  feeIconDone: { backgroundColor: colors.green },
  feeCopy: { flex: 1, paddingHorizontal: 11 },
  feeEyebrow: { color: colors.purple2, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  feeTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  feeInfo: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#FFFFFF10', alignItems: 'center', justifyContent: 'center' },
  feeHint: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 11 },
  monthMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  monthMetric: { width: '48.7%', minHeight: 106, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 13 },
  monthMetricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  monthMetricLabel: { color: colors.muted, fontSize: 10.5, marginTop: 9 },
  monthMetricValue: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 3 },
  criteriaCard: { marginTop: 10, padding: 15 },
  criteriaTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginBottom: 7 },
  criteriaRow: { minHeight: 47, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  criteriaCheck: { width: 25, height: 25, borderRadius: 9, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  criteriaCheckDone: { backgroundColor: colors.green },
  criteriaText: { flex: 1, color: colors.muted, fontSize: 10.5, lineHeight: 14 },
  criteriaTextDone: { color: colors.text, fontWeight: '700' },
  goalLinkCard: { marginTop: 10, flexDirection: 'row', alignItems: 'center', padding: 14 },
  goalLinkIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  goalLinkCopy: { flex: 1, paddingHorizontal: 11 },
  goalLinkTitle: { color: colors.text, fontSize: 12.5, fontWeight: '900' },
  goalLinkBody: { color: colors.muted, fontSize: 10.5, lineHeight: 14, marginTop: 3 },
  search: { height: 51, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 17, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  favorites: { gap: 16, paddingVertical: 18, paddingHorizontal: 4 },
  friendChip: { alignItems: 'center', gap: 6 },
  friendAvatar: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  friendAvatarText: { color: colors.white, fontSize: 14, fontWeight: '900' },
  friendFirst: { color: colors.text, fontSize: 11, fontWeight: '800' },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  listTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  listMeta: { color: colors.muted, fontSize: 10.5 },
  friendList: { paddingHorizontal: 13, paddingVertical: 2 },
  friendRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 9 },
  friendCopy: { flex: 1, paddingHorizontal: 11 },
  friendName: { color: colors.text, fontSize: 12.5, fontWeight: '900' },
  friendActivity: { color: colors.muted, fontSize: 10.5, marginTop: 3 },
  sendIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  proHero: { borderRadius: radii.xl, padding: 22, overflow: 'hidden' },
  proMark: { width: 55, height: 55, borderRadius: 18, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  proMarkText: { color: colors.white, fontSize: 17, fontWeight: '900' },
  proEyebrow: { color: colors.purple2, fontSize: 10.5, fontWeight: '900', letterSpacing: 1.2 },
  proTitle: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -1, marginTop: 6 },
  proBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8 },
  proMetrics: { flexDirection: 'row', gap: 8, marginTop: 21 },
  proConcept: { color: colors.purple2, fontSize: 10.5, lineHeight: 14, fontWeight: '700', marginTop: 18 },
  metric: { flex: 1, backgroundColor: '#FFFFFF0C', borderRadius: 15, padding: 12 },
  metricValue: { color: colors.text, fontSize: 16, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10.5, marginTop: 3 },
  proList: { gap: 8, marginVertical: 12 },
  proFeature: { flexDirection: 'row', padding: 14 },
  proFeatureIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  proFeatureCopy: { flex: 1, paddingLeft: 12 },
  proFeatureTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  proFeatureBody: { color: colors.muted, fontSize: 11, lineHeight: 14, marginTop: 4 },
  settingCard: { marginTop: 10 },
  settingHead: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1, paddingLeft: 11 },
  settingTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  settingHint: { color: colors.muted, fontSize: 10.5, marginTop: 3 },
  languageRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  language: { flex: 1, height: 52, borderRadius: 15, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  languageActive: { borderColor: colors.purple, backgroundColor: '#211A38' },
  flag: { fontSize: 20 },
  languageText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  languageTextActive: { color: colors.text },
  resetButton: { marginTop: 16 },
  aboutCard: { marginTop: 10, alignItems: 'center' },
  aboutMark: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -1.2 },
  aboutVersion: { color: colors.muted, fontSize: 10.5, marginTop: 4 },
  aboutText: { color: colors.purple2, fontSize: 11, fontWeight: '700', marginTop: 10 },
  sheetFriend: { alignItems: 'center', marginBottom: 16 },
  sheetAvatar: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  sheetAvatarText: { color: colors.white, fontSize: 21, fontWeight: '900' },
  sheetFriendName: { color: colors.text, fontSize: 13, fontWeight: '800' },
  amountInput: { height: 70, borderRadius: 19, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  amountText: { flex: 1, color: colors.text, fontSize: 29, fontWeight: '900' },
  amountCurrency: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  presets: { flexDirection: 'row', gap: 6, marginTop: 10 },
  preset: { flex: 1, height: 39, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  presetText: { color: colors.text, fontSize: 10.5, fontWeight: '800' },
  confirmButton: { marginTop: 17 },
  feeSheetIntro: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 8 },
  feeSheetRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  feeSheetText: { flex: 1, color: colors.text, fontSize: 10.5, lineHeight: 14, fontWeight: '700' },
  feeSheetState: { fontSize: 10.5, fontWeight: '900' },
});
