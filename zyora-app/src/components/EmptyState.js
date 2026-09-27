import React from 'react';
import { StyleSheet, View } from 'react-native';
import { space } from '../theme';
import { Button } from './Button';
import { IconTile } from './Surface';
import { T } from './Text';

export function EmptyState({ icon, title, body, action, onAction, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <IconTile icon={icon} tone="purple" size={56} />
      <T variant="headline" align="center" style={styles.title}>{title}</T>
      {body ? <T variant="subhead" tone="secondary" align="center" style={styles.body}>{body}</T> : null}
      {action ? <Button label={action} onPress={onAction} variant="tinted" size="md" style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.xl },
  title: { marginTop: space.lg },
  body: { marginTop: space.xs, maxWidth: 300 },
  action: { marginTop: space.xl },
});
