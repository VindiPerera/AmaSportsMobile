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
    </Stack>
  );
}
