import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { playerService } from '../../services/playerService';
import { CricketAnalysisResponse, PlayerProfile } from '../../types';
import { Button } from '../ui/Button';
import { AnalysisSkeleton } from './AnalysisSkeleton';
import { FormatFilterChips } from './FormatFilterChips';
import { CricketOverviewGrid } from './CricketOverviewGrid';
import { CricketBattingSection } from './CricketBattingSection';
import { CricketBowlingSection } from './CricketBowlingSection';
import { CricketRecentFormSection } from './CricketRecentFormSection';

interface CricketAnalysisScreenProps {
  player: PlayerProfile | null;
}

/**
 * Cricket's implementation of the generic Analysis shell — the only sport
 * with a real analysis screen for now (see analysis.tsx's component
 * registry). Strictly read-only: editing still happens on the Cricket
 * Profile form.
 */
export function CricketAnalysisScreen({ player }: CricketAnalysisScreenProps) {
  const [analysis, setAnalysis] = useState<CricketAnalysisResponse | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  const load = useCallback(async (formatId: number | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await playerService.fetchCricketAnalysis(formatId);
      setAnalysis(data);
    } catch {
      setError('Could not load your Cricket analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh on tab focus (e.g. after editing stats on the Profile tab) —
  // matches the pattern used by the Player Profile hub.
  useFocusEffect(
    useCallback(() => {
      load(selectedFormatId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useEffect(() => {
    // Skip the very first render — useFocusEffect above already covers it;
    // this effect only re-fetches when the player taps a different Format chip.
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
    return (
      <View style={styles.centerState}>
        <View style={styles.emptyIconWrapper}>
          <Ionicons name="stats-chart-outline" size={30} color={colors.primary} />
        </View>
        <Text style={styles.centerTitle}>
          {analysis.has_profile ? 'No cricket stats yet' : 'Cricket profile not found'}
        </Text>
        <Text style={styles.centerText}>
          {analysis.has_profile
            ? 'Add your batting, bowling or recent match stats on the Cricket Profile form to see charts here.'
            : 'Fill in your Cricket profile first — analysis charts build from those stats.'}
        </Text>
        <Button
          label="Go to Cricket Profile"
          onPress={() => router.push('/(protected)/player-profile/cricket')}
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
              <Text style={styles.sportBadgeText}>Cricket</Text>
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

      <CricketOverviewGrid overview={analysis.overview} />

      <CricketBattingSection
        batting={analysis.batting}
        boundaries={analysis.boundaries}
        recentForm={analysis.recent_form}
      />

      <CricketBowlingSection bowling={analysis.bowling} recentForm={analysis.recent_form} />

      <CricketRecentFormSection recentForm={analysis.recent_form} />
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
    marginBottom: spacing.md,
  },
  inlineErrorText: {
    ...typography.caption,
    color: colors.live,
    flex: 1,
  },
});
