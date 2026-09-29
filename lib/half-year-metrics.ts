import { meterReadings } from './quick-action-metrics';
export type MonthPoint = { month: string; value: number | null };
export function halfYearMonths(now = new Date()): string[] {
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit' }).formatToParts(now);
  const year = Number(month.find(p => p.type === 'year')!.value);
  const index = Number(month.find(p => p.type === 'month')!.value) - 1;
  return Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(year, index - 6 + i, 1)).toISOString().slice(0, 7));
}
export function monthlyConsumption(payload: unknown, meter: string, months = halfYearMonths()): MonthPoint[] {
  const readings = new Map<string, number>();
  for (const [time, value] of meterReadings(payload, meter)) {
    const key = new Date(time + 3 * 3600000).toISOString().slice(0, 7);
    readings.set(key, value);
  }
  return months.map(month => {
    const [year, index] = month.split('-').map(Number);
    const previous = new Date(Date.UTC(year, index - 2, 1)).toISOString().slice(0, 7);
    const end = readings.get(month), start = readings.get(previous);
    return { month, value: end == null || start == null || end < start ? null : Math.round((end - start) * 1000) / 1000 };
  });
}
export function stepPaths(points: MonthPoint[]): string[] {
  const values = points.flatMap(point => point.value == null ? [] : [point.value]);
  const min = Math.min(0, ...values), max = Math.max(1, ...values);
  const paths: string[] = [];
  let path = '';
  points.forEach((point, i) => {
    if (point.value == null) { if (path) paths.push(path); path = ''; return; }
    const x = 4 + i * 192 / points.length;
    const next = 4 + (i + 1) * 192 / points.length;
    const y = 42 - (point.value - min) / (max - min) * 36;
    path += path ? ` V${y} H${next}` : `M${x},${y} H${next}`;
  });
  if (path) paths.push(path);
  return paths;
}
