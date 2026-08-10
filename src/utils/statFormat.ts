/**
 * Display formatting for server-computed analysis stats. The backend
 * already returns `null` for anything it can't safely compute (divide by
 * zero, or a rate that can't be combined across rows) — these helpers only
 * decide how that `null` reads on screen, never recompute a fallback.
 */
export function fmtNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? 'N/A' : String(value);
}

export function fmtDecimal(value: number | null | undefined, suffix = ''): string {
  return value === null || value === undefined ? 'N/A' : `${value.toFixed(value % 1 === 0 ? 0 : 2)}${suffix}`;
}

export function fmtPercent(value: number | null | undefined): string {
  return value === null || value === undefined ? 'N/A' : `${value}%`;
}

export function fmtFigure(value: string | null | undefined): string {
  return value === null || value === undefined || value === '' ? 'N/A' : value;
}
