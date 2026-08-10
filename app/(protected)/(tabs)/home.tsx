import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';
import { resolveSportRoute } from '../../../src/utils/sportRoutes';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { CricketAnalysisResponse, PlayerProfile, PlayerSportEntry } from '../../../src/types';
import { fmtDecimal, fmtNumber, fmtPercent } from '../../../src/utils/statFormat';

/**
 * Modernized Home Dashboard visualizing real player data, quick-access sports cards,
 * Performance Analytics spotlight widget, recent match highlights, and live score shortcuts.
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sports, setSports] = useState<PlayerSportEntry[]>([]);
  const [cricketAnalysis, setCricketAnalysis] = useState<CricketAnalysisResponse | null>(null);
  const [selectedAnalyticsSlug, setSelectedAnalyticsSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setIsLoading(true);
      Promise.all([
        playerService.fetchProfile().catch(() => null),
        playerService.fetchSports().catch(() => []),
        playerService.fetchCricketAnalysis().catch(() => null),
      ]).then(([profileData, sportsData, analysisData]) => {
        if (isMounted) {
          setPlayer(profileData);
          setSports(sportsData ?? []);
          setCricketAnalysis(analysisData);
          setSelectedAnalyticsSlug((prev) => prev ?? sportsData?.[0]?.sport.slug ?? null);
          setIsLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const openSport = (entry: PlayerSportEntry) => {
    router.push(resolveSportRoute(entry.sport, 'view'));
  };

  const activeSlug = selectedAnalyticsSlug ?? sports[0]?.sport.slug ?? 'cricket';
  const activeSportEntry = sports.find((s) => s.sport.slug === activeSlug) ?? sports[0];
  const overview = cricketAnalysis?.overview;

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

        <View style={styles.profileHeaderRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{player?.full_name || user?.name || 'Athlete'}</Text>
          </View>
          {player?.photo_url ? (
            <Image source={{ uri: player.photo_url }} style={styles.heroAvatar} />
          ) : (
            <View style={styles.heroAvatarFallback}>
              <Text style={styles.heroAvatarText}>
                {(player?.full_name || user?.name || 'A')[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Real Data Stat Chips */}
        <View style={styles.statChipRow}>
          <View style={styles.statChip}>
            <Ionicons name="trophy-outline" size={14} color={colors.energy} />
            <Text style={styles.statChipNumber}>{sports.length}</Text>
            <Text style={styles.statChipLabel}>Active Sports</Text>
          </View>

          <View style={styles.statChip}>
            <Ionicons name="stats-chart-outline" size={14} color={colors.primaryLight} />
            <Text style={styles.statChipNumber}>{cricketAnalysis?.has_any_stats ? 'Active' : 'Setup'}</Text>
            <Text style={styles.statChipLabel}>Analytics</Text>
          </View>

          <View style={styles.statChip}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
            <Text style={styles.statChipNumber}>{sports.length > 0 ? '100%' : '0%'}</Text>
            <Text style={styles.statChipLabel}>Profile</Text>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} size="large" />
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
            Add your sports and career statistics so coaches and teams can find you on AmaSports.
          </Text>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </View>
        </Pressable>
      ) : (
        <>
          {/* Performance Analytics Highlight Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="analytics-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>PERFORMANCE ANALYTICS</Text>
            </View>
            <Pressable onPress={() => router.push('/(protected)/(tabs)/analysis')}>
              <Text style={styles.seeAllText}>Full Analytics</Text>
            </Pressable>
          </View>

          {/* Sport Swapper Bar if user has multiple sports */}
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
                  <Pressable
                    key={entry.id}
                    onPress={() => setSelectedAnalyticsSlug(entry.sport.slug)}
                    style={({ pressed }) => [
                      styles.sportSwapperChip,
                      active && styles.sportSwapperChipActive,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Ionicons
                      name={sportIconFor(entry.sport.slug)}
                      size={14}
                      color={active ? colors.white : colors.primary}
                    />
                    <Text style={[styles.sportSwapperText, active && styles.sportSwapperTextActive]}>
                      {entry.sport.name}
                    </Text>
                  </Pressable>
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
                  <Ionicons
                    name={sportIconFor(activeSlug)}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.analyticsWidgetTitle}>
                    {activeSportEntry?.sport?.name ?? 'Sport'} Snapshot
                  </Text>
                  <Text style={styles.analyticsWidgetSub}>
                    {activeSlug === 'cricket' && cricketAnalysis?.has_any_stats
                      ? 'Real-Time Performance Stats'
                      : `View ${activeSportEntry?.sport?.name ?? 'Sport'} Stats`}
                  </Text>
                </View>
              </View>

              <View style={styles.analyticsOpenBadge}>
                <Text style={styles.analyticsOpenText}>Analytics</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primary} />
              </View>
            </View>

            {activeSlug === 'cricket' && overview && cricketAnalysis?.has_any_stats ? (
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsTile}>
                  <Text style={styles.analyticsValue}>{fmtNumber(overview.matches)}</Text>
                  <Text style={styles.analyticsLabel}>Matches</Text>
                </View>
                <View style={styles.analyticsTile}>
                  <Text style={styles.analyticsValue}>{fmtNumber(overview.runs)}</Text>
                  <Text style={styles.analyticsLabel}>Total Runs</Text>
                </View>
                <View style={styles.analyticsTile}>
                  <Text style={styles.analyticsValue}>{fmtNumber(overview.wickets)}</Text>
                  <Text style={styles.analyticsLabel}>Wickets</Text>
                </View>
                <View style={styles.analyticsTile}>
                  <Text style={styles.analyticsValue}>{fmtPercent(overview.win_percentage)}</Text>
                  <Text style={styles.analyticsLabel}>Win Rate</Text>
                </View>
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

          {/* My Sports — Quick Access Row */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="grid-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>MY SPORTS — QUICK ACCESS</Text>
            </View>
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
                  <Ionicons name={sportIconFor(entry.sport.slug)} size={22} color={colors.primary} />
                </View>
                <Text style={styles.quickSportName}>{entry.sport.name}</Text>
                <View style={styles.quickStatusPill}>
                  <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                  <Text style={styles.quickStatusText}>Active</Text>
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

          {/* Recent Form & Activity Section */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="trending-up-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>RECENT FORM & HIGHLIGHTS</Text>
            </View>
          </View>

          {activeSlug === 'cricket' && cricketAnalysis?.recent_form && cricketAnalysis.recent_form.length > 0 ? (
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
                  <Text style={styles.activityBadgeText}>{activeSportEntry?.sport?.name?.toUpperCase() ?? 'SPORT'} PROFILE</Text>
                </View>
                <Text style={styles.activityTime}>Active Now</Text>
              </View>

              <Text style={styles.activityTitle}>
                {activeSportEntry?.sport?.name ?? 'Sport'} Stats Profile
              </Text>
              <Text style={styles.activityText}>
                Your {activeSportEntry?.sport?.name ?? 'sport'} profile is active. Tap to view statistics or edit career details from your profile hub.
              </Text>

              <Pressable
                style={styles.activityActionRow}
                onPress={() => openSport(activeSportEntry)}
              >
                <Text style={styles.activityActionText}>Open {activeSportEntry?.sport?.name ?? 'Sport'} Card</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          )}

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
    borderRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statChipNumber: {
    ...typography.body,
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  statChipLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
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
    marginTop: spacing.xs,
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
    fontWeight: '700',
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
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
  sportSwapperChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sportSwapperChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sportSwapperText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  sportSwapperTextActive: {
    fontWeight: '700',
    color: colors.white,
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
  horizontalScroll: {
    marginHorizontal: -spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  quickSportCard: {
    width: 125,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickSportIconCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickSportName: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
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
    borderRadius: radius.lg,
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
  livePromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.liveLight,
    borderRadius: radius.lg,
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
