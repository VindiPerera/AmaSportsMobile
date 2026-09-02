import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { Chip } from '../../../src/components/ui/Chip';
import { ComingSoonAnalysis } from '../../../src/components/analysis/ComingSoonAnalysis';
import { AnalysisSkeleton } from '../../../src/components/analysis/AnalysisSkeleton';
import { CricketAnalysisScreen } from '../../../src/components/analysis/CricketAnalysisScreen';
import { GenericAnalysisScreen, GENERIC_ANALYSIS_SLUGS } from '../../../src/components/analysis/GenericAnalysisScreen';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
import { playerService } from '../../../src/services/playerService';
import { PlayerProfile, PlayerSportEntry } from '../../../src/types';

/**
 * Analysis tab — dispatches to a real per-sport analysis screen for every
 * sport the player has completed a profile for: Cricket gets its own
 * bespoke screen (CricketAnalysisScreen), every slug in
 * GENERIC_ANALYSIS_SLUGS gets the config-driven GenericAnalysisScreen, and
 * anything else (Tennis/Badminton/Table Tennis, Soft-Ball-Cricket — see
 * SportAnalysisConfig's docblock for why) falls back to "Coming Soon". A
 * chip row lets the player switch between sports when they've registered
 * more than one.
 */
export default function AnalysisScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sports, setSports] = useState<PlayerSportEntry[]>([]);
  const [selectedSportSlug, setSelectedSportSlug] = useState<string | null>(null);

  const subscriptionStatus = useSubscriptionStore((s) => s.status);
  const refreshSubscription = useSubscriptionStore((s) => s.refresh);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [, profile, playerSports] = await Promise.all([
        refreshSubscription(),
        playerService.fetchProfile(),
        playerService.fetchSports(),
      ]);
      setPlayer(profile);
      const completed = playerSports.filter((s) => s.status === 'completed');
      setSports(completed);
      setSelectedSportSlug((current) => {
        if (current && completed.some((s) => s.sport.slug === current)) return current;
        return completed[0]?.sport.slug ?? null;
      });
    } catch {
      setError('Could not load your sports. Pull to retry.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshSubscription]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (isLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <AnalysisSkeleton />
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={36} color={colors.textFaint} />
          <Text style={styles.centerTitle}>Something went wrong</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => { setIsLoading(true); load(); }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (subscriptionStatus && !subscriptionStatus.is_active) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <View style={styles.iconWrapper}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
          </View>
          <Text style={styles.centerTitle}>
            {subscriptionStatus.has_subscribed ? 'Subscription expired' : 'Unlock Analysis'}
          </Text>
          <Text style={styles.centerText}>
            {subscriptionStatus.has_subscribed
              ? 'Renew your $10/year AmaX subscription to keep viewing performance analytics.'
              : 'A $10/year AmaX subscription unlocks the Analysis tab and adding new sports.'}
          </Text>
          <Button
            label={subscriptionStatus.has_subscribed ? 'Renew Subscription' : 'Subscribe Now'}
            onPress={() => router.push('/(protected)/subscription/paywall')}
            fullWidth={false}
            style={styles.subscribeCta}
          />
        </View>
      </ScreenContainer>
    );
  }

  const selectedEntry = sports.find((s) => s.sport.slug === selectedSportSlug) ?? null;

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Performance breakdown</Text>
      </View>

      {sports.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.switcherWrapper}
          contentContainerStyle={styles.switcherRow}
        >
          {sports.map((entry) => (
            <Chip
              key={entry.sport.slug}
              label={entry.sport.name}
              tone="primary"
              active={entry.sport.slug === selectedSportSlug}
              onPress={() => setSelectedSportSlug(entry.sport.slug)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.body}>
        {!selectedEntry ? (
          <ComingSoonAnalysis />
        ) : selectedEntry.sport.slug === 'cricket' ? (
          <CricketAnalysisScreen player={player} />
        ) : GENERIC_ANALYSIS_SLUGS.includes(selectedEntry.sport.slug) ? (
          <GenericAnalysisScreen player={player} sportSlug={selectedEntry.sport.slug} sportName={selectedEntry.sport.name} />
        ) : (
          <ComingSoonAnalysis sportName={selectedEntry.sport.name} sportSlug={selectedEntry.sport.slug} />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
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
  switcherWrapper: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  switcherRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centerTitle: {
    ...typography.h2,
    textAlign: 'center',
    fontSize: 20,
  },
  centerText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  subscribeCta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  body: {
    flex: 1,
  },
});
