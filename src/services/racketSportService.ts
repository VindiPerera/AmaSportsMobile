import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import {
  ApiSuccessResponse,
  RacketSportCareerRowForm,
  RacketSportProfileFormValues,
  RacketSportProfileResponse,
} from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function careerRowsToPayload(rows: RacketSportCareerRowForm[], category: string) {
  return rows
    .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
    .map((row) => ({
      category,
      format_id: idOrNull(row.format_id),
      age_category_id: idOrNull(row.age_category_id),
      match_category_id: idOrNull(row.match_category_id),
      matches: idOrNull(row.matches),
      win: idOrNull(row.win),
      lost: idOrNull(row.lost),
      set_win: idOrNull(row.set_win),
      set_lost: idOrNull(row.set_lost),
      quarter_final: idOrNull(row.quarter_final),
      semi_final: idOrNull(row.semi_final),
      third_place: idOrNull(row.third_place),
      second_place: idOrNull(row.second_place),
      champion: idOrNull(row.champion),
    }));
}

function toPayload(sportId: number, values: RacketSportProfileFormValues) {
  return {
    sport_id: sportId,
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    dominant_hand: values.dominant_hand || null,
    weight: values.weight || null,
    current_ranking: values.current_ranking || null,
    college_university: values.college_university || null,
    teams: values.teams.filter((team) => team.trim() !== ''),
    career_stats: [
      ...careerRowsToPayload(values.single_stats, 'single'),
      ...careerRowsToPayload(values.double_stats, 'double'),
      ...careerRowsToPayload(values.mix_double_stats, 'mix_double'),
    ],
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        win: row.win,
        lost: row.lost,
        set_1: row.set_1 || null,
        set_2: row.set_2 || null,
        set_3: row.set_3 || null,
        set_4: row.set_4 || null,
        set_5: row.set_5 || null,
      })),
  };
}

export const racketSportService = {
  async fetchProfile(sportId: number) {
    const { data } = await apiClient.get<ApiSuccessResponse<RacketSportProfileResponse>>(
      '/player/racket-sport-profile',
      { params: { sport_id: sportId } }
    );
    return data.data;
  },

  async saveProfile(sportId: number, values: RacketSportProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<RacketSportProfileResponse>>(
      '/player/racket-sport-profile',
      toPayload(sportId, values)
    );
    return data.data;
  },
};
