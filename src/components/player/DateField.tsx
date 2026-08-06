import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { toIsoDateString } from '../../utils/date';

interface DateFieldProps {
  label?: string;
  /** `YYYY-MM-DD`, or empty string for unset. */
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
}

/** The one field (Born) that gets a native date picker — see plan notes on why repeatable-row dates stay plain text. */
export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) onChange(toIsoDateString(selectedDate));
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        style={[styles.wrapper, !!error && styles.wrapperError]}
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
      >
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={styles.icon} />
        <Text style={value ? styles.valueText : styles.placeholderText}>
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
            <Pressable onPress={() => setShowPicker(false)} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  wrapperError: {
    borderColor: colors.live,
  },
  icon: {
    marginRight: spacing.sm,
  },
  valueText: {
    ...typography.body,
    color: colors.text,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textFaint,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  doneText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  errorText: {
    ...typography.caption,
    color: colors.live,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
});
