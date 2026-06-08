export const NA = 'N/A';

export function isNA(value: string): boolean {
  return value === NA;
}

export function formatGpa(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value) || value <= 0) return NA;
  return value.toFixed(1);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return NA;
  return value.toFixed(digits);
}

export function formatCredits(total: number): string {
  if (!total || total <= 0) return NA;
  return `${total}`;
}

export function formatRank(rank: number | null | undefined): string {
  if (rank == null || rank <= 0) return NA;
  return `Rank ${rank}`;
}

export function displayWithSuffix(value: string, suffix: string): string {
  return isNA(value) ? NA : `${value}${suffix}`;
}
