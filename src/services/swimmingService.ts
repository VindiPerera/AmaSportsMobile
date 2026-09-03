import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, SwimmingProfileFormValues, SwimmingProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: SwimmingProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    weight: values.weight || null,
    college_university: values.college_university || null,
    teams: values.teams.filter((team) => team.trim() !== ''),
    personal_bests: values.personal_bests
      .filter((row) => row.swimming_event_id !== '')
      .map((row) => ({
        swimming_event_id: idOrNull(row.swimming_event_id),
        personal_best: row.personal_best || null,
      })),
    career_stats: values.career_stats
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        swimming_event_id: idOrNull(row.swimming_event_id),
        current_time: row.current_time || null,
        third_place: idOrNull(row.third_place),
        second_place: idOrNull(row.second_place),
        champion: idOrNull(row.champion),
      })),
    recent_events: values.recent_events
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        event_date: row.event_date || null,
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        swimming_event_id: idOrNull(row.swimming_event_id),
        performance_time: row.performance_time || null,
        place: row.place || null,
      })),
  };
}

export const swimmingService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<SwimmingProfileResponse>>(
      '/player/swimming-profile'
    );
    return data.data;
  },

  async saveProfile(values: SwimmingProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<SwimmingProfileResponse>>(
      '/player/swimming-profile',
      toPayload(values)
    );
    return data.data;
  },
};
