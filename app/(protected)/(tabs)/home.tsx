import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';

/**
 * Landing point after login. Shows a "complete your player profile" nudge
 * until the player has added at least one sport (spec §4) — other tabs stay
 * reachable the whole time, this is just a prompt, not a hard gate.
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [hasSports, setHasSports] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      playerService
        .fetchSports()
        .then((sports) => setHasSports(sports.length > 0))
        .catch(() => setHasSports(null));
    }, [])
  );

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll>
      <LinearGradient
        colors={colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, shadows.md]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name ?? 'Athlete'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user?.role ?? 'student'}</Text>
          </View>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStatsRow}>
          <HeroStat icon="flame-outline" label="Streak" value="—" />
          <HeroStat icon="stats-chart-outline" label="Sessions" value="—" />
          <HeroStat icon="trophy-outline" label="Rank" value="—" />
        </View>
      </LinearGradient>

      {hasSports === false ? (
        <Pressable
          style={({ pressed }) => [styles.ctaCard, pressed && styles.ctaCardPressed]}
          onPress={() => router.push('/(protected)/(tabs)/player-profile')}
        >
          <View style={styles.placeholderIconWrapper}>
            <Ionicons name="person-add-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.placeholderTitle}>Complete your player profile</Text>
          <Text style={styles.placeholderText}>
            Add a sport and fill in your career stats so coaches and teams can find you.
          </Text>
          <View style={styles.ctaButtonRow}>
            <Text style={styles.ctaButtonText}>Get started</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </View>
        </Pressable>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Coming Up</Text>
          <View style={styles.placeholderCard}>
            <View style={styles.placeholderIconWrapper}>
              <Ionicons name="stats-chart-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.placeholderTitle}>Performance dashboard coming soon</Text>
            <Text style={styles.placeholderText}>
              Teams, analytics, live scores, and notifications will appear here.
            </Text>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.heroStat}>
      <Ionicons name={icon} size={18} color={colors.white} style={styles.heroStatIcon} />
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextBlock: {
    flex: 1,
  },
  greeting: {
    ...typography.body,
    color: 'rgba(255,255,255,0.75)',
  },
  name: {
    ...typography.h2,
    color: colors.white,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginVertical: spacing.lg,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStat: {
    alignItems: 'flex-start',
  },
  heroStatIcon: {
    marginBottom: spacing.xs,
  },
  heroStatValue: {
    ...typography.h3,
    color: colors.white,
  },
  heroStatLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionLabel: {
    ...typography.overline,
    marginBottom: spacing.md,
  },
  placeholderCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  placeholderIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  placeholderTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  placeholderText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  ctaCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  ctaCardPressed: {
    opacity: 0.9,
  },
  ctaButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  ctaButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
});
