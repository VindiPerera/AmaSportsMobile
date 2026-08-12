import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { playerService } from '../../../src/services/playerService';
import { PlayerSearchResult } from '../../../src/types';
import { fmtDecimal, fmtNumber, fmtPercent } from '../../../src/utils/statFormat';
import { formatShortMatchDate } from '../../../src/utils/date';

/**
 * Player Search (new — no prior search screen existed). Cricket-only for
 * now, matching the "coming soon" treatment every other sport already gets
 * on Analysis: Cricket is the only sport with real aggregated stats to show.
 */
export default function PlayerSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const trimmedQuery = query.trim();
  const isQueryTooShort = trimmedQuery.length < 2;

  const runSearch = useCallback((q: string) => {
    setIsLoading(true);
    playerService
      .searchPlayers(q)
      .then((data) => {
        setResults(data);
        setError(null);
      })
      .catch(() => setError('Could not search right now. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    // Nothing to reset here for the too-short case — the render below
    // treats `isQueryTooShort` as an independent, higher-priority branch,
    // so a stale `results`/`error` from a previous longer query is simply
    // never shown rather than needing to be cleared imperatively.
    if (isQueryTooShort) return;

    const timer = setTimeout(() => runSearch(trimmedQuery), 300);
    return () => clearTimeout(timer);
  }, [trimmedQuery, isQueryTooShort, runSearch]);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Find Players</Text>
        <Text style={styles.headerSubtitle}>Search Cricket players and their stats</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players by name..."
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={16} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isQueryTooShort ? (
          <View style={styles.promptState}>
            <View style={styles.promptIconWrapper}>
              <Ionicons name="people-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.promptTitle}>Find other players</Text>
            <Text style={styles.promptText}>Type at least 2 characters to search Cricket players by name.</Text>
          </View>
        ) : isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
        ) : error ? (
          <View style={styles.promptState}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.textFaint} />
            <Text style={styles.promptTitle}>Something went wrong</Text>
            <Text style={styles.promptText}>{error}</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.promptState}>
            <Ionicons name="search-outline" size={32} color={colors.textFaint} />
            <Text style={styles.promptTitle}>No players found</Text>
            <Text style={styles.promptText}>No Cricket players match &quot;{trimmedQuery}&quot;.</Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {results.map((item) => (
              <PlayerResultCard
                key={item.player_id}
                item={item}
                expanded={item.player_id === expandedId}
                onToggle={() => setExpandedId((prev) => (prev === item.player_id ? null : item.player_id))}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function PlayerResultCard({
  item,
  expanded,
  onToggle,
}: {
  item: PlayerSearchResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const initial = (item.full_name || '?')[0]?.toUpperCase();
  const metaLine = [item.sport, item.team].filter(Boolean).join(' · ');

  return (
    <View>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.resultCard,
          expanded && styles.resultCardExpanded,
          expanded && styles.resultCardExpandedBottom,
          pressed && styles.pressedOpacity,
        ]}
      >
        <View style={[styles.avatar, expanded && styles.avatarExpanded]}>
          <Text style={[styles.avatarText, expanded && styles.avatarTextExpanded]}>{initial}</Text>
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.full_name || 'Player'}
          </Text>
          <Text style={styles.resultMeta} numberOfLines={1}>
            {metaLine}
          </Text>
        </View>
        <View style={styles.headlineBlock}>
          <Text style={styles.headlineValue}>{fmtDecimal(item.overview.batting_average)}</Text>
          <Text style={styles.headlineLabel}>Bat Avg</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textFaint}
          style={expanded ? styles.chevronExpanded : undefined}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.expandPanel}>
          <View style={styles.statsGrid}>
            <ExpandStat label="Matches" value={fmtNumber(item.overview.matches)} />
            <ExpandStat label="Runs" value={fmtNumber(item.overview.runs)} />
            <ExpandStat label="Wickets" value={fmtNumber(item.overview.wickets)} />
            <ExpandStat label="Win %" value={fmtPercent(item.overview.win_percentage)} />
          </View>

          {item.recent_form.length > 0 ? (
            <>
              <Text style={styles.formLabel}>Recent Form</Text>
              <View style={styles.formRow}>
                {item.recent_form.map((m, idx) => (
                  <View
                    key={idx}
                    style={[styles.formDot, (m.runs ?? 0) >= 50 ? styles.formDotGood : styles.formDotNeutral]}
                  >
                    <Text
                      style={[
                        styles.formDotText,
                        (m.runs ?? 0) >= 50 ? styles.formDotTextGood : styles.formDotTextNeutral,
                      ]}
                    >
                      {m.runs ?? '-'}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.formHint}>Runs scored, most recent last · {formatShortMatchDate(item.recent_form[item.recent_form.length - 1]?.match_date)} onward</Text>
            </>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.viewProfileBtn, pressed && styles.pressedOpacity]}
            onPress={() => router.push(`/(protected)/player-search/${item.player_id}`)}
          >
            <Text style={styles.viewProfileText}>View Full Profile</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ExpandStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 50,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.text,
    height: '100%',
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
    flexGrow: 1,
  },
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  promptState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  promptIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  promptTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  promptText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  resultsList: {
    gap: spacing.sm,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
  },
  resultCardExpanded: {
    borderColor: colors.primary,
  },
  resultCardExpandedBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  pressedOpacity: {
    opacity: 0.85,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarExpanded: {
    backgroundColor: colors.navy,
  },
  avatarText: {
    ...typography.body,
    fontWeight: '800',
    fontSize: 15,
    color: colors.text,
  },
  avatarTextExpanded: {
    color: colors.energy,
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultName: {
    ...typography.body,
    fontWeight: '800',
    fontSize: 14,
    color: colors.text,
  },
  resultMeta: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  headlineBlock: {
    alignItems: 'flex-end',
  },
  headlineValue: {
    ...typography.body,
    fontWeight: '800',
    fontSize: 13,
    color: colors.text,
  },
  headlineLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textFaint,
    fontWeight: '600',
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  expandPanel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderTopWidth: 0,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    marginTop: -1,
    padding: spacing.sm + 2,
    gap: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
  },
  statTileValue: {
    ...typography.body,
    fontWeight: '800',
    fontSize: 14,
    color: colors.text,
  },
  statTileLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  formLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textFaint,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  formDot: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formDotGood: {
    backgroundColor: colors.energyLight,
  },
  formDotNeutral: {
    backgroundColor: colors.cardSubtle,
  },
  formDotText: {
    fontSize: 10,
    fontWeight: '800',
  },
  formDotTextGood: {
    color: '#7A8A0E',
  },
  formDotTextNeutral: {
    color: colors.textMuted,
  },
  formHint: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textFaint,
  },
  viewProfileBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  viewProfileText: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
    color: colors.white,
  },
});
