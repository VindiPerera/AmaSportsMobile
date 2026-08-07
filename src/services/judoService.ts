import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, JudoProfileFormValues, JudoProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: JudoProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    weight: values.weight || null,
    college_university: values.college_university || null,
    current_ranking: values.current_ranking || null,
    teams: values.teams.filter((team) => team.trim() !== ''),
    career_stats: values.career_stats
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        weight_position_id: idOrNull(row.weight_position_id),
        competition_level_id: idOrNull(row.competition_level_id),
        matches: idOrNull(row.matches),
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
        weight_position_id: idOrNull(row.weight_position_id),
        competition_level_id: idOrNull(row.competition_level_id),
        win: row.win,
        lost: row.lost,
        place: row.place || null,
      })),
  };
}

export const judoService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<JudoProfileResponse>>(
      '/player/judo-profile'
    );
    return data.data;
  },

  async saveProfile(values: JudoProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<JudoProfileResponse>>(
      '/player/judo-profile',
      toPayload(values)
    );
    return data.data;
  },
};
