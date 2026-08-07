import React from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows } from '../../theme';
import { PickedImage } from '../../types';

interface AvatarPhotoUploadProps {
  existingUrl?: string | null;
  picked: PickedImage | null;
  onPick: (image: PickedImage) => void;
  size?: number;
}

/** Circular "Upload Player Photo" avatar matching reference mockup styling. */
export function AvatarPhotoUpload({
  existingUrl,
  picked,
  onPick,
  size = 88,
}: AvatarPhotoUploadProps) {
  const handlePress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onPick({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
        file: asset.file,
      });
    }
  };

  const previewUri = picked?.uri ?? existingUrl ?? null;

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.container,
        shadows.md,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      accessibilityRole="button"
    >
      {previewUri ? (
        <Image
          source={{ uri: previewUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="person-outline" size={size * 0.45} color={colors.primary} />
        </View>
      )}
      <View style={styles.editBadge}>
        <Ionicons name="camera" size={13} color={colors.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.card,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
});

