export type MeterReadingRow = {
  Service: string;
  PastDate?: string;
  PastReading?: number | string;
  Reading: number | string;
  Volume?: number;
};

type DeviceLike = Record<string, unknown>;

function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (!isPresent(value)) return Number.NaN;
  return parseFloat(String(value).replace(",", ".").replace(/\s/g, ""));
}

export function buildMeterReadingsFromDevices(devices: DeviceLike[]): MeterReadingRow[] {
  const rows: MeterReadingRow[] = [];
  devices.forEach((dev) => {
    const reading =
      dev.Reading ??
      dev.Value ??
      dev.Показание ??
      dev.LastReading ??
      dev.ТекущееПоказание ??
      dev.КонечноеПоказание;

    if (!isPresent(reading)) return;

    const pastReadingRaw =
      dev.PastReading ??
      dev.PreviousReading ??
      dev.ПредыдущееПоказание ??
      dev.Предыдущее ??
      dev.НачальноеПоказание ??
      dev.Начальное;
    const pastReading = isPresent(pastReadingRaw) ? pastReadingRaw : reading;

    const pastDateRaw = dev.PastDate ?? dev.Date ?? dev.ReadingDate ?? dev.Дата;
    const dateFallback = dev.Date ?? dev.Дата;
    const pastDateValue = isPresent(pastDateRaw) ? pastDateRaw : dateFallback;
    const pastDate = isPresent(pastDateValue)
      ? (typeof pastDateValue === "string" && pastDateValue.length >= 10
          ? pastDateValue.slice(0, 10)
          : String(pastDateValue))
      : undefined;

    const readingNum = toNumber(reading);
    const pastNum = toNumber(pastReading);
    const volume = !Number.isNaN(readingNum) && !Number.isNaN(pastNum) ? readingNum - pastNum : undefined;

    rows.push({
      Service: String(dev.Service ?? dev.Услуга ?? dev.ServiceName ?? "—"),
      PastDate: pastDate,
      PastReading: pastReading as number | string,
      Reading: reading as number | string,
      Volume: volume,
    });
  });
  return rows;
}

export function hasValidMeterReadings(rows: MeterReadingRow[]): boolean {
  return rows.some((row) => isPresent(row.Reading));
}
