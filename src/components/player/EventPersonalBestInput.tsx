import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrayPath, Control, Controller, FieldValues, Path, useFieldArray, useWatch } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { Dropdown, DropdownOption } from './Dropdown';

interface EventPersonalBestInputProps<TFieldValues extends FieldValues> {
  label?: string;
  control: Control<TFieldValues>;
  /** Field array name, e.g. "personal_bests". */
  name: ArrayPath<TFieldValues>;
  /** Key each row uses for the event id, e.g. "athletics_event_id" or "swimming_event_id". */
  eventIdKey: string;
  events: DropdownOption[];
}

/**
 * The "Events" multi-select + "Personal Best" per-event pair from Overview
 * (spec Phase 3 §C1/§C2, Athletics & Swimming) — pick an event from the
 * dropdown to add it, then fill in its personal best inline.
 */
export function EventPersonalBestInput<TFieldValues extends FieldValues>({
  label = 'Events',
  control,
  name,
  eventIdKey,
  events,
}: EventPersonalBestInputProps<TFieldValues>) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const [pendingEventId, setPendingEventId] = useState('');

  const rows = useWatch({ control, name: name as Path<TFieldValues> }) as
    | Record<string, string>[]
    | undefined;

  const availableEvents = useMemo(() => {
    const usedIds = new Set((rows ?? []).map((row) => row?.[eventIdKey]).filter(Boolean));
    return events.filter((event) => !usedIds.has(event.value));
  }, [events, rows, eventIdKey]);

  const eventName = (eventId: string) => events.find((e) => e.value === eventId)?.label ?? '—';

  const handleAdd = () => {
    if (!pendingEventId) return;
    append({ [eventIdKey]: pendingEventId, personal_best: '' } as never);
    setPendingEventId('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.addRow}>
        <View style={styles.addDropdown}>
          <Dropdown value={pendingEventId} onChange={setPendingEventId} options={availableEvents} placeholder="Select an event" />
        </View>
        <Pressable onPress={handleAdd} style={styles.addButton} accessibilityRole="button">
          <Ionicons name="add" size={20} color={colors.white} />
        </Pressable>
      </View>

      {fields.map((field, index) => (
        <View key={field.id} style={styles.row}>
          <Text style={styles.eventName} numberOfLines={1}>
            {eventName((rows?.[index]?.[eventIdKey] as string) ?? '')}
          </Text>
          <Controller
            control={control}
            name={`${name}.${index}.personal_best` as Path<TFieldValues>}
            render={({ field: { value, onChange } }) => (
              <TextInput
                style={styles.personalBestInput}
                value={(value as string) ?? ''}
                onChangeText={onChange}
                placeholder="Personal best"
                placeholderTextColor={colors.textFaint}
              />
            )}
          />
          <Pressable onPress={() => remove(index)} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color={colors.live} />
          </Pressable>
        </View>
      ))}
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
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  addDropdown: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  eventName: {
    ...typography.caption,
    fontWeight: '700',
    flex: 1,
  },
  personalBestInput: {
    width: 120,
    height: 40,
    ...typography.caption,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
  },
});
