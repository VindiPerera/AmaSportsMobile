import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { matchService } from '../../../src/services/matchService';
import { CricketLiveScore, MatchSummary } from '../../../src/types';

const STATUS_LABEL: Record<MatchSummary['status'], string> = {
  live: 'Live',
  upcoming: 'Upcoming',
  finished: 'Finished',
};

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    matchService
      .fetchOne(Number(id))
      .then(setMatch)
      .catch(() => setError('Could not load this match.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      </ScreenContainer>
    );
  }

  if (!match) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ErrorBanner message={error ?? 'Match not found.'} />
      </ScreenContainer>
    );
  }

  const cricketScore = match.sport.slug === 'cricket' ? (match.live_score as CricketLiveScore | null) : null;

  return (
    <ScreenContainer edges={['bottom']} scroll>
      <View style={styles.headerCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusBadge}>{STATUS_LABEL[match.status]}</Text>
          <Text style={styles.sportName}>{match.sport.name}</Text>
        </View>
        <Text style={styles.teams}>
          {match.home_team.name} vs {match.away_team.name}
        </Text>
        {match.venue ? <Text style={styles.venue}>{match.venue}</Text> : null}
      </View>

      <Text style={styles.sectionLabel}>Score</Text>
      {cricketScore ? (
        <View style={styles.scoreCard}>
          {cricketScore.batting_team ? (
            <ScoreRow label="Batting" value={cricketScore.batting_team} />
          ) : null}
          {cricketScore.runs !== undefined ? (
            <ScoreRow
              label="Score"
              value={`${cricketScore.runs}/${cricketScore.wickets ?? 0} (${cricketScore.overs ?? 0} ov)`}
            />
          ) : null}
          {cricketScore.summary ? <ScoreRow label="Summary" value={cricketScore.summary} /> : null}
        </View>
      ) : (
        <View style={styles.scoreCard}>
          <Text style={styles.noScoreText}>
            Live score isn&apos;t available for {match.sport.name} yet.
          </Text>
        </View>
      )}

      {match.youtube_stream_url ? (
        <Button
          label="View Live Stream"
          variant="energy"
          onPress={() => router.push(`/(protected)/live-score/stream/${match.id}`)}
          style={styles.streamButton}
        />
      ) : null}
    </ScreenContainer>
  );
}

function ScoreRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  headerCard: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    ...typography.caption,
    color: colors.live,
    fontWeight: '700',
  },
  sportName: {
    ...typography.caption,
  },
  teams: {
    ...typography.h2,
  },
  venue: {
    ...typography.bodyMuted,
  },
  sectionLabel: {
    ...typography.overline,
    marginBottom: spacing.md,
  },
  scoreCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    ...typography.caption,
  },
  scoreValue: {
    ...typography.body,
    fontWeight: '700',
  },
  noScoreText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  streamButton: {
    marginBottom: spacing.xl,
  },
});
