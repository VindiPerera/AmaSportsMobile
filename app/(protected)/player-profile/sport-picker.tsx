import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { playerService } from '../../../src/services/playerService';
import { resolveSportRoute } from '../../../src/utils/sportRoutes';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { SportOption } from '../../../src/types';

/** Every sport minus ones the player already added — restyled with search & sport icons. */
export default function SportPickerScreen() {
  const lookups = useLookupStore((s) => s.lookups);
  const ensureLoaded = useLookupStore((s) => s.ensureLoaded);

  const [addedSportIds, setAddedSportIds] = useState<Set<number> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    return lookups.sports.filter(
      (sport) =>
        !addedSportIds.has(sport.id) &&
        sport.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [lookups, addedSportIds, searchQuery]);

  const handlePick = (sport: SportOption) => {
    setError(null);
    router.push(resolveSportRoute(sport));
  };

  const isLoading = !lookups || !addedSportIds;

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll>
      {/* Header Banner */}
      <LinearGradient
        colors={colors.gradientHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerBanner, shadows.md]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Add New Sport</Text>
        <Text style={styles.headerSubtitle}>Choose a sport to create your profile and stats.</Text>
      </LinearGradient>

      <ErrorBanner message={error} />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sports (e.g. Karate, Cricket)..."
          placeholderTextColor={colors.textFaint}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textFaint} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      ) : availableSports.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-circle-outline" size={32} color={colors.primary} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching sports found' : 'All sports added!'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try searching for another sport term.'
              : "You've already created profiles for every available sport."}
          </Text>
        </View>
      ) : (
        availableSports.map((sport) => (
          <Pressable
            key={sport.id}
            style={({ pressed }) => [styles.rowCard, shadows.sm, pressed && styles.rowPressed]}
            onPress={() => handlePick(sport)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={sportIconFor(sport.slug)} size={22} color={colors.primary} />
            </View>
            <View style={styles.rowTextBlock}>
              <Text style={styles.rowText}>{sport.name}</Text>
              <Text style={styles.rowSubtext}>Tap to set up profile form</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBanner: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  rowCard: {
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
  rowPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextBlock: {
    flex: 1,
  },
  rowText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  rowSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
});

