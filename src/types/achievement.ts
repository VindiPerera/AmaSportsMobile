/** One player's unlock of an Achievement template (see the backend's
 * PlayerAchievementResource) — `posted_at` is null until the player
 * deliberately shares it (see achievementService.post). */
export interface PlayerAchievement {
  id: number;
  title: string;
  description: string | null;
  /** Ionicons name (e.g. "trophy") — same icon set used everywhere else in
   * the app. */
  icon: string;
  /** Hex badge color, e.g. "#F59E0B". */
  color: string;
  threshold: number;
  /** The player's metric value when this unlocked (e.g. 105 when the
   * threshold was 100) — "You scored 105 runs!" reads better than repeating
   * the threshold back at them. */
  achieved_value: number;
  unlocked_at: string;
  posted_at: string | null;
}

export interface PlayerAchievementsResponse {
  /** Unlocked, not yet posted — shown as a notification the player can act on. */
  pending: PlayerAchievement[];
  /** Already posted — shown on Player Profile and Home. */
  posted: PlayerAchievement[];
}
