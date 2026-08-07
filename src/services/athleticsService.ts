import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { AthleticsProfileFormValues, AthleticsProfileResponse, ApiSuccessResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: AthleticsProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    weight: values.weight || null,
    college_university: values.college_university || null,
    teams: values.teams.filter((team) => team.trim() !== ''),
    personal_bests: values.personal_bests
      .filter((row) => row.athletics_event_id !== '')
      .map((row) => ({
        athletics_event_id: idOrNull(row.athletics_event_id),
        personal_best: row.personal_best || null,
      })),
    career_stats: values.career_stats
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        athletics_event_id: idOrNull(row.athletics_event_id),
        matches: idOrNull(row.matches),
        third_place: idOrNull(row.third_place),
        second_place: idOrNull(row.second_place),
        champion: idOrNull(row.champion),
      })),
    recent_events: values.recent_events
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        event_date: row.event_date || null,
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        matches: idOrNull(row.matches),
        athletics_event_id: idOrNull(row.athletics_event_id),
        place: row.place || null,
      })),
  };
}

export const athleticsService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<AthleticsProfileResponse>>(
      '/player/athletics-profile'
    );
    return data.data;
  },

  async saveProfile(values: AthleticsProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<AthleticsProfileResponse>>(
      '/player/athletics-profile',
      toPayload(values)
    );
    return data.data;
  },
};
