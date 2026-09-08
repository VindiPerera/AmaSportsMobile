import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { achievementService } from '../services/achievementService';
import { PlayerAchievement } from '../types';

/**
 * Refetches every time this screen regains focus (see useFocusEffect) —
 * achievements are unlocked server-side right after a Cricket profile save
 * (see CricketProfileController::update), so a player who just saved new
 * stats and comes back to Home/Player Profile should see the notification
 * without needing a manual pull-to-refresh.
 *
 * `celebration` is the oldest pending achievement, gated by a local
 * "dismissed this visit" flag rather than removed from `pending` — choosing
 * "Maybe Later" (see AchievementCelebrationModal) shouldn't post it or hide
 * it from the Achievements tab's notification state, just stop popping the
 * big celebration back up until the next time this screen is focused fresh.
 */
export function useAchievements() {
  const [pending, setPending] = useState<PlayerAchievement[]>([]);
  const [posted, setPosted] = useState<PlayerAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  const refresh = useCallback(() => {
    setIsLoading(true);
    achievementService
      .fetchAchievements()
      .then((r) => {
        setPending(r.pending);
        setPosted(r.posted);
        setCelebrationDismissed(false);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const postAchievement = useCallback(async (id: number) => {
    const updated = await achievementService.post(id);
    setPending((prev) => prev.filter((a) => a.id !== id));
    setPosted((prev) => [updated, ...prev]);
  }, []);

  const celebration = !celebrationDismissed && pending.length > 0 ? pending[0] : null;
  const dismissCelebration = useCallback(() => setCelebrationDismissed(true), []);

  return { pending, posted, isLoading, postAchievement, refresh, celebration, dismissCelebration };
}
