import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, FootballProfileFormValues, FootballProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: FootballProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    dominant_leg: values.dominant_leg || null,
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
        win: idOrNull(row.win),
        lost: idOrNull(row.lost),
        goals: idOrNull(row.goals),
        assists: idOrNull(row.assists),
        defensive_actions: idOrNull(row.defensive_actions),
        goalkeeper_clean_sheets: idOrNull(row.goalkeeper_clean_sheets),
        goalkeeper_goals_conceded: idOrNull(row.goalkeeper_goals_conceded),
        yellow_card: idOrNull(row.yellow_card),
        red_card: idOrNull(row.red_card),
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        venue: row.venue || null,
        win: row.win,
        lost: row.lost,
        goals: idOrNull(row.goals),
        assists: idOrNull(row.assists),
        defensive_actions: idOrNull(row.defensive_actions),
        goalkeeper_clean_sheets: idOrNull(row.goalkeeper_clean_sheets),
        goalkeeper_goals_conceded: idOrNull(row.goalkeeper_goals_conceded),
        yellow_card: idOrNull(row.yellow_card),
        red_card: idOrNull(row.red_card),
      })),
  };
}

export const footballService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<FootballProfileResponse>>(
      '/player/football-profile'
    );
    return data.data;
  },

  async saveProfile(values: FootballProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<FootballProfileResponse>>(
      '/player/football-profile',
      toPayload(values)
    );
    return data.data;
  },
};
