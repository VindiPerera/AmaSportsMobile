import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { sportIconFor } from '../../constants/sportIcons';

interface ComingSoonAnalysisProps {
  /** Omit both to render a generic, sport-agnostic placeholder — used by the
   * top-level Analysis tab, which no longer reads the player's registered
   * sports to decide what to show (see analysis.tsx). */
  sportName?: string;
  sportSlug?: string;
}

/**
 * Fallback body the generic Analysis shell renders for every sport that
 * doesn't have its own analysis component yet — registering a real one
 * later (see analysis.tsx's SPORT_ANALYSIS_COMPONENTS map) is all that's
 * needed to replace this per sport, no shell/navigation changes required.
 */
export function ComingSoonAnalysis({ sportName, sportSlug }: ComingSoonAnalysisProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <Ionicons name={sportSlug ? sportIconFor(sportSlug) : 'analytics-outline'} size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>{sportName ? `${sportName} Analytics` : 'Analytics'}</Text>
        <View style={styles.badge}>
          <Ionicons name="time-outline" size={12} color={colors.primary} />
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
        <Text style={styles.text}>
          Interactive charts and detailed performance insights for your
          {sportName ? ` ${sportName} career stats` : ' career stats'} will arrive in an upcoming update.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    padding: spacing.xl,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  text: {
    ...typography.bodyMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    maxWidth: 280,
  },
});
