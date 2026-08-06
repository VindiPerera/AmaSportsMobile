import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

/**
 * Stack for everything reachable from the Player Profile tab that isn't the
 * hub itself: picking a sport, the Cricket/Hockey forms, and the "coming
 * soon" placeholder. The parent (protected) stack hides headers globally,
 * so this re-enables a simple header (back button + title) for these.
 */
export default function PlayerProfileStackLayout() {
  return (
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
    </Stack>
  );
}
