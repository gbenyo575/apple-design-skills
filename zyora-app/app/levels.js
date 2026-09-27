import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../src/AppContext';
import { ProgressBar, ProgressRing } from '../src/components/Progress';
import { PressableRow } from '../src/components/Pressable';
import { StackScreen } from '../src/components/Screen';
import { Card, Group, Row, SectionHeader, StatusBadge } from '../src/components/Surface';
import { T } from '../src/components/Text';
import { useToast } from '../src/components/Toast';
import { levelName, rewards } from '../src/data';
import { formatMoney } from '../src/format';
import { haptic } from '../src/haptics';
import { colors, radii, space } from '../src/theme';

// Progress supports the money habits — it never competes with the money.
export default function LevelsScreen() {
  const toast = useToast();
  const { state, money, month, t, toggleMission } = useApp();
  const lang = state.lang;
  const done = state.missions.filter(m => m.done).length;
  const todaySpent = state.transactions
    .filter(tx => tx.amount < 0 && tx.kind !== 'goal' && new Date(tx.date).toDateString() === new Date().toDateString())
    .reduce((s, tx) => s - tx.amount, 0);

  function onMission(mission) {
    const result = toggleMission(mission.id);
    if (!result) return;
    if (result.done) {
      haptic.success();
      toast.show(result.leveledUp ? t('levels.levelUp', { level: result.leveledUp }) : t('levels.missionDone', { xp: result.xp }), 'success', { offset: 'none' });
    } else {
      haptic.light();
    }
  }

  const missionSubtitle = mission => {
    if (mission.id === 'budget') return t('levels.budgetMission', { spent: formatMoney(todaySpent, lang), daily: formatMoney(money.daily, lang) });
    return lang === 'en' ? mission.subtitleEn || mission.subtitle : mission.subtitle;
  };

  return (
    <StackScreen>
      <View style={styles.hero}>
        <ProgressRing value={state.xp / 10} size={132} stroke={10} color={colors.purple}>
          <T variant="caption" tone="secondary">{t('levels.levelWord')}</T>
          <T variant="largeTitle" tabular>{state.level}</T>
        </ProgressRing>
        <T variant="title" style={styles.heroTitle}>{levelName(state.level, lang)}</T>
        <T variant="subhead" tone="secondary" align="center">{t('levels.toNext', { xp: 1000 - state.xp, level: state.level + 1 })}</T>
        <T variant="footnote" tone="tertiary" align="center" style={styles.why}>{t('levels.why')}</T>
      </View>

      <SectionHeader title={t('levels.missionsTitle')} action={`${done}/${state.missions.length}`} />
      <View style={styles.group}>
        {state.missions.map((mission, index) => (
          <React.Fragment key={mission.id}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <PressableRow onPress={() => onMission(mission)} accessibilityRole="checkbox" accessibilityState={{ checked: mission.done }} style={styles.mission}>
              <View style={[styles.check, mission.done && styles.checkDone]}>
                {mission.done ? <Ionicons name="checkmark" size={16} color={colors.black} /> : null}
              </View>
              <View style={styles.flex}>
                <T variant="callout" weight="500" tone={mission.done ? 'secondary' : 'primary'}>{lang === 'en' ? mission.titleEn : mission.title}</T>
                <T variant="footnote" tone="tertiary">{missionSubtitle(mission)}</T>
              </View>
              <T variant="footnote" weight="600" tone={mission.done ? 'positive' : 'accent'}>+{mission.xp} XP</T>
            </PressableRow>
          </React.Fragment>
        ))}
      </View>

      <SectionHeader title={t('levels.feeTitle')} />
      <Card>
        <View style={styles.feeTop}>
          <T variant="headline" style={styles.flex}>{month.feeFreeEligible ? t('levels.feeEarned') : t('levels.feeProgress', { done: month.completedCriteria, total: month.criteria.length })}</T>
          <StatusBadge tone={month.feeFreeEligible ? 'good' : 'info'} icon={month.feeFreeEligible ? undefined : null} label={month.feeFreeEligible ? t('levels.feeFree') : t('levels.concept')} />
        </View>
        <View style={styles.feeBar}><ProgressBar value={month.feeFreeProgress} color={month.feeFreeEligible ? colors.protected : colors.purple} height={6} /></View>
        {month.criteria.map(item => (
          <View key={item.id} style={styles.criterion}>
            <Ionicons name={item.done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.done ? colors.green : colors.textTertiary} />
            <T variant="subhead" tone={item.done ? 'primary' : 'secondary'} style={styles.flex}>{t(`levels.criteria.${item.id}`)}</T>
          </View>
        ))}
        <T variant="footnote" tone="tertiary" style={styles.feeNote}>{t('levels.feeNote')}</T>
      </Card>

      <Group title={t('levels.rewardsTitle')} footer={t('levels.rewardsNote')} style={styles.rewards}>
        {rewards.map(reward => {
          const unlocked = reward.level <= state.level;
          return (
            <Row
              key={reward.level}
              icon={reward.icon}
              iconTone={unlocked ? 'purple' : 'neutral'}
              title={lang === 'en' ? reward.nameEn : reward.name}
              subtitle={lang === 'en' ? reward.detailEn : reward.detail}
              accessory={unlocked
                ? <StatusBadge tone="good" label={t('levels.unlocked')} />
                : <View style={styles.lock}><Ionicons name="lock-closed" size={12} color={colors.textTertiary} /><T variant="caption" tone="tertiary">{t('levels.levelShort', { level: reward.level })}</T></View>}
            />
          );
        })}
      </Group>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center', paddingTop: space.md },
  heroTitle: { marginTop: space.lg, marginBottom: space.xs },
  why: { marginTop: space.md, maxWidth: 300 },
  group: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineStrong, marginLeft: 56 },
  mission: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 64 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.textTertiary, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.green, borderColor: colors.green },
  feeTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  feeBar: { marginTop: space.md, marginBottom: space.sm },
  criterion: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  feeNote: { marginTop: space.sm },
  rewards: { marginTop: space.xxxl },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
