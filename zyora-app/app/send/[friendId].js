import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/AppContext';
import { Button } from '../../src/components/Button';
import { EmptyState } from '../../src/components/EmptyState';
import { Chips, MoneyInput, TextField, digitsToNumber } from '../../src/components/MoneyInput';
import { Avatar, Banner } from '../../src/components/Surface';
import { T } from '../../src/components/Text';
import { friends } from '../../src/data';
import { goalName } from '../../src/features/GoalSheets';
import { coverageFor } from '../../src/finance';
import { formatMoney, groupDigits } from '../../src/format';
import { haptic } from '../../src/haptics';
import { colors, gutter, space } from '../../src/theme';

// The one "delight" beat in the send flow: the confirmation settles in with a
// small spring (rare moment, user-caused), never from scale 0.
function SuccessBody({ children }) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(reduced ? 1 : 0.92);
  useEffect(() => {
    opacity.set(withTiming(1, { duration: 220 }));
    if (!reduced) scale.set(withSpring(1, { duration: 420, dampingRatio: 0.72 }));
  }, [opacity, scale, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get(), transform: [{ scale: scale.get() }] }));
  return <Animated.View style={[styles.successBody, style]}>{children}</Animated.View>;
}

export default function SendAmount() {
  const { friendId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, money, t, sendMoney } = useApp();
  const lang = state.lang;
  const friend = friends.find(item => item.id === friendId);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const [digits, setDigits] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  const [kbOffset, setKbOffset] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 450);
    return () => clearTimeout(timer);
  }, []);

  if (!friend) {
    return <View style={styles.root}><EmptyState icon="person-outline" title={t('send.missing')} action={t('common.back')} onAction={() => router.back()} /></View>;
  }

  const name = lang === 'en' ? friend.nameEn : friend.name;
  const amount = digitsToNumber(digits);
  const cover = coverageFor(amount, state, money);
  const needsCover = amount > 0 && cover.shortBy > 0;
  const blocked = needsCover && !cover.canCover;
  const reserveName = cover.reserve ? goalName(cover.reserve, lang) : '';
  const askFirst = state.overspendRule !== 'emergency';

  function submit() {
    if (!amount || blocked) return;
    const outcome = sendMoney(friend, amount, note);
    if (!outcome.ok) { haptic.error(); return; }
    haptic.success();
    setResult(outcome);
  }

  if (result) {
    return (
      <View style={[styles.root, styles.success, { paddingBottom: insets.bottom + space.xl }]}>
        <Stack.Screen options={{ headerBackVisible: false, title: '', gestureEnabled: false }} />
        <SuccessBody>
          <View style={styles.successIcon}><Ionicons name="checkmark" size={40} color={colors.black} /></View>
          <T variant="title" align="center" style={styles.successTitle}>{t('send.sentTitle')}</T>
          <T variant="largeTitle" tabular align="center">{formatMoney(result.amount, lang)}</T>
          <T variant="subhead" tone="secondary" align="center" style={styles.successLine}>{t('send.sentTo', { name })}</T>
          {result.covered ? <T variant="footnote" tone="warning" align="center" style={styles.successLine}>{t('send.sentCovered', { amount: formatMoney(result.covered, lang), goal: reserveName })}</T> : null}
          <T variant="footnote" tone="tertiary" align="center" style={styles.successDemo}>{t('send.demoNote')}</T>
        </SuccessBody>
        <Button label={t('common.done')} onPress={() => router.dismissTo('/')} style={styles.doneButton} />
      </View>
    );
  }

  const presets = [2000, 5000, 10000, 25000].map(v => ({ value: String(v), label: groupDigits(v, lang) }));
  const cta = !amount ? t('send.ctaEmpty')
    : blocked ? t('send.ctaBlocked')
    : needsCover && askFirst ? t('send.ctaApprove', { amount: formatMoney(amount, lang) })
    : t('send.cta', { amount: formatMoney(amount, lang) });

  return (
    <View
      ref={wrapRef}
      collapsable={false}
      style={styles.root}
      onLayout={() => wrapRef.current?.measureInWindow((x, y) => setKbOffset(y))}
    >
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={kbOffset} style={styles.root}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.recipient}>
            <Avatar label={friend.first.charAt(0)} color={friend.color} size={56} />
            <T variant="headline" style={styles.recipientName}>{name}</T>
          </View>

          <MoneyInput
            ref={inputRef}
            value={digits}
            onChangeText={setDigits}
            lang={lang}
            onSubmitEditing={submit}
            accessibilityLabel={t('send.amountLabel')}
            error={blocked ? t('send.errorBlocked') : null}
            helper={amount && !needsCover ? t('send.after', { amount: formatMoney(money.spendable - amount, lang) }) : t('send.available', { amount: formatMoney(money.spendable, lang) })}
          />
          <View style={styles.presets}><Chips options={presets} selected={digits} onSelect={value => { haptic.selection(); setDigits(value); }} /></View>

          {needsCover && !blocked ? (
            <View style={styles.banner}>
              <Banner
                tone="warning"
                icon="help-buoy-outline"
                title={t('send.coverTitle', { amount: formatMoney(cover.shortBy, lang) })}
                body={askFirst ? t('send.coverAsk', { amount: formatMoney(cover.shortBy, lang), goal: reserveName }) : t('send.coverAuto', { amount: formatMoney(cover.shortBy, lang), goal: reserveName })}
              />
            </View>
          ) : null}

          <TextField label={t('send.noteLabel')} value={note} onChangeText={setNote} placeholder={t('send.notePlaceholder')} maxLength={40} returnKeyType="done" style={styles.note} />
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <Button label={cta} icon={amount && !blocked ? 'paper-plane' : undefined} disabled={!amount || blocked} onPress={submit} />
          <T variant="caption" tone="tertiary" align="center" style={styles.footerNote}>{t('send.demoShort')}</T>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: gutter, paddingBottom: space.xl },
  recipient: { alignItems: 'center', paddingVertical: space.xl },
  recipientName: { marginTop: space.sm },
  presets: { marginTop: space.md },
  banner: { marginTop: space.lg },
  note: { marginTop: space.xl },
  footer: { paddingHorizontal: gutter, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong, backgroundColor: colors.surface },
  footerNote: { marginTop: space.sm },
  success: { justifyContent: 'space-between', paddingHorizontal: gutter },
  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: space.xl },
  successTitle: { marginBottom: space.sm },
  successLine: { marginTop: space.sm, maxWidth: 300 },
  successDemo: { marginTop: space.xl, maxWidth: 280 },
  doneButton: { alignSelf: 'stretch' },
});
