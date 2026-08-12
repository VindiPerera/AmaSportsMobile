import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * react-native-gifted-charts has a known sharp edge on web: certain data
 * shapes (see the curved-LineChart comment in CricketBattingSection) throw
 * inside its real <svg> path generation instead of the native renderer's
 * silent no-op. React error boundaries can only be class components — one
 * bad chart shouldn't take down the whole Analysis screen, so this catches
 * it and shows a fallback in that chart's place instead of a white screen.
 */
export class ChartErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[ChartErrorBoundary] chart failed to render:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.textFaint} />
          <Text style={styles.text}>Couldn&apos;t render this chart.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  text: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
