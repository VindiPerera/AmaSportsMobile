import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Logo } from '../../../src/components/ui/Logo';
import { Chip } from '../../../src/components/ui/Chip';
import { ImageLightbox } from '../../../src/components/ui/ImageLightbox';
import { SubscriptionStatusChip } from '../../../src/components/subscription/SubscriptionStatusChip';
import { SubscriptionStatusCard } from '../../../src/components/subscription/SubscriptionStatusCard';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
import { playerService } from '../../../src/services/playerService';
import { resolveSportRoute } from '../../../src/utils/sportRoutes';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { useSportAnalysis } from '../../../src/hooks/useSportAnalysis';
import { PlayerProfile, PlayerSportEntry } from '../../../src/types';

/**
 * Home Dashboard — the app's primary hub now that sport creation/management
 * has moved here from the Player Profile tab (which is a read-focused
 * player card instead; see app/(protected)/(tabs)/player-profile.tsx):
 * 1. "MY SPORTS" — the main section: full sport cards + Add Sport
 * 2. Performance Analytics for whichever sport is selected
 * 3. Recent Form & Highlights
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const subscriptionStatus = useSubscriptionStore((s) => s.status);
  const refreshSubscription = useSubscriptionStore((s) => s.refresh);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sports, setSports] = useState<PlayerSportEntry[]>([]);
  const [selectedAnalyticsSlug, setSelectedAnalyticsSlug] = useState<string | null>(null);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setIsLoading(true);
      Promise.all([
        playerService.fetchProfile().catch(() => null),
        playerService.fetchSports().catch(() => []),
        refreshSubscription(),
      ]).then(([profileData, sportsData]) => {
        if (isMounted) {
          setPlayer(profileData);
          setSports(sportsData ?? []);
          setSelectedAnalyticsSlug((prev) => prev ?? sportsData?.[0]?.sport.slug ?? null);
          setIsLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [refreshSubscription])
  );

  const activeSlug = selectedAnalyticsSlug ?? sports[0]?.sport.slug ?? null;
  const activeSportEntry = sports.find((s) => s.sport.slug === activeSlug) ?? sports[0];
  const { cricketAnalysis, analysisSupported, isLoading: isAnalysisLoading, isCricketActive, hasAnyStats, headlineStats } =
    useSportAnalysis(activeSlug);

  const openSport = (entry: PlayerSportEntry) => {
    router.push(resolveSportRoute(entry.sport, 'view'));
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
        {/* Decorative lime glow blob, top-right — echoes the splash screen's glow. */}
        <View style={styles.heroGlow} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.energy} stopOpacity={0.22} />
                <Stop offset="70%" stopColor={colors.energy} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill="url(#heroGlow)" />
          </Svg>
        </View>

        {/* Top Brand Logo Bar */}
        <View style={styles.topBrandRow}>
          <Logo size={28} />
          <View style={styles.subscriptionChipRow}>
            <SubscriptionStatusChip status={subscriptionStatus} />
          </View>
        </View>

        <View style={styles.profileHeaderRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{player?.full_name || user?.name || 'Athlete'}</Text>
          </View>
          {(() => {
            const avatarUri = player?.photo_url || user?.photo_url;
            return avatarUri ? (
              <Pressable onPress={() => setLightboxUri(avatarUri)}>
                <Image source={{ uri: avatarUri }} style={styles.heroAvatar} />
              </Pressable>
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Text style={styles.heroAvatarText}>
                  {(player?.full_name || user?.name || 'A')[0]?.toUpperCase()}
                </Text>
              </View>
            );
          })()}
        </View>

        {/* Real Data Stat Chips */}
        <View style={styles.statChipRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipNumber}>{sports.length}</Text>
            <Text style={styles.statChipLabel} numberOfLines={1}>My Sports</Text>
          </View>

          <View style={styles.statChip}>
            <Text style={styles.statChipNumber}>{player?.photos.length ?? 0}</Text>
            <Text style={styles.statChipLabel} numberOfLines={1}>Photos</Text>
          </View>

          <View style={styles.statChip}>
            <Text style={styles.statChipNumber} numberOfLines={1}>
              {hasAnyStats ? 'Active' : 'Setup'}
            </Text>
            <Text style={styles.statChipLabel} numberOfLines={1}>Analytics</Text>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} size="large" />
      ) : sports.length === 0 ? (
        /* Zero Sports Onboarding Prompt */
        <Pressable
          style={({ pressed }) => [styles.ctaCard, shadows.sm, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/(protected)/player-profile/sport-picker')}
        >
          <View style={styles.ctaIconCircle}>
            <Ionicons name="person-add-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.ctaTitle}>Add your first sport</Text>
          <Text style={styles.ctaText}>
            Add a sport and build your career stats so coaches and teams can find you on AmaX.
          </Text>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </View>
        </Pressable>
      ) : (
        <>
          <SubscriptionStatusCard status={subscriptionStatus} />

          {/* SECTION 1: MY SPORTS — the main section now that sport
              creation/management lives here instead of the Player Profile
              tab (that's a read-focused player card now — see its own
              screen for the "switch sport" + Edit icon flow). */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="grid-outline" size={15} color={colors.primary} />
              <Text style={styles.sectionTitle}>MY SPORTS</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{sports.length}</Text>
            </View>
          </View>

          {sports.map((entry) => (
            <Pressable
              key={entry.id}
              style={({ pressed }) => [styles.sportCard, shadows.sm, pressed && styles.pressedOpacity]}
              onPress={() => openSport(entry)}
            >
              <View style={styles.sportIconCircle}>
                <Ionicons name={sportIconFor(entry.sport.slug)} size={24} color={colors.primary} />
              </View>
              <View style={styles.sportTextBlock}>
                <Text style={styles.sportName}>{entry.sport.name}</Text>
                <View style={styles.statusBadgeRow}>
                  <View style={styles.statusPill}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={styles.statusPillText}>Profile Complete</Text>
                  </View>
                  <Text style={styles.sportSubtext}>• Tap to view</Text>
                </View>
              </View>
              <View style={styles.chevronWrapper}>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.pressedOpacity]}
            onPress={() => router.push('/(protected)/player-profile/sport-picker')}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </View>
            <View style={styles.addTextBlock}>
              <Text style={styles.addButtonText}>Add Another Sport</Text>
              <Text style={styles.addButtonSubtext}>Expand your athletic portfolio</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </Pressable>

          {/* SECTION 2: PERFORMANCE ANALYTICS & SPORT SWAPPER */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="analytics-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>PERFORMANCE ANALYTICS</Text>
            </View>
            <Pressable onPress={() => router.push('/(protected)/(tabs)/analysis')}>
              <Text style={styles.seeAllText}>Full Analytics</Text>
            </Pressable>
          </View>

          {/* Sport Swapper Tabs */}
          {sports.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sportSwapperScroll}
              contentContainerStyle={styles.sportSwapperRow}
            >
              {sports.map((entry) => {
                const active = entry.sport.slug === activeSlug;
                return (
                  <Chip
                    key={entry.id}
                    label={entry.sport.name}
                    active={active}
                    tone="primary"
                    onPress={() => setSelectedAnalyticsSlug(entry.sport.slug)}
                    icon={
                      <Ionicons
                        name={sportIconFor(entry.sport.slug)}
                        size={14}
                        color={active ? colors.white : colors.textMuted}
                      />
                    }
                  />
                );
              })}
            </ScrollView>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.analyticsWidgetCard, shadows.sm, pressed && styles.pressedOpacity]}
            onPress={() => router.push('/(protected)/(tabs)/analysis')}
          >
            <View style={styles.analyticsWidgetHeader}>
              <View style={styles.analyticsHeaderLeft}>
                <View style={styles.analyticsIconBadge}>
                  <Ionicons name={sportIconFor(activeSlug ?? '')} size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.analyticsWidgetTitle}>
                    {activeSportEntry?.sport?.name ?? 'Sport'} Snapshot
                  </Text>
                  <Text style={styles.analyticsWidgetSub}>
                    {hasAnyStats ? 'Real-Time Performance Stats' : `View ${activeSportEntry?.sport?.name ?? 'Sport'} Stats`}
                  </Text>
                </View>
              </View>

              <View style={styles.analyticsOpenBadge}>
                <Text style={styles.analyticsOpenText}>Analytics</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primary} />
              </View>
            </View>

            {isAnalysisLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.analyticsLoading} />
            ) : !analysisSupported ? (
              <View style={styles.analyticsPromptRow}>
                <Text style={styles.analyticsPromptText}>
                  Detailed stats for {activeSportEntry?.sport?.name ?? 'this sport'} are coming soon.
                </Text>
              </View>
            ) : hasAnyStats && headlineStats.length > 0 ? (
              <View style={styles.analyticsGrid}>
                {headlineStats.map((stat) => (
                  <View key={stat.label} style={styles.analyticsTile}>
                    <Text style={styles.analyticsValue}>{stat.value}</Text>
                    <Text style={styles.analyticsLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.analyticsPromptRow}>
                <Text style={styles.analyticsPromptText}>
                  Explore interactive charts and performance insights for {activeSportEntry?.sport?.name ?? 'this sport'} in the Analytics hub.
                </Text>
                <View style={styles.analyticsCtaPill}>
                  <Text style={styles.analyticsCtaPillText}>View Details</Text>
                </View>
              </View>
            )}
          </Pressable>

          {/* SECTION 3: RECENT FORM & HIGHLIGHTS */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="trending-up-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>RECENT FORM & HIGHLIGHTS</Text>
            </View>
          </View>

          {isCricketActive && cricketAnalysis?.recent_form && cricketAnalysis.recent_form.length > 0 ? (
            <View style={[styles.activityCard, shadows.sm]}>
              <View style={styles.activityHeader}>
                <View style={styles.activityBadge}>
                  <Ionicons name="trophy-outline" size={14} color={colors.primary} />
                  <Text style={styles.activityBadgeText}>LATEST MATCH PERFORMANCE</Text>
                </View>
                <Text style={styles.activityTime}>Recent</Text>
              </View>

              <Text style={styles.activityTitle}>
                vs {cricketAnalysis.recent_form[0].opponent || 'Opponent'}
              </Text>
              <View style={styles.recentFormStatsRow}>
                <View style={styles.recentStatPill}>
                  <Text style={styles.recentStatLabel}>Runs</Text>
                  <Text style={styles.recentStatVal}>{cricketAnalysis.recent_form[0].runs ?? '-'}</Text>
                </View>
                <View style={styles.recentStatPill}>
                  <Text style={styles.recentStatLabel}>Wickets</Text>
                  <Text style={styles.recentStatVal}>{cricketAnalysis.recent_form[0].wickets ?? '-'}</Text>
                </View>
                <View style={styles.recentStatPill}>
                  <Text style={styles.recentStatLabel}>Date</Text>
                  <Text style={styles.recentStatVal}>{cricketAnalysis.recent_form[0].match_date || 'N/A'}</Text>
                </View>
              </View>

              <Pressable
                style={styles.activityActionRow}
                onPress={() => router.push('/(protected)/(tabs)/analysis')}
              >
                <Text style={styles.activityActionText}>View Full Match Log</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          ) : (
            <View style={[styles.activityCard, shadows.sm]}>
              <View style={styles.activityHeader}>
                <View style={styles.activityBadge}>
                  <Ionicons name="ribbon-outline" size={14} color={colors.primary} />
                  <Text style={styles.activityBadgeText}>
                    {activeSportEntry?.sport?.name?.toUpperCase() ?? 'SPORT'} PROFILE
                  </Text>
                </View>
                <Text style={styles.activityTime}>Active Now</Text>
              </View>

              <Text style={styles.activityTitle}>
                {activeSportEntry?.sport?.name ?? 'Sport'} Stats Profile
              </Text>
              <Text style={styles.activityText}>
                Your {activeSportEntry?.sport?.name ?? 'sport'} profile is active. Tap below to view its full career stats and match history.
              </Text>

              <Pressable
                style={styles.activityActionRow}
                onPress={() => activeSportEntry && openSport(activeSportEntry)}
              >
                <Text style={styles.activityActionText}>
                  Open {activeSportEntry?.sport?.name ?? 'Sport'} Card
                </Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </>
      )}

      <ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -50,
    width: 180,
    height: 180,
  },
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  subscriptionChipRow: {
    alignItems: 'flex-start',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  greeting: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
  },
  name: {
    ...typography.h1,
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  heroAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroAvatarText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  statChipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statChip: {
    flex: 1,
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  statChipNumber: {
    ...typography.body,
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 18,
  },
  statChipLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
  loadingIndicator: {
    marginVertical: spacing.xl,
  },
  pressedOpacity: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
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
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '800',
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  countBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  /* Full "My Sports" cards — promoted from the old Player Profile hub. */
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sportIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportTextBlock: {
    flex: 1,
  },
  sportName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPillText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    fontSize: 12,
  },
  sportSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTextBlock: {
    flex: 1,
  },
  addButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  addButtonSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  /* Analytics Styles */
  sportSwapperScroll: {
    flexGrow: 0,
    marginBottom: spacing.xs + 4,
  },
  sportSwapperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  analyticsWidgetCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  analyticsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  analyticsIconBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsWidgetTitle: {
    ...typography.h3,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  analyticsWidgetSub: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  analyticsOpenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  analyticsOpenText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  analyticsLoading: {
    marginVertical: spacing.md,
  },
  analyticsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  analyticsTile: {
    flex: 1,
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  analyticsValue: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  analyticsLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  analyticsPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  analyticsPromptText: {
    ...typography.caption,
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  analyticsCtaPill: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  analyticsCtaPillText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  activityCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginVertical: 4,
  },
  recentFormStatsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  recentStatPill: {
    flex: 1,
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  recentStatLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
  },
  recentStatVal: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginTop: 1,
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
    marginTop: spacing.xs,
  },
  activityActionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
