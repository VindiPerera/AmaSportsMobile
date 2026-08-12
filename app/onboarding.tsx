import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '../src/components/ui/ScreenContainer';
import { Button } from '../src/components/ui/Button';
import { Logo } from '../src/components/ui/Logo';
import { SlideDots } from '../src/components/onboarding/SlideDots';
import { OnboardingSlideView } from '../src/components/onboarding/OnboardingSlideView';
import { ONBOARDING_SLIDES } from '../src/constants/onboarding';
import { colors, radius, spacing, typography } from '../src/theme';
import { useOnboardingStore } from '../src/store/onboardingStore';

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const completeOnboarding = useOnboardingStore((s) => s.complete);

  const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;

  const goToAuth = async () => {
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (isLastSlide) {
      goToAuth();
      return;
    }
    const nextIndex = activeIndex + 1;
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    setActiveIndex(nextIndex);
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} style={styles.screenBg}>
      {/* Light Header Bar */}
      <View style={styles.topRow}>
        <Logo size={34} />
      </View>

      {/* Main Full-Bleed Onboarding Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.pager}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.page, { width }]}>
            <OnboardingSlideView slide={slide} />
          </View>
        ))}
      </ScrollView>

      {/* Light Theme Footer Actions (Matches Reference UI) */}
      <View style={styles.footer}>
        <SlideDots count={ONBOARDING_SLIDES.length} activeIndex={activeIndex} />

        <View style={styles.actionGroup}>
          <Button
            label={isLastSlide ? "LET'S GO" : 'NEXT'}
            variant="primary"
            onPress={handleNext}
            style={styles.pillButton}
          />

          {!isLastSlide ? (
            <Pressable onPress={goToAuth} style={({ pressed }) => [styles.skipLink, pressed && styles.pressedOpacity]}>
              <Text style={styles.skipLinkText}>SKIP FOR NOW</Text>
            </Pressable>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  pager: {
    flex: 1,
    marginHorizontal: -spacing.lg,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  actionGroup: {
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  pillButton: {
    borderRadius: radius.full,
    height: 52,
  },
  skipLink: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  skipLinkText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
  },
  skipPlaceholder: {
    height: 24,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
});
