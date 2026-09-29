import { halfYearMonths, monthlyConsumption, stepPaths } from '@/lib/half-year-metrics';
it('uses six calendar months across a year boundary', () => {
  expect(halfYearMonths(new Date('2026-02-15T12:00:00Z'))).toEqual(['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01']);
});
it('uses last monthly readings, preserving missing months and resets', () => {
  const History = [
    { NumberOfDevice: 'a', Date: '2026-01-20', Reading: 100 },
    { NumberOfDevice: 'a', Date: '2026-02-10', Reading: 103 },
    { NumberOfDevice: 'a', Date: '2026-02-20', Reading: 110 },
    { NumberOfDevice: 'a', Date: '2026-04-20', Reading: 130 },
    { NumberOfDevice: 'a', Date: '2026-05-20', Reading: 2 },
  ];
  expect(monthlyConsumption({ History }, 'a', ['2026-02', '2026-03', '2026-04', '2026-05']).map(p => p.value)).toEqual([10, null, null, null]);
});
it('draws horizontal/vertical steps and never bridges missing data', () => {
  const paths = stepPaths([{ month: 'a', value: -5 }, { month: 'b', value: 10 }, { month: 'c', value: null }, { month: 'd', value: 0 }]);
  expect(paths).toHaveLength(2);
  expect(paths[0]).toContain(' V');
  expect(paths.join('')).not.toMatch(/NaN|Infinity|L/);
  expect(stepPaths([{ month: 'a', value: null }])).toEqual([]);
});
