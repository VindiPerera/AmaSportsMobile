import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { PickedImage, PlayerPhoto } from '../../types';
import { pickAndCompressPhoto } from '../../utils/imageCompression';

const MAX_PHOTOS = 10;
const TILE_SIZE = 78;

interface PhotoGalleryUploadProps {
  photos: PlayerPhoto[];
  onUpload: (image: PickedImage) => Promise<void>;
  onRemove: (photoId: number) => Promise<void>;
}

/**
 * Player's photo gallery (up to MAX_PHOTOS) — immediate upload/remove per
 * photo, same "own endpoint, not part of the bulk Save" pattern as
 * TeamsInput's per-team logo. Every picked photo is silently converted to
 * WebP and compressed under 1MB (see compressImageToWebp) before it's ever
 * uploaded — players never see a format or size picker.
 */
export function PhotoGalleryUpload({ photos, onUpload, onRemove }: PhotoGalleryUploadProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const isFull = photos.length >= MAX_PHOTOS;

  const handleAdd = async () => {
    if (isFull || isPicking) return;

    setIsPicking(true);
    try {
      const webp = await pickAndCompressPhoto();
      if (!webp) return;
      await onUpload(webp);
    } catch {
      Alert.alert('Upload failed', 'Could not upload that photo. Please try again.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleRemove = (photo: PlayerPhoto) => {
    Alert.alert('Remove photo?', 'This photo will be removed from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingId(photo.id);
          try {
            await onRemove(photo.id);
          } catch {
            Alert.alert('Remove failed', 'Could not remove that photo. Please try again.');
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Photos</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{photos.length}/{MAX_PHOTOS}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.tile}>
            <Image source={{ uri: photo.url }} style={styles.tileImage} />
            {removingId === photo.id ? (
              <View style={styles.tileOverlay}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            ) : (
              <Pressable
                onPress={() => handleRemove(photo)}
                style={styles.removeBadge}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Ionicons name="close" size={13} color={colors.white} />
              </Pressable>
            )}
          </View>
        ))}

        {!isFull ? (
          <Pressable
            onPress={handleAdd}
            disabled={isPicking}
            style={[styles.tile, styles.addTile]}
            accessibilityRole="button"
            accessibilityLabel="Add a photo"
          >
            {isPicking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="add" size={26} color={colors.primary} />
            )}
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.hint}>
        {isFull
          ? `You've reached the ${MAX_PHOTOS}-photo limit — remove one to add another.`
          : `Add up to ${MAX_PHOTOS} photos. Each is converted to WebP and kept under 1MB automatically.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    fontSize: 11,
    marginTop: spacing.xs,
  },
});
