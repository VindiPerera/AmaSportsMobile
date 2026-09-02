import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../theme';
import { fmtDecimal, fmtNumber, fmtPercent } from '../../utils/statFormat';
import { StatCard } from './StatCard';

interface GenericOverviewGridProps {
  overview: Record<string, number | null>;
}

function humanizeKey(key: string): string {
  const label = key.replace(/_percentage$/, ' %').replace(/_/g, ' ');
  return label.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function isPercentKey(key: string): boolean {
  return key.endsWith('_percentage') || key.endsWith('_accuracy');
}

function formatValue(key: string, value: number | null): string {
  if (isPercentKey(key)) return fmtPercent(value);
  if (key.endsWith('_per_match')) return fmtDecimal(value);
  return fmtNumber(value);
}

function iconFor(key: string): keyof typeof Ionicons.glyphMap {
  if (key === 'matches' || key === 'games') return 'calendar-outline';
  if (isPercentKey(key)) return 'trophy-outline';
  return 'stats-chart-outline';
}

/**
 * Generic counterpart to CricketOverviewGrid — the server's `overview`
 * object already carries only the headline keys for that sport (see
 * SportAnalysisConfig), so this just renders one tile per entry with a
 * key-derived label/icon/format instead of a fixed 6-field layout.
 */
export function GenericOverviewGrid({ overview }: GenericOverviewGridProps) {
  const entries = Object.entries(overview);
  if (entries.length === 0) return null;

  return (
    <View style={styles.grid}>
      {entries.map(([key, value]) => (
        <View key={key} style={styles.cell}>
          <StatCard
            label={humanizeKey(key)}
            value={formatValue(key, value)}
            icon={iconFor(key)}
            tone={key === 'matches' || key === 'games' ? 'primary' : isPercentKey(key) ? 'default' : 'energy'}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  cell: {
    flexGrow: 1,
    flexShrink: 0,
    width: '31%',
    minWidth: 95,
  },
});
