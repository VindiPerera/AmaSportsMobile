import { apiClient } from './apiClient';
import { isBlankRow, parseFloatOrNull, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, NetBallProfileFormValues, NetBallProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: NetBallProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    dominant_hand: values.dominant_hand || null,
    player_position: values.player_position || null,
    college_university: values.college_university || null,
    teams: values.teams.filter((team) => team.trim() !== ''),
    career_stats: values.career_stats
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        matches: idOrNull(row.matches),
        matches_won: idOrNull(row.matches_won),
        matches_lost: idOrNull(row.matches_lost),
        goals: idOrNull(row.goals),
        attempts: idOrNull(row.attempts),
        goal_accuracy: parseFloatOrNull(row.goal_accuracy),
        result_won: idOrNull(row.result_won),
        result_lost: idOrNull(row.result_lost),
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        venue: row.venue || null,
        goals: idOrNull(row.goals),
        attempts: idOrNull(row.attempts),
        goal_accuracy: parseFloatOrNull(row.goal_accuracy),
        win: row.win,
        lost: row.lost,
      })),
  };
}

export const netBallService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<NetBallProfileResponse>>(
      '/player/net-ball-profile'
    );
    return data.data;
  },

  async saveProfile(values: NetBallProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<NetBallProfileResponse>>(
      '/player/net-ball-profile',
      toPayload(values)
    );
    return data.data;
  },
};
