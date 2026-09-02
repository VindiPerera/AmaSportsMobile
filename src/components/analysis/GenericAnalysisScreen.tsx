import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { playerService } from '../../services/playerService';
import { resolveSportRoute } from '../../utils/sportRoutes';
import { PlayerProfile, SportAnalysisResponse } from '../../types';
import { Button } from '../ui/Button';
import { AnalysisSkeleton } from './AnalysisSkeleton';
import { FormatFilterChips } from './FormatFilterChips';
import { GenericOverviewGrid } from './GenericOverviewGrid';
import { GenericStatBreakdownSection } from './GenericStatBreakdownSection';
import { GenericRecentFormSection } from './GenericRecentFormSection';
import { AnalysisSectionCard } from './AnalysisSectionCard';

interface GenericAnalysisScreenProps {
  player: PlayerProfile | null;
  sportSlug: string;
  sportName: string;
}

/** Per-sport hints the generic charts need — which column to chart by
 * Format, and which columns identify a Recent Form row's date/title. Kept
 * here (not on the backend) since it's purely a presentation choice; the
 * data itself is fully generic already. Falls back to sensible defaults
 * for any sport not listed. */
const SPORT_UI: Record<string, { dateKey: string; titleKey?: string; metricKey: string; metricLabel: string }> = {
  hockey: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'goals', metricLabel: 'Goals' },
  'base-ball': { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'runs', metricLabel: 'Runs' },
  netball: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'goals', metricLabel: 'Goals' },
  kabadi: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'raids', metricLabel: 'Raids' },
  judo: { dateKey: 'fight_date', titleKey: 'opponent', metricKey: 'matches', metricLabel: 'Fights' },
  basketball: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'points', metricLabel: 'Points' },
  football: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'goals', metricLabel: 'Goals' },
  rugby: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'tries', metricLabel: 'Tries' },
  boxing: { dateKey: 'fight_date', titleKey: 'opponent', metricKey: 'matches', metricLabel: 'Fights' },
  karate: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'matches', metricLabel: 'Matches' },
  chess: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'games', metricLabel: 'Games' },
  athletics: { dateKey: 'event_date', metricKey: 'matches', metricLabel: 'Events' },
  swimming: { dateKey: 'event_date', metricKey: 'matches', metricLabel: 'Events' },
  volleyball: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'attacking', metricLabel: 'Attacking' },
  'beach-volleyball': { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'attacking', metricLabel: 'Attacking' },
  elle: { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'runs', metricLabel: 'Runs' },
};

const DEFAULT_UI = { dateKey: 'match_date', titleKey: 'opponent', metricKey: 'matches', metricLabel: 'Matches' };

/** Sport slugs GenericSportAnalysisService knows how to aggregate on the
 * backend (see SportAnalysisConfig) — used by analysis.tsx to decide
 * whether a registered sport gets real charts or the "Coming Soon" screen. */
export const GENERIC_ANALYSIS_SLUGS = Object.keys(SPORT_UI);

/**
 * Generic counterpart to CricketAnalysisScreen — same shell (header,
 * Format filter, loading/error/empty states) but every section is driven
 * by the server's open-record response instead of Cricket's fixed fields.
 */
export function GenericAnalysisScreen({ player, sportSlug, sportName }: GenericAnalysisScreenProps) {
  const ui = SPORT_UI[sportSlug] ?? DEFAULT_UI;

  const [analysis, setAnalysis] = useState<SportAnalysisResponse | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  const load = useCallback(
    async (formatId: number | null) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await playerService.fetchSportAnalysis(sportSlug, formatId);
        setAnalysis(data);
      } catch {
        setError(`Could not load your ${sportName} analysis. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    },
    [sportSlug, sportName]
  );

  useFocusEffect(
    useCallback(() => {
      load(selectedFormatId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sportSlug])
  );

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    load(selectedFormatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormatId]);

  if (isLoading && !analysis) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnalysisSkeleton />
      </ScrollView>
    );
  }

  if (error && !analysis) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="cloud-offline-outline" size={36} color={colors.textFaint} />
        <Text style={styles.centerTitle}>Something went wrong</Text>
        <Text style={styles.centerText}>{error}</Text>
        <Button label="Retry" variant="outline" onPress={() => load(selectedFormatId)} style={styles.retryButton} />
      </View>
    );
  }

  if (!analysis) return null;

  if (!analysis.has_profile || !analysis.has_any_stats) {
    const route = resolveSportRoute({ slug: sportSlug, name: sportName }, 'edit');
    return (
      <View style={styles.centerState}>
        <View style={styles.emptyIconWrapper}>
          <Ionicons name="stats-chart-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.centerTitle}>
          {analysis.has_profile ? `No ${sportName} stats yet` : `${sportName} profile not found`}
        </Text>
        <Text style={styles.centerText}>
          {analysis.has_profile
            ? `Add your career or recent stats on the ${sportName} Profile form to see charts here.`
            : `Fill in your ${sportName} profile first — analysis charts build from those stats.`}
        </Text>
        <Button
          label={`Go to ${sportName} Profile`}
          onPress={() => router.push(route.pathname as never, route.params as never)}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        {player?.photo_url ? (
          <Image source={{ uri: player.photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{(player?.full_name || '?')[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.headerName} numberOfLines={1}>
              {player?.full_name || 'Player'}
            </Text>
            <View style={styles.sportBadge}>
              <Ionicons name="sparkles" size={11} color={colors.primary} />
              <Text style={styles.sportBadgeText}>{sportName}</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Career & Performance Overview</Text>
        </View>
      </View>

      <FormatFilterChips
        formats={analysis.available_formats}
        selectedId={selectedFormatId}
        onSelect={setSelectedFormatId}
      />

      {error ? (
        <View style={styles.inlineError}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.live} />
          <Text style={styles.inlineErrorText}>Showing last loaded data — {error}</Text>
        </View>
      ) : null}

      <GenericOverviewGrid overview={analysis.overview} />

      {analysis.personal_bests.length > 0 ? (
        <AnalysisSectionCard title="Personal Bests" icon="ribbon-outline">
          {analysis.personal_bests.map((pb, idx) => (
            <View key={idx} style={styles.pbRow}>
              <Text style={styles.pbLabel}>{pb.event || 'Event'}</Text>
              <Text style={styles.pbValue}>{pb.value || '-'}</Text>
            </View>
          ))}
        </AnalysisSectionCard>
      ) : null}

      <GenericStatBreakdownSection byFormat={analysis.by_format} metricKey={ui.metricKey} metricLabel={ui.metricLabel} />

      <AnalysisSectionCard title="Recent Form" icon="trending-up-outline">
        <GenericRecentFormSection recentForm={analysis.recent_form} dateKey={ui.dateKey} titleKey={ui.titleKey} />
      </AnalysisSectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 2,
    paddingTop: spacing.xs,
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  headerName: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.full,
  },
  sportBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
    fontSize: 12,
    marginTop: 2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['3xl'],
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  centerTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  centerText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
    minWidth: 200,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.liveLight,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  inlineErrorText: {
    ...typography.caption,
    color: colors.live,
    flex: 1,
  },
  pbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
  },
  pbLabel: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
  },
  pbValue: {
    ...typography.body,
    fontSize: 13,
    color: colors.textMuted,
  },
});
