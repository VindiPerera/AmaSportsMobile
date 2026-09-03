import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, BoxingProfileFormValues, BoxingProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: BoxingProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    weight: values.weight || null,
    weight_class_id: idOrNull(values.weight_class_id),
    current_ranking: values.current_ranking || null,
    college_university: values.college_university || null,
    teams: values.teams.filter((team) => team.trim() !== ''),
    career_stats: values.career_stats
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        weight_class_id: idOrNull(row.weight_class_id),
        win: idOrNull(row.win),
        lost: idOrNull(row.lost),
        third_place: idOrNull(row.third_place),
        second_place: idOrNull(row.second_place),
        champion: idOrNull(row.champion),
      })),
    recent_fights: values.recent_fights
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        fight_date: row.fight_date || null,
        opponent: row.opponent || null,
        venue: row.venue || null,
        weight_class_id: idOrNull(row.weight_class_id),
        win: row.win,
        lost: row.lost,
        place: row.place || null,
      })),
  };
}

export const boxingService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<BoxingProfileResponse>>('/player/boxing-profile');
    return data.data;
  },

  async saveProfile(values: BoxingProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<BoxingProfileResponse>>(
      '/player/boxing-profile',
      toPayload(values)
    );
    return data.data;
  },
};
