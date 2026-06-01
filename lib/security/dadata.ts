/** Лимит длины запроса к DaData (защита от злоупотребления). */
export const DADATA_QUERY_MAX_LEN = 200;

export function normalizeDadataQuery(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const q = raw.trim();
  if (q.length < 3 || q.length > DADATA_QUERY_MAX_LEN) return null;
  return q;
}
