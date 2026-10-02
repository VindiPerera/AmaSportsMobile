import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useGlobalSearchParams, useSegments } from 'expo-router';
import { colors } from '../../../src/theme';
import { useSubscriptionStore } from '../../../src/store/subscriptionStore';
import { PlanRequiredScreen } from '../../../src/components/subscription/PlanRequiredScreen';

/** Screens in this stack that are NOT a sport form — they handle the plan check (or don't need one) themselves. */
const UNGATED_SCREENS = new Set(['player-profile', 'sport-picker', 'coming-soon']);

/**
 * Stack for everything reachable from the Player Profile tab that isn't the
 * hub itself: picking a sport, the Cricket/Hockey forms, and the "coming
 * soon" placeholder. The parent (protected) stack hides headers globally,
 * so this re-enables a simple header (back button + title) for these.
 *
 * Also the single plan gate for every sport form: opened for editing
 * (anything but `mode=view`) without an active plan — free trial or paid
 * year — a "choose a plan" screen covers the form, whichever way the player
 * got here (popular-sport shortcuts, editing an existing sport, the
 * Analysis tab's link). Read-only view stays open so lapsed players can
 * still see their stats; its Edit button is gated via requireActivePlan().
 * The backend enforces the same rule on every save (subscription.active).
 */
export default function PlayerProfileStackLayout() {
  const segments = useSegments();
  const { mode } = useGlobalSearchParams<{ mode?: string }>();
  const status = useSubscriptionStore((s) => s.status);
  const statusError = useSubscriptionStore((s) => s.error);
  const refresh = useSubscriptionStore((s) => s.refresh);

  const screen: string = segments[segments.length - 1] ?? '';
  const needsPlan = !UNGATED_SCREENS.has(screen) && mode !== 'view';

  // Re-check every time a sport form opens — a cached status can be stale
  // (e.g. the free trial ran out since it was last fetched).
  useEffect(() => {
    if (needsPlan) refresh();
  }, [needsPlan, screen, refresh]);

  // Not loaded yet -> covered (spinner) so the form never flashes open. If
  // the status request itself failed, let the form through — every save is
  // still refused server-side without a plan (402 -> paywall).
  const isBlocked = needsPlan && (status ? !status.is_active : !statusError);

  return (
    <View style={{ flex: 1 }}>
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="sport-picker" options={{ title: 'Add Sport' }} />
      <Stack.Screen name="coming-soon" options={{ title: 'Coming Soon' }} />
      <Stack.Screen name="cricket" options={{ title: 'Cricket Profile' }} />
      <Stack.Screen name="hockey" options={{ title: 'Hockey Profile' }} />
      <Stack.Screen name="base-ball" options={{ title: 'Base Ball Profile' }} />
      <Stack.Screen name="net-ball" options={{ title: 'Net Ball Profile' }} />
      <Stack.Screen name="racket-sport" options={{ title: 'Player Profile' }} />
      <Stack.Screen name="kabadi" options={{ title: 'Kabadi Profile' }} />
      <Stack.Screen name="judo" options={{ title: 'Judo Profile' }} />
      <Stack.Screen name="basketball" options={{ title: 'Basketball Profile' }} />
      <Stack.Screen name="football" options={{ title: 'Football Profile' }} />
      <Stack.Screen name="rugby" options={{ title: 'Rugby Profile' }} />
      <Stack.Screen name="boxing" options={{ title: 'Boxing Profile' }} />
      <Stack.Screen name="karate" options={{ title: 'Karate Profile' }} />
      <Stack.Screen name="chess" options={{ title: 'Chess Profile' }} />
      <Stack.Screen name="athletics" options={{ title: 'Athletics Profile' }} />
      <Stack.Screen name="swimming" options={{ title: 'Swimming Profile' }} />
      <Stack.Screen name="volleyball" options={{ title: 'Volleyball Profile' }} />
      <Stack.Screen name="beach-volleyball" options={{ title: 'Beach Volleyball Profile' }} />
      <Stack.Screen name="elle" options={{ title: 'Elle Profile' }} />
      <Stack.Screen name="soft-ball-cricket" options={{ title: 'Soft Ball Cricket Profile' }} />
    </Stack>
      {isBlocked && <PlanRequiredScreen status={status} />}
    </View>
  );
}
