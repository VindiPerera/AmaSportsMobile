import { apiClient } from './apiClient';
import { ApiSuccessResponse, PlayerAchievement, PlayerAchievementsResponse } from '../types';

export const achievementService = {
  /** Re-checks thresholds server-side before returning (see
   * AchievementService::evaluateForPlayer) — always call this rather than
   * caching a previous result, so a milestone crossed since the last fetch
   * (or before this feature existed) surfaces without the player needing to
   * re-save their profile. */
  async fetchAchievements() {
    const { data } = await apiClient.get<ApiSuccessResponse<PlayerAchievementsResponse>>('/player/achievements');
    return data.data;
  },

  /** The player's own "share this" action — nothing posts automatically. */
  async post(playerAchievementId: number) {
    const { data } = await apiClient.post<ApiSuccessResponse<PlayerAchievement>>(
      `/player/achievements/${playerAchievementId}/post`
    );
    return data.data;
  },
};
