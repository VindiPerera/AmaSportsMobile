import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

interface TeamsInputProps {
  label?: string;
  value: string[];
  onChange: (teams: string[]) => void;
}

/** Repeatable "Teams" chip input — a player can add more than one (spec §6.2/6.3). */
export function TeamsInput({ label = 'Teams', value, onChange }: TeamsInputProps) {
  const [draft, setDraft] = useState('');

  const addTeam = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setDraft('');
  };

  const removeTeam = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
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
              <Text style={styles.chipText}>{team}</Text>
              <Pressable onPress={() => removeTeam(index)} hitSlop={6}>
                <Ionicons name="close" size={14} color={colors.primary} />
              </Pressable>
            </View>
          ))}
        </View>
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
});
