import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { PlayerAchievement } from '../../types';
import { AchievementBadge, formatMetricNumber, resolveAchievementTheme } from './AchievementBadge';

interface AchievementDetailModalProps {
  achievement: PlayerAchievement | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * Modern Athletic Milestone Detail Modal:
 * Displays full prestige breakdown, benchmark performance, and official athlete verification.
 */
export function AchievementDetailModal({ achievement, onClose }: AchievementDetailModalProps) {
  if (!achievement) return null;

  const theme = resolveAchievementTheme(achievement);
  const formattedAchieved = achievement.achieved_value.toLocaleString();
  const formattedThreshold = achievement.threshold.toLocaleString();
  const hasExceeded = achievement.achieved_value > achievement.threshold;
  const ratio = achievement.threshold > 0 ? (achievement.achieved_value / achievement.threshold) : 1;

  return (
    <Modal visible={!!achievement} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <SafeAreaView edges={['bottom']} style={styles.sheetWrap}>
          <View style={[styles.sheet, shadows.lg]}>
            {/* Top Sheet Drag / Grip Indicator */}
            <View style={styles.grabBar} />

            {/* Close Button */}
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>

            {/* Prestige Tier Pill */}
            <View style={[styles.tierPill, { backgroundColor: theme.pillBg }]}>
              <View style={[styles.tierDot, { backgroundColor: theme.sparkColor }]} />
              <Text style={[styles.tierPillText, { color: theme.pillText }]}>
                {theme.tierName} · OFFICIAL RECORD
              </Text>
            </View>

            {/* Hero Medal Insignia with Aura */}
            <View style={styles.badgeWrap}>
              <AchievementBadge achievement={achievement} size={96} showAura={true} />
            </View>

            {/* Title & Description */}
            <Text style={styles.title}>{achievement.title}</Text>
            <Text style={styles.description}>
              {achievement.description || `Official milestone recognizing an outstanding career achievement of ${formattedAchieved}.`}
            </Text>

            {/* Benchmark Performance Card */}
            <View style={styles.statsCard}>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>YOU REACHED</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{formattedAchieved}</Text>
                <Text style={styles.statSubText}>{formatMetricNumber(achievement.achieved_value)} recorded</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statPill}>
                <Text style={styles.statLabel}>BENCHMARK</Text>
                <Text style={styles.statValue}>{formattedThreshold}</Text>
                <Text style={styles.statSubText}>Threshold required</Text>
              </View>
            </View>

            {/* Performance Badge */}
            {hasExceeded ? (
              <View style={styles.exceededBadge}>
                <Ionicons name="shield-checkmark" size={13} color={colors.success} />
                <Text style={styles.exceededBadgeText}>
                  {ratio >= 2 ? `${ratio.toFixed(0)}x Benchmark Exceeded` : `Benchmark Cleared (+${(achievement.achieved_value - achievement.threshold).toLocaleString()})`}
                </Text>
              </View>
            ) : null}

            {/* Timeline Row */}
            <View style={styles.timelineBlock}>
              <View style={styles.timelineRow}>
                <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                <Text style={styles.timelineText}>
                  Unlocked on <Text style={styles.timelineHighlight}>{formatDate(achievement.unlocked_at)}</Text>
                </Text>
              </View>

              {achievement.posted_at ? (
                <View style={styles.postedRow}>
                  <Ionicons name="checkmark-circle" size={15} color={colors.success} />
                  <Text style={styles.postedText}>
                    Showcased on Athlete Profile since {formatDate(achievement.posted_at)}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Close Button */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.doneButton, pressed && styles.doneButtonPressed]}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheet: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
  },
  tierDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tierPillText: {
    fontSize: 9.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  badgeWrap: {
    marginVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
  },

  /* BENCHMARK STATS CARD */
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  statPill: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 9.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    color: colors.text,
  },
  statSubText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  exceededBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDFDF5',
    borderWidth: 1,
    borderColor: '#C6F6D5',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: spacing.sm,
  },
  exceededBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#15803D',
  },

  /* TIMELINE */
  timelineBlock: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 4,
    marginTop: spacing.md,
    gap: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.textMuted,
  },
  timelineHighlight: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.text,
  },
  postedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postedText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#15803D',
  },

  /* DONE BUTTON */
  doneButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md + 4,
    ...shadows.sm,
  },
  doneButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  doneButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.white,
  },
});
