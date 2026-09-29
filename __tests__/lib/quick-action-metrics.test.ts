import { consumptionHistory, quickMetrics } from '@/lib/quick-action-metrics';

it('preserves overpayment and does not invent missing balances', () => {
  expect(quickMetrics({ CommonDuty: '-1 234,50', StartCommonDuty: '0' })).toMatchObject({ balance: -1234.5, openingBalance: 0 });
  expect(quickMetrics({})).toEqual({ balance: null, openingBalance: null, meters: [] });
  expect(quickMetrics({ CommonDuty: 'unknown' }).balance).toBeNull();
});
it('calculates differences for one meter, orders dates and deduplicates readings', () => {
  expect(consumptionHistory({ History: [
    { NumberOfDevice: 'a', Date: '01.03.2026', Reading: '120,5' },
    { NumberOfDevice: 'b', Date: '01.02.2026', Reading: 9999 },
    { NumberOfDevice: 'a', Date: '01.01.2026', Reading: 100 },
    { NumberOfDevice: 'a', Date: '01.02.2026', Reading: 110 },
    { NumberOfDevice: 'a', Date: '01.02.2026', Reading: 110 },
  ] }, 'a').map(point => point.value)).toEqual([10, 10.5]);
});
it('handles grouped history and starts a new series after meter reset', () => {
  const History = {
    '2026-01-01': [{ NumberOfDevice: 'a', Reading: 100 }],
    '2026-02-01': [{ NumberOfDevice: 'a', Reading: 120 }],
    '2026-03-01': [{ NumberOfDevice: 'a', Reading: 2 }],
    '2026-04-01': [{ NumberOfDevice: 'a', Reading: 7 }],
  };
  expect(consumptionHistory({ History }, 'a').map(point => point.value)).toEqual([5]);
});
it('does not draw fake consumption without valid history', () => {
  expect(consumptionHistory({ Error: 'Unavailable' }, 'a')).toEqual([]);
  expect(consumptionHistory({ History: [{ NumberOfDevice: 'a', Reading: 'bad', Date: '2026-01-01' }] }, 'a')).toEqual([]);
});
