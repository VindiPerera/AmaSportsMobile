import { apiClient } from './apiClient';
import { isBlankRow, parseFloatOrNull, parseIntOrNull } from '../utils/numeric';
import {
  ApiSuccessResponse,
  CricketAnalysisResponse,
  CricketProfileFormValues,
  CricketProfileResponse,
  HockeyProfileFormValues,
  HockeyProfileResponse,
  PickedImage,
  PlayerProfile,
  PlayerSearchResult,
  PlayerSportEntry,
  PublicPlayerProfile,
  SportAnalysisResponse,
  UpdatePlayerProfilePayload,
} from '../types';

/** Same web-vs-native File handling `buildProfileFormData` uses below,
 * pulled out so the team-logo upload doesn't duplicate it a third time. */
function appendPickedImage(formData: FormData, key: string, image: PickedImage) {
  formData.append(key, (image.file ?? (image as unknown)) as Blob, image.file ? image.name : undefined);
}

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function buildProfileFormData(payload: UpdatePlayerProfilePayload): FormData {
  const formData = new FormData();
  if (payload.full_name !== undefined) formData.append('full_name', payload.full_name);
  if (payload.country !== undefined) formData.append('country', payload.country);
  // On web, expo-image-picker's {uri,name,type} shape isn't a real file —
  // browser FormData would just stringify it to "[object Object]" and fail
  // Laravel's `image` rule. appendPickedImage uses the picker's web-only
  // `file` (a real browser File) there; native RN's FormData polyfill
  // accepts the plain {uri,name,type} object directly.
  if (payload.cover_photo) appendPickedImage(formData, 'cover_photo', payload.cover_photo);
  if (payload.photo) appendPickedImage(formData, 'photo', payload.photo);
  return formData;
}

/** Drops blank/zero entries so an untouched breakdown category is sent as
 * absent rather than `0` — keeps the payload small and matches how the
 * numeric StatTable rows already treat blank cells as "not entered". */
function breakdownToPayload(breakdown: Record<string, string>): Record<string, number> {
  const result: Record<string, number> = {};
  Object.entries(breakdown).forEach(([key, value]) => {
    const count = idOrNull(value);
    if (count !== null) result[key] = count;
  });
  return result;
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
    pitching_line_breakdown: breakdownToPayload(values.pitching_line_breakdown),
    ball_type_breakdown: breakdownToPayload(values.ball_type_breakdown),
    teams: values.teams.filter((team) => team.trim() !== ''),
    batting: values.batting
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        cricket_match_type_id: idOrNull(row.cricket_match_type_id),
        year: idOrNull(row.year),
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
        run_outs: idOrNull(row.run_outs),
        direct_hits: idOrNull(row.direct_hits),
        runs_saved: idOrNull(row.runs_saved),
        runs_giving: idOrNull(row.runs_giving),
        stumps_missing: idOrNull(row.stumps_missing),
      })),
    bowling: values.bowling
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        cricket_match_type_id: idOrNull(row.cricket_match_type_id),
        year: idOrNull(row.year),
        matches: idOrNull(row.matches),
        innings: idOrNull(row.innings),
        balls: idOrNull(row.balls),
        dot_balls: idOrNull(row.dot_balls),
        wide_balls: idOrNull(row.wide_balls),
        no_balls: idOrNull(row.no_balls),
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
    drop_catches: values.drop_catches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        format_id: idOrNull(row.format_id),
        age_category_id: idOrNull(row.age_category_id),
        match_category_id: idOrNull(row.match_category_id),
        field_position_id: idOrNull(row.field_position_id),
        drop_reason_id: idOrNull(row.drop_reason_id),
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
  // No addSport() here — a sport only ever gets attached to the player by
  // successfully submitting that sport's own profile form (see e.g.
  // saveCricketProfile below), never just by picking it in the UI.
  async fetchSports() {
    const { data } = await apiClient.get<ApiSuccessResponse<PlayerSportEntry[]>>('/player/sports');
    return data.data;
  },

  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<PlayerProfile>>('/player/profile');
    return data.data;
  },

  async updateProfile(payload: UpdatePlayerProfilePayload) {
    // Deliberately no explicit Content-Type header here: axios/React Native
    // auto-detects a FormData body and sets `multipart/form-data` with the
    // required `boundary=...` itself. Setting the header manually (without
    // a boundary) makes the server unable to parse the multipart body at
    // all, which fails Laravel's `image` rule with a 422.
    const { data } = await apiClient.post<ApiSuccessResponse<PlayerProfile>>(
      '/player/profile',
      buildProfileFormData(payload)
    );
    return data.data;
  },

  async fetchCricketProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<CricketProfileResponse>>(
      '/player/cricket-profile'
    );
    return data.data;
  },

  /** Player Search (Cricket-only for now) — name search, min 2 characters. */
  async searchPlayers(query: string) {
    const { data } = await apiClient.get<ApiSuccessResponse<PlayerSearchResult[]>>('/players/search', {
      params: { q: query },
    });
    return data.data;
  },

  /** Read-only profile for any player, by id — feeds CricketPlayerDetailView for "View Full Profile". */
  async fetchPublicCricketProfile(playerId: number) {
    const { data } = await apiClient.get<ApiSuccessResponse<PublicPlayerProfile>>(
      `/players/${playerId}/cricket-profile`
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

  /** Uploads (or replaces) the logo for one of the free-text team names on
   * the Cricket form's Teams field — immediate, not part of
   * saveCricketProfile's bulk save (see TeamsInput). */
  async uploadTeamLogo(teamName: string, logo: PickedImage) {
    const formData = new FormData();
    formData.append('team_name', teamName);
    appendPickedImage(formData, 'logo', logo);
    const { data } = await apiClient.post<ApiSuccessResponse<{ team_name: string; logo_url: string }>>(
      '/player/team-logo',
      formData
    );
    return data.data;
  },

  /** Removes a previously uploaded team logo — the team name itself is untouched. */
  async removeTeamLogo(teamName: string) {
    await apiClient.delete('/player/team-logo', { data: { team_name: teamName } });
  },

  /** Uploads (or replaces) the College/University logo — immediate, not
   * part of saveCricketProfile's bulk save. */
  async uploadCollegeLogo(logo: PickedImage) {
    const formData = new FormData();
    appendPickedImage(formData, 'logo', logo);
    const { data } = await apiClient.post<ApiSuccessResponse<{ college_logo_url: string }>>(
      '/player/cricket-profile/college-logo',
      formData
    );
    return data.data;
  },

  /** Removes the College/University logo — the name itself is untouched. */
  async removeCollegeLogo() {
    await apiClient.delete('/player/cricket-profile/college-logo');
  },

  /**
   * Read-only, server-aggregated stats for the Analysis tab. `formatId`
   * omitted (or null) means "All". Pass `silent: true` for background/
   * preview fetches (e.g. Home's dashboard) that already handle a lapsed
   * subscription gracefully and shouldn't trigger the global paywall
   * redirect — only the Analysis tab itself (a deliberate visit) should.
   */
  async fetchCricketAnalysis(formatId?: number | null, options?: { silent?: boolean }) {
    const { data } = await apiClient.get<ApiSuccessResponse<CricketAnalysisResponse>>(
      '/player/cricket-analysis',
      {
        params: formatId ? { format: formatId } : undefined,
        skipSubscriptionRedirect: options?.silent,
      }
    );
    return data.data;
  },

  /**
   * Generic counterpart to fetchCricketAnalysis for every sport
   * GenericSportAnalysisService knows how to aggregate — see
   * SportAnalysisConfig on the backend for the supported slug list.
   */
  async fetchSportAnalysis(sportSlug: string, formatId?: number | null, options?: { silent?: boolean }) {
    const { data } = await apiClient.get<ApiSuccessResponse<SportAnalysisResponse>>(
      `/player/${sportSlug}/analysis`,
      {
        params: formatId ? { format: formatId } : undefined,
        skipSubscriptionRedirect: options?.silent,
      }
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
