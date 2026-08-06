import { apiClient } from './apiClient';
import { parseFloatOrNull, parseIntOrNull } from '../utils/numeric';
import {
  ApiSuccessResponse,
  CricketProfileFormValues,
  CricketProfileResponse,
  HockeyProfileFormValues,
  HockeyProfileResponse,
  PlayerProfile,
  PlayerSportEntry,
  UpdatePlayerProfilePayload,
} from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

/** Strips blank rows (a row the player added but never filled in) before submit. */
function isBlankRow(row: Record<string, string | boolean>): boolean {
  return Object.values(row).every((value) => value === '' || value === false);
}

function buildProfileFormData(payload: UpdatePlayerProfilePayload): FormData {
  const formData = new FormData();
  if (payload.full_name !== undefined) formData.append('full_name', payload.full_name);
  if (payload.country !== undefined) formData.append('country', payload.country);
  if (payload.cover_photo) {
    // React Native's FormData accepts this {uri,name,type} shape directly.
    formData.append('cover_photo', payload.cover_photo as unknown as Blob);
  }
  if (payload.photo) {
    formData.append('photo', payload.photo as unknown as Blob);
  }
  return formData;
}

function cricketFormToPayload(values: CricketProfileFormValues) {
  return {
    born: values.born || null,
    age: idOrNull(values.age),
    batting_style: values.batting_style || null,
    bowling_style: values.bowling_style || null,
    playing_role: values.playing_role || null,
    height: values.height || null,
    college_university: values.college_university || null,
    teams: values.teams.filter((team) => team.trim() !== ''),
    batting: values.batting
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        cricket_match_type_id: idOrNull(row.cricket_match_type_id),
        matches: idOrNull(row.matches),
        won: idOrNull(row.won),
        lost: idOrNull(row.lost),
        innings: idOrNull(row.innings),
        not_out: idOrNull(row.not_out),
        runs: idOrNull(row.runs),
        hs: row.hs || null,
        average: parseFloatOrNull(row.average),
        best: idOrNull(row.best),
        sr: parseFloatOrNull(row.sr),
        hundreds: idOrNull(row.hundreds),
        fifties: idOrNull(row.fifties),
        fours: idOrNull(row.fours),
        sixes: idOrNull(row.sixes),
        catches: idOrNull(row.catches),
        stumpings: idOrNull(row.stumpings),
      })),
    bowling: values.bowling
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        cricket_match_type_id: idOrNull(row.cricket_match_type_id),
        matches: idOrNull(row.matches),
        innings: idOrNull(row.innings),
        balls: idOrNull(row.balls),
        runs: idOrNull(row.runs),
        wickets: idOrNull(row.wickets),
        bbi: row.bbi || null,
        bbm: row.bbm || null,
        average: parseFloatOrNull(row.average),
        economy: parseFloatOrNull(row.economy),
        sr: parseFloatOrNull(row.sr),
        four_w: idOrNull(row.four_w),
        five_w: idOrNull(row.five_w),
        ten_w: idOrNull(row.ten_w),
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        played_xi: row.played_xi,
        runs: idOrNull(row.runs),
        balls: idOrNull(row.balls),
        fours: idOrNull(row.fours),
        sixes: idOrNull(row.sixes),
        overs: parseFloatOrNull(row.overs),
        maidens: idOrNull(row.maidens),
        wickets: idOrNull(row.wickets),
        catches: idOrNull(row.catches),
        stumpings: idOrNull(row.stumpings),
      })),
  };
}

function hockeyFormToPayload(values: HockeyProfileFormValues) {
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
        kit_number: idOrNull(row.kit_number),
        matches: idOrNull(row.matches),
        matches_won: idOrNull(row.matches_won),
        matches_lost: idOrNull(row.matches_lost),
        goals: idOrNull(row.goals),
        assist_goals: idOrNull(row.assist_goals),
        defeat_goal: idOrNull(row.defeat_goal),
        result_won: idOrNull(row.result_won),
        result_lost: idOrNull(row.result_lost),
        result_drawn: idOrNull(row.result_drawn),
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        venue: row.venue || null,
        goals: idOrNull(row.goals),
        assist_goals: idOrNull(row.assist_goals),
        defeat_goals: idOrNull(row.defeat_goals),
        won: row.won,
        lost: row.lost,
        drawn: row.drawn,
      })),
  };
}

export const playerService = {
  async fetchSports() {
    const { data } = await apiClient.get<ApiSuccessResponse<PlayerSportEntry[]>>('/player/sports');
    return data.data;
  },

  async addSport(sportId: number) {
    const { data } = await apiClient.post<ApiSuccessResponse<PlayerSportEntry>>('/player/sports', {
      sport_id: sportId,
    });
    return data.data;
  },

  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<PlayerProfile>>('/player/profile');
    return data.data;
  },

  async updateProfile(payload: UpdatePlayerProfilePayload) {
    const { data } = await apiClient.post<ApiSuccessResponse<PlayerProfile>>(
      '/player/profile',
      buildProfileFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  async fetchCricketProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<CricketProfileResponse>>(
      '/player/cricket-profile'
    );
    return data.data;
  },

  async saveCricketProfile(values: CricketProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<CricketProfileResponse>>(
      '/player/cricket-profile',
      cricketFormToPayload(values)
    );
    return data.data;
  },

  async fetchHockeyProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<HockeyProfileResponse>>(
      '/player/hockey-profile'
    );
    return data.data;
  },

  async saveHockeyProfile(values: HockeyProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<HockeyProfileResponse>>(
      '/player/hockey-profile',
      hockeyFormToPayload(values)
    );
    return data.data;
  },
};
