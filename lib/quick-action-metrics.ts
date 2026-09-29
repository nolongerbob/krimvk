export function metricNumber(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value).replace(/\s/g, '').replace(',', '.');
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export type MeterMetric = { number: string; value: number | null; date: string | null };
export type QuickMetrics = { balance: number | null; openingBalance: number | null; meters: MeterMetric[] };
export function quickMetrics(data: Record<string, unknown>): QuickMetrics {
  const devices = data.MeteringDevices ?? data.Devices ?? data.meters;
  return {
    balance: metricNumber(data.CommonDuty ?? data.commonDuty),
    openingBalance: metricNumber(data.StartCommonDuty ?? data.startCommonDuty),
    meters: Array.isArray(devices) ? devices.map(device => ({
      number: String(device.NumberOfDevice ?? device.Number ?? device.DeviceNumber ?? device.SerialNumber ?? ''),
      value: metricNumber(device.LastReading ?? device.Reading ?? device.Value ?? device.Показание ?? device.ТекущееПоказание ?? device.КонечноеПоказание),
      date: device.LastReadingDate || device.ReadingDate ? String(device.LastReadingDate || device.ReadingDate) : null,
    })).filter(device => device.number) : [],
  };
}

function dateValue(value: unknown): number {
  const text = String(value ?? '');
  const ru = text.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ru) return Date.parse(`${ru[3]}-${ru[2]}-${ru[1]}T12:00:00Z`);
  if (/^\d{10,13}$/.test(text)) return Number(text) * (text.length === 10 ? 1000 : 1);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? Date.parse(text) : NaN;
}
export type ConsumptionPoint = { date: string; value: number; days: number };
/** Never combine meters or turn resets into negative consumption. */
export function meterReadings(payload: unknown, number: string): [number, number][] {
  if (!payload || typeof payload !== 'object') return [];
  const body = payload as Record<string, unknown>;
  if (body.Error || body.error) return [];
  const history = Array.isArray(payload) ? payload : body.History ?? body.history;
  const rows: { row: Record<string, unknown>; date?: string }[] = [];
  if (Array.isArray(history)) history.forEach(row => rows.push({ row }));
  else if (history && typeof history === 'object') Object.entries(history).forEach(([date, items]) => {
    if (Array.isArray(items)) items.forEach(row => rows.push({ row, date }));
  });
  const values = new Map<number, number>();
  for (const { row, date } of rows) {
    if (!row || String(row.NumberOfDevice ?? row.DeviceNumber ?? row.Number ?? row.DeviceId ?? '') !== number) continue;
    const time = dateValue(row.ReadingDate ?? row.Date ?? row.readingDate ?? row.DateOfHistory ?? date);
    const value = metricNumber(row.Reading ?? row.Value ?? row.value);
    if (Number.isFinite(time) && value !== null && value >= 0) values.set(time, value);
  }
  return Array.from(values).sort((a, b) => a[0] - b[0]);
}
export function consumptionHistory(payload: unknown, number: string): ConsumptionPoint[] {
  const sorted = meterReadings(payload, number);
  const result: ConsumptionPoint[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const delta = sorted[i][1] - sorted[i - 1][1];
    if (delta < 0) { result.length = 0; continue; }
    result.push({ date: new Date(sorted[i][0]).toISOString(), value: Math.round(delta * 1000) / 1000, days: Math.round((sorted[i][0] - sorted[i - 1][0]) / 86400000) });
  }
  return result.slice(-6);
}
