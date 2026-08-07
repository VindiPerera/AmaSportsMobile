/**
 * Every stat-table numeric field is edited via a plain TextInput (always a
 * string), so form state stores strings and these helpers convert to the
 * number|null shape the API expects right before submit.
 */
export function parseIntOrNull(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value.trim() === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parseFloatOrNull(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value.trim() === '') return null;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function toDisplayString(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/** Strips a stat-table row the player added but never filled in, before submit. */
export function isBlankRow(row: Record<string, string | boolean>): boolean {
  return Object.values(row).every((value) => value === '' || value === false);
}
