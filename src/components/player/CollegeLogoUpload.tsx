import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { PickedImage } from '../../types';

interface CollegeLogoUploadProps {
  logoUrl: string | null;
  onUpload: (image: PickedImage) => Promise<void>;
  onRemove: () => void;
}

/** Small circular "add a logo" button for the College/University field —
 * same tap-to-add / tap-again-to-remove interaction as the per-team logos
 * in TeamsInput, just for the one field instead of a list. */
export function CollegeLogoUpload({ logoUrl, onUpload, onRemove }: CollegeLogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setIsUploading(true);
    try {
      await onUpload({
        uri: asset.uri,
        // Cosmetic only — the backend always generates its own random
        // storage filename regardless of what's sent here.
        name: asset.fileName ?? 'logo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
        file: asset.file,
      });
    } catch {
      Alert.alert('Upload failed', 'Could not upload that logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Pressable
      onPress={() => (logoUrl ? onRemove() : pickLogo())}
      onLongPress={() => logoUrl && onRemove()}
      style={styles.thumb}
      accessibilityRole="button"
      accessibilityLabel={logoUrl ? 'Education logo — tap to remove' : 'Add a logo for your college or university'}
    >
      {isUploading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.img} />
      ) : (
        <Ionicons name="camera-outline" size={18} color={colors.primary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  img: {
    width: '100%',
    height: '100%',
  },
});
