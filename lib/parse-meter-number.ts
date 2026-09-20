/** 1C uses spaces (including NBSP) for grouping and a comma for decimals. */
export function parseMeterNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value !== 'string' || !value.trim()) return NaN;
  const text = value.trim();
  if (!/^[+-]?(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d+)?$/.test(text)) return NaN;
  const parsed = Number(text.replace(/[ \u00a0\u202f]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function formatMeterNumber(value: unknown): string {
  const parsed = parseMeterNumber(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';
}
