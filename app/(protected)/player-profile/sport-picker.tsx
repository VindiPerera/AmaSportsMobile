import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { playerService } from '../../../src/services/playerService';
import { SportOption } from '../../../src/types';

/** Every sport minus ones the player already added — spec §6.1. */
export default function SportPickerScreen() {
  const lookups = useLookupStore((s) => s.lookups);
  const ensureLoaded = useLookupStore((s) => s.ensureLoaded);

  const [addedSportIds, setAddedSportIds] = useState<Set<number> | null>(null);
  const [addingSportId, setAddingSportId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureLoaded();
    playerService
      .fetchSports()
      .then((sports) => setAddedSportIds(new Set(sports.map((s) => s.sport.id))))
      .catch(() => setAddedSportIds(new Set()));
  }, [ensureLoaded]);

  const availableSports = useMemo(() => {
    if (!lookups || !addedSportIds) return [];
    return lookups.sports.filter((sport) => !addedSportIds.has(sport.id));
  }, [lookups, addedSportIds]);

  const handlePick = async (sport: SportOption) => {
    setError(null);
    setAddingSportId(sport.id);
    try {
      await playerService.addSport(sport.id);
      if (sport.slug === 'cricket') {
        router.replace('/(protected)/player-profile/cricket');
      } else if (sport.slug === 'hockey') {
        router.replace('/(protected)/player-profile/hockey');
      } else {
        router.replace({
          pathname: '/(protected)/player-profile/coming-soon',
          params: { sport: sport.name },
        });
      }
    } catch {
      setError('Could not add that sport. Please try again.');
      setAddingSportId(null);
    }
  };

  const isLoading = !lookups || !addedSportIds;

  return (
    <ScreenContainer edges={['bottom']} scroll>
      <Text style={styles.subtitle}>Choose a sport to build your player profile for.</Text>
      <ErrorBanner message={error} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      ) : availableSports.length === 0 ? (
        <Text style={styles.emptyText}>You&apos;ve already added every available sport.</Text>
      ) : (
        availableSports.map((sport) => (
          <Pressable
            key={sport.id}
            disabled={addingSportId !== null}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => handlePick(sport)}
          >
            <Text style={styles.rowText}>{sport.name}</Text>
            {addingSportId === sport.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            )}
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...typography.bodyMuted,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  emptyText: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowText: {
    ...typography.body,
    fontWeight: '600',
  },
});
