import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Logo } from '../../../src/components/ui/Logo';
import { SubscriptionStatusChip } from '../../../src/components/subscription/SubscriptionStatusChip';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
import { playerService } from '../../../src/services/playerService';
import { matchService } from '../../../src/services/matchService';
import { seedInitialLiveScores, subscribeToLiveScore, MultiSportLiveScore } from '../../../src/services/firebaseService';
import { resolveSportRoute } from '../../../src/utils/sportRoutes';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { CricketAnalysisResponse, MatchSummary, PlayerProfile, PlayerSportEntry } from '../../../src/types';
import { fmtDecimal, fmtNumber, fmtPercent } from '../../../src/utils/statFormat';

function getMatchScoreDisplay(item: MatchSummary, liveData?: MultiSportLiveScore): string {
  const backendScore = (item.live_score ?? null) as Record<string, any> | null;
  if (item.sport.slug === 'cricket') {
    const cs = liveData?.cricket_score ?? backendScore?.cricket_score;
    const battingTeam = cs?.team_a && cs?.team_b ? (cs.innings === 2 ? cs.team_b : cs.team_a) : null;
    const runs = battingTeam?.runs ?? cs?.runs ?? 0;
    const wickets = battingTeam?.wickets ?? cs?.wickets ?? 0;
    const oversText = battingTeam ? `${battingTeam.overs}.${battingTeam.balls}` : String(cs?.overs ?? 0);
    return `${runs}/${wickets} (${oversText} ov)`;
  } else if (liveData?.racket_scores ?? backendScore?.racket_scores) {
    const rs = liveData?.racket_scores ?? backendScore?.racket_scores;
    return `Set ${rs.current_set ?? 1}: ${rs.points_home ?? 0} - ${rs.points_away ?? 0}`;
  } else if (liveData?.team_score ?? backendScore?.team_score) {
    const ts = liveData?.team_score ?? backendScore?.team_score;
    return `${ts.home_total ?? 0} - ${ts.away_total ?? 0}`;
  }
  return 'Live Action';
}

/**
 * Creative, Modernized Home Dashboard with:
 * 1. Compact "MY SPORTS" Quick Access
 * 2. Real-Time Live Scoring & Streaming Hub
 * 3. Performance Analytics Spotlight & Sport Swapper
 * 4. Recent Form & Athletic Highlights
 */
export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const subscriptionStatus = useSubscriptionStore((s) => s.status);
  const refreshSubscription = useSubscriptionStore((s) => s.refresh);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sports, setSports] = useState<PlayerSportEntry[]>([]);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [liveScoreState, setLiveScoreState] = useState<Record<number, MultiSportLiveScore>>({});
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
        matchService.fetchAll().catch(() => []),
        playerService.fetchCricketAnalysis().catch(() => null),
        refreshSubscription(),
      ]).then(([profileData, sportsData, matchesData, analysisData]) => {
        if (isMounted) {
          setPlayer(profileData);
          setSports(sportsData ?? []);
          setMatches(matchesData ?? []);
          seedInitialLiveScores(matchesData ?? []);
          setCricketAnalysis(analysisData);
          setSelectedAnalyticsSlug((prev) => prev ?? sportsData?.[0]?.sport.slug ?? null);
          setIsLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [refreshSubscription])
  );

  // Subscribe to Firebase real-time live score updates
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];
    matches.forEach((m) => {
      const unsub = subscribeToLiveScore(m.id, (updatedScore) => {
        setLiveScoreState((prev) => ({
          ...prev,
          [m.id]: updatedScore,
        }));
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [matches]);

  const openSport = (entry: PlayerSportEntry) => {
    router.push(resolveSportRoute(entry.sport, 'view'));
  };

  const activeSlug = selectedAnalyticsSlug ?? sports[0]?.sport.slug ?? 'cricket';
  const activeSportEntry = sports.find((s) => s.sport.slug === activeSlug) ?? sports[0];
  const overview = cricketAnalysis?.overview;
  const liveMatches = matches.filter((m) => m.status === 'live');
  const featuredMatch = liveMatches[0] ?? matches[0];

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll>
      {/* Dark Navy Hero Section */}
      <LinearGradient
        colors={colors.gradientHero}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.heroCard, shadows.md]}
      >
        {/* Top Brand Logo Bar */}
        <View style={styles.topBrandRow}>
          <Logo size={28} />
          <View style={styles.subscriptionChipRow}>
            <SubscriptionStatusChip status={subscriptionStatus} />
          </View>
        </View>

        {/* Live Score & Stream Quick Pill */}
        <Pressable
          style={({ pressed }) => [styles.liveBadgeRow, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/(protected)/(tabs)/live-score')}
        >
          <View style={styles.liveTag}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveTagText}>LIVE</Text>
          </View>
          <Text style={styles.liveBannerText}>
            {liveMatches.length > 0 ? `${liveMatches.length} Live Match(es) Streaming` : 'Live Scores & Streaming Hub'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.white} />
        </Pressable>

        <View style={styles.subscriptionChipRow}>
          <SubscriptionStatusChip status={subscriptionStatus} />
        </View>

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
            <Text style={styles.statChipLabel}>My Sports</Text>
          </View>

          <View style={styles.statChip}>
            <Ionicons name="radio-outline" size={14} color={colors.live} />
            <Text style={styles.statChipNumber}>{liveMatches.length}</Text>
            <Text style={styles.statChipLabel}>Live Now</Text>
          </View>

          <View style={styles.statChip}>
            <Ionicons name="stats-chart-outline" size={14} color={colors.primaryLight} />
            <Text style={styles.statChipNumber}>{cricketAnalysis?.has_any_stats ? 'Active' : 'Setup'}</Text>
            <Text style={styles.statChipLabel}>Analytics</Text>
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
          {/* SECTION 1: MY SPORTS — QUICK ACCESS (COMPACT DESIGN) */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="grid-outline" size={15} color={colors.primary} />
              <Text style={styles.sectionTitle}>MY SPORTS</Text>
            </View>
            <Pressable onPress={() => router.push('/(protected)/(tabs)/player-profile')}>
              <Text style={styles.seeAllText}>Manage Hub</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compactSportsScroll}>
            {sports.map((entry) => (
              <Pressable
                key={entry.id}
                style={({ pressed }) => [styles.compactSportCard, shadows.sm, pressed && styles.pressedOpacity]}
                onPress={() => openSport(entry)}
              >
                <View style={styles.compactSportIconCircle}>
                  <Ionicons name={sportIconFor(entry.sport.slug)} size={18} color={colors.primary} />
                </View>
                <Text style={styles.compactSportName} numberOfLines={1}>
                  {entry.sport.name}
                </Text>
                <View style={styles.compactStatusRow}>
                  <View style={styles.compactGreenDot} />
                  <Text style={styles.compactStatusText}>Active</Text>
                </View>
              </Pressable>
            ))}

            <Pressable
              style={({ pressed }) => [styles.compactAddCard, pressed && styles.pressedOpacity]}
              onPress={() => router.push('/(protected)/player-profile/sport-picker')}
            >
              <View style={styles.compactAddIconCircle}>
                <Ionicons name="add" size={18} color={colors.primary} />
              </View>
              <Text style={styles.compactAddText}>Add Sport</Text>
            </Pressable>
          </ScrollView>

          {/* SECTION 2: LIVE SCORING & STREAMING PANEL */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.glowingLiveDot} />
              <Text style={styles.sectionTitle}>LIVE SCORING & STREAMING</Text>
            </View>
            <Pressable onPress={() => router.push('/(protected)/(tabs)/live-score')}>
              <Text style={styles.seeAllText}>All Matches</Text>
            </Pressable>
          </View>

          {featuredMatch ? (
            <View style={[styles.liveMatchCard, shadows.md]}>
              <View style={styles.liveCardTopBar}>
                <View style={styles.liveTagHeader}>
                  <View style={styles.liveTagBadge}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.liveTagText}>LIVE SCOREBOARD</Text>
                  </View>
                  <Text style={styles.liveMatchSport}>{featuredMatch.sport.name}</Text>
                </View>
                <View style={styles.formatPill}>
                  <Text style={styles.formatPillText}>{featuredMatch.format || 'Match'}</Text>
                </View>
              </View>

              <View style={styles.liveTeamsCenterRow}>
                {/* Home Team */}
                <View style={styles.teamSideCol}>
                  <Image
                    source={{
                      uri:
                        featuredMatch.home_team?.photo_url ||
                        featuredMatch.home_team?.logo_url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                    }}
                    style={styles.teamAvatar}
                  />
                  <Text style={styles.teamTitle} numberOfLines={1}>
                    {featuredMatch.home_team?.name || 'Home Team'}
                  </Text>
                </View>

                {/* Score / VS Block */}
                <View style={styles.scoreCenterBlock}>
                  <Text style={styles.liveScoreBig}>
                    {getMatchScoreDisplay(featuredMatch, liveScoreState[featuredMatch.id])}
                  </Text>
                  <Text style={styles.venueSubText} numberOfLines={1}>
                    {featuredMatch.venue || 'Match Venue'}
                  </Text>
                </View>

                {/* Away Team */}
                <View style={styles.teamSideCol}>
                  <Image
                    source={{
                      uri:
                        featuredMatch.away_team?.photo_url ||
                        featuredMatch.away_team?.logo_url ||
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
                    }}
                    style={styles.teamAvatar}
                  />
                  <Text style={styles.teamTitle} numberOfLines={1}>
                    {featuredMatch.away_team?.name || 'Away Team'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row: Watch Stream + View Scoreboard */}
              <View style={styles.liveActionRow}>
                {featuredMatch.youtube_stream_url ? (
                  <Pressable
                    style={({ pressed }) => [styles.streamBtn, pressed && styles.pressedOpacity]}
                    onPress={() => router.push(`/(protected)/live-score/stream/${featuredMatch.id}`)}
                  >
                    <Ionicons name="tv-outline" size={15} color={colors.white} />
                    <Text style={styles.streamBtnText}>WATCH LIVE STREAM</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.streamBtn, pressed && styles.pressedOpacity]}
                    onPress={() => router.push(`/(protected)/live-score/${featuredMatch.id}`)}
                  >
                    <Ionicons name="pulse" size={15} color={colors.white} />
                    <Text style={styles.streamBtnText}>OPEN LIVE SCOREBOARD</Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.scoreDetailBtn}
                  onPress={() => router.push(`/(protected)/live-score/${featuredMatch.id}`)}
                >
                  <Text style={styles.scoreDetailText}>Details</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.livePromoCard, shadows.sm, pressed && styles.pressedOpacity]}
              onPress={() => router.push('/(protected)/(tabs)/live-score')}
            >
              <View style={styles.livePromoContent}>
                <View style={styles.livePromoTagHeader}>
                  <View style={styles.liveTagRed}>
                    <Text style={styles.liveTagRedText}>LIVE MATCHES & STREAMS</Text>
                  </View>
                  <Text style={styles.livePromoSub}>Firebase Real-Time Sync</Text>
                </View>
                <Text style={styles.livePromoTitle}>Track live scores, fixtures & embedded video streams</Text>
              </View>
              <Ionicons name="radio" size={28} color={colors.live} />
            </Pressable>
          )}

          {/* SECTION 3: PERFORMANCE ANALYTICS & SPORT SWAPPER */}
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
                  <Ionicons name={sportIconFor(activeSlug)} size={16} color={colors.primary} />
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

          {/* SECTION 4: RECENT FORM & HIGHLIGHTS */}
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
                Your {activeSportEntry?.sport?.name ?? 'sport'} profile is active. Tap to view statistics or edit career details from your profile hub.
              </Text>

              <Pressable
                style={styles.activityActionRow}
                onPress={() => openSport(activeSportEntry)}
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
  },
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
  subscriptionChipRow: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
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
    marginTop: spacing.sm,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glowingLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.live,
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
  /* Compact Sports Quick Access Row Styles */
  compactSportsScroll: {
    marginHorizontal: -spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  compactSportCard: {
    width: 104,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginRight: 8,
    alignItems: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  compactSportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  compactSportName: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  compactStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  compactStatusText: {
    ...typography.caption,
    color: colors.success,
    fontSize: 10,
    fontWeight: '600',
  },
  compactAddCard: {
    width: 90,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAddIconCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  compactAddText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  /* Live Scoring & Streaming Panel Styles */
  liveMatchCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  liveCardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  liveTagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  liveMatchSport: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  formatPill: {
    backgroundColor: colors.cardSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  formatPillText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  liveTeamsCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  teamSideCol: {
    flex: 1,
    alignItems: 'center',
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    marginBottom: 4,
  },
  teamTitle: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  scoreCenterBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  liveScoreBig: {
    ...typography.h2,
    fontSize: 17,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
  },
  venueSubText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 120,
    textAlign: 'center',
  },
  liveActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  streamBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.live,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  streamBtnText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  scoreDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  scoreDetailText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
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
    marginBottom: spacing.lg,
  },
  livePromoContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  livePromoTagHeader: {
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
