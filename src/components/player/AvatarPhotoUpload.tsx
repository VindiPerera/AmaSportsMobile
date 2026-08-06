import React from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';
import { PickedImage } from '../../types';

interface AvatarPhotoUploadProps {
  existingUrl?: string | null;
  picked: PickedImage | null;
  onPick: (image: PickedImage) => void;
  size?: number;
}

/** Circular "Upload Player Photo" avatar from the reference mockups. */
export function AvatarPhotoUpload({
  existingUrl,
  picked,
  onPick,
  size = 84,
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
      });
    }
  };

  const previewUri = picked?.uri ?? existingUrl ?? null;

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityRole="button"
    >
      {previewUri ? (
        <Image
          source={{ uri: previewUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="person-outline" size={size * 0.45} color={colors.textFaint} />
        </View>
      )}
      <View style={styles.editBadge}>
        <Ionicons name="camera" size={12} color={colors.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.card,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
});
