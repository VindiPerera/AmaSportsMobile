import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Gallery section has been removed per user request.
 * Automatically routes back to player profile if navigated directly.
 */
export default function GalleryScreen() {
  useEffect(() => {
    router.replace('/(protected)/(tabs)/player-profile');
  }, []);

  return null;
}
