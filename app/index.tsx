import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AmaXLogo } from '../src/components/ui/AmaXLogo';
import { colors, radius, spacing, typography } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';

/**
 * Animated Brand Splash Screen for AmaX.
 * Renders a multi-stage entrance animation with the official business logo,
 * smooth glow pulses, and tagline reveal before performing entry route redirection.
 */
export default function SplashScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const [animationFinished, setAnimationFinished] = useState(false);

  // Animated values
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(24)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(16)).current;

  const glowScale = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const progressWidth = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Stage 1: Glow background fade and scale
    Animated.parallel([
      Animated.timing(glowOpacity, {
        toValue: 0.85,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(glowScale, {
        toValue: 1.15,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2: Logo scale, slide and opacity sequence
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // Stage 3: Tagline entrance & progress bar fill
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progressWidth, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // 4-second timer for brand splash animation to display fully
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setAnimationFinished(true);
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!animationFinished) {
    return (
      <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
        {/* Soft Animated Radial Glow in Background */}
        <Animated.View
          style={[
            styles.glowWrapper,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(227, 27, 35, 0.14)', 'rgba(245, 158, 11, 0.08)', 'transparent']}
            style={styles.glow}
          />
        </Animated.View>

        {/* Center Animated Logo & Branding Content */}
        <View style={styles.centerBox}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }, { translateY: logoTranslateY }],
              },
            ]}
          >
            <AmaXLogo size={76} variant="full" />
          </Animated.View>

          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.subtitle}>Sports Management & Performance Network</Text>

            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </Animated.View>
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
    backgroundColor: '#FFFFFF',
  },
  glowWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 480,
    height: 480,
    marginLeft: -240,
    marginTop: -240,
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 240,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  textContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  progressTrack: {
    width: 140,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
