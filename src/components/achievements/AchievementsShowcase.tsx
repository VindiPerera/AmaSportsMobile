import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { PlayerAchievement } from '../../types';
import { AchievementBadgeCard } from './AchievementBadge';

interface AchievementsShowcaseProps {
  posted: PlayerAchievement[];
  /** Home shows a compact teaser; Player Profile shows the full case */
  limit?: number;
  emptyHint?: string;
  onPressAchievement?: (achievement: PlayerAchievement) => void;
}

/**
 * Modern Athletic Showcase:
 * Displays horizontal carousel of collectible achievement trophies.
 */
export function AchievementsShowcase({
  posted,
  limit,
  emptyHint,
  onPressAchievement,
}: AchievementsShowcaseProps) {
  const rows = limit ? posted.slice(0, limit) : posted;

  if (rows.length === 0) {
    if (!emptyHint) return null;
    return (
      <View style={styles.container}>
        <SectionHeader count={0} />
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBadge}>
            <Ionicons name="trophy-outline" size={18} color={colors.textFaint} />
          </View>
          <Text style={styles.emptyText}>{emptyHint}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionHeader count={posted.length} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {rows.map((achievement) => (
          <AchievementBadgeCard
            key={achievement.id}
            achievement={achievement}
            onPress={onPressAchievement ? () => onPressAchievement(achievement) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ count }: { count: number }) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerTitleGroup}>
        <View style={styles.headerIconBadge}>
          <Ionicons name="trophy" size={13} color={colors.navy} />
        </View>
        <Text style={styles.headerTitle}>CAREER ACHIEVEMENTS</Text>
      </View>
      {count > 0 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count} UNLOCKED</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.energy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    color: colors.text,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  row: {
    gap: 10,
    paddingRight: spacing.md,
    paddingVertical: 4,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  emptyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
});
