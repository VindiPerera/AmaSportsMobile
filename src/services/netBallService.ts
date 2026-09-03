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
        play_position: row.play_position || null,
        matches: idOrNull(row.matches),
        goals: idOrNull(row.goals),
        attempts: idOrNull(row.attempts),
        goal_accuracy: parseFloatOrNull(row.goal_accuracy),
        won: idOrNull(row.won),
        lost: idOrNull(row.lost),
        no_result: idOrNull(row.no_result),
        draw: idOrNull(row.draw),
        year: idOrNull(row.year),
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
        play_position: row.play_position || null,
        won: row.won,
        lost: row.lost,
        no_result: row.no_result,
        draw: row.draw,
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
