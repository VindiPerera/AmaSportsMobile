import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { AmaXLogo } from '../src/components/ui/AmaXLogo';
import { DiagonalShard } from '../src/components/ui/DiagonalShard';
import { colors, radius, shadows, spacing, typography } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';

/**
 * Animated Brand Splash Screen for AmaX — per the "AmaSports Splash" Claude
 * Design handoff: warm off-white ground, two diagonal gold/lime + navy
 * shards echoing the logo's X mark, a pulsing radial glow behind a white
 * badge-carded logo, a fading-in tagline, and three looping activity dots.
 */
export default function SplashScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const [animationFinished, setAnimationFinished] = useState(false);

  // One-shot entrance values
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(10)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(8)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Looping values — glow pulse, shard sweep, dot pulses
  const glowPulse = useRef(new Animated.Value(0)).current;
  const shardSweepA = useRef(new Animated.Value(0)).current;
  const shardSweepB = useRef(new Animated.Value(0)).current;
  const dot0 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo: scale/slide/fade in once, settling with a slight overshoot.
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Tagline fades in a beat after the logo settles.
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Glow: continuous pulse (opacity 0.5<->0.85, scale 1<->1.12).
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    // Shards: slow sweep drifting back and forth, opposite phase.
    const shardLoopA = Animated.loop(
      Animated.sequence([
        Animated.timing(shardSweepA, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shardSweepA, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const shardLoopB = Animated.loop(
      Animated.sequence([
        Animated.timing(shardSweepB, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(shardSweepB, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    shardLoopA.start();
    shardLoopB.start();

    // Dots: staggered pulse, like a typing/activity indicator.
    const dotLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 550, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(1200 - delay - 350 - 550 > 0 ? 1200 - delay - 350 - 550 : 0),
        ])
      );
    const dotLoop0 = dotLoop(dot0, 0);
    const dotLoop1 = dotLoop(dot1, 200);
    const dotLoop2 = dotLoop(dot2, 400);
    dotLoop0.start();
    dotLoop1.start();
    dotLoop2.start();

    // 4-second timer for the brand splash to display fully, then fade out.
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setAnimationFinished(true);
      });
    }, 4000);

    return () => {
      clearTimeout(timer);
      glowLoop.stop();
      shardLoopA.stop();
      shardLoopB.stop();
      dotLoop0.stop();
      dotLoop1.stop();
      dotLoop2.stop();
    };
  }, []);

  if (!animationFinished) {
    const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
    const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] });
    const shardTranslateA = shardSweepA.interpolate({ inputRange: [0, 1], outputRange: [-15, 15] });
    const shardTranslateB = shardSweepB.interpolate({ inputRange: [0, 1], outputRange: [15, -15] });

    const dotStyle = (value: Animated.Value) => ({
      opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
      transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
    });

    return (
      <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
        {/* Diagonal shard — gold/lime, top-right, echoes the logo's X mark. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.shardTopRight, { transform: [{ translateX: shardTranslateA }] }]}
        >
          <DiagonalShard colors={[colors.warning, colors.energy]} opacity={0.18} />
        </Animated.View>

        {/* Diagonal shard — navy, bottom-left. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.shardBottomLeft, { transform: [{ translateX: shardTranslateB }] }]}
        >
          <DiagonalShard colors={[colors.navy, colors.navyDark]} opacity={0.08} />
        </Animated.View>

        {/* Radial glow behind the logo, gold center fading through lime. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.glowWrapper, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.warning} stopOpacity={0.32} />
                <Stop offset="45%" stopColor={colors.energy} stopOpacity={0.14} />
                <Stop offset="72%" stopColor={colors.energy} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill="url(#glow)" />
          </Svg>
        </Animated.View>

        {/* Center Animated Logo & Branding Content */}
        <View style={styles.centerBox}>
          <Animated.View
            style={[
              styles.logoCard,
              shadows.lg,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
              },
            ]}
          >
            <AmaXLogo size={68} variant="full" />
          </Animated.View>

          <Animated.View
            style={[
              styles.textContainer,
              { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
            ]}
          >
            <Text style={styles.tagline}>Every Sport, Live</Text>
          </Animated.View>
        </View>

        {/* Three-dot activity indicator, loops for the duration of the splash. */}
        <View style={styles.dotsRow} pointerEvents="none">
          <Animated.View style={[styles.dot, dotStyle(dot0)]} />
          <Animated.View style={[styles.dot, dotStyle(dot1)]} />
          <Animated.View style={[styles.dot, dotStyle(dot2)]} />
        </View>
      </Animated.View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)/home" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  shardTopRight: {
    position: 'absolute',
    top: -70,
    right: -90,
    width: 280,
    height: 280,
  },
  shardBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -100,
    width: 260,
    height: 260,
  },
  glowWrapper: {
    position: 'absolute',
    top: '44%',
    left: '50%',
    width: 360,
    height: 360,
    marginLeft: -180,
    marginTop: -180,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    paddingVertical: 26,
    paddingHorizontal: 32,
    marginBottom: spacing.lg,
  },
  textContainer: {
    alignItems: 'center',
  },
  tagline: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
  },
});
