import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { DiagonalShard } from './DiagonalShard';
import { colors, radius, spacing, typography } from '../../theme';

interface AuthHeroProps {
  /** Big headline — pass `\n` for the two-line treatment. */
  title: string;
  subtitle: string;
  showBack?: boolean;
  /** Small pill label in the top-right corner, e.g. "New here?". */
  tag?: string;
}

/**
 * Dark radial-gradient hero panel shared by the Login/Register screens —
 * same glow/shard language as the splash screen, so auth feels like part of
 * one brand moment instead of a bare form behind a plain header.
 */
export function AuthHero({ title, subtitle, showBack = false, tag }: AuthHeroProps) {
  const insets = useSafeAreaInsets();
  const glowPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowPulse]);

  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <View style={styles.hero}>
      {/* Radial navy gradient ground. */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="heroGround" cx="70%" cy="20%" r="75%">
            <Stop offset="0%" stopColor="#1c2434" />
            <Stop offset="55%" stopColor={colors.navy} />
            <Stop offset="100%" stopColor={colors.navyDark} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#heroGround)" />
      </Svg>

      {/* Floating lime glow blob, top-left. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.glowBlob, { transform: [{ scale: glowScale }] }]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.energy} stopOpacity={0.3} />
              <Stop offset="70%" stopColor={colors.energy} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#heroGlow)" />
        </Svg>
      </Animated.View>

      {/* Diagonal gold/lime shard, bottom-right. */}
      <View pointerEvents="none" style={styles.shard}>
        <DiagonalShard colors={[colors.warning, colors.energy]} opacity={0.14} />
      </View>

      <View style={[styles.topRow, { marginTop: insets.top + spacing.md }]}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressedOpacity]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <View style={styles.backChevron} />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        {tag ? (
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.headlineBlock}>
        <Text style={styles.headline}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'relative',
    height: 280,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  glowBlob: {
    position: 'absolute',
    top: 20,
    left: -40,
    width: 200,
    height: 200,
  },
  shard: {
    position: 'absolute',
    bottom: -60,
    right: -50,
    width: 220,
    height: 220,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 34,
    height: 34,
  },
  backChevron: {
    width: 8,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
    transform: [{ rotate: '45deg' }, { translateX: 1 }],
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  tagPill: {
    backgroundColor: 'rgba(215, 255, 63, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(215, 255, 63, 0.4)',
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  tagText: {
    ...typography.caption,
    color: colors.energy,
    fontWeight: '700',
    fontSize: 11,
  },
  headlineBlock: {
    maxWidth: 260,
  },
  headline: {
    ...typography.display,
    fontFamily: 'Inter_900Black',
    fontWeight: '900',
    fontSize: 34,
    lineHeight: 38,
    color: colors.white,
    letterSpacing: -1,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
});
