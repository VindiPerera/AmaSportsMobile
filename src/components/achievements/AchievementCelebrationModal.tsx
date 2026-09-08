import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, Line, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { PlayerAchievement } from '../../types';
import { AchievementBadge, formatMetricNumber, resolveAchievementTheme } from './AchievementBadge';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#D7FF3F', // Energy Lime
  '#F59E0B', // 24K Gold
  '#FFFFFF', // Pure White
  '#38BDF8', // Ice Cyan
  '#F43F5E', // Ruby Pink
  '#A855F7', // Amethyst Purple
  '#10B981', // Emerald
];
const CONFETTI_COUNT = 32;

/**
 * Animated Celebration Confetti with varied shapes:
 * Diamonds, circles, and shimmering streamers.
 */
function ConfettiPiece({ index }: { index: number }) {
  const fall = useSharedValue(0);
  const startX = Math.random() * SCREEN_WIDTH;
  const drift = (Math.random() - 0.5) * 160;
  const delay = Math.random() * 300;
  const duration = 2000 + Math.random() * 1000;
  const size = 7 + Math.random() * 7;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const shapeType = index % 3; // 0 = diamond, 1 = circle, 2 = rectangle

  useEffect(() => {
    fall.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: fall.value * (SCREEN_HEIGHT * 0.75) },
      { translateX: drift * fall.value },
      { rotate: `${fall.value * (index % 2 === 0 ? 540 : -540)}deg` },
      { scale: 1 - fall.value * 0.2 },
    ],
    opacity: 1 - Math.max(0, fall.value - 0.75) * 4,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confettiPiece,
        animatedStyle,
        {
          left: startX,
          width: shapeType === 2 ? size * 0.6 : size,
          height: shapeType === 2 ? size * 1.5 : size,
          backgroundColor: color,
          borderRadius: shapeType === 1 ? size / 2 : shapeType === 0 ? 2 : 1,
        },
      ]}
    />
  );
}

/**
 * Rotating Radiant Sunburst Beams behind the medal
 */
function RotatingAuraBeams({ color }: { color: string }) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 14000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.95, { duration: 1600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: pulse.value },
    ],
  }));

  const numRays = 12;
  const radiusRay = 90;
  const center = 100;

  return (
    <Animated.View style={[styles.auraWrapper, animatedStyle]}>
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <Stop offset="60%" stopColor={color} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={center} cy={center} r={95} fill="url(#auraGlow)" />
        <G stroke={color} strokeWidth={3} strokeOpacity={0.4} strokeLinecap="round">
          {Array.from({ length: numRays }).map((_, i) => {
            const angle = (i * 360) / numRays * (Math.PI / 180);
            const x2 = center + radiusRay * Math.cos(angle);
            const y2 = center + radiusRay * Math.sin(angle);
            const x1 = center + 48 * Math.cos(angle);
            const y1 = center + 48 * Math.sin(angle);
            return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </G>
      </Svg>
    </Animated.View>
  );
}

/**
 * Spring-Loaded Medal with continuous breathing float
 */
function PopMedal({ achievement }: { achievement: PlayerAchievement }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withDelay(120, withTiming(1.22, { duration: 420, easing: Easing.out(Easing.back(2.4)) })),
      withTiming(1, { duration: 180 }),
      withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.quad) }),
            withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        )
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AchievementBadge achievement={achievement} size={108} showAura={true} />
    </Animated.View>
  );
}

interface AchievementCelebrationModalProps {
  achievement: PlayerAchievement | null;
  queueCount: number;
  isPosting: boolean;
  onPost: () => void;
  onDismiss: () => void;
}

/**
 * World-Class Athletic Milestone Celebration Popup:
 * - Brand-aligned obsidian & midnight charcoal palette
 * - Rotating radiant sunburst beams
 * - Multi-colored confetti fireworks
 * - Spring-loaded medal pop
 * - Glassmorphic benchmark HUD
 * - High-voltage Energy Lime CTA
 */
export function AchievementCelebrationModal({
  achievement,
  queueCount,
  isPosting,
  onPost,
  onDismiss,
}: AchievementCelebrationModalProps) {
  if (!achievement) return null;

  const theme = resolveAchievementTheme(achievement);
  const formattedAchieved = achievement.achieved_value.toLocaleString();
  const formattedThreshold = achievement.threshold.toLocaleString();
  const hasExceeded = achievement.achieved_value > achievement.threshold;

  return (
    <Modal visible={!!achievement} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        {/* Confetti Fireworks */}
        {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiPiece key={`${achievement.id}-${i}`} index={i} />
        ))}

        {/* Backdrop dismiss pressable */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        {/* Main Obsidian Luxury Trophy Card */}
        <LinearGradient
          colors={['#1E293B', '#111827', '#030712']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.card, shadows.lg]}
        >
          {/* Close X Button */}
          <Pressable
            onPress={onDismiss}
            hitSlop={10}
            style={styles.closeButton}
            accessibilityRole="button"
          >
            <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>

          {/* Glowing Pill Eyebrow */}
          <View style={styles.eyebrowBadge}>
            <Ionicons name="sparkles" size={12} color={colors.energy} />
            <Text style={styles.eyebrowText}>NEW MILESTONE UNLOCKED</Text>
          </View>

          {/* Hero Insignia with Rotating Aura */}
          <View style={styles.medalContainer}>
            <RotatingAuraBeams color={theme.sparkColor} />
            <PopMedal achievement={achievement} />
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.subtitle}>
            {achievement.description || 'Outstanding career performance logged on the official leaderboard.'}
          </Text>

          {/* Benchmark HUD Pod */}
          <View style={styles.hudPod}>
            <View style={styles.hudStatBlock}>
              <Text style={styles.hudLabel}>YOU LOGGED</Text>
              <Text style={[styles.hudValue, { color: colors.energy }]}>
                {formatMetricNumber(achievement.achieved_value)}
              </Text>
              <Text style={styles.hudSub}>{formattedAchieved} total</Text>
            </View>

            <View style={styles.hudDivider} />

            <View style={styles.hudStatBlock}>
              <Text style={styles.hudLabel}>BENCHMARK</Text>
              <Text style={styles.hudValue}>{formatMetricNumber(achievement.threshold)}</Text>
              <Text style={styles.hudSub}>Threshold: {formattedThreshold}</Text>
            </View>
          </View>

          {hasExceeded ? (
            <View style={styles.bonusBadgeRow}>
              <Ionicons name="trending-up" size={13} color={colors.energy} />
              <Text style={styles.bonusBadgeText}>
                Benchmark shattered by +{(achievement.achieved_value - achievement.threshold).toLocaleString()}!
              </Text>
            </View>
          ) : null}

          {/* Multi-Queue Pill */}
          {queueCount > 0 ? (
            <View style={styles.queuePill}>
              <Text style={styles.queueText}>
                +{queueCount} more milestone{queueCount > 1 ? 's' : ''} awaiting review
              </Text>
            </View>
          ) : null}

          {/* CTA: Post to Profile */}
          <Pressable
            onPress={onPost}
            disabled={isPosting}
            style={({ pressed }) => [styles.postButton, pressed && styles.postButtonPressed]}
          >
            <LinearGradient
              colors={['#E4FF75', '#D7FF3F', '#A6D90A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.postGradient}
            >
              {isPosting ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="trophy" size={17} color={colors.primary} />
                  <Text style={styles.postButtonText}>Post to Athlete Profile</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* Secondary Dismiss Action */}
          <Pressable onPress={onDismiss} style={styles.laterButton}>
            <Text style={styles.laterButtonText}>Keep in Vault for Later</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  confettiPiece: {
    position: 'absolute',
    top: -20,
    zIndex: 10,
  },
  card: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 255, 63, 0.3)',
    paddingVertical: spacing.xl - 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    zIndex: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(215, 255, 63, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(215, 255, 63, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  eyebrowText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.energy,
    letterSpacing: 1.1,
  },
  medalContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  auraWrapper: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.72)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: spacing.xs,
  },

  /* HUD POD */
  hudPod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.card,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  hudStatBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  hudLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.8,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  hudValue: {
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.2,
  },
  hudSub: {
    fontSize: 9.5,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  hudDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  bonusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  bonusBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: colors.energy,
  },
  queuePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: spacing.xs + 2,
  },
  queueText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.65)',
  },

  /* POST CTA BUTTON */
  postButton: {
    width: '100%',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  postButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  postGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  postButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  laterButton: {
    marginTop: spacing.sm,
    paddingVertical: 6,
  },
  laterButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
