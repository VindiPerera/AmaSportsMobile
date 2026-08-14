import { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';

// Keep the native splash screen visible until we've hydrated auth + onboarding state.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Ensures that if the app is opened via a deep link while the in-app browser is active,
// the browser sheet is dismissed automatically (e.g. after PayPal checkout).
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);
  const isAuthHydrating = useAuthStore((s) => s.isHydrating);
  const isOnboardingHydrating = useOnboardingStore((s) => s.isHydrating);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    hydrateAuth();
    hydrateOnboarding();
  }, [hydrateAuth, hydrateOnboarding]);

  const isReady = !isAuthHydrating && !isOnboardingHydrating && fontsLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  // Render nothing (native splash stays up) until hydration finishes — this
  // is what lets the very first screen route correctly to onboarding,
  // auth, or the protected app without a visible flash.
  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(protected)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
