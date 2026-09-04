import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File as ExpoFile } from 'expo-file-system';
import { PickedImage } from '../types';

/** Matches the backend's `max:1024` (KB) rule on the photo-gallery upload
 * (see PlayerPhotoController) — 1024 KiB, not 1000000 bytes. */
const MAX_BYTES = 1024 * 1024;

/** Tried in order, cheapest (least destructive) first, until one lands
 * under MAX_BYTES. A 600px-wide WebP at quality 0.5 is tiny for virtually
 * any real photo, so this is expected to succeed well before the last step. */
const ATTEMPTS: { width?: number; quality: number }[] = [
  { quality: 0.8 },
  { quality: 0.6 },
  { width: 1600, quality: 0.7 },
  { width: 1200, quality: 0.6 },
  { width: 900, quality: 0.5 },
  { width: 600, quality: 0.5 },
];

/**
 * Local URI → its size in bytes (and, on web, the Blob itself — needed
 * there to build the upload `File`; native's FormData upload works from
 * the bare `{uri,name,type}` triple instead, see PickedImage).
 *
 * Split by platform because `fetch()` on a local `file://` URI is a
 * long-standing React Native reliability problem, especially on Android —
 * it can hang or reject even though the file is perfectly readable. Web's
 * native `fetch` has no such issue, so it stays the web path (it's also
 * the only way to get a Blob there). Native uses expo-file-system's `File`,
 * a synchronous filesystem stat with no network layer involved at all.
 */
async function sizeOf(uri: string): Promise<{ blob: Blob | null; sizeBytes: number }> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    return { blob, sizeBytes: blob.size };
  }
  return { blob: null, sizeBytes: new ExpoFile(uri).size };
}

/**
 * Converts whatever the player picked (JPEG/PNG/HEIC from their camera roll)
 * into a WebP file under 1MB — the Photo Gallery's format/size requirement
 * (see PlayerPhotoController). Players never see a format or size picker;
 * this runs silently between "pick" and "upload".
 *
 * Throws if even the most aggressive attempt doesn't fit, which in practice
 * should only happen for a pathological source image.
 */
export async function compressImageToWebp(uri: string): Promise<PickedImage> {
  for (const attempt of ATTEMPTS) {
    const context = ImageManipulator.manipulate(uri);
    if (attempt.width) context.resize({ width: attempt.width });
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({ format: SaveFormat.WEBP, compress: attempt.quality });

    const { blob, sizeBytes } = await sizeOf(result.uri);
    if (sizeBytes <= MAX_BYTES) {
      const name = `photo-${Date.now()}.webp`;
      return {
        uri: result.uri,
        name,
        type: 'image/webp',
        // Web only (blob is null on native — see sizeOf) — mirrors how
        // expo-image-picker's own `file` is used elsewhere (see
        // PickedImage), since browser FormData needs a real File, not a
        // {uri,name,type} object, to upload a blob: URI.
        file: blob ? new File([blob], name, { type: 'image/webp' }) : undefined,
      };
    }
  }

  throw new Error('Could not compress this photo under 1MB. Please choose a simpler photo.');
}

/**
 * Permission request → library picker → compressImageToWebp, in one call —
 * every Photo Gallery entry point (the Cricket form's PhotoGalleryUpload,
 * the Player Profile hub, the Home dashboard) shares this instead of each
 * reimplementing the pick step. Resolves `null` if the player cancels or
 * denies permission (an alert is already shown for the latter) — callers
 * just bail out on null rather than needing their own error branch for it.
 */
export async function pickAndCompressPhoto(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to add a photo.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled || !result.assets[0]) return null;

  return compressImageToWebp(result.assets[0].uri);
}
