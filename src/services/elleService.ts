import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, ElleProfileFormValues, ElleProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: ElleProfileFormValues) {
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
        runs: idOrNull(row.runs),
        catches: idOrNull(row.catches),
        third_place: idOrNull(row.third_place),
        second_place: idOrNull(row.second_place),
        champion: idOrNull(row.champion),
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        venue: row.venue || null,
        win: row.win,
        lost: row.lost,
        runs: idOrNull(row.runs),
        catches: idOrNull(row.catches),
        place: row.place || null,
      })),
  };
}

export const elleService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<ElleProfileResponse>>('/player/elle-profile');
    return data.data;
  },

  async saveProfile(values: ElleProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<ElleProfileResponse>>(
      '/player/elle-profile',
      toPayload(values)
    );
    return data.data;
  },
};
