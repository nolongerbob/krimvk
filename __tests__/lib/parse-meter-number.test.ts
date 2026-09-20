import { parseMeterNumber, formatMeterNumber } from '@/lib/parse-meter-number';
import { buildMeterReadingsFromDevices, syncChargesWithMeterReadings } from '@/lib/receipt-meter-mapping';

it.each([
  ['999,50', 999.5], ['1 000', 1000], ['1 234,50', 1234.5],
  ['1\u00a0234,50', 1234.5], ['1\u202f234,50', 1234.5],
  ['12 345,678', 12345.678], ['1 234 567.89', 1234567.89],
  ['1234.50', 1234.5], [1234.5, 1234.5], [0, 0], ['0,00', 0],
])('parses %s without truncating thousands', (input, expected) => {
  expect(parseMeterNumber(input)).toBe(expected);
});

it.each([null, undefined, '', ' ', '1 2', '1234abc', '1,234.50', NaN, Infinity, {}, true])('rejects invalid input %s', input => {
  expect(parseMeterNumber(input)).toBeNaN();
  expect(formatMeterNumber(input)).toBe('—');
});

it('formats grouped readings and preserves zero', () => {
  expect(formatMeterNumber('1\u00a0234,50')).toBe((1234.5).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  expect(formatMeterNumber(0)).toBe('0,00');
});

it('keeps the receipt readings and volume consistent above one thousand', () => {
  const rows = buildMeterReadingsFromDevices([{ Service: 'water', Reading: '1\u00a0234,50', PastReading: '1\u202f200,25' }]);
  expect(rows[0].Volume).toBe(34.25);
  const charges: Record<string, unknown>[] = [{ Service: 'water' }];
  syncChargesWithMeterReadings(charges, rows, s => s);
  expect(charges[0]).toMatchObject({ StartReading: 1200.25, EndReading: 1234.5 });
});
