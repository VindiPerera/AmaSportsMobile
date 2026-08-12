import { Stack } from 'expo-router';

/**
 * Stack for "View Full Profile", pushed from the Player Search tab.
 * headerShown: false — CricketPlayerDetailView renders its own full header
 * (back button, name, cover photo) internally; a native header on top of
 * that would just be a second, redundant back button (see the Match Detail
 * screen fix earlier this session for the exact same class of bug).
 */
export default function PlayerSearchStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
