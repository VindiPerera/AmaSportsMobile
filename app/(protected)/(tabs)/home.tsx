import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';
import { resolveSportRoute } from '../../../src/utils/sportRoutes';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { PlayerProfile, PlayerSportEntry } from '../../../src/types';

/**
 * Modernized Home Dashboard visualizing real player data, quick-access sports cards,
 * recent match highlights, and live score shortcuts matching the visual reference design.
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sports, setSports] = useState<PlayerSportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setIsLoading(true);
      Promise.all([
        playerService.fetchProfile().catch(() => null),
        playerService.fetchSports().catch(() => []),
      ]).then(([profileData, sportsData]) => {
        if (isMounted) {
          setPlayer(profileData);
          setSports(sportsData ?? []);
          setIsLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const openSport = (entry: PlayerSportEntry) => {
    router.push(resolveSportRoute(entry.sport));
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll>
      {/* Dark Navy Hero Section */}
      <LinearGradient
        colors={colors.gradientHero}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.heroCard, shadows.md]}
      >
        {/* Live Score Banner CTA */}
        <Pressable
          style={({ pressed }) => [styles.liveBadgeRow, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/(protected)/(tabs)/live-score')}
        >
          <View style={styles.liveTag}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveTagText}>LIVE</Text>
          </View>
          <Text style={styles.liveBannerText}>Follow Live Match Scores & Fixtures</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.white} />
        </Pressable>

        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{player?.full_name || user?.name || 'Athlete'}</Text>

        {/* Real Data Stat Chips */}
        <View style={styles.statChipRow}>
          <View style={styles.statChip}>
            <Ionicons name="trophy" size={14} color={colors.energy} />
            <Text style={styles.statChipNumber}>{sports.length}</Text>
            <Text style={styles.statChipLabel}>Sports Active</Text>
          </View>

          <View style={styles.statChip}>
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={styles.statChipNumber}>{sports.length > 0 ? '100%' : '0%'}</Text>
            <Text style={styles.statChipLabel}>Profile Ready</Text>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      ) : sports.length === 0 ? (
        /* Zero Sports Onboarding Prompt */
        <Pressable
          style={({ pressed }) => [styles.ctaCard, shadows.sm, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/(protected)/(tabs)/player-profile')}
        >
          <View style={styles.ctaIconCircle}>
            <Ionicons name="person-add-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.ctaTitle}>Complete your player profile</Text>
          <Text style={styles.ctaText}>
            Add your sports and career statistics so coaches and teams can find you on AmaX.
          </Text>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </View>
        </Pressable>
      ) : (
        <>
          {/* My Sports — Quick Access Row */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>MY SPORTS — QUICK ACCESS</Text>
            <Pressable onPress={() => router.push('/(protected)/(tabs)/player-profile')}>
              <Text style={styles.seeAllText}>See Hub</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {sports.map((entry) => (
              <Pressable
                key={entry.id}
                style={({ pressed }) => [styles.quickSportCard, shadows.sm, pressed && styles.pressedOpacity]}
                onPress={() => openSport(entry)}
              >
                <View style={styles.quickSportIconCircle}>
                  <Ionicons name={sportIconFor(entry.sport.slug)} size={24} color={colors.primary} />
                </View>
                <Text style={styles.quickSportName}>{entry.sport.name}</Text>
                <View style={styles.quickStatusPill}>
                  <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                  <Text style={styles.quickStatusText}>Complete</Text>
                </View>
              </Pressable>
            ))}

            <Pressable
              style={({ pressed }) => [styles.addQuickCard, pressed && styles.pressedOpacity]}
              onPress={() => router.push('/(protected)/player-profile/sport-picker')}
            >
              <View style={styles.addQuickIconCircle}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <Text style={styles.addQuickText}>Add Sport</Text>
            </Pressable>
          </ScrollView>

          {/* Recent Activity Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          </View>

          <View style={[styles.activityCard, shadows.sm]}>
            <View style={styles.activityHeader}>
              <View style={styles.activityBadge}>
                <Ionicons name="ribbon-outline" size={14} color={colors.primary} />
                <Text style={styles.activityBadgeText}>ATHLETIC PROFILE UPDATED</Text>
              </View>
              <Text style={styles.activityTime}>Active Now</Text>
            </View>

            <Text style={styles.activityTitle}>
              Registered in {sports.map((s) => s.sport.name).join(', ')}
            </Text>
            <Text style={styles.activityText}>
              Your sport profiles and stat forms are active. Tap any sport card above to manage recent matches and career totals.
            </Text>

            <Pressable
              style={styles.activityActionRow}
              onPress={() => router.push('/(protected)/(tabs)/player-profile')}
            >
              <Text style={styles.activityActionText}>Edit Sports Profile</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </Pressable>
          </View>

          {/* Live Score Promo Section */}
          <Pressable
            style={({ pressed }) => [styles.livePromoCard, shadows.sm, pressed && styles.pressedOpacity]}
            onPress={() => router.push('/(protected)/(tabs)/live-score')}
          >
            <View style={styles.livePromoContent}>
              <View style={styles.liveTagHeader}>
                <View style={styles.liveTagRed}>
                  <Text style={styles.liveTagRedText}>LIVE MATCHES</Text>
                </View>
                <Text style={styles.livePromoSub}>Real-Time Scores</Text>
              </View>
              <Text style={styles.livePromoTitle}>Track ongoing tournaments and live team matches</Text>
            </View>
            <Ionicons name="radio" size={28} color={colors.live} />
          </Pressable>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.card,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.live,
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  liveTagText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  liveBannerText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  greeting: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
  },
  name: {
    ...typography.h1,
    color: colors.white,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  statChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statChipNumber: {
    ...typography.body,
    color: colors.white,
    fontWeight: '800',
  },
  statChipLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  loadingIndicator: {
    marginVertical: spacing.xl,
  },
  pressedOpacity: {
    opacity: 0.88,
  },
  ctaCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  ctaIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  ctaTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  ctaText: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  ctaButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  horizontalScroll: {
    marginHorizontal: -spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  quickSportCard: {
    width: 130,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  quickSportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickSportName: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  quickStatusText: {
    ...typography.caption,
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  addQuickCard: {
    width: 100,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addQuickIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addQuickText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textFaint,
    fontSize: 11,
  },
  activityTitle: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
    marginVertical: 4,
  },
  activityText: {
    ...typography.bodyMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  activityActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityActionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  livePromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.liveLight,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.liveBorder,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  livePromoContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  liveTagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  liveTagRed: {
    backgroundColor: colors.live,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  liveTagRedText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    fontSize: 10,
  },
  livePromoSub: {
    ...typography.caption,
    color: colors.live,
    fontWeight: '700',
    fontSize: 11,
  },
  livePromoTitle: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
  },
});
