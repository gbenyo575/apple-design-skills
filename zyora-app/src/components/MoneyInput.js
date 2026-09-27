import React, { forwardRef, useId, useState } from 'react';
import { InputAccessoryView, Keyboard, Platform, StyleSheet, TextInput, View } from 'react-native';
import { currencyLabel, groupDigits } from '../format';
import { colors, radii, space, type } from '../theme';
import { PressableScale } from './Pressable';
import { T } from './Text';

export const toDigits = text => String(text ?? '').replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9);
export const digitsToNumber = digits => Number(toDigits(digits)) || 0;

// Amount entry: grouped digits as you type ("612 400"), currency suffix,
// inline error/helper text. On iOS the number pad has no return key, so a
// screen-level input gets a "Done" bar; inside sheets the pinned primary
// button sits directly above the keyboard instead.
export const MoneyInput = forwardRef(function MoneyInput(
  { value, onChangeText, label, lang = 'hu', error, helper, size = 'lg', autoFocus, onSubmitEditing, doneLabel, onFocus, onBlur, accessibilityLabel, style },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const accessoryId = `money-${useId()}`;
  const hasDone = Platform.OS === 'ios' && Boolean(doneLabel);
  const borderColor = error ? colors.red : focused ? colors.purple : colors.hairlineStrong;
  return (
    <View style={style}>
      {label ? <T variant="footnote" tone="secondary" weight="500" style={styles.label}>{label}</T> : null}
      <View style={[styles.field, size === 'lg' ? styles.fieldLg : styles.fieldMd, { borderColor }]}>
        <TextInput
          ref={ref}
          value={toDigits(value) ? groupDigits(toDigits(value), lang) : ''}
          onChangeText={text => onChangeText(toDigits(text))}
          keyboardType="number-pad"
          returnKeyType="done"
          autoFocus={autoFocus}
          selectTextOnFocus
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          onFocus={event => { setFocused(true); onFocus?.(event); }}
          onBlur={event => { setFocused(false); onBlur?.(event); }}
          onSubmitEditing={onSubmitEditing}
          inputAccessoryViewID={hasDone ? accessoryId : undefined}
          accessibilityLabel={accessibilityLabel || label}
          maxFontSizeMultiplier={1.3}
          style={[styles.input, size === 'lg' ? styles.inputLg : styles.inputMd]}
        />
        <T variant={size === 'lg' ? 'title' : 'headline'} tone="secondary" style={styles.currency}>{currencyLabel(lang)}</T>
      </View>
      {error ? <T variant="footnote" tone="negative" style={styles.message} accessibilityLiveRegion="polite">{error}</T>
        : helper ? <T variant="footnote" tone="secondary" style={styles.message}>{helper}</T> : null}
      {hasDone ? (
        <InputAccessoryView nativeID={accessoryId} backgroundColor={colors.surface2}>
          <View style={styles.accessory}>
            <PressableScale onPress={() => { Keyboard.dismiss(); onSubmitEditing?.(); }} style={styles.doneButton} accessibilityLabel={doneLabel}>
              <T variant="callout" tone="accent" weight="600">{doneLabel}</T>
            </PressableScale>
          </View>
        </InputAccessoryView>
      ) : null}
    </View>
  );
});

export function Chips({ options, onSelect, selected }) {
  return (
    <View style={styles.chips}>
      {options.map(option => {
        const active = selected === option.value;
        return (
          <PressableScale key={option.key ?? option.value} onPress={() => onSelect(option.value)} style={[styles.chip, active && styles.chipActive]} accessibilityState={{ selected: active }}>
            <T variant="footnote" weight="600" tone={active ? 'primary' : 'secondary'} tabular numberOfLines={1}>{option.label}</T>
          </PressableScale>
        );
      })}
    </View>
  );
}

export const TextField = forwardRef(function TextField({ label, error, style, inputStyle, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      {label ? <T variant="footnote" tone="secondary" weight="500" style={styles.label}>{label}</T> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textTertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxFontSizeMultiplier={1.4}
        accessibilityLabel={rest.accessibilityLabel || label}
        style={[styles.textInput, { borderColor: error ? colors.red : focused ? colors.purple : colors.hairlineStrong }, inputStyle]}
        {...rest}
      />
      {error ? <T variant="footnote" tone="negative" style={styles.message}>{error}</T> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { marginBottom: space.sm, marginLeft: 2 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: radii.md, borderWidth: 1.5, paddingHorizontal: space.lg },
  fieldLg: { height: 68 },
  fieldMd: { height: 54 },
  input: { flex: 1, minWidth: 0, outlineWidth: 0, color: colors.text, fontVariant: ['tabular-nums'], paddingVertical: 0 },
  inputLg: { ...type.largeTitle, lineHeight: undefined },
  inputMd: { ...type.title, lineHeight: undefined },
  currency: { marginLeft: space.sm },
  message: { marginTop: space.sm, marginLeft: 2 },
  accessory: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.lg, paddingVertical: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong },
  doneButton: { paddingHorizontal: space.sm, paddingVertical: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.hairlineStrong, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.purpleTintStrong, borderColor: colors.purple },
  textInput: { outlineWidth: 0, height: 54, borderRadius: radii.md, borderWidth: 1.5, backgroundColor: colors.surface2, paddingHorizontal: space.lg, color: colors.text, ...type.body, lineHeight: undefined },
});
