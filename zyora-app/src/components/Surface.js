import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { colors, radii, space } from '../theme';
import { PressableRow, PressableScale } from './Pressable';
import { T } from './Text';

// A card groups things that belong together. It is not a default wrapper.
export function Card({ children, style, onPress, accessibilityLabel }) {
  if (onPress) {
    return <PressableScale onPress={onPress} scale={0.985} accessibilityLabel={accessibilityLabel} style={[styles.card, style]}>{children}</PressableScale>;
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, action, onAction, style }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <T variant="title" accessibilityRole="header" style={styles.sectionTitle}>{title}</T>
      {action ? (
        <PressableScale onPress={onAction} hitSlop={12} accessibilityLabel={action}>
          <T variant="subhead" tone="accent" weight="600">{action}</T>
        </PressableScale>
      ) : null}
    </View>
  );
}

// iOS-style inset grouped list: one surface, hairline separators, rows inside.
export function Group({ title, footer, children, style }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={style}>
      {title ? <T variant="footnote" tone="secondary" weight="600" style={styles.groupTitle}>{title}</T> : null}
      <View style={styles.group}>
        {rows.map((child, index) => (
          <React.Fragment key={child.key ?? index}>
            {index > 0 ? <View style={styles.separator} /> : null}
            {child}
          </React.Fragment>
        ))}
      </View>
      {footer ? <T variant="footnote" tone="tertiary" style={styles.groupFooter}>{footer}</T> : null}
    </View>
  );
}

export function IconTile({ icon, tone = 'neutral', size = 36, emoji }) {
  const palette = {
    neutral: [colors.surface3, colors.textSecondary],
    purple: [colors.purpleTint, colors.purpleLight],
    green: [colors.greenTint, colors.green],
    red: [colors.redTint, colors.red],
    orange: [colors.orangeTint, colors.orange],
    blue: [colors.blueTint, colors.blue],
  }[tone] || [colors.surface3, colors.textSecondary];
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: palette[0] }]}>
      {emoji ? <T style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>{emoji}</T> : <Ionicons name={icon} size={size * 0.52} color={palette[1]} />}
    </View>
  );
}

// A row in a Group. Shows a chevron only when it navigates somewhere.
export function Row({ icon, iconTone, emoji, title, subtitle, value, valueTone = 'secondary', onPress, chevron, accessory, destructive, switchValue, onSwitch, accessibilityLabel }) {
  const content = (
    <View style={styles.row}>
      {icon || emoji ? <IconTile icon={icon} emoji={emoji} tone={destructive ? 'red' : iconTone} size={32} /> : null}
      <View style={styles.rowCopy}>
        <T variant="callout" weight="500" tone={destructive ? 'negative' : 'primary'} numberOfLines={2}>{title}</T>
        {subtitle ? <T variant="footnote" tone="secondary" style={styles.rowSubtitle}>{subtitle}</T> : null}
      </View>
      {value != null ? <T variant="subhead" tone={valueTone} tabular style={styles.rowValue} numberOfLines={1}>{value}</T> : null}
      {accessory}
      {onSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitch}
          trackColor={{ false: colors.surface3, true: colors.purpleFill }}
          thumbColor={colors.white}
          activeThumbColor={colors.white}
          ios_backgroundColor={colors.surface3}
          accessibilityLabel={title}
        />
      ) : null}
      {onPress && chevron !== false ? <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} /> : null}
    </View>
  );
  if (!onPress) return <View accessible={!onSwitch} accessibilityLabel={accessibilityLabel}>{content}</View>;
  return <PressableRow onPress={onPress} accessibilityLabel={accessibilityLabel || title}>{content}</PressableRow>;
}

const badgeTones = {
  good: [colors.greenTint, colors.green, 'checkmark-circle'],
  warning: [colors.orangeTint, colors.orange, 'alert-circle'],
  critical: [colors.redTint, colors.red, 'close-circle'],
  info: [colors.purpleTint, colors.purpleLight, 'information-circle'],
  neutral: [colors.surface3, colors.textSecondary, null],
};

// Status always pairs colour with an icon and a word.
export function StatusBadge({ tone = 'neutral', label, icon }) {
  const [bg, fg, defaultIcon] = badgeTones[tone];
  const name = icon === undefined ? defaultIcon : icon;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {name ? <Ionicons name={name} size={13} color={fg} /> : null}
      <T variant="caption" weight="600" style={{ color: fg }}>{label}</T>
    </View>
  );
}

export function Avatar({ label, color = colors.purpleFill, size = 44 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <T variant={size > 56 ? 'title' : 'headline'} tone="inverse" style={size <= 36 && { fontSize: 14 }}>{label}</T>
    </View>
  );
}

export function Banner({ tone = 'warning', icon, title, body, action, onAction }) {
  const [bg, fg] = badgeTones[tone];
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Ionicons name={icon || badgeTones[tone][2] || 'information-circle'} size={20} color={fg} style={styles.bannerIcon} />
      <View style={styles.bannerCopy}>
        {title ? <T variant="subhead" weight="600">{title}</T> : null}
        {body ? <T variant="footnote" tone="secondary" style={title && styles.bannerBody}>{body}</T> : null}
        {action ? (
          <PressableScale onPress={onAction} hitSlop={10} style={styles.bannerAction}>
            <T variant="footnote" weight="600" style={{ color: fg }}>{action}</T>
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: space.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.xxxl, marginBottom: space.md },
  sectionTitle: { flexShrink: 1 },
  groupTitle: { marginLeft: space.lg, marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 },
  group: { backgroundColor: colors.surface, borderRadius: radii.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  groupFooter: { marginHorizontal: space.lg, marginTop: space.sm },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineStrong, marginLeft: space.lg },
  tile: { alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: 10 },
  rowCopy: { flex: 1 },
  rowSubtitle: { marginTop: 2 },
  rowValue: { maxWidth: '48%', textAlign: 'right' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radii.lg },
  bannerIcon: { marginTop: 1 },
  bannerCopy: { flex: 1 },
  bannerBody: { marginTop: 3 },
  bannerAction: { marginTop: space.sm, alignSelf: 'flex-start' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineStrong },
});
