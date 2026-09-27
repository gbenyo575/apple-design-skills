import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../src/AppContext';
import { Button } from '../src/components/Button';
import { StackScreen } from '../src/components/Screen';
import { StatusBadge } from '../src/components/Surface';
import { T } from '../src/components/Text';
import { useToast } from '../src/components/Toast';
import { haptic } from '../src/haptics';
import { colors, radii, space } from '../src/theme';

// Pro reads as "the same app, further ahead" — a clear Free vs Pro table and
// an honest waitlist, not a paywall.
const FEATURES = [
  { key: 'spendable', free: true },
  { key: 'goals', free: true },
  { key: 'stats', free: true },
  { key: 'forecast', free: false },
  { key: 'rules', free: false },
  { key: 'accounts', free: false },
  { key: 'copilot', free: false },
];

export default function ProScreen() {
  const toast = useToast();
  const { state, t, joinProWaitlist } = useApp();

  function join() {
    joinProWaitlist();
    haptic.success();
    toast.show(t('pro.joinedToast'), 'success', { offset: 'none' });
  }

  return (
    <StackScreen>
      <View style={styles.hero}>
        <StatusBadge tone="info" icon="sparkles" label={t('pro.badge')} />
        <T variant="largeTitle" style={styles.title}>{t('pro.headline')}</T>
        <T variant="body" tone="secondary">{t('pro.body')}</T>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHead]}>
          <T variant="footnote" tone="secondary" weight="600" style={styles.feature}>{t('pro.feature')}</T>
          <T variant="footnote" tone="secondary" weight="600" style={styles.col} align="center">{t('pro.free')}</T>
          <T variant="footnote" tone="accent" weight="700" style={styles.col} align="center">Pro</T>
        </View>
        {FEATURES.map(feature => (
          <View key={feature.key} style={styles.tableRow} accessible accessibilityLabel={`${t(`pro.f.${feature.key}`)}: ${feature.free ? t('pro.a11yBoth') : t('pro.a11yProOnly')}`}>
            <View style={styles.feature}>
              <T variant="subhead" weight="500">{t(`pro.f.${feature.key}`)}</T>
              {!feature.free ? <T variant="caption" tone="tertiary" style={styles.featureHint}>{t(`pro.h.${feature.key}`)}</T> : null}
            </View>
            <View style={styles.col}>{feature.free ? <Ionicons name="checkmark" size={18} color={colors.textSecondary} /> : <T variant="subhead" tone="tertiary">–</T>}</View>
            <View style={styles.col}><Ionicons name="checkmark" size={18} color={colors.purpleLight} /></View>
          </View>
        ))}
      </View>

      <Button
        label={state.proWaitlist ? t('pro.joined') : t('pro.join')}
        icon={state.proWaitlist ? 'checkmark' : 'notifications-outline'}
        variant={state.proWaitlist ? 'secondary' : 'primary'}
        disabled={state.proWaitlist}
        onPress={join}
        style={styles.cta}
      />
      <T variant="footnote" tone="tertiary" align="center" style={styles.note}>{t('pro.note')}</T>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: space.sm, paddingTop: space.sm },
  title: { marginTop: space.sm },
  table: { marginTop: space.xxl, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong, minHeight: 52 },
  tableHead: { borderTopWidth: 0, backgroundColor: colors.surface2, minHeight: 40 },
  feature: { flex: 1, paddingRight: space.sm },
  featureHint: { marginTop: 2 },
  col: { width: 52, alignItems: 'center' },
  cta: { marginTop: space.xxl },
  note: { marginTop: space.md },
});
