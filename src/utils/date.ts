/** `YYYY-MM-DD` — what the API and the date pickers exchange. */
export function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Auto-calculates age from a `YYYY-MM-DD` born date; the player can still override it manually. */
export function calculateAge(bornIsoDate: string | null | undefined): number | null {
  if (!bornIsoDate) return null;
  const born = new Date(bornIsoDate);
  if (Number.isNaN(born.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;

  return age >= 0 ? age : null;
}
