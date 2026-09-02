import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { chartMaxValue } from '../../utils/chart';
import { SportAnalysisResponse } from '../../types';
import { AnalysisSectionCard } from './AnalysisSectionCard';
import { ChartErrorBoundary } from './ChartErrorBoundary';

interface GenericStatBreakdownSectionProps {
  byFormat: SportAnalysisResponse['by_format'];
  metricKey: string;
  metricLabel: string;
}

const BAR_WIDTH = 26;

/**
 * Generic counterpart to CricketBattingSection's "Runs by Format" chart —
 * one bar chart of `metricKey` (Matches, unless a sport overrides it — see
 * GenericAnalysisScreen) grouped by the Format breakdown the backend
 * already computed.
 */
export function GenericStatBreakdownSection({ byFormat, metricKey, metricLabel }: GenericStatBreakdownSectionProps) {
  const data = byFormat.map((f) => ({
    value: (f[metricKey] as number) ?? 0,
    label: f.format_name.length > 8 ? `${f.format_name.slice(0, 7)}…` : f.format_name,
    frontColor: colors.primary,
  }));

  return (
    <AnalysisSectionCard title={`${metricLabel} by Format`} icon="bar-chart-outline">
      {data.length === 0 ? (
        <View style={styles.emptyNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textFaint} />
          <Text style={styles.emptyNoteText}>Add stats for a format to see this chart.</Text>
        </View>
      ) : (
        <ChartErrorBoundary>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={data}
              maxValue={chartMaxValue(data.map((d) => d.value))}
              barWidth={BAR_WIDTH}
              spacing={22}
              barBorderRadius={6}
              roundedTop
              hideRules
              xAxisThickness={1}
              yAxisThickness={0}
              xAxisColor={colors.border}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              noOfSections={4}
              height={140}
              isAnimated
            />
          </ScrollView>
        </ChartErrorBoundary>
      )}
    </AnalysisSectionCard>
  );
}

const styles = StyleSheet.create({
  axisText: {
    color: colors.textFaint,
    fontSize: 10,
  },
  emptyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cardSubtle,
    borderRadius: 10,
    padding: spacing.sm,
  },
  emptyNoteText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
});
