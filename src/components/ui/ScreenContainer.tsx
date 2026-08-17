import React from 'react';
import { Platform, StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
      {scroll ? (
        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          enableAutomaticScroll={(Platform.OS === 'ios')}
          extraHeight={Platform.OS === 'ios' ? 100 : 150}
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 50}
        >
          {children}
        </KeyboardAwareScrollView>
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
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
});
