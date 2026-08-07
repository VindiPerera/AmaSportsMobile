import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

interface GlossaryDisclosureProps {
  title?: string;
  items: { abbr: string; meaning: string }[];
}

/** Expandable "What do these mean?" reference for abbreviated table columns (e.g. Kabadi's R/SR/UR/...). */
export function GlossaryDisclosure({ title = 'What do these mean?', items }: GlossaryDisclosureProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
      >
        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.headerText}>{title}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textFaint}
        />
      </Pressable>
      {expanded ? (
        <View style={styles.grid}>
          {items.map((item) => (
            <View key={item.abbr} style={styles.row}>
              <Text style={styles.abbr}>{item.abbr}</Text>
              <Text style={styles.meaning}>{item.meaning}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  headerText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    flex: 1,
  },
  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    width: '47%',
  },
  abbr: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  meaning: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 1,
  },
});
