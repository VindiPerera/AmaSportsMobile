import { Stack } from 'expo-router';
import { colors } from '../../../src/theme';

/** Stack for Match Detail + the embedded YouTube stream, pushed from the Live Score tab. */
export default function LiveScoreStackLayout() {
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
      <Stack.Screen name="[id]" options={{ title: 'Match Detail' }} />
      <Stack.Screen name="stream/[id]" options={{ title: 'Live Stream' }} />
    </Stack>
  );
}
