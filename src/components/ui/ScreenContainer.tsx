import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Edge[];
  /** Wraps children in a vertically scrollable view. Off by default — most auth screens already scroll their own ScrollView. */
  scroll?: boolean;
  backgroundColor?: string;
}

/** Standard screen wrapper: safe area + keyboard avoidance + consistent padding. */
export function ScreenContainer({
  children,
  style,
  edges = ['top', 'bottom'],
  scroll = false,
  backgroundColor = colors.background,
}: ScreenContainerProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor }, style]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
