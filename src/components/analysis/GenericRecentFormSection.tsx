import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatShortMatchDate } from '../../utils/date';

interface GenericRecentFormSectionProps {
  recentForm: Record<string, unknown>[];
  /** Which key on each row holds the date — varies per sport (match_date/fight_date/event_date). */
  dateKey: string;
  /** Which key holds the row's title (usually "opponent") — omitted for event-based sports (Athletics/Swimming) that have no opponent. */
  titleKey?: string;
}

function humanizeKey(key: string): string {
  return key
    .replace(/_id$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function isDisplayable(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '' && value !== false && value !== 0;
}

/**
 * Generic counterpart to CricketRecentFormSection's match-log list — a
 * per-sport trend chart isn't practical to generalize (every sport's
 * "form" metric is named differently), so this shows the last 10 entries
 * as cards with every non-empty field rendered as a small tag, most recent
 * first. The by-Format bar chart above still gives a real chart per sport.
 */
export function GenericRecentFormSection({ recentForm, dateKey, titleKey }: GenericRecentFormSectionProps) {
  const rows = [...recentForm].reverse();

  if (rows.length === 0) {
    return (
      <View style={styles.emptyNote}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textFaint} />
        <Text style={styles.emptyNoteText}>No recent entries logged yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {rows.map((row, idx) => {
        const title = titleKey ? String(row[titleKey] ?? 'Entry') : 'Entry';
        const tagEntries = Object.entries(row).filter(
          ([key, value]) => key !== dateKey && key !== titleKey && isDisplayable(value)
        );

        return (
          <View key={idx} style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeader}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.date}>{formatShortMatchDate(row[dateKey] as string | null)}</Text>
            </View>
            {tagEntries.length > 0 ? (
              <View style={styles.tagRow}>
                {tagEntries.map(([key, value]) => (
                  <View key={key} style={styles.tag}>
                    <Text style={styles.tagText}>
                      {value === true ? humanizeKey(key) : `${humanizeKey(key)}: ${String(value)}`}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  date: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tagText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  emptyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  emptyNoteText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
});
