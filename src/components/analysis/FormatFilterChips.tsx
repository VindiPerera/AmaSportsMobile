import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../../theme';
import { CricketFormatOption } from '../../types';
import { Chip } from '../ui/Chip';

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
});
