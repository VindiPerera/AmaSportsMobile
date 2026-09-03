import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, BaseBallProfileFormValues, BaseBallProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: BaseBallProfileFormValues) {
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
        total_matches: idOrNull(row.total_matches),
        at_bats: idOrNull(row.at_bats),
        runs: idOrNull(row.runs),
        hits: idOrNull(row.hits),
        rbi: idOrNull(row.rbi),
        won: idOrNull(row.won),
        lost: idOrNull(row.lost),
        no_result: idOrNull(row.no_result),
        year: idOrNull(row.year),
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        venue: row.venue || null,
        won: row.won,
        lost: row.lost,
        at_bats: idOrNull(row.at_bats),
        runs: idOrNull(row.runs),
        hits: idOrNull(row.hits),
      })),
  };
}

export const baseBallService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<BaseBallProfileResponse>>(
      '/player/base-ball-profile'
    );
    return data.data;
  },

  async saveProfile(values: BaseBallProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<BaseBallProfileResponse>>(
      '/player/base-ball-profile',
      toPayload(values)
    );
    return data.data;
  },
};
