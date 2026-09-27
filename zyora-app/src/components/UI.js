import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatMoney, useApp } from '../AppContext';
import { colors, radii, shadow } from '../theme';

export function Card({ children, style, onPress }) {
  if (onPress) return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>{children}</Pressable>;
  return <View style={[styles.card, style]}>{children}</View>;
}

export function BrandHeader({ onProfile, onNotifications }) {
  const { state } = useApp();
  const firstName = (state.profile?.fullName || 'Tesztelő').split(' · ')[0].split(' ')[0];
  return (
    <View style={styles.brandHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel={state.lang === 'en' ? 'Open profile' : 'Profil megnyitása'} onPress={onProfile} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}><Text style={styles.avatarText}>B</Text></Pressable>
      <View style={styles.brandCopy}><Text style={styles.hello}>{state.lang === 'en' ? `Hi, ${firstName}` : `Szia, ${firstName}`} 👋</Text><Text style={styles.wordmark}>zyora</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={state.lang === 'en' ? 'Notifications' : 'Értesítések'} onPress={onNotifications} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <Ionicons name="notifications-outline" size={21} color={colors.text} />
      </Pressable>
    </View>
  );
}

export function ScreenHeader({ eyebrow, title, onBack, right }) {
  return (
    <View style={styles.screenHeader}>
      {onBack ? <Pressable onPress={onBack} style={styles.backButton}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable> : <View style={styles.headerSpacer} />}
      <View style={styles.screenHeaderCopy}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.screenTitle}>{title}</Text></View>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View><Text style={styles.sectionTitle}>{title}</Text>{subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}</View>
      {action ? <Pressable onPress={onAction} hitSlop={10}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function ProgressBar({ value, color = colors.purple, track = colors.surface3, height = 8 }) {
  const pct = Math.max(0, Math.min(100, value));
  return <View style={[styles.progressTrack, { backgroundColor: track, height }]}><View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} /></View>;
}

export function PrimaryButton({ label, onPress, icon = 'arrow-forward', secondary = false, disabled = false, style }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, secondary && styles.secondaryButton, disabled && styles.disabled, pressed && styles.pressed, style]}>
      <Text style={[styles.primaryButtonText, secondary && styles.secondaryButtonText]}>{label}</Text>
      {icon ? <Ionicons name={icon} size={18} color={secondary ? colors.text : colors.white} /> : null}
    </Pressable>
  );
}

export function TransactionRow({ item, onPress }) {
  const { state } = useApp();
  const merchant = state.lang === 'en' ? (item.merchantEn || item.merchant) : item.merchant;
  const category = state.lang === 'en' ? (item.categoryEn || item.category) : item.category;
  const date = state.lang === 'en' ? (item.dateEn || item.date) : item.date;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.transaction, pressed && styles.pressed]}>
      <View style={[styles.merchantIcon, { backgroundColor: `${item.color}22` }]}><Ionicons name={item.icon} size={20} color={item.color} /></View>
      <View style={styles.txCopy}><Text style={styles.txMerchant} numberOfLines={1}>{merchant}</Text><Text style={styles.txMeta}>{category} · {date}</Text></View>
      <Text style={[styles.txAmount, item.amount > 0 && styles.txIncome]}>{formatMoney(item.amount, state.lang, true)}</Text>
    </Pressable>
  );
}

export function DemoBadge() {
  const { t } = useApp();
  return <View style={styles.demoBadge}><View style={styles.demoDot} /><Text style={styles.demoText}>{t('demoBadge')}</Text></View>;
}

export function BottomTabs({ active, onChange }) {
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const tabs = [
    { id: 'home', icon: 'home-outline', activeIcon: 'home', label: t('home') },
    { id: 'split', icon: 'sparkles-outline', activeIcon: 'sparkles', label: t('split') },
    { id: 'goals', icon: 'flag-outline', activeIcon: 'flag', label: t('goals') },
    { id: 'levels', icon: 'trophy-outline', activeIcon: 'trophy', label: t('levels') },
    { id: 'more', icon: 'grid-outline', activeIcon: 'grid', label: t('more') },
  ];
  return (
    <View style={[styles.tabBar, { height: 63 + Math.max(12, insets.bottom), paddingBottom: Math.max(12, insets.bottom) }]}>
      {tabs.map(tab => {
        const selected = active === tab.id;
        return (
          <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(tab.id)} style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
            <View style={[styles.tabIconWrap, selected && styles.tabIconActive]}><Ionicons name={selected ? tab.activeIcon : tab.icon} size={20} color={selected ? colors.purple2 : colors.muted2} /></View>
            <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function BottomSheet({ visible, onClose, title, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(22, insets.bottom + 10) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{title}</Text><Pressable onPress={onClose} style={styles.sheetClose}><Ionicons name="close" size={20} color={colors.text} /></Pressable></View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SavingsSlider({ value, onChange, min = 5, max = 40 }) {
  const { state } = useApp();
  const pct = Math.max(0, Math.min(100, (value - min) / (max - min) * 100));
  return (
    <View style={styles.sliderWrap}>
      <View style={styles.sliderLabels}><Text style={styles.sliderLimit}>5%</Text><Text style={styles.sliderLimit}>40%</Text></View>
      <View style={styles.sliderTouch}>
        <View pointerEvents="none" style={[styles.sliderBubble, { left: `${Math.max(8, Math.min(92, pct))}%` }]}><Text style={styles.sliderBubbleText}>{Math.round(value)}%</Text></View>
        <Slider accessibilityLabel={state.lang === 'en' ? 'Savings rate' : 'Megtakarítás mértéke'}
          style={styles.nativeSlider}
          minimumValue={min}
          maximumValue={max}
          step={1}
          value={value}
          onValueChange={onChange}
          minimumTrackTintColor={colors.purple}
          maximumTrackTintColor={colors.surface3}
          thumbTintColor={colors.purple2}
          tapToSeek
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radii.lg, padding: 18 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  brandHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 18 },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center', ...shadow },
  avatarText: { color: colors.white, fontSize: 17, fontWeight: '900' },
  brandCopy: { flex: 1, paddingLeft: 12 },
  hello: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  wordmark: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: -1 },
  iconButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.purple2, borderWidth: 1.5, borderColor: colors.surface2 },
  screenHeader: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 4 },
  screenHeaderCopy: { flex: 1, paddingHorizontal: 10 },
  eyebrow: { color: colors.purple2, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  screenTitle: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  headerRight: { minWidth: 40, alignItems: 'flex-end' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 25, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  sectionSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  sectionAction: { color: colors.purple2, fontSize: 12, fontWeight: '800' },
  progressTrack: { width: '100%', borderRadius: radii.pill, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radii.pill },
  primaryButton: { minHeight: 52, borderRadius: 17, paddingHorizontal: 18, backgroundColor: colors.purple3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '900' },
  secondaryButton: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  secondaryButtonText: { color: colors.text },
  disabled: { opacity: 0.38 },
  transaction: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 10 },
  merchantIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txCopy: { flex: 1, paddingHorizontal: 12 },
  txMerchant: { color: colors.text, fontSize: 14, fontWeight: '800' },
  txMeta: { color: colors.muted, fontSize: 10.5, marginTop: 3 },
  txAmount: { color: colors.text, fontSize: 13, fontWeight: '800' },
  txIncome: { color: colors.green },
  demoBadge: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, marginVertical: 16 },
  demoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  demoText: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10, flexDirection: 'row', backgroundColor: '#121016F5', borderTopWidth: 1, borderTopColor: colors.line },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabIconWrap: { width: 39, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  tabIconActive: { backgroundColor: '#2A2345' },
  tabLabel: { color: colors.muted2, fontSize: 9.5, fontWeight: '700' },
  tabLabelActive: { color: colors.purple2 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000AA' },
  sheet: { maxHeight: '88%', backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 22, borderWidth: 1, borderColor: colors.line },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: colors.line, marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 17 },
  sheetTitle: { flex: 1, color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.6 },
  sheetClose: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  sliderWrap: { paddingTop: 2 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  sliderLimit: { color: colors.muted2, fontSize: 9, fontWeight: '700' },
  sliderTouch: { height: 60, justifyContent: 'flex-end' },
  nativeSlider: { width: '100%', height: 36 },
  sliderBubble: { position: 'absolute', top: 0, marginLeft: -24, width: 48, height: 29, borderRadius: 11, backgroundColor: colors.purple2, alignItems: 'center', justifyContent: 'center', zIndex: 2, ...shadow },
  sliderBubbleText: { color: colors.black, fontSize: 11, fontWeight: '900' },
});
