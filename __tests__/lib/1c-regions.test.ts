import {
  ALLOWED_1C_REGIONS,
  assertValid1cRegion,
  Invalid1cRegionError,
} from '@/lib/1c-regions';

describe('assertValid1cRegion', () => {
  it('accepts allowlisted regions', () => {
    for (const r of ALLOWED_1C_REGIONS) {
      expect(assertValid1cRegion(r)).toBe(r);
      expect(assertValid1cRegion(`  ${r.toUpperCase()}  `)).toBe(r);
    }
  });

  it('rejects path traversal', () => {
    expect(() => assertValid1cRegion('../prog')).toThrow(Invalid1cRegionError);
    expect(() => assertValid1cRegion('prog/extra')).toThrow(Invalid1cRegionError);
  });

  it('rejects unknown region', () => {
    expect(() => assertValid1cRegion('moscow')).toThrow(Invalid1cRegionError);
  });

  it('rejects empty', () => {
    expect(() => assertValid1cRegion('')).toThrow(Invalid1cRegionError);
  });
});
