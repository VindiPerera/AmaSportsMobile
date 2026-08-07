import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, KarateProfileFormValues, KarateProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: KarateProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    weight: values.weight || null,
    player_style_id: idOrNull(values.player_style_id),
    current_ranking: values.current_ranking || null,
    college_university: values.college_university || null,
    teams: values.teams.filter((team) => team.trim() !== ''),
    career_stats: values.career_stats
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        matches: idOrNull(row.matches),
        fights: idOrNull(row.fights),
        win: idOrNull(row.win),
        lost: idOrNull(row.lost),
        stats: row.stats || null,
        weight_category: row.weight_category || null,
        age_category: row.age_category || null,
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
        stats: row.stats || null,
        weight_category: row.weight_category || null,
        age_category: row.age_category || null,
        place: row.place || null,
      })),
  };
}

export const karateService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<KarateProfileResponse>>('/player/karate-profile');
    return data.data;
  },

  async saveProfile(values: KarateProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<KarateProfileResponse>>(
      '/player/karate-profile',
      toPayload(values)
    );
    return data.data;
  },
};
