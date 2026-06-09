/** Build section labels A, B, C, ... for a given count */
export function buildSectionLabels(count: number): string[] {
  const n = Math.max(1, Math.min(26, count));
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
}

export function parseSectionLabels(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}
