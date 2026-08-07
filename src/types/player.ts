import { SportOption } from './lookup';

export type PlayerSportStatus = 'placeholder' | 'completed';

/** Shared across every sport profile that has a "Dominant Hand" field. */
export type DominantHand = 'right' | 'left';

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
  /**
   * Web-only browser `File` from `expo-image-picker`'s `ImagePickerAsset.file`.
   * On web, `FormData` won't turn a plain `{uri,name,type}` object into a real
   * file part (it just stringifies to "[object Object]"), so this must be
   * appended directly there. Native RN's `FormData` polyfill is fine with the
   * plain object and never sets this.
   */
  file?: File;
}

export interface UpdatePlayerProfilePayload {
  full_name?: string;
  country?: string;
  cover_photo?: PickedImage | null;
  photo?: PickedImage | null;
}
