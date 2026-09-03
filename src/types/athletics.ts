/** One row per event the player selected in the multi-select "Events" field (spec §C1). */
export interface AthleticsPersonalBestRowForm {
  athletics_event_id: string;
  personal_best: string;
}

export interface AthleticsCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  athletics_event_id: string;
  personal_best: string;
  third_place: string;
  second_place: string;
  champion: string;
}

export interface AthleticsRecentEventRowForm {
  event_date: string;
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  athletics_event_id: string;
  personal_best: string;
  place: string;
}

export interface AthleticsProfileFormValues {
  born: string;
  age: string;
  height: string;
  weight: string;
  college_university: string;
  teams: string[];
  personal_bests: AthleticsPersonalBestRowForm[];
  career_stats: AthleticsCareerRowForm[];
  recent_events: AthleticsRecentEventRowForm[];
}

export interface AthleticsProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  college_university: string | null;
  teams: string[];
  personal_bests: Record<string, unknown>[];
  career_stats: Record<string, unknown>[];
  recent_events: Record<string, unknown>[];
}
