import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { CricketFormatOption } from '../../types';

interface FormatFilterChipsProps {
  formats: CricketFormatOption[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

/**
 * "All" plus one chip per Format value that actually appears in this
 * player's own data (spec Phase 5 §3a) — not the full shared Format lookup,
 * so a player never sees a filter chip for a competition level they've
 * never logged a stat row against.
 */
export function FormatFilterChips({ formats, selectedId, onSelect }: FormatFilterChipsProps) {
  if (formats.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollWrapper}
      contentContainerStyle={styles.row}
    >
      <Chip label="All" active={selectedId === null} onPress={() => onSelect(null)} />
      {formats.map((format) => (
        <Chip
          key={format.id}
          label={format.name}
          active={selectedId === format.id}
          onPress={() => onSelect(format.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollWrapper: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textMuted,
  },
  chipTextActive: {
    fontWeight: '700',
    color: colors.white,
  },
});
