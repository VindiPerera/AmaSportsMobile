import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../../src/theme';

/**
 * Empty placeholder per spec §7 — will later chart the stats captured in
 * the Cricket/Hockey profile tables. Route stays reachable from the tab.
 */
export default function AnalysisScreen() {
  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="stats-chart-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Player Analysis — coming soon</Text>
        <Text style={styles.text}>
          Charts and trends built from your career stats will appear here.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  text: {
    ...typography.bodyMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
