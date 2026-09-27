import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../AppContext';
import { Card, DemoBadge, ProgressBar, ScreenHeader } from '../components/UI';
import { rewards } from '../data';
import { colors, radii } from '../theme';

export default function LevelsScreen({ showToast }) {
  const { state, t, toggleMission } = useApp();
  const completed = state.missions.filter(item => item.done).length;
  const xpToNext = Math.max(0, 1000 - state.xp);

  function handleMission(mission) {
    toggleMission(mission.id);
    if (!mission.done) showToast(`+${mission.xp} XP · ${t('done')}`);
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <ScreenHeader eyebrow={t('level')} title={t('progressTitle')} />

      <LinearGradient colors={['#6B53F6', '#382582', '#17131F']} locations={[0, 0.6, 1]} style={styles.hero}>
        <View style={styles.orbitOuter}><View style={styles.orbitInner}><Text style={styles.levelNumber}>{state.level}</Text><Text style={styles.levelUnit}>LVL</Text></View><View style={styles.flash}><Ionicons name="flash" size={16} color={colors.white} /></View></View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>MOMENTUM</Text>
          <Text style={styles.heroTitle}>{xpToNext} {t('toLevel')}</Text>
          <Text style={styles.heroBody}>{t('progressHelp')}</Text>
          <ProgressBar value={state.xp / 10} color={colors.purple2} track="#FFFFFF24" height={9} />
          <View style={styles.xpLine}><Text style={styles.xpText}>{state.xp} XP</Text><Text style={styles.xpText}>1000 XP</Text></View>
        </View>
      </LinearGradient>

      <View style={styles.streakRow}>
        <Streak icon="calendar" value={String(completed)} label={state.lang === 'en' ? 'done missions' : 'kész küldetés'} color={colors.orange} />
        <Streak icon="flag" value={String(state.goals.length)} label={state.lang === 'en' ? 'active goals' : 'aktív cél'} color={colors.purple2} />
        <Streak icon="trending-up" value={`${Math.round(state.savingsRate)}%`} label={state.lang === 'en' ? 'savings rate' : 'megtakarítási arány'} color={colors.green} />
      </View>

      <View style={styles.challengeHead}><View><Text style={styles.challengeEyebrow}>{t('dailyMissions')}</Text><Text style={styles.challengeTitle}>{t('earnXp')}</Text></View><View style={styles.challengeCount}><Text style={styles.challengeCountText}>{completed} / {state.missions.length}</Text></View></View>
      <View style={styles.missionList}>
        {state.missions.map((mission, index) => (
          <Pressable key={mission.id} onPress={() => handleMission(mission)} style={({ pressed }) => [styles.mission, mission.done && styles.missionDone, pressed && styles.pressed]}>
            <View style={[styles.missionCheck, mission.done && styles.missionCheckDone]}>{mission.done ? <Ionicons name="checkmark" size={17} color={colors.black} /> : <Text style={styles.missionIndex}>{index + 1}</Text>}</View>
            <View style={styles.missionCopy}><Text style={styles.missionTitle}>{state.lang === 'en' ? (mission.titleEn || mission.title) : mission.title}</Text><Text style={styles.missionSubtitle}>{state.lang === 'en' ? (mission.subtitleEn || mission.subtitle) : mission.subtitle}</Text></View>
            <Text style={[styles.missionXp, mission.done && styles.missionXpDone]}>+{mission.xp} XP</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.unlockHead}><View><Text style={styles.unlockEyebrow}>{state.lang === 'en' ? 'LEVEL MAP' : 'SZINTTÉRKÉP'}</Text><Text style={styles.unlockTitle}>{t('upcoming')}</Text></View></View>
      <View style={styles.rewardPath}>
        <View style={styles.pathLine} />
        {rewards.map(reward => {
          const active = reward.level === (rewards.find(item => item.level > state.level)?.level || rewards[rewards.length - 1].level);
          const unlocked = reward.level <= state.level;
          const distance = Math.max(0, (reward.level - state.level - 1) * 1000 + xpToNext);
          return (
            <Card key={reward.level} style={[styles.rewardCard, active && styles.rewardActive]}>
              <View style={[styles.rewardLevel, { borderColor: reward.accent }, active && { backgroundColor: reward.accent }]}><Text style={[styles.rewardLevelText, active && { color: colors.black }]}>{reward.level}</Text></View>
              <View style={[styles.rewardIcon, { backgroundColor: `${reward.accent}1D` }]}><Ionicons name={reward.icon} size={21} color={reward.accent} /></View>
              <View style={styles.rewardCopy}><Text style={styles.rewardTag}>LVL {reward.level}{unlocked ? (state.lang === 'en' ? ' · REACHED' : ' · ELÉRVE') : active ? (state.lang === 'en' ? ' · NEXT' : ' · KÖVETKEZŐ') : ''}</Text><Text style={styles.rewardName}>{reward.name}</Text><Text style={styles.rewardDetail}>{state.lang === 'en' ? reward.detailEn : reward.detail}</Text></View>
              {unlocked ? <Ionicons name="checkmark-circle-outline" size={18} color={colors.purple2} /> : active ? <Text style={styles.rewardDistance}>+{distance} XP</Text> : <Ionicons name="lock-closed" size={14} color={colors.muted2} />}
            </Card>
          );
        })}
      </View>

      <Card style={styles.rewardNote}><Ionicons name="information-circle-outline" size={18} color={colors.purple2} /><Text style={styles.rewardNoteText}>{state.lang === 'en' ? 'Rewards are MVP concepts; final benefits depend on partner agreements.' : 'A jutalmak MVP-koncepciók; a végleges előnyök partneri megállapodásoktól függnek.'}</Text></Card>
      <DemoBadge />
    </ScrollView>
  );
}

function Streak({ icon, value, label, color }) {
  return <Card style={styles.streak}><Ionicons name={icon} size={21} color={color} /><Text style={styles.streakValue}>{value}</Text><Text style={styles.streakLabel}>{label}</Text></Card>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 125 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  hero: { minHeight: 242, borderRadius: radii.xl, padding: 20, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  orbitOuter: { width: 112, height: 112, borderRadius: 56, borderWidth: 1, borderColor: '#FFFFFF32', alignItems: 'center', justifyContent: 'center' },
  orbitInner: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#100C24', borderWidth: 7, borderColor: colors.purple2, alignItems: 'center', justifyContent: 'center' },
  levelNumber: { color: colors.white, fontSize: 31, fontWeight: '900', lineHeight: 32 },
  levelUnit: { color: colors.purple2, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  flash: { position: 'absolute', right: 2, top: 9, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, paddingLeft: 18 },
  heroEyebrow: { color: colors.purple2, fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: colors.white, fontSize: 20, lineHeight: 24, fontWeight: '900', letterSpacing: -0.7, marginTop: 5 },
  heroBody: { color: '#D6CFF4', fontSize: 11, lineHeight: 14, marginVertical: 9 },
  xpLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xpText: { color: '#D6CFF4', fontSize: 10.5, fontWeight: '700' },
  streakRow: { flexDirection: 'row', gap: 7, marginTop: 11 },
  streak: { flex: 1, padding: 12, alignItems: 'center' },
  streakValue: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 5 },
  streakLabel: { color: colors.muted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  challengeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  challengeEyebrow: { color: colors.purple2, fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  challengeTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 3 },
  challengeCount: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 13, backgroundColor: '#2A2345' },
  challengeCountText: { color: colors.purple2, fontSize: 11, fontWeight: '900' },
  missionList: { gap: 8 },
  mission: { minHeight: 76, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 13, flexDirection: 'row', alignItems: 'center' },
  missionDone: { backgroundColor: '#131E19', borderColor: '#284337' },
  missionCheck: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  missionCheckDone: { backgroundColor: colors.green },
  missionIndex: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  missionCopy: { flex: 1, paddingHorizontal: 11 },
  missionTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  missionSubtitle: { color: colors.muted, fontSize: 10.5, marginTop: 4 },
  missionXp: { color: colors.purple2, fontSize: 11, fontWeight: '900' },
  missionXpDone: { color: colors.green },
  unlockHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 },
  unlockEyebrow: { color: colors.orange, fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  unlockTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 3 },
  mapAction: { color: colors.purple2, fontSize: 11, fontWeight: '900' },
  rewardPath: { position: 'relative', gap: 9 },
  pathLine: { position: 'absolute', left: 34, top: 20, bottom: 20, width: 2, backgroundColor: colors.line },
  rewardCard: { minHeight: 102, flexDirection: 'row', alignItems: 'center', padding: 13 },
  rewardActive: { borderColor: colors.purple, backgroundColor: '#1E1830' },
  rewardLevel: { width: 43, height: 43, borderRadius: 22, backgroundColor: colors.surface2, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  rewardLevelText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  rewardIcon: { width: 39, height: 39, borderRadius: 14, marginLeft: 10, alignItems: 'center', justifyContent: 'center' },
  rewardCopy: { flex: 1, paddingHorizontal: 10 },
  rewardTag: { color: colors.muted2, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  rewardName: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 3 },
  rewardDetail: { color: colors.muted, fontSize: 10.5, lineHeight: 12, marginTop: 3 },
  rewardDistance: { color: colors.purple2, fontSize: 11, fontWeight: '900' },
  rewardNote: { marginTop: 11, flexDirection: 'row', gap: 9, padding: 13 },
  rewardNoteText: { flex: 1, color: colors.muted, fontSize: 10.5, lineHeight: 13 },
});
