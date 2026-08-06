import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from '../src/components/ui/Logo';
import { colors, spacing, typography } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';

/**
 * Splash / bootstrap screen.
 * By the time this renders, auth + onboarding state is already hydrated
 * (root layout waits for that), so this briefly shows the brand mark and
 * then redirects to the correct entry point. Background stays white — the
 * gradient logo mark plus a soft glow behind it carries all the color.
 */
export default function SplashScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);

  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.85));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();

    // Small deliberate delay so the brand splash is perceptible even on
    // fast devices / warm starts, rather than flashing instantly.
    const timer = setTimeout(() => setMinDelayElapsed(true), 950);
    return () => clearTimeout(timer);
  }, [opacity, scale]);

  if (!minDelayElapsed) {
    return (
      <View style={styles.container}>
        <View style={styles.glowWrapper}>
          <LinearGradient
            colors={[colors.primaryLight, colors.background]}
            style={styles.glow}
          />
        </View>
        <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
          <Logo size={104} />
          <Text style={styles.title}>AmaSports</Text>
          <Text style={styles.subtitle}>Performance. Together.</Text>
        </Animated.View>
      </View>
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
  },
  glowWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 420,
    height: 420,
    marginLeft: -210,
    marginTop: -210,
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 210,
  },
  content: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
});
