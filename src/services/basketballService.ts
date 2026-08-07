import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, BasketballProfileFormValues, BasketballProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: BasketballProfileFormValues) {
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
        win: idOrNull(row.win),
        lost: idOrNull(row.lost),
        points: idOrNull(row.points),
        rebounds: idOrNull(row.rebounds),
        assists: idOrNull(row.assists),
        blocks: idOrNull(row.blocks),
        steals: idOrNull(row.steals),
        minutes: idOrNull(row.minutes),
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        venue: row.venue || null,
        win: row.win,
        lost: row.lost,
        points: idOrNull(row.points),
        rebounds: idOrNull(row.rebounds),
        assists: idOrNull(row.assists),
        blocks: idOrNull(row.blocks),
        steals: idOrNull(row.steals),
        minutes: idOrNull(row.minutes),
      })),
  };
}

export const basketballService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<BasketballProfileResponse>>(
      '/player/basketball-profile'
    );
    return data.data;
  },

  async saveProfile(values: BasketballProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<BasketballProfileResponse>>(
      '/player/basketball-profile',
      toPayload(values)
    );
    return data.data;
  },
};
