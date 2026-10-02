import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, Modal, SafeAreaView } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { PlanOption } from '../../../src/components/subscription/PlanOption';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
import { subscriptionService } from '../../../src/services/subscriptionService';
import { lookupService } from '../../../src/services/lookupService';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { formatBornDate } from '../../../src/utils/date';
import { formatPrice } from '../../../src/utils/price';
import { ApiError, SportOption } from '../../../src/types';

const BENEFITS = [
  {
    icon: 'add-circle-outline' as const,
    title: 'Add every sport you play',
    text: 'Register and build a full profile for any of AmaX’s sports — one subscription covers every one of them, no per-sport fee.',
  },
  {
    icon: 'create-outline' as const,
    title: 'Edit your stats anytime',
    text: 'Career numbers, recent matches, personal bests — every sport profile you’ve built stays fully editable for as long as you’re subscribed.',
  },
  {
    icon: 'stats-chart-outline' as const,
    title: 'Analysis tab',
    text: 'In-depth career, format, and recent-form breakdowns. Cricket analytics are live now, with more sports rolling out.',
  },
  {
    icon: 'calendar-outline' as const,
    title: 'One price, a full year',
    text: 'Your subscription price covers everything above for a full 12 months — no extra or per-sport charges until it’s time to renew for the next year.',
  },
];

/** How many times to poll subscription-status after the in-app browser closes, before giving up and asking the player to check manually. */
// PayHere's notify_url usually lands within a few seconds of payment, but can lag.
const POLL_ATTEMPTS = 8;
const POLL_DELAY_MS = 2500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Subscribe/renew paywall (Phase 6 revision 2) — reached from Add Sport,
 * Analysis, a lapsed write (see apiClient's 402 handler), or Profile's
 * "Manage Subscription". Never trusts the PayHere redirect landing on the
 * backend's return page by itself: once the checkout view is dismissed for
 * any reason, it polls subscription-status itself (activation happens
 * server-side when PayHere calls the backend's notify_url).
 */
export default function SubscriptionPaywallScreen() {
  const status = useSubscriptionStore((s) => s.status);
  const refresh = useSubscriptionStore((s) => s.refresh);

  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollState, setPollState] = useState<'idle' | 'polling' | 'timed-out'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sports, setSports] = useState<SportOption[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'yearly'>('trial');
  // expires_at as it was when checkout opened — an upgrade/early renewal is
  // already `is_active`, so payment is confirmed by expires_at moving instead.
  const expiresBeforeCheckout = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsCheckingStatus(true);
      refresh().finally(() => setIsCheckingStatus(false));
    }, [refresh])
  );

  // Real sport list from the backend rather than a hardcoded copy of it —
  // stays correct as sports get added without anyone remembering to update
  // this screen. Purely informational here, so a failure just leaves the
  // chip row empty instead of blocking anything.
  useEffect(() => {
    lookupService
      .fetchAll()
      .then((lookups) => setSports(lookups.sports.filter((sport) => sport.has_full_form)))
      .catch(() => undefined);
  }, []);

  const isActive = !!status?.is_active;
  const isRenewal = status?.has_subscribed && !isActive;
  // First-time player who hasn't started (or used up) their one free 10-day
  // trial (Phase 8) picks a plan: Free (10 days) or the 1-year plan. Once
  // trial_eligible flips to false (trial started, or a lapsed trial was
  // used up), this always falls through to the normal subscribe/renew flow
  // below, even if `isRenewal` is also true.
  const canPickTrial = !isActive && !!status?.trial_eligible;
  const isTrialOffer = canPickTrial && selectedPlan === 'trial';
  // Already unlocked, but the year can still be bought — on the free trial
  // (upgrade) or in a paid year's last 30 days (renew early). Either way the
  // backend starts the new year when the current period ends.
  const isUpgrade = isActive && !!status?.is_trial && !!status?.can_purchase;
  const isEarlyRenewal = isActive && !status?.is_trial && !!status?.can_purchase;
  // plan_amount, not amount — amount is what the current row cost, 0 for the trial.
  const price = formatPrice(status?.plan_amount ?? status?.amount ?? 10, status?.currency);
  const currentEndsOn = status?.expires_at ? formatBornDate(status.expires_at) : 'N/A';

  const handleStartTrial = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      // No PayHere step at all — the backend unlocks access immediately and
      // returns the updated status directly, so there's nothing to poll for.
      await subscriptionService.startTrial();
      await refresh();
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start your free trial. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /** True once the paid year has landed — for an upgrade/early renewal the player was already active, so look for expires_at moving. */
  const isPaymentApplied = () => {
    const latest = useSubscriptionStore.getState().status;
    return !!latest?.is_active && latest.expires_at !== expiresBeforeCheckout.current;
  };

  const handleSubscribe = async () => {
    setError(null);
    setIsProcessing(true);
    setPollState('idle');
    expiresBeforeCheckout.current = status?.expires_at ?? null;
    try {
      const order = await subscriptionService.createOrder();
      setCheckoutUrl(order.approve_url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start checkout. Please try again.');
      setPollState('idle');
      setIsProcessing(false);
    }
  };

  const startPollingStatus = async () => {
    setCheckoutUrl(null);
    setPollState('polling');
    setIsProcessing(true);
    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
      await sleep(POLL_DELAY_MS);
      await refresh();
      if (isPaymentApplied()) {
        setPollState('idle');
        setIsProcessing(false);
        router.back();
        return;
      }
    }
    setPollState('timed-out');
    setIsProcessing(false);
  };

  const handleWebViewNavigation = (navState: WebViewNavigation) => {
    // Our backend's return/cancel pages (PayHere redirects there), or the
    // app deep link those pages bounce to — never PayHere's own pages.
    const url = navState.url;
    if (
      url.includes('payment-return') ||
      url.includes('/payments/subscriptions/return') ||
      url.includes('/payments/subscriptions/cancel')
    ) {
      startPollingStatus();
    }
  };

  // Cancel on the checkout sheet — re-enable the button (it stayed in its
  // loading state before) and quietly re-check status in case they had
  // already paid before closing.
  const handleCloseCheckout = () => {
    setCheckoutUrl(null);
    setIsProcessing(false);
    refresh();
  };

  const handleCheckAgain = async () => {
    setIsProcessing(true);
    await refresh();
    setIsProcessing(false);
    if (isPaymentApplied()) {
      router.back();
    }
  };

  return (
    <ScreenContainer edges={['bottom']} scroll>
      <LinearGradient
        colors={colors.gradientHero}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.heroCard, shadows.md]}
      >
        <View style={styles.heroIconCircle}>
          <Ionicons name="ribbon" size={28} color={colors.energy} />
        </View>
        <Text style={styles.heroTitle}>
          {canPickTrial
            ? 'Choose your plan'
            : isUpgrade
              ? 'Upgrade to 1 year'
              : isEarlyRenewal
                ? 'Renew your plan early'
                : isRenewal
                  ? 'Renew your subscription'
                  : 'Unlock AmaX'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {canPickTrial
            ? 'Try AmaX free for 10 days, or get the full year right away. Both unlock every sport you play and full performance analytics.'
            : isUpgrade
              ? `You’re on the free trial until ${currentEndsOn}. Upgrade now and your year starts when the trial ends — you keep every free day.`
              : isEarlyRenewal
                ? `Your plan runs until ${currentEndsOn}. Renew now and the next year is added on top — no gap in access.`
                : isRenewal
                  ? 'Your subscription has expired. Renew to keep adding sports, editing your stats, and viewing Analysis.'
                  : 'One subscription unlocks every sport you want to play and your full performance analytics.'}
        </Text>
        <View style={styles.priceRow}>
          {canPickTrial ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={styles.priceValue}>Free</Text>
                <Text style={styles.priceUnit}>for your first 10 days</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ ...typography.body, color: 'rgba(255,255,255,0.85)' }}>
                  Then
                </Text>
                <View style={{ backgroundColor: colors.energy, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 }}>
                  <Text style={{ ...typography.body, color: colors.navy, fontWeight: '800' }}>
                    {price} / year
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.priceValue}>{price}</Text>
              <Text style={styles.priceUnit}>/ year</Text>
            </>
          )}
        </View>
      </LinearGradient>

      <ErrorBanner message={error} />

      {isCheckingStatus ? (
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      ) : isActive && !status?.can_purchase ? (
        <View style={styles.activeCard}>
          <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          <Text style={styles.activeTitle}>You&rsquo;re already subscribed</Text>
          <Text style={styles.activeText}>
            Valid until {status.expires_at ? formatBornDate(status.expires_at) : 'N/A'}.
          </Text>
          <Button label="Done" onPress={() => router.back()} style={styles.doneButton} />
        </View>
      ) : (
        <>
          <View style={styles.benefitsCard}>
            {BENEFITS.map((benefit) => (
              <View key={benefit.title} style={styles.benefitRow}>
                <View style={styles.benefitIconCircle}>
                  <Ionicons name={benefit.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.benefitTextBlock}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
              </View>
            ))}
          </View>

          {sports.length > 0 && (
            <View style={styles.sportsCard}>
              <Text style={styles.sportsTitle}>Sports included</Text>
              <View style={styles.sportsChipRow}>
                {sports.map((sport) => (
                  <View key={sport.id} style={styles.sportChip}>
                    <Ionicons name={sportIconFor(sport.slug)} size={14} color={colors.primary} />
                    <Text style={styles.sportChipText}>{sport.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {canPickTrial && (
            <View style={styles.planList} accessibilityRole="radiogroup">
              <Text style={styles.planListTitle}>Pick a plan</Text>
              <PlanOption
                title="Free trial"
                price="Free"
                priceUnit="10 days"
                description="Full access for 10 days. No payment needed."
                icon="gift-outline"
                selected={selectedPlan === 'trial'}
                onPress={() => setSelectedPlan('trial')}
              />
              <PlanOption
                title="1 Year plan"
                price={price}
                priceUnit="/ year"
                description="Full access for 12 months. Renew each year."
                badge="BEST VALUE"
                icon="calendar-outline"
                selected={selectedPlan === 'yearly'}
                onPress={() => setSelectedPlan('yearly')}
              />
            </View>
          )}

          {isTrialOffer ? (
            <>
              <Button
                label="Start Free Trial"
                onPress={handleStartTrial}
                loading={isProcessing}
                disabled={isProcessing}
                style={styles.subscribeButton}
              />
              <Text style={styles.disclaimer}>
                Your trial lasts 10 days from the moment you start it — no payment, no charge. After that, keeping
                your sports and Analysis unlocked requires the {price}/year subscription;
                we&rsquo;ll remind you before it ends.
              </Text>
            </>
          ) : (
            <>
              {pollState === 'polling' ? (
                <View style={styles.pollingCard}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.pollingText}>Confirming your payment with PayHere…</Text>
                </View>
              ) : pollState === 'timed-out' ? (
                <View style={styles.pollingCard}>
                  <Ionicons name="time-outline" size={22} color={colors.warning} />
                  <Text style={styles.pollingText}>
                    Still confirming your payment — this can take a minute. Check again, or come back shortly.
                  </Text>
                  <Pressable onPress={handleCheckAgain} style={styles.checkAgainButton}>
                    <Text style={styles.checkAgainText}>I&apos;ve paid — check again</Text>
                  </Pressable>
                </View>
              ) : null}

              <Button
                label={
                  isUpgrade
                    ? `Upgrade to 1 Year — ${price}`
                    : isEarlyRenewal
                      ? `Renew Early — ${price}/year`
                      : `${isRenewal ? 'Renew Now' : 'Subscribe Now'} — ${price}/year`
                }
                onPress={handleSubscribe}
                loading={isProcessing}
                disabled={isProcessing}
                style={styles.subscribeButton}
              />
              {(isUpgrade || isEarlyRenewal) && (
                <Text style={styles.disclaimer}>
                  Your new year starts on {currentEndsOn}, when your current {isUpgrade ? 'free trial' : 'plan'} ends,
                  and runs for 12 months from then.
                </Text>
              )}
              <Text style={styles.disclaimer}>
                Payment is handled securely by PayHere{Platform.OS !== 'web' ? " in an in-app browser" : ''}. AmaX never sees or stores your card details.
              </Text>
            </>
          )}
          <Text style={styles.disclaimer}>
            This doesn&rsquo;t include VIP live-stream access, which is unlocked separately per match.
          </Text>
        </>
      )}

      {/* Embedded PayHere checkout WebView */}
      <Modal visible={!!checkoutUrl} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.webViewHeader}>
            <Pressable onPress={handleCloseCheckout} style={styles.webViewClose}>
              <Ionicons name="close" size={24} color={colors.text} />
              <Text style={styles.webViewCloseText}>Cancel</Text>
            </Pressable>
          </View>
          {checkoutUrl && (
            <WebView
              source={{ uri: checkoutUrl }}
              onNavigationStateChange={handleWebViewNavigation}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.md,
  },
  priceValue: {
    ...typography.display,
    color: colors.white,
    fontSize: 36,
  },
  priceUnit: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 6,
    marginLeft: 4,
  },
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  activeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.successBorder,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  activeTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  activeText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: spacing.md,
  },
  planList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  planListTitle: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  benefitsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  benefitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextBlock: {
    flex: 1,
  },
  benefitTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  benefitText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  sportsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sportsTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sportsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  sportChipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  pollingCard: {
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  pollingText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  checkAgainButton: {
    marginTop: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  checkAgainText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  subscribeButton: {
    marginBottom: spacing.sm,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    fontSize: 11,
    marginBottom: spacing.xl,
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  webViewClose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.xs,
  },
  webViewCloseText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
