import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';

/**
 * Placeholder home/dashboard. This is the landing point after login and the
 * natural home for upcoming modules — performance summaries, team feed,
 * live scores widget, notifications, etc.
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name ?? 'Athlete'}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{user?.role ?? 'student'}</Text>
        </View>
      </View>

      <View style={styles.placeholderCard}>
        <Ionicons name="stats-chart-outline" size={32} color={colors.primary} />
        <Text style={styles.placeholderTitle}>Performance dashboard coming soon</Text>
        <Text style={styles.placeholderText}>
          Sports, teams, analytics, live scores, and notifications will appear here.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.bodyMuted,
  },
  name: {
    ...typography.h2,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  placeholderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  placeholderTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  placeholderText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
});
