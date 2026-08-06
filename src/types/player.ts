import { SportOption } from './lookup';

export type PlayerSportStatus = 'placeholder' | 'completed';

export interface PlayerSportEntry {
  id: number;
  status: PlayerSportStatus;
  sport: SportOption;
}

export interface PlayerProfile {
  id: number;
  full_name: string | null;
  country: string | null;
  cover_photo_url: string | null;
  photo_url: string | null;
}

/** A picked image ready to attach to a multipart `FormData` upload. */
export interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

export interface UpdatePlayerProfilePayload {
  full_name?: string;
  country?: string;
  cover_photo?: PickedImage | null;
  photo?: PickedImage | null;
}
