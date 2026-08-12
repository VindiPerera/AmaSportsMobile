import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { CricketAnalysisScreen } from '../../../src/components/analysis/CricketAnalysisScreen';
import { ComingSoonAnalysis } from '../../../src/components/analysis/ComingSoonAnalysis';
import { AnalysisSkeleton } from '../../../src/components/analysis/AnalysisSkeleton';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { playerService } from '../../../src/services/playerService';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { PlayerProfile, PlayerSportEntry } from '../../../src/types';

/**
 * Generic sport-switching shell for the Analysis tab (spec Phase 5 §1).
 * Register a real analysis component here as each sport gets one later —
 * everything else (picker, empty/loading states) stays untouched.
 */
const SPORT_ANALYSIS_COMPONENTS: Partial<Record<string, React.ComponentType<{ player: PlayerProfile | null }>>> = {
  cricket: CricketAnalysisScreen,
};

export default function AnalysisScreen() {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sports, setSports] = useState<PlayerSportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const subscriptionStatus = useSubscriptionStore((s) => s.status);
  const refreshSubscription = useSubscriptionStore((s) => s.refresh);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [playerData, sportsData] = await Promise.all([
        playerService.fetchProfile(),
        playerService.fetchSports(),
        refreshSubscription(),
      ]);
      setPlayer(playerData);
      setSports(sportsData);
      setSelectedSlug((current) => current ?? sportsData[0]?.sport.slug ?? null);
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

  if (sports.length === 0) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.centerState}>
          <View style={styles.iconWrapper}>
            <Ionicons name="stats-chart-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.centerTitle}>No sports registered yet</Text>
          <Text style={styles.centerText}>
            Add a sport on your Profile to start building the stats this screen charts.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => router.push('/(protected)/player-profile/sport-picker')}
          >
            <Text style={styles.retryButtonText}>Add a Sport</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const activeSlug = selectedSlug ?? sports[0].sport.slug;
  const activeSport = sports.find((s) => s.sport.slug === activeSlug)?.sport ?? sports[0].sport;
  const AnalysisComponent = SPORT_ANALYSIS_COMPONENTS[activeSlug];

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Performance breakdown</Text>
      </View>

      {sports.length > 1 ? (
        <View style={styles.pickerContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pickerScrollView}
            contentContainerStyle={styles.pickerRow}
          >
            {sports.map((entry) => {
              const active = entry.sport.slug === activeSlug;
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => setSelectedSlug(entry.sport.slug)}
                  style={({ pressed }) => [
                    styles.sportChip,
                    active && styles.sportChipActive,
                    pressed && styles.sportChipPressed,
                  ]}
                >
                  <Ionicons
                    name={sportIconFor(entry.sport.slug)}
                    size={16}
                    color={active ? colors.white : colors.primary}
                  />
                  <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>
                    {entry.sport.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.body}>
        {AnalysisComponent ? (
          <AnalysisComponent player={player} />
        ) : (
          <ComingSoonAnalysis sportName={activeSport.name} sportSlug={activeSport.slug} />
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
  pickerContainer: {
    marginBottom: spacing.sm,
  },
  pickerScrollView: {
    flexGrow: 0,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sportChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sportChipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  sportChipText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
  },
  sportChipTextActive: {
    color: colors.white,
  },
  body: {
    flex: 1,
  },
});
