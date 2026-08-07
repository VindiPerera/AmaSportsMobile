export interface SwimmingPersonalBestRowForm {
  swimming_event_id: string;
  personal_best: string;
}

export interface SwimmingCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  swimming_event_id: string;
  matches: string;
  current_time: string;
  third_place: string;
  second_place: string;
  champion: string;
}

export interface SwimmingRecentEventRowForm {
  event_date: string;
  age_category_id: string;
  match_category_id: string;
  matches: string;
  swimming_event_id: string;
  performance_time: string;
  place: string;
}

export interface SwimmingProfileFormValues {
  born: string;
  age: string;
  height: string;
  weight: string;
  college_university: string;
  teams: string[];
  personal_bests: SwimmingPersonalBestRowForm[];
  career_stats: SwimmingCareerRowForm[];
  recent_events: SwimmingRecentEventRowForm[];
}

export interface SwimmingProfileResponse {
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
