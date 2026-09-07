import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
 * Home Dashboard — The Pro Athlete Command Center.
 * 1. Hero HUD: Luxury obsidian gradient, dynamic time-of-day greeting, verified athlete pill,
 *    PickMe avatar with Energy Lime ring, and 3 glassmorphic KPI pods.
 * 2. Quick-Launch Pro Strip: 1-tap jump to My Card, Analytics, Live Scores, and Scout.
 * 3. VIP Athlete Membership / Free Trial Pass Banner.
 * 4. My Disciplines (Sports Showcase) with complete profile tags and inviting "Add Discipline" card.
 * 5. Performance Analytics Hub with metric preview grid and sport swapper tabs.
 * 6. Recent Match Form & Highlights scorecard.
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
  const {
    cricketAnalysis,
    analysisSupported,
    isLoading: isAnalysisLoading,
    isCricketActive,
    hasAnyStats,
    headlineStats,
  } = useSportAnalysis(activeSlug);

  const openSport = (entry: PlayerSportEntry) => {
    router.push(resolveSportRoute(entry.sport, 'view'));
  };

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const playerName = player?.full_name || user?.name || 'Athlete';
  const avatarUri = player?.photo_url || user?.photo_url;
  const initial = (playerName || 'A')[0]?.toUpperCase();
  const photoCount = player?.photos.length ?? 0;

  return (
    <ScreenContainer
      edges={['top', 'bottom']}
      scroll
      style={styles.screen}
      backgroundColor={colors.background}
    >
      {/* 1. ATHLETE HUD HERO SECTION */}
      <View style={styles.heroWrapper}>
        <LinearGradient
          colors={['#111827', '#1F2937']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.heroCard, shadows.sm]}
        >
          {/* Subtle Ambient Glow */}
          <View style={styles.heroGlow} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="homeHeroGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={colors.energy} stopOpacity={0.06} />
                  <Stop offset="80%" stopColor={colors.energy} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx="50" cy="50" r="50" fill="url(#homeHeroGlow)" />
            </Svg>
          </View>

          {/* Top Brand & Status Navigation Bar */}
          <View style={styles.topBrandRow}>
            <Logo size={26} />

            <View style={styles.topActionsCluster}>
              <SubscriptionStatusChip status={subscriptionStatus} />

              <Pressable
                style={styles.searchIconButton}
                onPress={() => router.push('/(protected)/(tabs)/player-search')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Search athletes"
              >
                <Ionicons name="search-outline" size={16} color="rgba(255, 255, 255, 0.85)" />
              </Pressable>
            </View>
          </View>

          {/* Athlete Profile Header Row */}
          <View style={styles.profileHeaderRow}>
            <View style={styles.greetingBlock}>
              <View style={styles.proPill}>
                <Ionicons name="shield-checkmark" size={10} color="rgba(255, 255, 255, 0.85)" />
                <Text style={styles.proPillText}>VERIFIED ATHLETE</Text>
              </View>

              <Text style={styles.greetingText}>{timeGreeting},</Text>
              <Text style={styles.playerNameText} numberOfLines={1}>
                {playerName}
              </Text>
            </View>

            {/* Avatar with Minimalist Border Ring */}
            <Pressable
              style={({ pressed }) => [styles.avatarRing, pressed && styles.pressedOpacity]}
              onPress={() => {
                if (avatarUri) {
                  setLightboxUri(avatarUri);
                } else {
                  router.push('/(protected)/(tabs)/player-profile');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="View player photo"
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <LinearGradient
                  colors={['#1E293B', '#0F172A']}
                  style={styles.avatarFallback}
                >
                  <Text style={styles.avatarInitialText}>{initial}</Text>
                </LinearGradient>
              )}
            </Pressable>
          </View>

          {/* 3 Minimalist Translucent HUD Pods */}
          <View style={styles.hudPodsRow}>
            {/* Pod 1: Disciplines */}
            <Pressable
              style={styles.hudPod}
              onPress={() => {
                if (sports.length > 0) openSport(sports[0]);
              }}
            >
              <View style={styles.hudPodHeader}>
                <Ionicons name="ribbon-outline" size={13} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.hudPodLabel}>DISCIPLINE</Text>
              </View>
              <Text style={styles.hudPodValue}>
                {sports.length} {sports.length === 1 ? 'Sport' : 'Sports'}
              </Text>
              <Text style={styles.hudPodSub} numberOfLines={1}>
                {sports[0]?.sport.name || 'Set up'}
              </Text>
            </Pressable>

            {/* Pod 2: Photos Portfolio */}
            <Pressable
              style={styles.hudPod}
              onPress={() => router.push('/(protected)/(tabs)/player-profile')}
            >
              <View style={styles.hudPodHeader}>
                <Ionicons name="images-outline" size={13} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.hudPodLabel}>PORTFOLIO</Text>
              </View>
              <Text style={styles.hudPodValue}>{photoCount} / 10</Text>
              <Text style={styles.hudPodSub}>Cover Gallery</Text>
            </Pressable>

            {/* Pod 3: Analytics Engine Status */}
            <Pressable
              style={styles.hudPod}
              onPress={() => router.push('/(protected)/(tabs)/analysis')}
            >
              <View style={styles.hudPodHeader}>
                <Ionicons name="pulse-outline" size={13} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.hudPodLabel}>ANALYTICS</Text>
              </View>
              <View style={styles.statusLiveRow}>
                <View style={styles.statusDotLive} />
                <Text style={styles.hudPodValue}>{hasAnyStats ? 'Active' : 'Standby'}</Text>
              </View>
              <Text style={styles.hudPodSub}>Real-Time Hub</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      {/* 2. ATHLETE QUICK-LAUNCH TOOLBAR (MINIMALIST UNIFIED MONOCHROME) */}
      <View style={styles.quickLaunchContainer}>
        <Pressable
          style={({ pressed }) => [styles.quickLaunchItem, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/(protected)/(tabs)/player-profile')}
          accessibilityRole="button"
          accessibilityLabel="Open Player Profile"
        >
          <View style={styles.quickLaunchIcon}>
            <Ionicons name="person-circle-outline" size={20} color={colors.navy} />
          </View>
          <Text style={styles.quickLaunchText}>My Card</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.quickLaunchItem, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/(protected)/(tabs)/analysis')}
          accessibilityRole="button"
          accessibilityLabel="Open Performance Analysis"
        >
          <View style={styles.quickLaunchIcon}>
            <Ionicons name="bar-chart-outline" size={20} color={colors.navy} />
          </View>
          <Text style={styles.quickLaunchText}>Analytics</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.quickLaunchItem, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/(protected)/(tabs)/live-score')}
          accessibilityRole="button"
          accessibilityLabel="Open Live Scores"
        >
          <View style={styles.quickLaunchIcon}>
            <Ionicons name="radio-outline" size={20} color={colors.navy} />
          </View>
          <Text style={styles.quickLaunchText}>Live Center</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.quickLaunchItem, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/(protected)/(tabs)/player-search')}
          accessibilityRole="button"
          accessibilityLabel="Search Athletes and Teams"
        >
          <View style={styles.quickLaunchIcon}>
            <Ionicons name="search-outline" size={20} color={colors.navy} />
          </View>
          <Text style={styles.quickLaunchText}>Scout</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} size="large" />
      ) : sports.length === 0 ? (
        /* ZERO SPORTS ONBOARDING PROMPT */
        <Pressable
          style={({ pressed }) => [styles.onboardingCard, shadows.sm, pressed && styles.pressedOpacity]}
          onPress={() => router.push('/(protected)/player-profile/sport-picker')}
        >
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            style={styles.onboardingIconCircle}
          >
            <Ionicons name="trophy" size={28} color={colors.energy} />
          </LinearGradient>
          <Text style={styles.onboardingTitle}>Build Your Athlete Passport</Text>
          <Text style={styles.onboardingText}>
            Choose your sport discipline, record career milestones, and showcase your profile to scouts and coaches on AmaX.
          </Text>
          <View style={styles.onboardingBtn}>
            <Text style={styles.onboardingBtnText}>Select Primary Sport</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.navy} />
          </View>
        </Pressable>
      ) : (
        <>
          {/* 3. VIP ATHLETE PASS / SUBSCRIPTION BANNER */}
          <SubscriptionStatusCard status={subscriptionStatus} />

          {/* 4. SECTION: MY DISCIPLINES (SPORTS) */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="shield-outline" size={14} color={colors.navy} />
              </View>
              <Text style={styles.sectionTitle}>MY DISCIPLINES</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{sports.length}</Text>
            </View>
          </View>

          {/* Sport Discipline Cards */}
          {sports.map((entry, index) => (
            <Pressable
              key={entry.id}
              style={({ pressed }) => [styles.sportCard, shadows.sm, pressed && styles.pressedOpacity]}
              onPress={() => openSport(entry)}
              accessibilityRole="button"
              accessibilityLabel={`View ${entry.sport.name} profile`}
            >
              <View style={styles.sportIconCircle}>
                <Ionicons
                  name={sportIconFor(entry.sport.slug)}
                  size={22}
                  color={colors.navy}
                />
              </View>

              <View style={styles.sportTextBlock}>
                <View style={styles.sportTitleRow}>
                  <Text style={styles.sportName}>{entry.sport.name}</Text>
                  {index === 0 && (
                    <View style={styles.primaryTag}>
                      <Text style={styles.primaryTagText}>PRIMARY</Text>
                    </View>
                  )}
                </View>

                <View style={styles.statusBadgeRow}>
                  <View style={styles.statusPill}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={styles.statusPillText}>Profile Complete</Text>
                  </View>
                  <Text style={styles.sportSubtext}>• Tap to view stats</Text>
                </View>
              </View>

              <View style={styles.chevronPill}>
                <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
              </View>
            </Pressable>
          ))}

          {/* Add Another Sport Inspiring Card */}
          <Pressable
            style={({ pressed }) => [styles.addSportCard, shadows.sm, pressed && styles.pressedOpacity]}
            onPress={() => router.push('/(protected)/player-profile/sport-picker')}
            accessibilityRole="button"
            accessibilityLabel="Add another sport discipline"
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={18} color={colors.navy} />
            </View>
            <View style={styles.addTextBlock}>
              <Text style={styles.addSportTitle}>Add Another Discipline</Text>
              <Text style={styles.addSportSub}>
                Expand your athletic portfolio • Football, Badminton & more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* 5. SECTION: PERFORMANCE ANALYTICS SNAPSHOT */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="analytics" size={14} color={colors.navy} />
              </View>
              <Text style={styles.sectionTitle}>PERFORMANCE ANALYTICS</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(protected)/(tabs)/analysis')}
              hitSlop={8}
            >
              <Text style={styles.seeAllText}>Full Hub →</Text>
            </Pressable>
          </View>

          {/* Multi-Sport Swapper Tabs (if 2+ sports) */}
          {sports.length > 1 && (
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
          )}

          {/* High-Octane Analytics Snapshot Card */}
          <Pressable
            style={({ pressed }) => [styles.analyticsCard, shadows.sm, pressed && styles.pressedOpacity]}
            onPress={() => router.push('/(protected)/(tabs)/analysis')}
            accessibilityRole="button"
            accessibilityLabel="Open performance analysis hub"
          >
            <View style={styles.analyticsHeader}>
              <View style={styles.analyticsHeaderLeft}>
                <View style={styles.analyticsBadge}>
                  <Ionicons name={sportIconFor(activeSlug ?? '')} size={15} color={colors.navy} />
                </View>
                <View>
                  <Text style={styles.analyticsTitle}>
                    {activeSportEntry?.sport?.name ?? 'Sport'} Snapshot
                  </Text>
                  <Text style={styles.analyticsSubtitle}>
                    {hasAnyStats ? 'Career Performance Marks' : 'Interactive Analytics Hub'}
                  </Text>
                </View>
              </View>

              <View style={styles.analyticsActionBadge}>
                <Text style={styles.analyticsActionText}>Open Hub</Text>
                <Ionicons name="arrow-forward" size={11} color={colors.navy} />
              </View>
            </View>

            {isAnalysisLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.analyticsLoading} />
            ) : !analysisSupported ? (
              <View style={styles.analyticsPromptContainer}>
                <Text style={styles.analyticsPromptText}>
                  Detailed analytics for {activeSportEntry?.sport?.name ?? 'this sport'} are coming soon.
                </Text>
              </View>
            ) : hasAnyStats && headlineStats.length > 0 ? (
              <View style={styles.statsPodsGrid}>
                {headlineStats.slice(0, 4).map((stat, idx) => (
                  <View
                    key={stat.label}
                    style={[styles.statPodTile, idx === 0 && styles.statPodTileFeatured]}
                  >
                    <Text
                      style={[styles.statPodValue, idx === 0 && styles.statPodValueFeatured]}
                      numberOfLines={1}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      style={[styles.statPodLabel, idx === 0 && styles.statPodLabelFeatured]}
                      numberOfLines={1}
                    >
                      {stat.label.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.analyticsEmptyHub}>
                <Ionicons name="sparkles" size={20} color={colors.energyDark} />
                <Text style={styles.analyticsEmptyText}>
                  Explore interactive match charts, breakdown trends, and insights in the Analytics Hub.
                </Text>
                <View style={styles.analyticsExploreBtn}>
                  <Text style={styles.analyticsExploreBtnText}>Explore Hub</Text>
                  <Ionicons name="arrow-forward" size={12} color={colors.navy} />
                </View>
              </View>
            )}
          </Pressable>

          {/* 6. SECTION: RECENT FORM & MATCHES */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View style={styles.sectionIconBadge}>
                <Ionicons name="trending-up" size={14} color={colors.navy} />
              </View>
              <Text style={styles.sectionTitle}>RECENT FORM & HIGHLIGHTS</Text>
            </View>
          </View>

          {isCricketActive && cricketAnalysis?.recent_form && cricketAnalysis.recent_form.length > 0 ? (
            <View style={[styles.matchCard, shadows.sm]}>
              <View style={styles.matchCardHeader}>
                <View style={styles.matchBadge}>
                  <Ionicons name="trophy-outline" size={13} color={colors.navy} />
                  <Text style={styles.matchBadgeText}>LATEST MATCH LOG</Text>
                </View>
                <Text style={styles.matchTimeText}>Verified</Text>
              </View>

              <Text style={styles.matchOpponentText}>
                vs {cricketAnalysis.recent_form[0].opponent || 'Opponent Team'}
              </Text>

              <View style={styles.matchStatsRow}>
                <View style={styles.matchStatPill}>
                  <Text style={styles.matchStatLabel}>RUNS</Text>
                  <Text style={styles.matchStatValue}>{cricketAnalysis.recent_form[0].runs ?? '-'}</Text>
                </View>
                <View style={styles.matchStatPill}>
                  <Text style={styles.matchStatLabel}>WICKETS</Text>
                  <Text style={styles.matchStatValue}>{cricketAnalysis.recent_form[0].wickets ?? '-'}</Text>
                </View>
                <View style={styles.matchStatPill}>
                  <Text style={styles.matchStatLabel}>DATE</Text>
                  <Text style={styles.matchStatValue}>{cricketAnalysis.recent_form[0].match_date || 'Recent'}</Text>
                </View>
              </View>

              <Pressable
                style={styles.matchActionRow}
                onPress={() => router.push('/(protected)/(tabs)/analysis')}
              >
                <Text style={styles.matchActionText}>View Full Match Log</Text>
                <Ionicons name="arrow-forward" size={13} color={colors.primary} />
              </Pressable>
            </View>
          ) : (
            <View style={[styles.matchCard, shadows.sm]}>
              <View style={styles.matchCardHeader}>
                <View style={styles.matchBadge}>
                  <Ionicons name="ribbon-outline" size={13} color={colors.navy} />
                  <Text style={styles.matchBadgeText}>
                    {activeSportEntry?.sport?.name?.toUpperCase() ?? 'SPORT'} PROFILE
                  </Text>
                </View>
                <Text style={styles.matchTimeText}>Active</Text>
              </View>

              <Text style={styles.matchOpponentText}>
                {activeSportEntry?.sport?.name ?? 'Sport'} Career Hub
              </Text>
              <Text style={styles.matchSubText}>
                Your official {activeSportEntry?.sport?.name ?? 'sport'} card is live and accessible. Tap below to review your career stats and achievements.
              </Text>

              <Pressable
                style={styles.matchActionRow}
                onPress={() => activeSportEntry && openSport(activeSportEntry)}
              >
                <Text style={styles.matchActionText}>
                  Open {activeSportEntry?.sport?.name ?? 'Sport'} Card
                </Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* Lightbox for Full-Res Avatar Inspection */}
      <ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: spacing.xl,
  },
  heroWrapper: {
    marginBottom: spacing.md,
  },
  heroCard: {
    borderRadius: radius['2xl'],
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md + 2,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 220,
    height: 220,
  },
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  topActionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIconButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md + 4,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: spacing.sm,
    gap: 2,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 2,
  },
  proPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.8,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.2,
  },
  playerNameText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.6,
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    padding: 2,
    backgroundColor: '#1E293B',
    ...shadows.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  avatarFallback: {
    flex: 1,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
  },
  hudPodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  hudPod: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-between',
  },
  hudPodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  hudPodLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.7,
  },
  hudPodValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.2,
  },
  hudPodSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '600',
    marginTop: 2,
  },
  statusLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },

  /* 2. ATHLETE QUICK-LAUNCH STRIP */
  quickLaunchContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-around',
    ...shadows.sm,
  },
  quickLaunchItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  quickLaunchIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLaunchText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },

  /* SECTION HEADERS */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 4,
    marginTop: spacing.xs,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.text,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  /* SPORT DISCIPLINE CARDS */
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 12,
  },
  sportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportTextBlock: {
    flex: 1,
    gap: 2,
  },
  sportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sportName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  primaryTag: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: radius.full,
  },
  primaryTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  sportSubtext: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chevronPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ADD SPORT CARD */
  addSportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: 12,
  },
  addIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTextBlock: {
    flex: 1,
  },
  addSportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  addSportSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* PERFORMANCE ANALYTICS WIDGET */
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
  analyticsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 4,
  },
  analyticsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyticsBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  analyticsSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  analyticsActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  analyticsActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
  },
  analyticsLoading: {
    marginVertical: spacing.md,
  },
  analyticsPromptContainer: {
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  analyticsPromptText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  statsPodsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statPodTile: {
    flex: 1,
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statPodTileFeatured: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.borderStrong,
  },
  statPodValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
  },
  statPodValueFeatured: {
    color: colors.text,
  },
  statPodLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.6,
  },
  statPodLabelFeatured: {
    color: colors.textMuted,
  },
  analyticsEmptyHub: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  analyticsEmptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
  },
  analyticsExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.navy,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    marginTop: 4,
  },
  analyticsExploreBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },

  /* RECENT FORM & MATCH CARD */
  matchCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  matchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.navy,
    letterSpacing: 0.6,
  },
  matchTimeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  matchOpponentText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    marginVertical: 4,
  },
  matchSubText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
  matchStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: spacing.xs,
  },
  matchStatPill: {
    flex: 1,
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  matchStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  matchStatValue: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
    marginTop: 2,
  },
  matchActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs + 4,
  },
  matchActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  /* ONBOARDING ZERO SPORTS */
  onboardingCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  onboardingIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  onboardingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  onboardingText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  onboardingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.energy,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: 22,
    ...shadows.sm,
  },
  onboardingBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.navy,
  },

  loadingIndicator: {
    marginVertical: spacing.xl,
  },
  pressedOpacity: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
