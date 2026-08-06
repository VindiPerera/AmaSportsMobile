import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ArrayPath, Control, Controller, FieldValues, Path, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
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
  text: 120,
  number: 76,
  decimal: 84,
  date: 116,
  boolean: 56,
  select: 130,
};

interface StatTableProps<TFieldValues extends FieldValues> {
  title: string;
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  columns: StatColumn[];
   
  emptyRow: Record<string, any>;
}

/**
 * Generic repeatable stat table — one instance per Career Status / Recent
 * Matches table across the Cricket and Hockey forms (spec 6.2/6.3), driven
 * entirely by a column-definition list so no per-table component is needed.
 * Header + rows share one horizontal ScrollView so columns stay aligned.
 * Typed over the caller's form (`TFieldValues`) rather than `Control<any>`,
 * which react-hook-form's generics don't structurally accept.
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
        <Text style={styles.title}>{title}</Text>
        <Pressable
          onPress={() => append(emptyRow as never)}
          style={styles.addRowButton}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.addRowText}>Add Row</Text>
        </Pressable>
      </View>

      {fields.length === 0 ? (
        <Text style={styles.emptyText}>No rows yet — tap &quot;Add Row&quot; to add one.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={styles.row}>
              {columns.map((column) => (
                <Text
                  key={column.key}
                  style={[styles.headerCell, { width: column.width ?? DEFAULT_WIDTH[column.type] }]}
                >
                  {column.label}
                </Text>
              ))}
              <Text style={[styles.headerCell, { width: 44 }]} />
            </View>

            {fields.map((field, rowIndex) => (
              <View key={field.id} style={styles.row}>
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
                <View style={[styles.cell, { width: 44 }]}>
                  <Pressable onPress={() => remove(rowIndex)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.live} />
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
      return <Switch value={!!value} onValueChange={onChange} />;
    case 'select':
      return (
        <Dropdown
          compact
          value={value ?? ''}
          onChange={onChange}
          options={column.options ?? []}
          placeholder="—"
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addRowText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textFaint,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    ...typography.caption,
    fontWeight: '700',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
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
    backgroundColor: colors.card,
    height: 40,
    paddingHorizontal: spacing.xs,
  },
});
