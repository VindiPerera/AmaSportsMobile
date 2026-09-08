import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { PlayerAchievement } from '../../types';

export interface AchievementTheme {
  gradient: readonly [string, string, string];
  glow: string;
  rim: string;
  pillBg: string;
  pillText: string;
  tierName: string;
  sparkColor: string;
}

/**
 * Format huge numbers into compact pro athlete stat labels:
 * 55,555,572 -> 55.6M
 * 14,200 -> 14.2K
 * 14 -> 14
 */
export function formatMetricNumber(val: number): string {
  if (val >= 1_000_000_000) {
    return (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (val >= 1_000_000) {
    return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (val >= 10_000) {
    return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return val.toLocaleString();
}

/**
 * Smart Athletic Palette Harmonizer:
 * Analyzes the raw achievement color, title, and icon to map it into
 * a premier metallic prestige tier (Gold, Energy Lime, Ruby, Emerald, Sapphire, Amethyst, Obsidian).
 * Eliminates muddy browns or flat raw colors completely.
 */
export function resolveAchievementTheme(achievement: PlayerAchievement): AchievementTheme {
  const hex = (achievement.color || '').toLowerCase().trim();
  const title = (achievement.title || '').toLowerCase();
  const icon = (achievement.icon || '').toLowerCase();

  // 1. Check title/icon keywords first for semantic athletic meaning
  if (
    title.includes('century') ||
    title.includes('gold') ||
    title.includes('trophy') ||
    title.includes('champion') ||
    icon.includes('trophy') ||
    icon.includes('medal')
  ) {
    return {
      gradient: ['#FFF3B0', '#F59E0B', '#B45309'] as const,
      glow: 'rgba(245, 158, 11, 0.45)',
      rim: '#FDE68A',
      pillBg: '#FEF3C7',
      pillText: '#B45309',
      tierName: 'GOLD TIER',
      sparkColor: '#F59E0B',
    };
  }

  if (
    title.includes('debut') ||
    title.includes('rookie') ||
    title.includes('speed') ||
    title.includes('energy') ||
    icon.includes('flash') ||
    icon.includes('flag')
  ) {
    return {
      gradient: ['#F5FFDB', '#D7FF3F', '#84CC16'] as const,
      glow: 'rgba(215, 255, 63, 0.5)',
      rim: '#EAFF8A',
      pillBg: '#F5FFDB',
      pillText: '#3F6212',
      tierName: 'ELITE MARK',
      sparkColor: '#D7FF3F',
    };
  }

  if (
    title.includes('run machine') ||
    title.includes('fire') ||
    title.includes('flame') ||
    icon.includes('flame')
  ) {
    return {
      gradient: ['#FED7AA', '#F97316', '#C2410C'] as const,
      glow: 'rgba(249, 115, 22, 0.45)',
      rim: '#FFEDD5',
      pillBg: '#FFEDD5',
      pillText: '#C2410C',
      tierName: 'FLAME TIER',
      sparkColor: '#F97316',
    };
  }

  if (
    title.includes('500') ||
    title.includes('strike') ||
    title.includes('red') ||
    title.includes('beast') ||
    hex.startsWith('#e') ||
    hex.startsWith('#d0') ||
    hex.startsWith('#c')
  ) {
    return {
      gradient: ['#FECDD3', '#E11D48', '#9F1239'] as const,
      glow: 'rgba(225, 29, 72, 0.4)',
      rim: '#FFE4E6',
      pillBg: '#FFE4E6',
      pillText: '#9F1239',
      tierName: 'RUBY ELITE',
      sparkColor: '#E11D48',
    };
  }

  if (
    title.includes('fifty') ||
    title.includes('club') ||
    title.includes('star') ||
    icon.includes('ribbon') ||
    icon.includes('star')
  ) {
    return {
      gradient: ['#BAE6FD', '#0284C7', '#075985'] as const,
      glow: 'rgba(14, 165, 233, 0.4)',
      rim: '#E0F2FE',
      pillBg: '#E0F2FE',
      pillText: '#0369A1',
      tierName: 'STAR CLUB',
      sparkColor: '#0284C7',
    };
  }

  if (
    title.includes('scorer') ||
    title.includes('master') ||
    title.includes('green') ||
    hex.startsWith('#1') ||
    hex.startsWith('#2') ||
    hex.startsWith('#0')
  ) {
    return {
      gradient: ['#A7F3D0', '#10B981', '#065F46'] as const,
      glow: 'rgba(16, 185, 129, 0.4)',
      rim: '#D1FAE5',
      pillBg: '#DCFCE7',
      pillText: '#166534',
      tierName: 'MASTER TIER',
      sparkColor: '#10B981',
    };
  }

  // Fallback prestige tier
  return {
    gradient: ['#E9D5FF', '#A855F7', '#6B21A8'] as const,
    glow: 'rgba(168, 85, 247, 0.4)',
    rim: '#F3E8FF',
    pillBg: '#F3E8FF',
    pillText: '#6B21A8',
    tierName: 'PRO RECORD',
    sparkColor: '#A855F7',
  };
}

interface AchievementBadgeProps {
  achievement: PlayerAchievement;
  size?: number;
  showAura?: boolean;
}

/**
 * The luxury athletic insignia / medal badge:
 * - Ambient radial glow
 * - Specular outer rim ring
 * - Multi-stop metallic gradient
 * - Specular diagonal glass reflection
 * - Crisp centered icon with drop shadow
 */
export function AchievementBadge({ achievement, size = 56, showAura = true }: AchievementBadgeProps) {
  const theme = resolveAchievementTheme(achievement);
  const auraSize = size * 1.25;
  const iconSize = Math.round(size * 0.48);

  return (
    <View style={[styles.badgeContainer, { width: size, height: size }]}>
      {/* Ambient Back-Glow */}
      {showAura ? (
        <View
          style={[
            styles.aura,
            {
              width: auraSize,
              height: auraSize,
              borderRadius: auraSize / 2,
              backgroundColor: theme.glow,
            },
          ]}
        />
      ) : null}

      {/* Main Metallic Medal */}
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.rim,
          },
        ]}
      >
        {/* Specular Diagonal Glass Sheen */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.15)', 'transparent']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 0.8 }}
          style={[
            styles.specularShine,
            {
              width: size * 0.9,
              height: size * 0.5,
              borderRadius: size / 2,
            },
          ]}
        />

        {/* Center Icon */}
        <Ionicons
          name={(achievement.icon as keyof typeof Ionicons.glyphMap) || 'trophy'}
          size={iconSize}
          color={colors.white}
          style={styles.badgeIcon}
        />
      </LinearGradient>
    </View>
  );
}

/**
 * Collectible Pro Trophy Card:
 * Displays medal, dynamic tier chip, two-line title, and formatted metric pill.
 */
export function AchievementBadgeCard({
  achievement,
  onPress,
}: {
  achievement: PlayerAchievement;
  onPress?: () => void;
}) {
  const theme = resolveAchievementTheme(achievement);
  const formattedMetric = formatMetricNumber(achievement.achieved_value);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, shadows.sm, pressed && onPress && styles.cardPressed]}
    >
      {/* Tier / Status Micro Tag */}
      <View style={[styles.cardTierTag, { backgroundColor: theme.pillBg }]}>
        <View style={[styles.tierDot, { backgroundColor: theme.sparkColor }]} />
        <Text style={[styles.cardTierText, { color: theme.pillText }]}>
          {theme.tierName}
        </Text>
      </View>

      {/* Medal Insignia with Aura */}
      <View style={styles.medalHolder}>
        <AchievementBadge achievement={achievement} size={54} />
      </View>

      {/* Title */}
      <Text style={styles.cardTitle} numberOfLines={2}>
        {achievement.title}
      </Text>

      {/* Metric / Value Pill */}
      <View style={styles.metricPill}>
        <Ionicons name="flash" size={10} color={colors.primary} />
        <Text style={styles.metricText} numberOfLines={1}>
          {formattedMetric}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    opacity: 0.75,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    overflow: 'hidden',
  },
  specularShine: {
    position: 'absolute',
    top: 1,
    left: 1,
    borderTopLeftRadius: radius.full,
    borderTopRightRadius: radius.full,
  },
  badgeIcon: {
    shadowColor: 'rgba(0, 0, 0, 0.45)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },

  /* COLLECTIBLE CARD */
  card: {
    width: 104,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: 6,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardTierTag: {
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
  cardTierText: {
    fontSize: 8,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  medalHolder: {
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
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metricText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '800',
    color: colors.text,
  },
});
