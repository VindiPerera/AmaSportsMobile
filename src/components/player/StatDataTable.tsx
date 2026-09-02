import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { ColumnType, StatColumn, formatStatCellValue } from './StatTable';

const ROW_HEIGHT = 44;

const CELL_WIDTH: Record<ColumnType, number> = {
  text: 100,
  number: 76,
  decimal: 84,
  date: 110,
  boolean: 84,
  select: 120,
};

interface StatDataTableProps {
  columns: StatColumn[];
  rows: Record<string, unknown>[];
  /** Opens the row at this index for editing (see RecentMatchTable/
   * CareerStatTable) — always available, independent of the "one new entry
   * per save" add-lock, since correcting something already on file isn't
   * adding a new one. */
  onEditRow: (index: number) => void;
}

/**
 * Read-only, horizontally-scrolling grid of already-saved entries — sits
 * above the "Add New ..." button so a player can see exactly what's on file
 * (and fix it, via the pencil icon) instead of just a bare row count. The
 * row number + edit action are pinned to the left outside the ScrollView;
 * only the data columns scroll, since a row can carry a dozen-plus of them
 * (see the column lists in cricket.tsx).
 */
export function StatDataTable({ columns, rows, onEditRow }: StatDataTableProps) {
  if (rows.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.pinnedColumn}>
        <View style={[styles.pinnedCell, styles.headerCellBg]}>
          <Text style={styles.headerText}>#</Text>
        </View>
        {rows.map((_, index) => (
          <View key={index} style={[styles.pinnedCell, index % 2 === 1 && styles.rowAlt]}>
            <Text style={styles.indexText}>{index + 1}</Text>
            <Pressable
              onPress={() => onEditRow(index)}
              hitSlop={8}
              style={styles.editButton}
              accessibilityRole="button"
              accessibilityLabel={`Edit entry ${index + 1}`}
            >
              <Ionicons name="pencil" size={12} color={colors.primary} />
            </Pressable>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator bounces={false}>
        <View>
          <View style={[styles.dataRow, styles.headerCellBg]}>
            {columns.map((column) => (
              <Text
                key={column.key}
                style={[styles.headerCell, { width: column.width ?? CELL_WIDTH[column.type] }]}
                numberOfLines={1}
              >
                {column.label}
              </Text>
            ))}
          </View>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.dataRow, rowIndex % 2 === 1 && styles.rowAlt]}>
              {columns.map((column) => (
                <Text
                  key={column.key}
                  style={[styles.dataCell, { width: column.width ?? CELL_WIDTH[column.type] }]}
                  numberOfLines={1}
                >
                  {formatStatCellValue(column, row[column.key])}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  pinnedColumn: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  pinnedCell: {
    height: ROW_HEIGHT,
    minWidth: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    gap: 6,
  },
  headerCellBg: {
    backgroundColor: colors.background,
  },
  rowAlt: {
    backgroundColor: colors.background,
  },
  headerText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 10,
  },
  indexText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 11,
  },
  editButton: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    height: ROW_HEIGHT,
  },
  headerCell: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.xs,
    alignSelf: 'center',
  },
  dataCell: {
    ...typography.caption,
    color: colors.text,
    fontSize: 12,
    paddingHorizontal: spacing.xs,
    alignSelf: 'center',
  },
});
