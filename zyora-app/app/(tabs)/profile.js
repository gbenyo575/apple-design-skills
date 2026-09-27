import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../../src/AppContext';
import { confirmDestructive } from '../../src/confirm';
import { ProgressBar } from '../../src/components/Progress';
import { TabScreen } from '../../src/components/Screen';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { Sheet } from '../../src/components/Sheet';
import { Avatar, Card, Group, Row, StatusBadge } from '../../src/components/Surface';
import { T } from '../../src/components/Text';
import { useToast } from '../../src/components/Toast';
import { levelName } from '../../src/data';
import { formatMoney } from '../../src/format';
import { haptic } from '../../src/haptics';
import { exportStructuredLogs } from '../../src/services/logger';
import { space } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { state, money, t, profile, setLang, setNotificationPref, resetDemo } = useApp();
  const lang = state.lang;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const prefs = state.notificationPrefs || {};
  const missionsDone = state.missions.filter(m => m.done).length;
  const displayName = lang === 'en' ? profile.nameEn : profile.name;

  function confirmReset() {
    confirmDestructive({
      title: t('profile.resetTitle'),
      message: t('profile.resetBody'),
      cancelLabel: t('common.cancel'),
      confirmLabel: t('profile.resetConfirm'),
      onConfirm: async () => { await resetDemo(); haptic.success(); toast.show(t('profile.resetDone'), 'success'); },
    });
  }

  async function exportLogs() {
    setExporting(true);
    try {
      const result = await exportStructuredLogs();
      toast.show(t('profile.logsExported', { count: result.eventCount }), 'success');
    } catch (error) {
      toast.show(error?.message === 'sharing-unavailable' ? t('profile.logsUnavailable') : t('profile.logsFailed'), 'error');
    } finally {
      setExporting(false);
    }
  }

  const header = (
    <View style={styles.header}>
      <Avatar label={profile.first.charAt(0)} size={72} />
      <T variant="title" style={styles.name}>{displayName}</T>
      <T variant="subhead" tone="secondary">{profile.email}</T>
    </View>
  );

  const toggle = key => value => { haptic.selection(); setNotificationPref(key, value); };

  return (
    <TabScreen header={header}>
      <Card onPress={() => router.push('/levels')} accessibilityLabel={t('profile.levelA11y', { level: state.level })}>
        <View style={styles.levelTop}>
          <View style={styles.flex}>
            <T variant="footnote" tone="secondary">{t('profile.levelLabel')}</T>
            <T variant="headline">{t('profile.level', { level: state.level, name: levelName(state.level, lang) })}</T>
          </View>
          <StatusBadge tone="info" icon="flash" label={`${state.xp} XP`} />
        </View>
        <View style={styles.levelBar}><ProgressBar value={state.xp / 10} height={6} /></View>
        <T variant="footnote" tone="secondary">{t('profile.levelNext', { xp: 1000 - state.xp, level: state.level + 1, done: missionsDone, total: state.missions.length })}</T>
      </Card>

      <Group title={t('profile.moneyGroup')} style={styles.group}>
        <Row icon="cash-outline" iconTone="green" title={t('profile.salary')} value={formatMoney(state.salary, lang)} onPress={() => router.navigate('/plan')} />
        <Row icon="shield-checkmark-outline" iconTone="purple" title={t('profile.savings')} value={`${state.savingsRate}% · ${formatMoney(money.savedTotal, lang)}`} onPress={() => router.navigate('/plan')} />
        <Row icon="git-branch-outline" iconTone="orange" title={t('profile.overspend')} value={state.overspendRule === 'emergency' ? t('profile.overspendEmergency') : t('profile.overspendAsk')} onPress={() => router.navigate('/plan')} />
      </Group>

      <Group title={t('profile.notificationsGroup')} footer={t('profile.notificationsFooter')} style={styles.group}>
        <Row title={t('profile.notifSalary')} switchValue={prefs.salary !== false} onSwitch={toggle('salary')} />
        <Row title={t('profile.notifBudget')} switchValue={prefs.budget !== false} onSwitch={toggle('budget')} />
        <Row title={t('profile.notifGoals')} switchValue={prefs.goals !== false} onSwitch={toggle('goals')} />
        <Row title={t('profile.notifShield')} switchValue={prefs.shield !== false} onSwitch={toggle('shield')} />
      </Group>

      <Group title={t('profile.accountGroup')} style={styles.group}>
        <Row icon="person-outline" title={t('profile.details')} onPress={() => setDetailsOpen(true)} />
        <Row icon="sparkles-outline" iconTone="purple" title="Zyora Pro" accessory={<StatusBadge tone="info" icon={null} label={state.proWaitlist ? t('profile.proWaitlisted') : t('profile.proPreview')} />} onPress={() => router.push('/pro')} />
      </Group>

      <Group title={t('profile.appGroup')} style={styles.group}>
        <View style={styles.languageRow}>
          <T variant="callout" weight="500" style={styles.flex}>{t('profile.language')}</T>
          <SegmentedControl
            style={styles.language}
            value={lang}
            onChange={setLang}
            accessibilityLabel={t('profile.language')}
            options={[{ value: 'hu', label: 'Magyar' }, { value: 'en', label: 'English' }]}
          />
        </View>
        <Row icon="document-text-outline" title={t('profile.exportLogs')} subtitle={t('profile.exportLogsHint')} onPress={exporting ? undefined : exportLogs} chevron={false} />
        <Row icon="refresh-outline" title={t('profile.reset')} destructive onPress={confirmReset} chevron={false} />
      </Group>

      <View style={styles.footer}>
        <T variant="headline" tone="secondary" style={styles.wordmark}>zyora</T>
        <T variant="caption" tone="tertiary" align="center">{t('profile.footer', { version: '0.5.0' })}</T>
      </View>

      <Sheet visible={detailsOpen} onClose={() => setDetailsOpen(false)} title={t('profile.details')} closeLabel={t('common.close')}>
        <Group>
          <Row title={t('profile.fieldName')} value={displayName} />
          <Row title={t('profile.fieldEmail')} value={profile.email} />
          <Row title={t('profile.fieldPhone')} value={profile.phone} />
        </Group>
        <T variant="footnote" tone="tertiary" style={styles.detailsNote}>{t('profile.detailsNote')}</T>
      </Sheet>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: 'center', paddingTop: space.xl, paddingBottom: space.xxl },
  name: { marginTop: space.md },
  levelTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  levelBar: { marginTop: space.md, marginBottom: space.sm },
  group: { marginTop: space.xxl },
  languageRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 56 },
  language: { width: 190 },
  footer: { alignItems: 'center', marginTop: space.xxxl, gap: 2 },
  wordmark: { letterSpacing: -0.6, fontWeight: '800' },
  detailsNote: { marginTop: space.md, marginHorizontal: space.xs },
});
