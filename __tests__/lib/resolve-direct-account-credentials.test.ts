import { resolveDirectAccountCredentials } from '@/lib/resolve-direct-account-credentials';
import { createDirectAccountSession } from '@/lib/direct-account-session';

describe('resolveDirectAccountCredentials', () => {
  it('resolves credentials for valid token', () => {
    const token = createDirectAccountSession('admin-1', '12345', 'secret', 'saki');
    const result = resolveDirectAccountCredentials(token, 'admin-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.credentials.accountNumber).toBe('12345');
      expect(result.credentials.password).toBe('secret');
      expect(result.credentials.region).toBe('saki');
    }
  });

  it('rejects missing token', () => {
    const result = resolveDirectAccountCredentials(null, 'admin-1');
    expect(result.ok).toBe(false);
  });

  it('rejects token for another admin', () => {
    const token = createDirectAccountSession('admin-1', '12345', 'secret', 'saki');
    const result = resolveDirectAccountCredentials(token, 'admin-2');
    expect(result.ok).toBe(false);
  });
});
