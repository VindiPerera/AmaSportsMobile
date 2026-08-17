import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, Modal, SafeAreaView } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
import { subscriptionService } from '../../../src/services/subscriptionService';
import { lookupService } from '../../../src/services/lookupService';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { formatBornDate } from '../../../src/utils/date';
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
    text: '$10 covers everything above for 12 months from the day you subscribe — no extra or per-sport charges until it’s time to renew.',
  },
];

/** How many times to poll subscription-status after the in-app browser closes, before giving up and asking the player to check manually. */
const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Subscribe/renew paywall (Phase 6 revision 2) — reached from Add Sport,
 * Analysis, a lapsed write (see apiClient's 402 handler), or Profile's
 * "Manage Subscription". Never trusts the PayPal redirect landing on the
 * backend's return page by itself: once the in-app browser is dismissed for
 * any reason, it polls subscription-status itself.
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

  const isRenewal = status?.has_subscribed && !status?.is_active;
  // First-time player who hasn't started (or used up) their one free month
  // (Phase 8) — show the trial CTA instead of the $10/year flow. Once
  // trial_eligible flips to false (trial started, or a lapsed trial was
  // used up), this always falls through to the normal subscribe/renew flow
  // below, even if `isRenewal` is also true.
  const isTrialOffer = !status?.is_active && status?.trial_eligible;

  const handleStartTrial = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      // No PayPal step at all — the backend unlocks access immediately and
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

  const handleSubscribe = async () => {
    setError(null);
    setIsProcessing(true);
    setPollState('idle');
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
      if (useSubscriptionStore.getState().status?.is_active) {
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
    // If PayPal redirects back to our return URL or cancellation URL
    if (navState.url.includes('payment-return') || navState.url.includes('cancel')) {
      startPollingStatus();
    }
  };

  const handleCheckAgain = async () => {
    setIsProcessing(true);
    await refresh();
    setIsProcessing(false);
    if (useSubscriptionStore.getState().status?.is_active) {
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
          {isTrialOffer ? 'Your first month is free' : isRenewal ? 'Renew your subscription' : 'Unlock AmaX'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {isTrialOffer
            ? 'Start your free trial to add every sport you play and unlock full performance analytics — no payment needed.'
            : isRenewal
              ? 'Your subscription has expired. Renew to keep adding sports, editing your stats, and viewing Analysis.'
              : 'One subscription unlocks every sport you want to play and your full performance analytics.'}
        </Text>
        <View style={styles.priceRow}>
          {isTrialOffer ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={styles.priceValue}>Free</Text>
                <Text style={styles.priceUnit}>for your 1st month</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ ...typography.body, color: 'rgba(255,255,255,0.85)' }}>
                  Then
                </Text>
                <View style={{ backgroundColor: colors.energy, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 }}>
                  <Text style={{ ...typography.body, color: colors.navy, fontWeight: '800' }}>
                    ${(status?.amount || 10).toFixed(0)} / year
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.priceValue}>${(status?.amount || 10).toFixed(0)}</Text>
              <Text style={styles.priceUnit}>/ year</Text>
            </>
          )}
        </View>
      </LinearGradient>

      <ErrorBanner message={error} />

      {isCheckingStatus ? (
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      ) : status?.is_active ? (
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
                Your trial lasts one month from the moment you start it — no PayPal, no charge. After that, keeping
                your sports and Analysis unlocked requires the ${(status?.amount || 10).toFixed(0)}/year subscription;
                we&rsquo;ll remind you before it ends.
              </Text>
            </>
          ) : (
            <>
              {pollState === 'polling' ? (
                <View style={styles.pollingCard}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.pollingText}>Confirming your payment with PayPal…</Text>
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
                label={isRenewal ? 'Renew Now — $10/year' : 'Subscribe Now — $10/year'}
                onPress={handleSubscribe}
                loading={isProcessing}
                disabled={isProcessing}
                style={styles.subscribeButton}
              />
              <Text style={styles.disclaimer}>
                Payment is handled entirely by PayPal{Platform.OS !== 'web' ? " in an in-app browser" : ''}. AmaX never sees or stores your card details.
              </Text>
            </>
          )}
          <Text style={styles.disclaimer}>
            This doesn&rsquo;t include VIP live-stream access, which is unlocked separately per match for $5.
          </Text>
        </>
      )}

      {/* Embedded PayPal WebView */}
      <Modal visible={!!checkoutUrl} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.webViewHeader}>
            <Pressable onPress={() => setCheckoutUrl(null)} style={styles.webViewClose}>
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
