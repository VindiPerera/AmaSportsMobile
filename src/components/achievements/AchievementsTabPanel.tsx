import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing } from '../../theme';
import { useAchievements } from '../../hooks/useAchievements';
import { PlayerAchievement } from '../../types';
import { AchievementBadge, formatMetricNumber, resolveAchievementTheme } from './AchievementBadge';
import { AchievementDetailModal } from './AchievementDetailModal';

/**
 * Achievements Tab Panel inside player profile details:
 * Renders a 3-column collectible trophy grid with full milestone inspection.
 */
export function AchievementsTabPanel() {
  const { posted, isLoading } = useAchievements();
  const [selected, setSelected] = useState<PlayerAchievement | null>(null);

  if (isLoading && posted.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (posted.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="trophy" size={28} color={colors.energyDark} />
        </View>
        <Text style={styles.emptyTitle}>No Achievements Posted Yet</Text>
        <Text style={styles.emptyText}>
          Keep competing and logging match scorecards. When you shatter a personal or tournament milestone, you will receive an instant trophy celebration to post here.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.grid}>
        {posted.map((achievement) => {
          const theme = resolveAchievementTheme(achievement);
          const formattedValue = formatMetricNumber(achievement.achieved_value);

          return (
            <Pressable
              key={achievement.id}
              onPress={() => setSelected(achievement)}
              style={({ pressed }) => [styles.card, shadows.sm, pressed && styles.cardPressed]}
              accessibilityRole="button"
            >
              {/* Micro Tier Tag */}
              <View style={[styles.tierTag, { backgroundColor: theme.pillBg }]}>
                <View style={[styles.tierDot, { backgroundColor: theme.sparkColor }]} />
                <Text style={[styles.tierText, { color: theme.pillText }]}>
                  {theme.tierName}
                </Text>
              </View>

              {/* Medal with Aura */}
              <View style={styles.medalWrap}>
                <AchievementBadge achievement={achievement} size={56} />
              </View>

              {/* Title */}
              <Text style={styles.cardTitle} numberOfLines={2}>
                {achievement.title}
              </Text>

              {/* Value Pill */}
              <View style={styles.valuePill}>
                <Ionicons name="flash" size={10} color={colors.primary} />
                <Text style={styles.cardValue} numberOfLines={1}>
                  {formattedValue}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <AchievementDetailModal achievement={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  card: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: 4,
    gap: 5,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  tierTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tierDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tierText: {
    fontSize: 7.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  medalWrap: {
    marginVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardValue: {
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    color: colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.energyLight,
    borderWidth: 1,
    borderColor: '#D0F060',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
