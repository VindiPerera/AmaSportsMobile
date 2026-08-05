import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Logo } from '../src/components/ui/Logo';
import { colors, spacing, typography } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';

/**
 * Splash / bootstrap screen.
 * By the time this renders, auth + onboarding state is already hydrated
 * (root layout waits for that), so this briefly shows the brand mark and
 * then redirects to the correct entry point.
 */
export default function SplashScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);

  useEffect(() => {
    // Small deliberate delay so the brand splash is perceptible even on
    // fast devices / warm starts, rather than flashing instantly.
    const timer = setTimeout(() => setMinDelayElapsed(true), 900);
    return () => clearTimeout(timer);
  }, []);

  if (!minDelayElapsed) {
    return (
      <View style={styles.container}>
        <Logo size={96} />
        <Text style={styles.title}>AmaSports</Text>
        <Text style={styles.subtitle}>Performance. Together.</Text>
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
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.primaryLight,
  },
});
