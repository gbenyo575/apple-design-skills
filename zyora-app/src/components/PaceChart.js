import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { groupDigits } from '../format';
import { colors, space } from '../theme';
import { T } from './Text';

// Cumulative spending this month against an even pace to the budget.
// Emphasis form: one accent line (actual) + one gray reference (plan).
export function PaceChart({ points, budget, daysInMonth, lang, labels }) {
  const [width, setWidth] = useState(0);
  const height = 150;
  const padTop = 18;
  const padBottom = 4;
  const last = points[points.length - 1];
  const spent = last?.total || 0;
  const maxY = Math.max(budget, spent, 1) * 1.08;
  const x = day => ((day - 1) / Math.max(1, daysInMonth - 1)) * (width - 8) + 4;
  const y = value => padTop + (1 - value / maxY) * (height - padTop - padBottom);

  const actualPath = points.length
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.day).toFixed(1)},${y(p.total).toFixed(1)}`).join(' ')
    : '';
  const budgetY = y(budget);

  return (
    <View
      accessible
      accessibilityLabel={labels.a11y}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
    >
      <View style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Line x1={0} x2={width} y1={y(0)} y2={y(0)} stroke={colors.hairlineStrong} strokeWidth={1} />
            {budget > 0 ? <Line x1={0} x2={width} y1={budgetY} y2={budgetY} stroke={colors.hairlineStrong} strokeWidth={1} strokeDasharray="2 4" /> : null}
            {budget > 0 ? <Line x1={x(1)} y1={y(0)} x2={x(daysInMonth)} y2={budgetY} stroke={colors.pace} strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" /> : null}
            {actualPath ? <Path d={actualPath} stroke={colors.spendable} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" /> : null}
            {last ? <Circle cx={x(last.day)} cy={y(last.total)} r={5} fill={colors.spendable} stroke={colors.surface} strokeWidth={2} /> : null}
          </Svg>
        ) : null}
        {width > 0 && budget > 0 ? (
          <T variant="caption" tone="tertiary" tabular style={[styles.budgetLabel, { top: Math.max(0, budgetY - 18) }]}>{labels.budget} · {groupDigits(budget, lang)}</T>
        ) : null}
      </View>
      <View style={styles.axis}>
        <T variant="caption" tone="tertiary">{labels.day(1)}</T>
        <T variant="caption" tone="tertiary">{labels.day(Math.ceil(daysInMonth / 2))}</T>
        <T variant="caption" tone="tertiary">{labels.day(daysInMonth)}</T>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.spendable }]} />
          <T variant="caption" tone="secondary">{labels.actual}</T>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatchDashed]} />
          <T variant="caption" tone="secondary">{labels.pace}</T>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  budgetLabel: { position: 'absolute', left: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  legend: { flexDirection: 'row', gap: space.lg, marginTop: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 3, borderRadius: 2 },
  swatchDashed: { width: 14, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.pace },
});
