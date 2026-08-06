import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { matchService } from '../../../src/services/matchService';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { MatchStatus, MatchSummary } from '../../../src/types';

const STATUS_LABEL: Record<MatchStatus, string> = {
  live: 'Live',
  upcoming: 'Upcoming',
  finished: 'Finished',
};

const STATUS_COLORS: Record<MatchStatus, { bg: string; text: string }> = {
  live: { bg: colors.liveLight, text: colors.live },
  upcoming: { bg: colors.warningLight, text: colors.warning },
  finished: { bg: colors.card, text: colors.textMuted },
};

/** Covers both live scores and live streaming per spec §5 — this tab is the entry list. */
export default function LiveScoreScreen() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const data = await matchService.fetchAll();
      setMatches(data);
      setError(null);
    } catch {
      setError('Could not load matches. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (isLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <Text style={styles.title}>Live Score</Text>
      <FlatList
        data={matches}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="radio-outline" size={28} color={colors.primary} />
            <Text style={styles.emptyTitle}>{error ?? 'No matches scheduled right now'}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusColors = STATUS_COLORS[item.status];
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(`/(protected)/live-score/${item.id}`)}
            >
              <View style={styles.sportIconWrapper}>
                <Ionicons name={sportIconFor(item.sport.slug)} size={20} color={colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.teams}>
                  {item.home_team.name} vs {item.away_team.name}
                </Text>
                <Text style={styles.sportName}>{item.sport.name}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {STATUS_LABEL[item.status]}
                </Text>
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
  title: {
    ...typography.h2,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  sportIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  teams: {
    ...typography.body,
    fontWeight: '700',
  },
  sportName: {
    ...typography.caption,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
});
