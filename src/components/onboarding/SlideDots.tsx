import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';

interface SlideDotsProps {
  count: number;
  activeIndex: number;
}

export function SlideDots({ count, activeIndex }: SlideDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === activeIndex && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
});
