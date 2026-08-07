import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
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
  width?: number;
}

const DEFAULT_WIDTH: Record<ColumnType, number> = {
  text: 130,
  number: 84,
  decimal: 90,
  date: 124,
  boolean: 64,
  select: 140,
};

interface StatTableProps<TFieldValues extends FieldValues> {
  title: string;
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  columns: StatColumn[];
  emptyRow: Record<string, any>;
}

/**
 * Generic repeatable stat table — restyled into a card-based scrollable container
 * with clean column headers, formatted cell inputs, and pill action buttons.
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
    <View style={[styles.cardContainer, shadows.sm]}>
      <View style={styles.titleRow}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.rowCountBadge}>
            <Text style={styles.rowCountText}>{fields.length} rows</Text>
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
          <Ionicons name="document-text-outline" size={24} color={colors.textFaint} />
          <Text style={styles.emptyText}>No entries added yet — tap &quot;Add Row&quot; to begin.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator style={styles.scrollWrapper}>
          <View>
            <View style={styles.headerRow}>
              {columns.map((column) => (
                <Text
                  key={column.key}
                  style={[styles.headerCell, { width: column.width ?? DEFAULT_WIDTH[column.type] }]}
                >
                  {column.label.toUpperCase()}
                </Text>
              ))}
              <Text style={[styles.headerCell, { width: 44 }]} />
            </View>

            {fields.map((field, rowIndex) => (
              <View
                key={field.id}
                style={[
                  styles.dataRow,
                  rowIndex % 2 === 1 && styles.evenRow,
                ]}
              >
                {columns.map((column) => (
                  <View
                    key={column.key}
                    style={[styles.cell, { width: column.width ?? DEFAULT_WIDTH[column.type] }]}
                  >
                    <Controller
                      control={control}
                      name={`${name}.${rowIndex}.${column.key}` as Path<TFieldValues>}
                      render={({ field: { value, onChange } }) => (
                        <Cell column={column} value={value} onChange={onChange} />
                      )}
                    />
                  </View>
                ))}
                <View style={[styles.cell, { width: 44, alignItems: 'center' }]}>
                  <Pressable
                    onPress={() => remove(rowIndex)}
                    hitSlop={8}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.live} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
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
  cardContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
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
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  scrollWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  evenRow: {
    backgroundColor: colors.background,
  },
  cell: {
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  cellInput: {
    ...typography.caption,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    height: 38,
    paddingHorizontal: spacing.xs,
  },
  switchWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.liveLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

