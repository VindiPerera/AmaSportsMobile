import { apiClient } from './apiClient';
import { isBlankRow, parseFloatOrNull, parseIntOrNull } from '../utils/numeric';
import { ApiSuccessResponse, SoftBallCricketProfileFormValues, SoftBallCricketProfileResponse } from '../types';

function idOrNull(value: string): number | null {
  return parseIntOrNull(value);
}

function toPayload(values: SoftBallCricketProfileFormValues) {
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
        matches: idOrNull(row.matches),
        runs: idOrNull(row.runs),
        innings: idOrNull(row.innings),
        highest: row.highest || null,
        not_out: idOrNull(row.not_out),
        hundreds: idOrNull(row.hundreds),
        fifties: idOrNull(row.fifties),
        sixes: idOrNull(row.sixes),
        fours: idOrNull(row.fours),
        catches: idOrNull(row.catches),
        stumpings: idOrNull(row.stumpings),
        won: idOrNull(row.won),
        lost: idOrNull(row.lost),
        tied: idOrNull(row.tied),
      })),
    bowling: values.bowling
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        matches: idOrNull(row.matches),
        balls: idOrNull(row.balls),
        runs: idOrNull(row.runs),
        wickets: idOrNull(row.wickets),
        average: parseFloatOrNull(row.average),
        economy: parseFloatOrNull(row.economy),
        three_w: idOrNull(row.three_w),
        four_w: idOrNull(row.four_w),
        five_w: idOrNull(row.five_w),
        career_best: row.career_best || null,
      })),
    recent_matches: values.recent_matches
      .filter((row) => !isBlankRow(row as unknown as Record<string, string>))
      .map((row) => ({
        match_date: row.match_date || null,
        opponent: row.opponent || null,
        won: row.won,
        lost: row.lost,
        runs: idOrNull(row.runs),
        balls: idOrNull(row.balls),
        average: row.average || null,
        bowling_balls: idOrNull(row.bowling_balls),
        bowling_runs: idOrNull(row.bowling_runs),
        wickets: idOrNull(row.wickets),
        catches: idOrNull(row.catches),
        stumpings: idOrNull(row.stumpings),
      })),
  };
}

export const softBallCricketService = {
  async fetchProfile() {
    const { data } = await apiClient.get<ApiSuccessResponse<SoftBallCricketProfileResponse>>(
      '/player/soft-ball-cricket-profile'
    );
    return data.data;
  },

  async saveProfile(values: SoftBallCricketProfileFormValues) {
    const { data } = await apiClient.put<ApiSuccessResponse<SoftBallCricketProfileResponse>>(
      '/player/soft-ball-cricket-profile',
      toPayload(values)
    );
    return data.data;
  },
};
