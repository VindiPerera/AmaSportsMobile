import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { SubscriptionStatus } from '../../types';
import { formatBornDate } from '../../utils/date';

interface Props {
  status: SubscriptionStatus | null;
}

/**
 * Profile-tab subscription status card (Phase 6 revision 2 spec §"Showing
 * subscription status to the user"): active w/ expiry date, expiring-soon
 * reminder, or expired w/ renew prompt. Doubles as the "Manage Subscription"
 * entry point.
 */
export function SubscriptionStatusCard({ status }: Props) {
  if (!status) return null;

  const goToPaywall = () => router.push('/(protected)/subscription/paywall');

  if (status.is_active) {
    const expiringSoon = status.expiring_soon;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          expiringSoon ? styles.cardWarning : styles.cardSuccess,
          pressed && styles.pressed,
        ]}
        onPress={goToPaywall}
      >
        <View style={[styles.iconCircle, expiringSoon ? styles.iconCircleWarning : styles.iconCircleSuccess]}>
          <Ionicons
            name={expiringSoon ? 'time-outline' : 'checkmark-circle'}
            size={20}
            color={expiringSoon ? colors.warning : colors.success}
          />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>
            {expiringSoon ? 'Subscription expiring soon' : 'Subscription active'}
          </Text>
          <Text style={styles.text}>
            {expiringSoon
              ? `Renews needed — valid until ${formatBornDate(status.expires_at)} (${status.days_remaining} day${status.days_remaining === 1 ? '' : 's'} left).`
              : `Valid until ${formatBornDate(status.expires_at)}.`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    );
  }

  const hasLapsed = status.has_subscribed;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, styles.cardExpired, pressed && styles.pressed]}
      onPress={goToPaywall}
    >
      <View style={[styles.iconCircle, styles.iconCircleExpired]}>
        <Ionicons name="lock-closed" size={20} color={colors.live} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{hasLapsed ? 'Subscription expired' : 'No active subscription'}</Text>
        <Text style={styles.text}>
          {hasLapsed
            ? 'Renew to add sports or view analysis.'
            : `Subscribe for $${status.amount.toFixed(0)}/year to add sports and unlock Analysis.`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardSuccess: { borderColor: colors.successBorder },
  cardWarning: { borderColor: colors.warning },
  cardExpired: { borderColor: colors.liveBorder },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSuccess: { backgroundColor: colors.successLight },
  iconCircleWarning: { backgroundColor: colors.warningLight },
  iconCircleExpired: { backgroundColor: colors.liveLight },
  textBlock: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  text: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
});
