import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ScreenContainer } from '../../../../src/components/ui/ScreenContainer';
import { Button } from '../../../../src/components/ui/Button';
import { ErrorBanner } from '../../../../src/components/ui/ErrorBanner';
import { BottomNavigation } from '../../../../src/components/ui/BottomNavigation';
import { colors, radius, shadows, spacing, typography } from '../../../../src/theme';
import { matchService } from '../../../../src/services/matchService';
import { streamAccessService } from '../../../../src/services/streamAccessService';
import { extractYouTubeId } from '../../../../src/utils/youtube';
import { ApiError, MatchSummary } from '../../../../src/types';

/** How many times to poll the match after the in-app browser closes, before giving up and asking the viewer to check manually. */
const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Embedded YouTube live stream — plays inside the app rather than handing
 * off to the YouTube app/browser (spec §5), using the admin-pasted URL.
 * Gated by the $5/match unlock: an admin can already pay for this (Admin
 * panel), and — since `stream_access_active` is match-scoped, not
 * player-scoped — any player can now unlock the same match here as "VIP
 * access", opening it for every viewer (Phase 6 revision 3).
 */
export default function LiveStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const matchId = Number(id);

  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [pollState, setPollState] = useState<'idle' | 'polling' | 'timed-out'>('idle');

  const load = useCallback(() => {
    if (!id) return Promise.resolve();
    return matchService
      .fetchOne(matchId)
      .then((data) => {
        setMatch(data);
        setError(null);
      })
      .catch(() => setError('Could not load the live stream.'));
  }, [id, matchId]);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, [load]);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') setIsPlaying(false);
  }, []);

  // load() closes over stale state in the polling loop below — track the
  // latest match in a ref so the loop can read what it just fetched.
  const matchRef = useRef<MatchSummary | null>(null);
  matchRef.current = match;

  const handleUnlock = async () => {
    setError(null);
    setIsUnlocking(true);
    setPollState('idle');
    try {
      const order = await streamAccessService.createOrder(matchId);
      await WebBrowser.openBrowserAsync(order.approve_url);

      // The browser closing doesn't mean payment succeeded — poll instead
      // of trusting the redirect, same reasoning as the subscription paywall.
      setPollState('polling');
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
        await sleep(POLL_DELAY_MS);
        await load();
        if (matchRef.current?.stream_access_active) {
          setPollState('idle');
          setIsUnlocking(false);
          return;
        }
      }
      setPollState('timed-out');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start checkout. Please try again.');
      setPollState('idle');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCheckAgain = async () => {
    setIsUnlocking(true);
    await load();
    setIsUnlocking(false);
    if (matchRef.current?.stream_access_active) {
      setPollState('idle');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenContainer edges={['top']}>
          <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
        </ScreenContainer>
        <BottomNavigation activeTab="live-score" />
      </View>
    );
  }

  const videoId = match ? extractYouTubeId(match.youtube_stream_url) : null;
  const isFinished = match?.status === 'finished';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenContainer edges={['top']}>
        <ErrorBanner message={error} />
        {videoId ? (
          <View style={styles.playerWrapper}>
            <YoutubePlayer
              height={(width - spacing.lg * 2) * 0.5625}
              play={isPlaying}
              videoId={videoId}
              onChangeState={onStateChange}
            />
          </View>
        ) : match?.stream_access_active ? (
          <View style={styles.waitingCard}>
            <Ionicons name="time-outline" size={28} color={colors.textMuted} />
            <Text style={styles.waitingTitle}>Stream unlocked</Text>
            <Text style={styles.waitingText}>
              This match's live stream is unlocked — waiting for the broadcast to start.
            </Text>
          </View>
        ) : isFinished ? (
          <Text style={styles.fallbackText}>This match has ended.</Text>
        ) : (
          <LinearGradient
            colors={colors.gradientEnergy}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.vipCard, shadows.md]}
          >
            <View style={styles.vipIconCircle}>
              <Ionicons name="star" size={26} color={colors.white} />
            </View>
            <Text style={styles.vipTitle}>VIP Access</Text>
            <Text style={styles.vipSubtitle}>
              Unlock this match's live stream for every viewer — one payment covers everyone watching.
            </Text>
            <Text style={styles.vipPrice}>
              ${(match?.stream_access_amount ?? 5).toFixed(0)}
              <Text style={styles.vipPriceUnit}> / match</Text>
            </Text>

            {pollState === 'polling' ? (
              <View style={styles.pollingCard}>
                <ActivityIndicator color={colors.white} />
                <Text style={styles.pollingText}>Confirming your payment with PayPal…</Text>
              </View>
            ) : pollState === 'timed-out' ? (
              <View style={styles.pollingCard}>
                <Ionicons name="time-outline" size={20} color={colors.white} />
                <Text style={styles.pollingText}>
                  Still confirming — this can take a minute. Check again, or come back shortly.
                </Text>
                <Button
                  label="I've paid — check again"
                  onPress={handleCheckAgain}
                  loading={isUnlocking}
                  disabled={isUnlocking}
                  variant="secondary"
                  style={styles.checkAgainButton}
                />
              </View>
            ) : (
              <Button
                label="Unlock with VIP"
                onPress={handleUnlock}
                loading={isUnlocking}
                disabled={isUnlocking}
                variant="secondary"
                style={styles.unlockButton}
              />
            )}
            <Text style={styles.disclaimer}>
              Payment is handled entirely by PayPal
              {Platform.OS !== 'web' ? ' in an in-app browser' : ''}. AmaX never sees or stores your card details.
            </Text>
          </LinearGradient>
        )}
      </ScreenContainer>
      <BottomNavigation activeTab="live-score" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  playerWrapper: {
    marginTop: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  fallbackText: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  waitingCard: {
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  waitingTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  waitingText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  vipCard: {
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  vipIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  vipTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  vipSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  vipPrice: {
    ...typography.display,
    color: colors.white,
    fontSize: 32,
    marginTop: spacing.md,
  },
  vipPriceUnit: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  unlockButton: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  pollingCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'stretch',
  },
  pollingText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  checkAgainButton: {
    marginTop: spacing.xs,
    alignSelf: 'stretch',
  },
  disclaimer: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontSize: 11,
    marginTop: spacing.md,
  },
});
