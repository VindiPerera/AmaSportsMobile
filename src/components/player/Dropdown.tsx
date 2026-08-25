import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, radius, spacing, typography } from '../../theme';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  error?: string;
  disabled?: boolean;
  /** Compact mode drops the label/error chrome — used inside stat-table cells. */
  compact?: boolean;
}

/** Wraps @react-native-picker/picker in the app's TextField-style chrome. */
export function Dropdown({
  label,
  placeholder = 'Select...',
  value,
  onChange,
  options,
  error,
  disabled,
  compact = false,
}: DropdownProps) {
  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      {label && !compact ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          compact ? styles.compactWrapper : styles.wrapper,
          !!error && styles.wrapperError,
          disabled && styles.wrapperDisabled,
        ]}
      >
        <Picker
          enabled={!disabled}
          selectedValue={value}
          onValueChange={(itemValue) => onChange(String(itemValue))}
          style={compact ? styles.compactPicker : styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label={placeholder} value="" color={colors.textFaint} />
          {(options || []).map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
      {error && !compact ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  compactContainer: {
    minWidth: 160,
    width: '100%',
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  wrapper: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 50,
  },
  compactWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 50,
    paddingHorizontal: 2,
  },
  wrapperError: {
    borderColor: colors.live,
  },
  wrapperDisabled: {
    opacity: 0.6,
  },
  picker: {
    color: colors.text,
    height: 50,
  },
  compactPicker: {
    color: colors.text,
    height: 50,
    fontSize: 13,
  },
  pickerItem: {
    fontSize: 16,
  },
  errorText: {
    ...typography.caption,
    color: colors.live,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
});
