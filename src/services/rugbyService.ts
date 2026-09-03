import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, RugbyProfileFormValues, RugbyProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: RugbyProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    weight: values.weight || null,
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
        win: idOrNull(row.win),
        lost: idOrNull(row.lost),
        tries: idOrNull(row.tries),
        conversion: idOrNull(row.conversion),
        penalty_kick: idOrNull(row.penalty_kick),
        drop_goal: idOrNull(row.drop_goal),
        yellow_card: idOrNull(row.yellow_card),
        red_card: idOrNull(row.red_card),
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        venue: row.venue || null,
        play_position: row.play_position || null,
        win: row.win,
        lost: row.lost,
        tries: idOrNull(row.tries),
        conversion: idOrNull(row.conversion),
        penalty_kick: idOrNull(row.penalty_kick),
        drop_goal: idOrNull(row.drop_goal),
        yellow_card: idOrNull(row.yellow_card),
        red_card: idOrNull(row.red_card),
      })),
  };
}

export const rugbyService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<RugbyProfileResponse>>('/player/rugby-profile');
    return data.data;
  },

  async saveProfile(values: RugbyProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<RugbyProfileResponse>>(
      '/player/rugby-profile',
      toPayload(values)
    );
    return data.data;
  },
};
