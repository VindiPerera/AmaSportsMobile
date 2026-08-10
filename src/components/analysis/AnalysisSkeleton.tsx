import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

/** A single pulsing placeholder block — building block for every skeleton below. */
function Block({ style }: { style: object }) {
  // Lazy useState init (not useRef) — Animated.Value is mutable and never
  // needs to trigger a re-render itself, but reading `.current` off a ref
  // during render trips the react-hooks/refs rule.
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

/**
 * Loading state for the Cricket Analysis screen — mirrors the real layout
 * (header, stat grid, chart cards) so the screen never looks blank while
 * the first fetch is in flight.
 */
export function AnalysisSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Block style={styles.avatar} />
        <View style={styles.headerText}>
          <Block style={styles.line} />
          <Block style={[styles.line, styles.lineShort]} />
        </View>
      </View>

      <View style={styles.chipsRow}>
        {[0, 1, 2, 3].map((i) => (
          <Block key={i} style={styles.chip} />
        ))}
      </View>

      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Block key={i} style={styles.gridCard} />
        ))}
      </View>

      <Block style={styles.chartCard} />
      <Block style={styles.chartCard} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  block: {
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  line: {
    height: 14,
    width: '60%',
  },
  lineShort: {
    width: '35%',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  chip: {
    width: 64,
    height: 30,
    borderRadius: radius.full,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  gridCard: {
    width: '31%',
    height: 74,
  },
  chartCard: {
    height: 180,
    borderRadius: radius.card,
    marginBottom: spacing.md,
  },
});
