import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { ComingSoonAnalysis } from '../../../src/components/analysis/ComingSoonAnalysis';
import { AnalysisSkeleton } from '../../../src/components/analysis/AnalysisSkeleton';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';

/**
 * Analysis tab — intentionally decoupled from the player profile (no more
 * reading the player's registered sports or cricket stats to decide what to
 * show). A dedicated player analytics page is planned for the web app; this
 * tab will point at that data source once it exists, so it always renders
 * the generic "Coming Soon" placeholder below for now.
 *
 * The real per-sport analytics implementation isn't gone — it's just not
 * wired up here. See `src/components/analysis/CricketAnalysisScreen.tsx`
 * plus `playerService.fetchCricketAnalysis()` and the backend
 * CricketAnalysisController/Service, all left untouched for reconnecting
 * later (e.g. once this tab fetches from the new player analytics page).
 */
export default function AnalysisScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscriptionStatus = useSubscriptionStore((s) => s.status);
  const refreshSubscription = useSubscriptionStore((s) => s.refresh);

  const load = useCallback(async () => {
    setError(null);
    try {
      await refreshSubscription();
    } catch {
      setError('Could not load your subscription status. Pull to retry.');
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

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Performance breakdown</Text>
      </View>

      <View style={styles.body}>
        <ComingSoonAnalysis />
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
  body: {
    flex: 1,
  },
});
