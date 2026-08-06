import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, StyleSheet, Text, View , Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';
import { PlayerProfile, PlayerSportEntry } from '../../../src/types';

/**
 * "My Sports" hub — the tab named "Player Profile" in the bottom nav. A
 * player can add more than one sport here (e.g. Cricket + Hockey); each
 * card links into that sport's full form or a "coming soon" placeholder.
 */
export default function PlayerProfileHubScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sports, setSports] = useState<PlayerSportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const load = useCallback(async () => {
    try {
      const [playerData, sportsData] = await Promise.all([
        playerService.fetchProfile(),
        playerService.fetchSports(),
      ]);
      setPlayer(playerData);
      setSports(sportsData);
    } catch {
      // Swallow — the screen just shows what it last had; user can pull back in via re-focus.
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch every time this tab regains focus (e.g. after saving a form).
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
    if (entry.sport.slug === 'cricket') {
      router.push('/(protected)/player-profile/cricket');
    } else if (entry.sport.slug === 'hockey') {
      router.push('/(protected)/player-profile/hockey');
    } else {
      router.push({
        pathname: '/(protected)/player-profile/coming-soon',
        params: { sport: entry.sport.name },
      });
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll>
      <View style={styles.header}>
        <Pressable onPress={handleLogout} style={styles.logoutButton} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
        </Pressable>

        {player?.photo_url ? (
          <Image source={{ uri: player.photo_url }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </LinearGradient>
        )}
        <Text style={styles.name}>{player?.full_name || user?.name}</Text>
        <Text style={styles.email}>{player?.country || user?.email}</Text>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>My Sports</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      ) : sports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="trophy-outline" size={28} color={colors.primary} />
          <Text style={styles.emptyTitle}>No sports added yet</Text>
          <Text style={styles.emptyText}>
            Add a sport to start building your player profile and career stats.
          </Text>
        </View>
      ) : (
        sports.map((entry) => (
          <Pressable
            key={entry.id}
            style={({ pressed }) => [styles.sportCard, pressed && styles.sportCardPressed]}
            onPress={() => openSport(entry)}
          >
            <View style={styles.sportIconWrapper}>
              <Ionicons name="american-football-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.sportTextBlock}>
              <Text style={styles.sportName}>{entry.sport.name}</Text>
              <Text style={styles.sportStatus}>
                {!entry.sport.has_full_form
                  ? 'Coming soon'
                  : entry.status === 'completed'
                    ? 'Profile complete'
                    : 'Tap to finish your profile'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </Pressable>
        ))
      )}

      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && styles.sportCardPressed]}
        onPress={() => router.push('/(protected)/player-profile/sport-picker')}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addButtonText}>Add Sport</Text>
      </Pressable>

      {isLoggingOut ? <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} /> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  logoutButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: spacing.xs,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInitial: {
    ...typography.h1,
    color: colors.white,
  },
  name: {
    ...typography.h2,
  },
  email: {
    ...typography.bodyMuted,
  },
  sectionHeaderRow: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.overline,
  },
  loadingIndicator: {
    marginVertical: spacing.lg,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
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
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sportCardPressed: {
    opacity: 0.85,
  },
  sportIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
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
  },
  sportStatus: {
    ...typography.caption,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  addButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
});
