import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/AppContext';
import { BottomSheet, BottomTabs, Card, PrimaryButton } from './src/components/UI';
import GoalsScreen from './src/screens/GoalsScreen';
import HomeScreen from './src/screens/HomeScreen';
import LevelsScreen from './src/screens/LevelsScreen';
import MoreScreen from './src/screens/MoreScreen';
import SplitScreen from './src/screens/SplitScreen';
import { logEvent, logScreenView } from './src/services/logger';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { loaded, state, money, t, update } = useApp();
  const [launchDone, setLaunchDone] = useState(false);
  const [screen, setScreen] = useState('home');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastY = useRef(new Animated.Value(12)).current;
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => {
    if (loaded && launchDone) logScreenView(screen);
  }, [launchDone, loaded, screen]);

  function showToast(message) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastOpacity.setValue(0); toastY.setValue(12);
    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(toastY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(), 2200);
  }

  if (!loaded || !launchDone) return <AnimatedSplash onDone={() => setLaunchDone(true)} />;

  const shared = { onNavigate: setScreen, showToast };
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.demoRibbon}><Ionicons name="flask-outline" size={14} color={colors.purple2} /><Text style={styles.demoRibbonText}>{state.lang === 'en' ? 'INTERACTIVE DEMO · no real money moves' : 'INTERAKTÍV DEMÓ · nincs valódi pénzmozgás'}</Text></View>
        {screen === 'home' ? <HomeScreen {...shared} onProfile={() => setProfileOpen(true)} onNotifications={() => setNotificationsOpen(true)} /> : null}
        {screen === 'split' ? <SplitScreen {...shared} /> : null}
        {screen === 'goals' ? <GoalsScreen {...shared} /> : null}
        {screen === 'levels' ? <LevelsScreen {...shared} /> : null}
        {screen === 'more' || screen === 'friends' ? <MoreScreen key={screen} {...shared} initialSection={screen === 'friends' ? 'friends' : 'month'} /> : null}
      </SafeAreaView>
      <BottomTabs active={screen === 'friends' ? 'more' : screen} onChange={setScreen} />

      {toast ? <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.toast, { opacity: toastOpacity, transform: [{ translateY: toastY }] }]}><Ionicons name="information-circle-outline" size={18} color={colors.purple2} /><Text style={styles.toastText}>{toast}</Text></Animated.View> : null}

      <BottomSheet visible={profileOpen} onClose={() => setProfileOpen(false)} title={t('profile')}>
        <ScrollView style={styles.profileScrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.profileScroll}>
          <View style={styles.profileHero}><View style={styles.largeAvatar}><Text style={styles.largeAvatarText}>B</Text></View><Text style={styles.profileName}>{state.profile?.fullName}</Text><Text style={styles.profileMeta}>{state.lang === 'en' ? 'Zyora · interactive demo' : state.profile?.plan} · LVL {state.level} · {state.xp} XP</Text><View style={styles.verifiedPill}><Ionicons name="information-circle-outline" size={14} color={colors.purple2} /><Text style={styles.verifiedText}>{state.lang === 'en' ? 'Example profile' : 'Példaprofil'}</Text></View></View>
          <Text style={styles.profileSection}>{state.lang === 'en' ? 'PERSONAL DETAILS' : 'SZEMÉLYES ADATOK'}</Text>
          <Card style={styles.profileInfo}><ProfileLine icon="mail-outline" label={state.lang === 'en' ? 'Email' : 'E-mail'} value={state.profile?.email} /><ProfileLine icon="call-outline" label={state.lang === 'en' ? 'Phone' : 'Telefon'} value={state.profile?.phone} /><ProfileLine icon="calendar-outline" label={state.lang === 'en' ? 'Member since' : 'Regisztráció'} value={state.lang === 'en' ? 'Demo profile' : state.profile?.joined} /><ProfileLine icon="language-outline" label={t('language')} value={state.lang === 'hu' ? 'Magyar' : 'English'} /></Card>
          <Text style={styles.profileSection}>{state.lang === 'en' ? 'MONEY SETTINGS' : 'PÉNZÜGYI BEÁLLÍTÁSOK'}</Text>
          <View style={styles.profileMetrics}><ProfileMetric label={state.lang === 'en' ? 'Monthly salary' : 'Havi fizetés'} value={formatProfileMoney(state.salary, state.lang)} /><ProfileMetric label={state.lang === 'en' ? 'Automatic saving' : 'Automatikus megtakarítás'} value={`${state.savingsRate}%`} /><ProfileMetric label="Shield" value={`${state.shieldHours || 0}h`} /><ProfileMetric label={state.lang === 'en' ? 'Spendable' : 'Elkölthető'} value={formatProfileMoney(money.spendable, state.lang)} /></View>
          <Card style={styles.coverageCard}>
            <View style={styles.coverageHead}><Ionicons name="git-branch-outline" size={20} color={colors.orange} /><View style={styles.coverageCopy}><Text style={styles.coverageTitle}>{state.lang === 'en' ? 'Overspending coverage' : 'Túlköltési fedezet'}</Text><Text style={styles.coverageHint}>{state.lang === 'en' ? 'Choose what happens after your spendable pocket is empty.' : 'Állítsd be, mi történjen, ha az elkölthető zseb elfogy.'}</Text></View></View>
            <View style={styles.coverageOptions}><Pressable onPress={() => update({ overspendSource: 'emergency' })} style={[styles.coverageOption, state.overspendSource === 'emergency' && styles.coverageOptionActive]}><Ionicons name="shield-outline" size={17} color={state.overspendSource === 'emergency' ? colors.white : colors.purple2} /><Text style={[styles.coverageOptionText, state.overspendSource === 'emergency' && styles.coverageOptionTextActive]}>{state.lang === 'en' ? 'Emergency fund' : 'Vésztartalék'}</Text></Pressable><Pressable onPress={() => update({ overspendSource: 'approval' })} style={[styles.coverageOption, state.overspendSource === 'approval' && styles.coverageOptionActive]}><Ionicons name="hand-left-outline" size={17} color={state.overspendSource === 'approval' ? colors.white : colors.purple2} /><Text style={[styles.coverageOptionText, state.overspendSource === 'approval' && styles.coverageOptionTextActive]}>{state.lang === 'en' ? 'Always ask' : 'Mindig kérdezzen'}</Text></Pressable></View>
          </Card>
          <PrimaryButton label={state.lang === 'en' ? 'Open full settings' : 'Teljes beállítások'} icon="settings-outline" secondary onPress={() => { setProfileOpen(false); setScreen('more'); }} style={styles.sheetAction} />
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} title={t('notifications')}>
        <View style={styles.notificationEmpty}><View style={styles.notificationIcon}><Ionicons name="notifications-off-outline" size={28} color={colors.purple2} /></View><Text style={styles.notificationTitle}>{t('noNotifications')}</Text><Text style={styles.notificationBody}>{state.lang === 'en' ? 'Important spending, goal and Shield alerts will appear here.' : 'A fontos költési, cél- és Shield-értesítések itt jelennek majd meg.'}</Text></View>
      </BottomSheet>
    </View>
  );
}

function AnimatedSplash({ onDone }) {
  const scale = useRef(new Animated.Value(0.72)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordX = useRef(new Animated.Value(-34)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    logEvent('splash.animation_started', { screen: 'splash', action: 'animate' });
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, damping: 11, stiffness: 140, useNativeDriver: true }),
        Animated.timing(markOpacity, { toValue: 1, duration: 230, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(wordX, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(90),
      Animated.timing(screenOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      logEvent('splash.animation_completed', { screen: 'splash', action: 'complete' });
      onDoneRef.current();
    });
  }, []);

  return (
    <Animated.View style={[styles.splash, { opacity: screenOpacity }]}>
      <View style={styles.splashLogo}>
        <Animated.View style={{ opacity: markOpacity, transform: [{ scale }] }}><Image source={require('./assets/zyora-icon.png')} style={styles.splashMark} /></Animated.View>
        <Animated.Text style={[styles.splashWord, { opacity: wordOpacity, transform: [{ translateX: wordX }] }]}>yora</Animated.Text>
      </View>
      <Animated.Text style={[styles.splashTagline, { opacity: wordOpacity }]}>Money, but finally on your side.</Animated.Text>
    </Animated.View>
  );
}

function ProfileLine({ icon, label, value }) {
  return <View style={styles.profileLine}><Ionicons name={icon} size={18} color={colors.purple2} /><Text style={styles.profileLineLabel}>{label}</Text><Text style={styles.profileLineText}>{value}</Text></View>;
}

function ProfileMetric({ label, value }) {
  return <View style={styles.profileMetric}><Text style={styles.profileMetricLabel}>{label}</Text><Text style={styles.profileMetricValue}>{value}</Text></View>;
}

function formatProfileMoney(value, lang) {
  return `${Math.round(value).toLocaleString(lang === 'en' ? 'en-GB' : 'hu-HU')} ${lang === 'en' ? 'HUF' : 'Ft'}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  demoRibbon: { marginHorizontal: 18, marginTop: 4, marginBottom: 4, paddingHorizontal: 10, minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface2, borderRadius: 10 },
  demoRibbonText: { color: colors.purple2, fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  toast: { position: 'absolute', left: 18, right: 18, bottom: 100, minHeight: 52, borderRadius: 17, backgroundColor: '#1B1721F5', borderWidth: 1, borderColor: '#3B3445', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  toastText: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '700' },
  profileHero: { alignItems: 'center', paddingVertical: 7, paddingBottom: 18 },
  profileScrollView: { flexShrink: 1 },
  profileScroll: { paddingBottom: 8 },
  largeAvatar: { width: 76, height: 76, borderRadius: 25, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  largeAvatarText: { color: colors.white, fontSize: 28, fontWeight: '900' },
  profileName: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 11 },
  profileMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#29233D', marginTop: 10 },
  verifiedText: { color: colors.purple2, fontSize: 10.5, fontWeight: '800' },
  profileSection: { color: colors.purple2, fontSize: 10.5, fontWeight: '900', letterSpacing: 1, marginTop: 5, marginBottom: 8 },
  profileInfo: { paddingVertical: 3, paddingHorizontal: 14 },
  profileLine: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
  profileLineLabel: { flex: 1, color: colors.muted, fontSize: 11 },
  profileLineText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  profileMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  profileMetric: { width: '48.7%', minHeight: 74, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 12, justifyContent: 'center' },
  profileMetricLabel: { color: colors.muted, fontSize: 10.5 },
  profileMetricValue: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 4 },
  coverageCard: { marginTop: 10, padding: 14 },
  coverageHead: { flexDirection: 'row', alignItems: 'center' },
  coverageCopy: { flex: 1, paddingLeft: 10 },
  coverageTitle: { color: colors.text, fontSize: 12.5, fontWeight: '900' },
  coverageHint: { color: colors.muted, fontSize: 10.5, lineHeight: 13, marginTop: 3 },
  coverageOptions: { flexDirection: 'row', gap: 7, marginTop: 13 },
  coverageOption: { flex: 1, minHeight: 52, borderRadius: 14, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 6 },
  coverageOptionActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  coverageOptionText: { color: colors.muted, fontSize: 10.5, fontWeight: '800', textAlign: 'center' },
  coverageOptionTextActive: { color: colors.white },
  sheetAction: { marginTop: 12 },
  notificationEmpty: { alignItems: 'center', paddingVertical: 18 },
  notificationIcon: { width: 70, height: 70, borderRadius: 24, backgroundColor: '#2A2345', alignItems: 'center', justifyContent: 'center' },
  notificationTitle: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'center', marginTop: 14 },
  notificationBody: { color: colors.muted, fontSize: 11, lineHeight: 15, textAlign: 'center', maxWidth: 280, marginTop: 6 },
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { flexDirection: 'row', alignItems: 'center' },
  splashMark: { width: 78, height: 78, borderRadius: 24 },
  splashWord: { color: colors.text, fontSize: 61, lineHeight: 70, fontWeight: '900', letterSpacing: -5.3, marginLeft: 7 },
  splashTagline: { color: colors.purple2, fontSize: 11, fontWeight: '700', letterSpacing: 0.1, marginTop: 16 },
});
