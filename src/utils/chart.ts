/**
 * gifted-charts computes each bar/point's height as roughly
 * `value / maxValue`. When every value in a series is 0 (e.g. a bowler with
 * no wickets logged yet), an auto-computed maxValue is also 0, and that
 * division becomes 0/0 — NaN. Native RN silently drops a NaN SVG path;
 * react-native-web's real <svg> throws on it and crashes the screen. Always
 * pin an explicit non-zero maxValue so the math never gets there, even when
 * the underlying data is legitimately all-zero.
 */
export function chartMaxValue(values: number[]): number {
  return Math.max(1, ...values);
}
