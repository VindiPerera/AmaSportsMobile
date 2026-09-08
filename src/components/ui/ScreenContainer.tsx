import React from 'react';
import { Platform, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: Edge[];
  /** Wraps children in a vertically scrollable view. Off by default — most auth screens already scroll their own ScrollView. */
  scroll?: boolean;
  /** Use KeyboardAwareScrollView instead of native ScrollView (useful for auth/edit forms with TextInputs). */
  keyboardAware?: boolean;
  backgroundColor?: string;
}

/** Standard screen wrapper: safe area + keyboard avoidance + consistent padding. */
export function ScreenContainer({
  children,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  scroll = false,
  keyboardAware = false,
  backgroundColor = colors.background,
}: ScreenContainerProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor }, style]}>
      {scroll ? (
        keyboardAware ? (
          <KeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            enableAutomaticScroll={Platform.OS === 'ios'}
            extraHeight={Platform.OS === 'ios' ? 100 : 150}
            extraScrollHeight={Platform.OS === 'ios' ? 20 : 50}
          >
            {children}
          </KeyboardAwareScrollView>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {children}
          </ScrollView>
        )
      ) : (
        children
      )}
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
    paddingBottom: spacing.xl,
  },
});
