import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { SubscriptionStatus } from '../../types';
import { formatBornDate } from '../../utils/date';

interface Props {
  status: SubscriptionStatus | null;
}

/**
 * Profile & Home subscription status card:
 * Redesigned into an ultra-modern VIP Athlete Pass with countdown pill,
 * subtle luxury gradients, and clear call-to-action.
 */
export function SubscriptionStatusCard({ status }: Props) {
  if (!status) return null;

  const goToPaywall = () => router.push('/(protected)/subscription/paywall');

  if (status.is_active) {
    const expiringSoon = status.expiring_soon;
    const isTrial = status.is_trial;
    const title = isTrial
      ? expiringSoon
        ? 'Free Trial Ending Soon'
        : 'Free Trial Active'
      : expiringSoon
        ? 'Subscription Expiring Soon'
        : 'Pro Athlete Active';

    const daysLeft = status.days_remaining;
    const daysLabel = `${daysLeft}d remaining`;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          expiringSoon ? styles.cardWarning : styles.cardActive,
          shadows.sm,
          pressed && styles.pressed,
        ]}
        onPress={goToPaywall}
        accessibilityRole="button"
        accessibilityLabel={`${title}. Tap to manage subscription.`}
      >
        <View style={styles.topRow}>
          <View style={styles.badgeGroup}>
            <View
              style={[
                styles.iconCircle,
                expiringSoon ? styles.iconCircleWarning : styles.iconCircleActive,
              ]}
            >
              <Ionicons
                name={expiringSoon ? 'time-outline' : isTrial ? 'sparkles-outline' : 'checkmark-circle-outline'}
                size={16}
                color={expiringSoon ? '#D97706' : '#059669'}
              />
            </View>
            <Text
              style={[
                styles.passType,
                expiringSoon ? styles.passTypeWarning : styles.passTypeActive,
              ]}
            >
              {isTrial ? 'FREE TRIAL' : 'PRO PASS'}
            </Text>
          </View>

          {daysLeft !== undefined && (
            <View
              style={[
                styles.daysBadge,
                expiringSoon ? styles.daysBadgeWarning : styles.daysBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.daysBadgeText,
                  expiringSoon ? styles.daysBadgeTextWarning : styles.daysBadgeTextActive,
                ]}
              >
                {daysLabel}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentRow}>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.text}>
              {expiringSoon
                ? isTrial
                  ? `Your trial concludes on ${formatBornDate(status.expires_at)} — upgrade to keep analytics.`
                  : `Renews on ${formatBornDate(status.expires_at)}.`
                : isTrial
                  ? `Full access active through ${formatBornDate(status.expires_at)}.`
                  : `Active through ${formatBornDate(status.expires_at)}.`}
            </Text>
          </View>

          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>
              {expiringSoon ? 'Upgrade' : 'Manage'}
            </Text>
            <Ionicons name="arrow-forward" size={12} color={colors.white} />
          </View>
        </View>
      </Pressable>
    );
  }

  const hasLapsed = status.has_subscribed;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, styles.cardExpired, shadows.sm, pressed && styles.pressed]}
      onPress={goToPaywall}
      accessibilityRole="button"
      accessibilityLabel="Subscription expired or inactive. Tap to subscribe."
    >
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <View style={[styles.iconCircle, styles.iconCircleExpired]}>
            <Ionicons name="lock-closed-outline" size={15} color="#DC2626" />
          </View>
          <Text style={[styles.passType, { color: '#DC2626' }]}>
            {hasLapsed ? 'MEMBERSHIP EXPIRED' : 'UPGRADE TO PRO'}
          </Text>
        </View>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>
            {hasLapsed ? 'Renew Your Access' : 'Unlock Pro Athlete Features'}
          </Text>
          <Text style={styles.text}>
            {hasLapsed
              ? 'Renew today to manage sports and unlock deep analytics.'
              : `Subscribe for $${status.amount.toFixed(0)}/year to unlock all sports & analysis.`}
          </Text>
        </View>

        <View style={[styles.actionBtn, { backgroundColor: colors.navy }]}>
          <Text style={styles.actionBtnText}>Unlock</Text>
          <Ionicons name="arrow-forward" size={12} color={colors.white} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  cardActive: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  cardExpired: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#ECFDF5',
  },
  iconCircleWarning: {
    backgroundColor: '#FEF3C7',
  },
  iconCircleExpired: {
    backgroundColor: '#FEE2E2',
  },
  passType: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  passTypeActive: {
    color: '#059669',
  },
  passTypeWarning: {
    color: '#B45309',
  },
  daysBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.full,
  },
  daysBadgeActive: {
    backgroundColor: '#ECFDF5',
  },
  daysBadgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  daysBadgeTextActive: {
    color: '#059669',
  },
  daysBadgeTextWarning: {
    color: '#B45309',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  text: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.navy,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radius.full,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
