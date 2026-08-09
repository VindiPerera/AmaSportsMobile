import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { matchService } from '../../../src/services/matchService';
import { seedInitialLiveScores, subscribeToLiveScore, MultiSportLiveScore } from '../../../src/services/firebaseService';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { MatchStatus, MatchSummary } from '../../../src/types';

const SPORT_FILTERS = [
  { slug: 'all', name: 'All Sports', icon: 'grid-outline' },
  { slug: 'cricket', name: 'Cricket', icon: 'baseball-outline' },
  { slug: 'badminton', name: 'Badminton', icon: 'tennisball-outline' },
  { slug: 'volleyball', name: 'Volleyball', icon: 'american-football-outline' },
  { slug: 'tennis', name: 'Tennis', icon: 'tennisball-outline' },
  { slug: 'basketball', name: 'Basketball', icon: 'basketball-outline' },
  { slug: 'judo', name: 'Judo', icon: 'shield-outline' },
];

const STATUS_LABEL: Record<MatchStatus, string> = {
  live: 'LIVE',
  upcoming: 'UPCOMING',
  finished: 'FINISHED',
};

const STATUS_COLORS: Record<MatchStatus, { bg: string; text: string; dot: string }> = {
  live: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', dot: '#EF4444' },
  upcoming: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', dot: '#F59E0B' },
  finished: { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748B', dot: '#94A3B8' },
};

export default function LiveScoreScreen() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [liveScoreState, setLiveScoreState] = useState<Record<number, MultiSportLiveScore>>({});
  const [selectedSport, setSelectedSport] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const data = await matchService.fetchAll();
      setMatches(data);
      seedInitialLiveScores(data);
      setError(null);
    } catch {
      setError('Could not fetch matches. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  // Subscribe to Firebase real-time live score updates for all active matches
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

  const filteredMatches = selectedSport === 'all'
    ? matches
    : matches.filter((m) => m.sport.slug.toLowerCase() === selectedSport.toLowerCase());

  if (isLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loadingIndicator} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* Header Title Section */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Live Scores</Text>
          <View style={styles.firebaseBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.firebaseText}>Firebase Realtime Sync</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Real-time multi-sport scoreboard & live match tracking</Text>
      </View>

      {/* Horizontal Sport Filter Selector */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {SPORT_FILTERS.map((item) => {
            const isSelected = selectedSport === item.slug;
            return (
              <Pressable
                key={item.slug}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedSport(item.slug)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={16}
                  color={isSelected ? colors.white : colors.textMuted}
                />
                <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Live Matches List */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadMatches(true)} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={32} color={colors.primary} />
            <Text style={styles.emptyTitle}>{error ?? 'No live matches scheduled for this category'}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const liveData = liveScoreState[item.id];
          const status = item.status || 'live';
          const statusColors = STATUS_COLORS[status];

          // Backend (the admin panel's MySQL record) is the source of truth
          // for this metadata; liveData (Firestore/mock) only fills in when
          // the backend hasn't been given a value yet or Firebase is running
          // its local demo simulation.
          const formatText = item.format || liveData?.format || 'Single';
          const ageText = item.age_group || liveData?.age_group || 'Under 17';
          const categoryText = item.category || liveData?.category || 'District';
          const venueText = item.venue || liveData?.venue || 'Royal College Ground - Colombo';
          const countryText = item.country || liveData?.country || 'Sri Lanka';

          // Team details
          const homeName = item.home_team?.name || 'Amal Sampath';
          const awayName = item.away_team?.name || 'Asanka Herath';
          const homeSchool = item.home_team?.school_academy || liveData?.home_team?.school_academy || 'Maristella College';
          const awaySchool = item.away_team?.school_academy || liveData?.away_team?.school_academy || 'Ananda College';
          const homePhoto = item.home_team?.photo_url || item.home_team?.logo_url || liveData?.home_team?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
          const awayPhoto = item.away_team?.photo_url || item.away_team?.logo_url || liveData?.away_team?.photo_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80';

          // Ticking score numbers: Firestore (liveData) is the real-time
          // channel while a match is live. Once finished (or before Firebase
          // is configured), fall back to the final snapshot the admin panel
          // wrote to MySQL (`live_score`, shaped identically per sport key).
          const backendScore = (item.live_score ?? null) as Record<string, any> | null;

          // Live Score String Calculation — 0 across the board until the
          // admin actually clicks Start (no data yet is not a "demo" state).
          let scoreDisplay = '0 - 0';
          if (item.sport.slug === 'cricket') {
            const cs = liveData?.cricket_score ?? backendScore?.cricket_score;
            // team_a/team_b are fixed slots ("bats in innings 1"/"innings
            // 2"), not literal home/away — pick whichever is currently (or
            // finally) batting. Falls back to the old flat shape for
            // matches scored before the full two-innings scorer shipped.
            const battingTeam = cs?.team_a && cs?.team_b
              ? (cs.innings === 2 ? cs.team_b : cs.team_a)
              : null;
            const runs = battingTeam?.runs ?? cs?.runs ?? 0;
            const wickets = battingTeam?.wickets ?? cs?.wickets ?? 0;
            const oversText = battingTeam ? `${battingTeam.overs}.${battingTeam.balls}` : String(cs?.overs ?? 0);
            scoreDisplay = `${runs}/${wickets} (${oversText} ov)`;
          } else if (liveData?.racket_scores ?? backendScore?.racket_scores) {
            const rs = liveData?.racket_scores ?? backendScore?.racket_scores;
            scoreDisplay = `Set ${rs.current_set ?? 1}: ${rs.points_home ?? 0} - ${rs.points_away ?? 0}`;
          } else if (liveData?.team_score ?? backendScore?.team_score) {
            const ts = liveData?.team_score ?? backendScore?.team_score;
            scoreDisplay = `${ts.home_total ?? 0} - ${ts.away_total ?? 0}`;
          }

          return (
            <Pressable
              style={({ pressed }) => [styles.matchCard, pressed && styles.cardPressed]}
              onPress={() => router.push(`/(protected)/live-score/${item.id}`)}
            >
              {/* Top Metadata Bar matching Document Spec */}
              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{item.sport.name.toUpperCase()}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metaTagsScroll}>
                  <Text style={styles.metaTag}>{formatText}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaTag}>{ageText}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaTag}>{categoryText}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaTag}>{countryText}</Text>
                </ScrollView>
                <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
                  <Text style={[styles.statusText, { color: statusColors.text }]}>{STATUS_LABEL[status]}</Text>
                </View>
              </View>

              {/* Main Vs Team Container */}
              <View style={styles.teamsRow}>
                {/* Home Player / Team */}
                <View style={styles.teamCol}>
                  <Image source={{ uri: homePhoto }} style={styles.avatarImage} />
                  <Text style={styles.teamName} numberOfLines={1}>{homeName}</Text>
                  <Text style={styles.teamSub} numberOfLines={1}>{homeSchool}</Text>
                </View>

                {/* Vs Badge & Live Score Pill */}
                <View style={styles.vsCenterCol}>
                  <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillText}>{scoreDisplay}</Text>
                  </View>
                </View>

                {/* Away Player / Team */}
                <View style={styles.teamCol}>
                  <Image source={{ uri: awayPhoto }} style={styles.avatarImage} />
                  <Text style={styles.teamName} numberOfLines={1}>{awayName}</Text>
                  <Text style={styles.teamSub} numberOfLines={1}>{awaySchool}</Text>
                </View>
              </View>

              {/* Footer Row: Venue & Action Button */}
              <View style={styles.cardFooter}>
                <View style={styles.venueRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.venueText} numberOfLines={1}>{venueText}</Text>
                </View>
                <View style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>View Score</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  firebaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 94, 239, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.live,
  },
  firebaseText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  filterScroll: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterTextSelected: {
    color: colors.white,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  emptyTitle: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  matchCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
    gap: 8,
  },
  metaBadge: {
    backgroundColor: colors.navy,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  metaBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaTagsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  metaDot: {
    fontSize: 10,
    color: colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.white,
    marginBottom: 6,
  },
  teamName: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  teamSub: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  vsCenterCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    gap: 6,
  },
  vsBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.navy,
  },
  scorePill: {
    backgroundColor: 'rgba(21, 94, 239, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(21, 94, 239, 0.2)',
  },
  scorePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: spacing.sm,
  },
  venueText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
