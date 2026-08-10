import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ScreenContainer } from '../../../../src/components/ui/ScreenContainer';
import { ErrorBanner } from '../../../../src/components/ui/ErrorBanner';
import { BottomNavigation } from '../../../../src/components/ui/BottomNavigation';
import { colors, spacing, typography } from '../../../../src/theme';
import { matchService } from '../../../../src/services/matchService';
import { extractYouTubeId } from '../../../../src/utils/youtube';

/**
 * Embedded YouTube live stream — plays inside the app rather than handing
 * off to the YouTube app/browser (spec §5), using the admin-pasted URL.
 */
export default function LiveStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();

  const [videoId, setVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    matchService
      .fetchOne(Number(id))
      .then((match) => {
        const extracted = extractYouTubeId(match.youtube_stream_url);
        if (!extracted) {
          setError('No live stream is available for this match yet.');
        }
        setVideoId(extracted);
      })
      .catch(() => setError('Could not load the live stream.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') setIsPlaying(false);
  }, []);

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
        ) : (
          <Text style={styles.fallbackText}>No live stream is available for this match yet.</Text>
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
});
