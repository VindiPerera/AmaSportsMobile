import React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ArrayPath, Control, Controller, FieldValues, Path, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Dropdown, DropdownOption } from './Dropdown';

export type ColumnType = 'text' | 'number' | 'decimal' | 'date' | 'boolean' | 'select';

export interface StatColumn {
  key: string;
  label: string;
  type: ColumnType;
  options?: DropdownOption[];
  /** Minimum width (px) the field claims before wrapping to the next line. */
  width?: number;
}

const FIELD_MIN_WIDTH: Record<ColumnType, number> = {
  text: 128,
  number: 92,
  decimal: 100,
  date: 140,
  boolean: 104,
  select: 152,
};

interface StatTableProps<TFieldValues extends FieldValues> {
  title: string;
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  columns: StatColumn[];
  emptyRow: Record<string, any>;
}

/**
 * Generic repeatable stat entry list. Each row renders as its own labeled
 * card with fields wrapping in a responsive grid, rather than a wide
 * horizontally-scrolling table — reads cleanly on phone-width screens with
 * no clipped text or off-screen columns, and every field's label sits
 * directly above its input instead of a separate header row.
 */
export function StatTable<TFieldValues extends FieldValues>({
  title,
  control,
  name,
  columns,
  emptyRow,
}: StatTableProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.rowCountBadge}>
            <Text style={styles.rowCountText}>{fields.length} {fields.length === 1 ? 'entry' : 'entries'}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => append(emptyRow as never)}
          style={({ pressed }) => [styles.addRowButton, pressed && styles.addRowButtonPressed]}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={16} color={colors.white} />
          <Text style={styles.addRowText}>Add Row</Text>
        </Pressable>
      </View>

      {fields.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={22} color={colors.textFaint} />
          <Text style={styles.emptyText}>No entries added yet — tap &quot;Add Row&quot; to begin.</Text>
        </View>
      ) : (
        fields.map((field, rowIndex) => (
          <View key={field.id} style={[styles.entryCard, shadows.sm]}>
            <View style={styles.entryHeader}>
              <View style={styles.entryIndexBadge}>
                <Text style={styles.entryIndexText}>{rowIndex + 1}</Text>
              </View>
              <Text style={styles.entryLabel}>Entry {rowIndex + 1}</Text>
              <Pressable onPress={() => remove(rowIndex)} hitSlop={8} style={styles.deleteButton} accessibilityRole="button">
                <Ionicons name="trash-outline" size={14} color={colors.live} />
              </Pressable>
            </View>

            <View style={styles.fieldGrid}>
              {columns.map((column) => (
                <View key={column.key} style={[styles.fieldWrapper, { minWidth: column.width ?? FIELD_MIN_WIDTH[column.type] }]}>
                  <Text style={styles.fieldLabel} numberOfLines={1}>
                    {column.label}
                  </Text>
                  <Controller
                    control={control}
                    name={`${name}.${rowIndex}.${column.key}` as Path<TFieldValues>}
                    render={({ field: { value, onChange } }) => (
                      <Cell column={column} value={value} onChange={onChange} />
                    )}
                  />
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function Cell({
  column,
  value,
  onChange,
}: {
  column: StatColumn;
  value: any;
  onChange: (value: unknown) => void;
}) {
  switch (column.type) {
    case 'boolean':
      return (
        <View style={styles.switchWrapper}>
          <Switch
            value={!!value}
            onValueChange={onChange}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={value ? colors.primary : colors.textFaint}
          />
        </View>
      );
    case 'select':
      return (
        <Dropdown
          compact
          value={value ?? ''}
          onChange={onChange}
          options={column.options ?? []}
          placeholder="Select"
        />
      );
    case 'date':
      return (
        <TextInput
          style={styles.cellInput}
          value={value ?? ''}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textFaint}
        />
      );
    case 'number':
      return (
        <TextInput
          style={styles.cellInput}
          value={value ?? ''}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.textFaint}
        />
      );
    case 'decimal':
      return (
        <TextInput
          style={styles.cellInput}
          value={value ?? ''}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor={colors.textFaint}
        />
      );
    default:
      return (
        <TextInput
          style={styles.cellInput}
          value={value ?? ''}
          onChangeText={onChange}
          placeholderTextColor={colors.textFaint}
        />
      );
  }
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  titleWithBadge: {
    flexDirection: 'row',
    flexShrink: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flexShrink: 1,
  },
  rowCountBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rowCountText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addRowButtonPressed: {
    opacity: 0.88,
  },
  addRowText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  entryIndexBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryIndexText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    fontSize: 11,
  },
  entryLabel: {
    ...typography.caption,
    flex: 1,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fieldWrapper: {
    flexGrow: 1,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
    marginBottom: 4,
  },
  cellInput: {
    ...typography.caption,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    height: 50,
    paddingHorizontal: spacing.sm,
  },
  switchWrapper: {
    height: 50,
    justifyContent: 'center',
  },
  deleteButton: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.liveLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
