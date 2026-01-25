/**
 * Парсинг истории показаний из 1С — та же логика, что на странице «Передача показаний» / «История показаний».
 * 1С: { History: { "timestamp": [ { NumberOfDevice, Reading, Service, Volume, PastReading } ] } }
 * или { history: ... }, или массив записей.
 *
 * Используется в /api/1c/receipt для подстановки Нач./Кон. в квитанцию.
 */

export interface MeterHistoryItem {
  NumberOfDevice?: string;
  DeviceNumber?: string;
  Number?: string;
  Reading?: number | string;
  ReadingDate?: string;
  Date?: string;
  Value?: number | string;
  Service?: string;
  Volume?: number | string;
  PastReading?: number | string;
  DateOfHistory?: string;
  [k: string]: unknown;
}

/**
 * Разбирает ответ get_metering_device_history (1С) в плоский массив записей.
 * Логика полностью как в app/dashboard/meters/page.tsx (fetchMeterHistory).
 *
 * @param raw — сырой ответ 1С (то же, что data.history в /api/1c/meter-history)
 */
export function parseMeterHistory(raw: unknown): MeterHistoryItem[] {
  const items: MeterHistoryItem[] = [];

  if (!raw || typeof raw !== "object") return items;

  // Если 1С вернул массив на верхнем уровне (как data.history = [...] в «Передача показаний»)
  if (Array.isArray(raw)) {
    raw.forEach((item: unknown) => {
      if (item && typeof item === "object") {
        const i = item as Record<string, unknown>;
        items.push({
          ...i,
          ReadingDate: (i.ReadingDate ?? i.Date ?? i.DateOfHistory) as string | undefined,
        } as MeterHistoryItem);
      }
    });
    return items;
  }

  const r = raw as Record<string, unknown>;
  // Точно как на странице «Передача показаний»: History || history || сам объект
  const historyData: unknown = r.History ?? r.history ?? raw;

  if (!historyData || typeof historyData !== "object") return items;

  // Объект: ключи = timestamp (сек), значения = массивы показаний
  if (typeof historyData === "object" && !Array.isArray(historyData)) {
    const obj = historyData as Record<string, unknown>;
    Object.keys(obj).forEach((timestamp) => {
      const readingsForDate = obj[timestamp];
      if (Array.isArray(readingsForDate)) {
        readingsForDate.forEach((item: unknown) => {
          if (item && typeof item === "object") {
            items.push({
              ...(item as object),
              ReadingDate: new Date(parseInt(timestamp, 10) * 1000).toISOString(),
              Date: new Date(parseInt(timestamp, 10) * 1000).toISOString(),
            } as MeterHistoryItem);
          }
        });
      }
    });
    return items;
  }

  // History — массив
  if (Array.isArray(historyData)) {
    historyData.forEach((item: unknown) => {
      if (item && typeof item === "object") {
        const i = item as Record<string, unknown>;
        items.push({
          ...i,
          ReadingDate: (i.ReadingDate ?? i.Date ?? i.DateOfHistory) as string | undefined,
        } as MeterHistoryItem);
      }
    });
    return items;
  }

  return items;
}
