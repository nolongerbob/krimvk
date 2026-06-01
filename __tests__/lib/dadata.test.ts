import {
  DADATA_QUERY_MAX_LEN,
  normalizeDadataQuery,
} from '@/lib/security/dadata';

describe('normalizeDadataQuery', () => {
  it('accepts valid query', () => {
    expect(normalizeDadataQuery('Симферополь')).toBe('Симферополь');
  });

  it('rejects short query', () => {
    expect(normalizeDadataQuery('ab')).toBeNull();
  });

  it('rejects too long query', () => {
    expect(normalizeDadataQuery('x'.repeat(DADATA_QUERY_MAX_LEN + 1))).toBeNull();
  });
});
