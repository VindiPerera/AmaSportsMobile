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

/**
 * Uses a horizontally-paging ScrollView instead of react-native-pager-view
 * so the carousel works on iOS, Android, AND web from one implementation —
 * react-native-pager-view has no web target and breaks the Metro web bundle.
 */
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
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.topRow}>
        <Logo size={36} />
        {!isLastSlide ? (
          <Pressable
            onPress={goToAuth}
            style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
            hitSlop={8}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

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

      <View style={styles.footer}>
        <SlideDots count={ONBOARDING_SLIDES.length} activeIndex={activeIndex} />
        <Button
          label={isLastSlide ? 'Get Started' : 'Next'}
          variant={isLastSlide ? 'energy' : 'primary'}
          onPress={handleNext}
          style={styles.button}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  skipButton: {
    height: 36,
    minWidth: 64,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  skipButtonPressed: {
    backgroundColor: colors.border,
  },
  skipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
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
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
});
