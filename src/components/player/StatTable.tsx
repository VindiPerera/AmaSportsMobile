import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ArrayPath, Control, Controller, FieldValues, Path, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { toIsoDateString } from '../../utils/date';
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
                      <StatCell column={column} value={value} onChange={onChange} />
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

/** The field widget for one StatColumn — exported so other add-one-at-a-time
 * flows (see RecentMatchTable/SimpleStatAddModal) get the same date-picker/
 * boolean-switch/select behavior without re-implementing it. */
export function StatCell({
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
      return <DateCell value={value ?? ''} onChange={onChange} />;
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

/**
 * A native date picker for the 'date' column type, in place of a raw
 * TextInput — free-typed text ("25/08/2026", a half-finished "2026-08")
 * passed Laravel's `date` validation rule right through to a 422 on save.
 * Matches the picker already used for the Born field (see DateField).
 */
function DateCell({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) onChange(toIsoDateString(selectedDate));
  };

  return (
    <>
      <Pressable style={styles.dateCellButton} onPress={() => setShowPicker(true)} accessibilityRole="button">
        <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
        <Text style={value ? styles.dateCellValue : styles.dateCellPlaceholder} numberOfLines={1}>
          {value || 'YYYY-MM-DD'}
        </Text>
      </Pressable>
      {showPicker ? (
        <>
          <DateTimePicker
            value={value ? new Date(value) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={() => setShowPicker(false)} style={styles.dateCellDoneButton}>
              <Text style={styles.dateCellDoneText}>Done</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </>
  );
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
  dateCellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    height: 50,
    paddingHorizontal: spacing.sm,
  },
  dateCellValue: {
    ...typography.caption,
    color: colors.text,
    flexShrink: 1,
  },
  dateCellPlaceholder: {
    ...typography.caption,
    color: colors.textFaint,
    flexShrink: 1,
  },
  dateCellDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  dateCellDoneText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
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
