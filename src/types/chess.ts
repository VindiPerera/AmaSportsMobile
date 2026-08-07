export interface ChessCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  games: string;
  win: string;
  lost: string;
  third_place: string;
  second_place: string;
  champion: string;
}

export interface ChessRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  win: boolean;
  lost: boolean;
  place: string;
}

export interface ChessProfileFormValues {
  born: string;
  age: string;
  height: string;
  current_ranking: string;
  college_university: string;
  teams: string[];
  career_stats: ChessCareerRowForm[];
  recent_matches: ChessRecentMatchRowForm[];
}

export interface ChessProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  current_ranking: string | null;
  college_university: string | null;
  teams: string[];
  career_stats: Record<string, unknown>[];
  recent_matches: Record<string, unknown>[];
}
