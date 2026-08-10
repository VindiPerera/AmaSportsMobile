import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../../theme';
import { SubscriptionStatus } from '../../types';

interface Props {
  status: SubscriptionStatus | null;
}

/**
 * Compact Home-tab subscription chip (Phase 6 revision 2) — sits in the dark
 * hero section alongside the other translucent chips there. Neutral while
 * comfortably active, and switches to an amber/red call-to-action once
 * expiring soon or expired, matching the Profile tab's fuller status card.
 */
export function SubscriptionStatusChip({ status }: Props) {
  if (!status) return null;

  const goToPaywall = () => router.push('/(protected)/subscription/paywall');

  if (status.is_active && !status.expiring_soon) {
    return (
      <View style={styles.chip}>
        <Ionicons name="shield-checkmark" size={12} color={colors.success} />
        <Text style={styles.chipText}>Subscribed</Text>
      </View>
    );
  }

  const isExpired = !status.is_active;
  const label = isExpired
    ? status.has_subscribed
      ? 'Subscription expired — renew'
      : 'Subscribe to unlock more'
    : `Renews in ${status.days_remaining}d`;

  return (
    <Pressable
      style={({ pressed }) => [styles.chip, styles.chipAlert, pressed && styles.pressed]}
      onPress={goToPaywall}
    >
      <Ionicons name={isExpired ? 'alert-circle' : 'time-outline'} size={12} color={colors.energy} />
      <Text style={[styles.chipText, styles.chipAlertText]}>{label}</Text>
      <Ionicons name="chevron-forward" size={11} color={colors.energy} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipAlert: {
    backgroundColor: 'rgba(255, 107, 53, 0.18)',
  },
  pressed: {
    opacity: 0.85,
  },
  chipText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  chipAlertText: {
    color: colors.energyLight,
  },
});
