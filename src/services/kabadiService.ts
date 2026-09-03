import { apiClient } from './apiClient';
import { isBlankRow, parseIntOrNull } from '../utils/numeric';
import {
  ApiSuccessResponse,
  KabadiProfileFormValues,
  KabadiProfileResponse,
  KabadiStatFields,
} from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function statFieldsToPayload(row: KabadiStatFields) {
  return {
    tpe: idOrNull(row.tpe),
    cbp: idOrNull(row.cbp),
    raids: idOrNull(row.raids),
    successful_raids: idOrNull(row.successful_raids),
    unsuccessful_raids: idOrNull(row.unsuccessful_raids),
    raid_touch_point: idOrNull(row.raid_touch_point),
    raid_bonus_point: idOrNull(row.raid_bonus_point),
    tackles: idOrNull(row.tackles),
    successful_tackles: idOrNull(row.successful_tackles),
    unsuccessful_tackles: idOrNull(row.unsuccessful_tackles),
    empty_raids: idOrNull(row.empty_raids),
    yellow_cards: idOrNull(row.yellow_cards),
    green_cards: idOrNull(row.green_cards),
    red_cards: idOrNull(row.red_cards),
  };
}

function toPayload(values: KabadiProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    height: values.height || null,
    weight: values.weight || null,
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
        ...statFieldsToPayload(row),
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        venue: row.venue || null,
        win: row.win,
        lost: row.lost,
        ...statFieldsToPayload(row),
      })),
  };
}

export const kabadiService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<KabadiProfileResponse>>(
      '/player/kabadi-profile'
    );
    return data.data;
  },

  async saveProfile(values: KabadiProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<KabadiProfileResponse>>(
      '/player/kabadi-profile',
      toPayload(values)
    );
    return data.data;
  },
};
