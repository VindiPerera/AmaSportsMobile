import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { colors, radius, spacing, typography } from '../../theme';
import { SubscriptionStatus } from '../../types';

interface Props {
  /** null while subscription status is still loading — shows a spinner instead of the lock. */
  status: SubscriptionStatus | null;
}

/**
 * Full-screen "choose a plan first" lock shown over a sport profile form
 * opened for editing without an active plan (see player-profile/_layout).
 * Same copy rules as the Add Sport / Analysis locks: lapsed players are told
 * to renew, first-timers are sent to pick Free trial or the 1-year plan.
 */
export function PlanRequiredScreen({ status }: Props) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(protected)/(tabs)/player-profile'));

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={goBack} style={styles.backButton} hitSlop={8} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={22} color={colors.primary} />
      </Pressable>

      {!status ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : (
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={30} color={colors.primary} />
          </View>
          <Text style={styles.title}>{status.has_subscribed ? 'Your plan has ended' : 'Choose a plan first'}</Text>
          <Text style={styles.text}>
            {status.has_subscribed
              ? 'Renew your 1-year plan to add sports and edit your stats again. Your saved stats are kept and still visible.'
              : status.trial_eligible
                ? 'Start a free 10-day trial or get the 1-year plan to add your sport details and stats.'
                : 'Get the 1-year plan to add your sport details and stats.'}
          </Text>
          <Button
            label={status.has_subscribed ? 'Renew Plan' : 'See Plans'}
            onPress={() => router.push('/(protected)/subscription/paywall')}
            style={styles.button}
          />
          <Button label="Go Back" variant="ghost" onPress={goBack} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginTop: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: spacing['3xl'],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing['3xl'],
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  text: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  button: {
    marginBottom: spacing.xs,
  },
});
