/** @jest-environment node */
import { get1CUserData } from '@/lib/1c-api';
import { cacheGetJson, cacheSetJson } from '@/lib/cache/redis';
jest.mock('server-only', () => ({}));
jest.mock('@/lib/cache/redis', () => ({ cacheGetJson: jest.fn(), cacheSetJson: jest.fn() }));
jest.mock('@/lib/meter-submission-guard', () => ({}));
beforeEach(() => { jest.resetAllMocks(); process.env.ONE_C_API_BASE_URL = 'https://1c.test'; });
afterAll(() => { delete process.env.ONE_C_API_BASE_URL; });
it('does not serve a valid cached account for another password', async () => {
  const cache = new Map<string, unknown>();
  (cacheGetJson as jest.Mock).mockImplementation(async key => cache.get(key) ?? null);
  (cacheSetJson as jest.Mock).mockImplementation(async (key, value) => { cache.set(key, value); });
  global.fetch = jest.fn(async (url: string) => new URL(url).searchParams.get('WaPass') === 'correct'
    ? { ok: true, json: async () => ({ Address: 'Test' }) } : { ok: false, status: 401, text: async () => 'Denied' }) as jest.Mock;
  await get1CUserData('123', 'correct', 'saki');
  await expect(get1CUserData('123', 'wrong', 'saki')).rejects.toThrow('AUTH_ERROR');
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
it('always bypasses cached credentials for account linking', async () => {
  (cacheGetJson as jest.Mock).mockResolvedValue({ Address: 'Old cached data' });
  global.fetch = jest.fn(async () => ({ ok: false, status: 401, text: async () => 'Denied' })) as jest.Mock;
  await expect(get1CUserData('123', 'old-password', 'saki', undefined, undefined, { bypassCache: true })).rejects.toThrow('AUTH_ERROR');
  expect(cacheGetJson).not.toHaveBeenCalled(); expect(cacheSetJson).not.toHaveBeenCalled();
});
