import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { PickedImage } from '../../types';

interface TeamsInputProps {
  label?: string;
  value: string[];
  onChange: (teams: string[]) => void;
  /** Logo per team name — omit entirely (all other sports today) to render
   * the plain name-only chips exactly as before; pass it (Cricket) to also
   * offer a logo upload per team. Keyed by name since teams here don't have
   * a stable id of their own. */
  logos?: Record<string, string>;
  onUploadLogo?: (teamName: string, image: PickedImage) => Promise<void>;
  onRemoveLogo?: (teamName: string) => void;
}

/** Repeatable "Teams" chip input — a player can add more than one (spec §6.2/6.3). */
export function TeamsInput({ label = 'Teams', value, onChange, logos, onUploadLogo, onRemoveLogo }: TeamsInputProps) {
  const [draft, setDraft] = useState('');
  const [uploadingTeam, setUploadingTeam] = useState<string | null>(null);
  const supportsLogos = !!onUploadLogo;

  const addTeam = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setDraft('');
  };

  const removeTeam = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const pickLogo = async (team: string) => {
    if (!onUploadLogo) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload a team logo.');
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
    setUploadingTeam(team);
    try {
      await onUploadLogo(team, {
        uri: asset.uri,
        // Cosmetic only — the backend's store() call always generates its
        // own random hashed filename, so no need for client-side uniqueness
        // here (and Date.now() inside a .map()-built closure trips the
        // React Compiler's purity check).
        name: asset.fileName ?? 'logo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
        file: asset.file,
      });
    } catch {
      Alert.alert('Upload failed', 'Could not upload that logo. Please try again.');
    } finally {
      setUploadingTeam(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="e.g. School XI"
          placeholderTextColor={colors.textFaint}
          onSubmitEditing={addTeam}
          returnKeyType="done"
        />
        <Pressable onPress={addTeam} style={styles.addButton} accessibilityRole="button">
          <Ionicons name="add" size={20} color={colors.white} />
        </Pressable>
      </View>
      {value.length > 0 ? (
        <View style={styles.chipRow}>
          {value.map((team, index) => (
            <View key={`${team}-${index}`} style={styles.chip}>
              {supportsLogos ? (
                <Pressable
                  onPress={() => (logos?.[team] ? onRemoveLogo?.(team) : pickLogo(team))}
                  onLongPress={() => logos?.[team] && onRemoveLogo?.(team)}
                  style={styles.logoThumb}
                  accessibilityRole="button"
                  accessibilityLabel={logos?.[team] ? `${team} logo — tap to remove` : `Add a logo for ${team}`}
                >
                  {uploadingTeam === team ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : logos?.[team] ? (
                    <Image source={{ uri: logos[team] }} style={styles.logoImg} />
                  ) : (
                    <Ionicons name="camera-outline" size={13} color={colors.primary} />
                  )}
                </Pressable>
              ) : null}
              <Text style={styles.chipText}>{team}</Text>
              <Pressable onPress={() => removeTeam(index)} hitSlop={6}>
                <Ionicons name="close" size={14} color={colors.primary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {supportsLogos && value.length > 0 ? (
        <Text style={styles.logoHint}>Tap the icon on a team to add its logo — tap again to remove it.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  chipText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  logoThumb: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  logoHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    fontSize: 11,
    marginTop: spacing.xs,
  },
});
