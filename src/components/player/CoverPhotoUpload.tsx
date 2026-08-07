import React from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { PickedImage } from '../../types';

interface CoverPhotoUploadProps {
  /** Existing remote URL (from the API) shown until the player picks a new one. */
  existingUrl?: string | null;
  picked: PickedImage | null;
  onPick: (image: PickedImage) => void;
}

/** Dashed rectangular "Upload Cover Photo" box matching reference mockup styling. */
export function CoverPhotoUpload({ existingUrl, picked, onPick }: CoverPhotoUploadProps) {
  const handlePress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a cover photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPick({
        uri: asset.uri,
        name: asset.fileName ?? `cover-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
        file: asset.file,
      });
    }
  };

  const previewUri = picked?.uri ?? existingUrl ?? null;

  return (
    <Pressable onPress={handlePress} style={[styles.container, shadows.sm]} accessibilityRole="button">
      {previewUri ? (
        <Image source={{ uri: previewUri }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <View style={styles.iconCircle}>
            <Ionicons name="image-outline" size={24} color={colors.primary} />
          </View>
          <Text style={styles.placeholderText}>Upload Cover Photo</Text>
          <Text style={styles.placeholderSubtext}>Tap to browse photo library</Text>
        </View>
      )}
      <View style={styles.editBadge}>
        <Ionicons name="camera" size={14} color={colors.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 150,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.card,
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  placeholderText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  placeholderSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  editBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
});

