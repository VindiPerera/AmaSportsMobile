import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, View, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { ImageLightbox } from '../../../src/components/ui/ImageLightbox';
import { SubscriptionStatusCard } from '../../../src/components/subscription/SubscriptionStatusCard';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
import { playerService } from '../../../src/services/playerService';
import { resolveSportRoute } from '../../../src/utils/sportRoutes';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { PlayerProfile, PlayerSportEntry } from '../../../src/types';

/**
 * "My Sports" hub — the tab named "Player Profile" in the bottom nav.
 * Restyled with a dark gradient hero section, player summary stat chips,
 * card-based sports list, and a modern "Add Sport" CTA.
 */
export default function PlayerProfileHubScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const subscriptionStatus = useSubscriptionStore((s) => s.status);
  const refreshSubscription = useSubscriptionStore((s) => s.refresh);

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sports, setSports] = useState<PlayerSportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [playerData, sportsData] = await Promise.all([
        playerService.fetchProfile(),
        playerService.fetchSports(),
        refreshSubscription(),
      ]);
      setPlayer(playerData);
      setSports(sportsData);
    } catch {
      // Swallow — the screen shows what it last fetched
    } finally {
      setIsLoading(false);
    }
  }, [refreshSubscription]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const performLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) performLogout();
      return;
    }
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: performLogout },
    ]);
  };

  const openSport = (entry: PlayerSportEntry) => {
    // Both Home and Profile tab open the player detail view with an "Edit Profile" button option.
    router.push(resolveSportRoute(entry.sport, 'view'));
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll>
      {/* Dark Navy Hero Section */}
      <View style={[styles.heroCard, shadows.md]}>
        {player?.cover_photo_url ? (
          <Pressable onPress={() => setLightboxUri(player.cover_photo_url ?? null)} style={StyleSheet.absoluteFill}>
            <Image source={{ uri: player.cover_photo_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </Pressable>
        ) : null}
        {/* Light scrim — let the cover photo read clearly, only darken
            enough to keep the white name/chip text legible near the bottom. */}
        <LinearGradient
          colors={player?.cover_photo_url ? ['rgba(11, 25, 44, 0.15)', 'rgba(11, 25, 44, 0.55)'] : colors.gradientHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <Pressable onPress={handleLogout} style={styles.logoutButton} hitSlop={8}>
          <View style={styles.logoutIconWrapper}>
            <Ionicons name="log-out-outline" size={18} color={colors.white} />
          </View>
        </Pressable>

        <View style={styles.heroContent}>
          <View style={styles.avatarWrapper}>
            {(() => {
              const avatarUri = player?.photo_url || user?.photo_url;
              return avatarUri ? (
                <Pressable onPress={() => setLightboxUri(avatarUri)}>
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                </Pressable>
              ) : (
                <LinearGradient
                  colors={colors.gradientAccent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
                </LinearGradient>
              );
            })()}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color={colors.white} />
            </View>
          </View>

          <Text style={styles.name}>{player?.full_name || user?.name || 'Athlete'}</Text>
          <Text style={styles.email}>{player?.country || user?.email}</Text>

          {/* Hero Stat Summary Strip */}
          <View style={styles.summaryStrip}>
            <View style={styles.summaryChip}>
              <Ionicons name="trophy" size={14} color={colors.energy} />
              <Text style={styles.summaryChipText}>
                {sports.length} {sports.length === 1 ? 'Sport' : 'Sports'} Active
              </Text>
            </View>
            <View style={styles.summaryChip}>
              <View style={styles.activeDot} />
              <Text style={styles.summaryChipText}>Profile Verified</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Body: My Sports Section */}
      <View style={styles.bodySection}>
        <SubscriptionStatusCard status={subscriptionStatus} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MY SPORTS</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{sports.length}</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
        ) : sports.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="trophy-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No sports registered</Text>
            <Text style={styles.emptyText}>
              Add a sport to build your career stats, match logs, and athletic profile.
            </Text>
          </View>
        ) : (
          sports.map((entry) => (
            <Pressable
              key={entry.id}
              style={({ pressed }) => [styles.sportCard, shadows.sm, pressed && styles.sportCardPressed]}
              onPress={() => openSport(entry)}
            >
              <View style={styles.sportIconCircle}>
                <Ionicons name={sportIconFor(entry.sport.slug)} size={24} color={colors.primary} />
              </View>
              <View style={styles.sportTextBlock}>
                <Text style={styles.sportName}>{entry.sport.name}</Text>
                <View style={styles.statusBadgeRow}>
                  <View style={styles.statusPill}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={styles.statusPillText}>Profile Complete</Text>
                  </View>
                  <Text style={styles.sportSubtext}>• Tap to edit stats</Text>
                </View>
              </View>
              <View style={styles.chevronWrapper}>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Pressable>
          ))
        )}

        {/* Add Sport Action */}
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          onPress={() => router.push('/(protected)/player-profile/sport-picker')}
        >
          <View style={styles.addIconCircle}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </View>
          <View style={styles.addTextBlock}>
            <Text style={styles.addButtonText}>Add Another Sport</Text>
            <Text style={styles.addButtonSubtext}>Expand your athletic portfolio</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {isLoggingOut ? <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} /> : null}

      <ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.card,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  logoutButton: {
    alignSelf: 'flex-end',
  },
  logoutIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarInitial: {
    ...typography.display,
    color: colors.white,
    fontSize: 36,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  name: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  email: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  summaryChipText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  bodySection: {
    paddingHorizontal: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  countBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  loadingIndicator: {
    marginVertical: spacing.lg,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sportCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  sportIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportTextBlock: {
    flex: 1,
  },
  sportName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPillText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    fontSize: 12,
  },
  sportSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryLight,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTextBlock: {
    flex: 1,
  },
  addButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  addButtonSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
});

