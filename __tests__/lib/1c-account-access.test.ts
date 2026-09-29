/** @jest-environment node */
import { get1CAccountPassword, reset1CAccountPassword, update1CAccountEmail, utilityWritesEnabled } from '@/lib/1c-account-access';
jest.mock('server-only', () => ({}));
jest.mock('@/lib/1c-api', () => ({ get1cBaseUrl: () => mockBaseUrl }));
let mockBaseUrl = 'https://one-c.test';
const originalEnv = process.env, originalFetch = global.fetch;
const fetchMock = jest.fn();
beforeEach(() => {
  jest.clearAllMocks(); global.fetch = fetchMock;
  process.env = { ...originalEnv, NODE_ENV: 'test' }; mockBaseUrl = 'https://one-c.test';
  process.env.ONE_C_READ_ONLY = 'false'; process.env.PASSWORD1C_ENCRYPTION_KEY = 'test-only-key';
  fetchMock.mockResolvedValue({ ok: true, text: async () => '{}' });
});
afterEach(() => { process.env = originalEnv; global.fetch = originalFetch; });
it('calls the exact new 1C methods/parameters without caching or redirects', async () => {
  await reset1CAccountPassword('00123', 'Abcd12&?', 'saki');
  expect(fetchMock).toHaveBeenLastCalledWith('https://one-c.test/saki/hs/WebAccounts/ResetAccountPassword?WaLsCode=00123&WaNewPass=Abcd12%26%3F', expect.objectContaining({ cache: 'no-store', redirect: 'error' }));
  await update1CAccountEmail('00123', 'person+tag@example.test', 'saki');
  expect(fetchMock.mock.calls[1][0]).toContain('UpdateAccountEmail?WaLsCode=00123&WaNewEMail=person%2Btag%40example.test');
  fetchMock.mockResolvedValue({ ok: true, text: async () => JSON.stringify({ WaLsPass: 'Abcd1234' }) });
  expect(await get1CAccountPassword('00123', 'saki')).toBe('Abcd1234');
  expect(fetchMock.mock.calls[2][0]).toBe('https://one-c.test/saki/hs/WebAccounts/GetAccountPassword?WaLsCode=00123');
});
it.each(['krasn', 'pervom', 'nignegorsk', 'ruch', 'sovetskoe', 'chernomorsk', '../saki'])('never calls unsupported region %s', async region => {
  await expect(reset1CAccountPassword('123', 'Abcd1234', region)).rejects.toMatchObject({ code: 'UNSUPPORTED_REGION' });
  await expect(update1CAccountEmail('123', 'person@example.test', region)).rejects.toThrow();
  await expect(get1CAccountPassword('123', region)).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
it('honors dev read-only and requires encrypted storage before writes', async () => {
  process.env.ONE_C_READ_ONLY = 'true';
  await expect(reset1CAccountPassword('123', 'Abcd1234', 'saki')).rejects.toMatchObject({ code: 'ONE_C_READ_ONLY' });
  await expect(update1CAccountEmail('123', 'a@b.test', 'saki')).rejects.toThrow();
  process.env.ONE_C_READ_ONLY = 'false'; delete process.env.PASSWORD1C_ENCRYPTION_KEY;
  await expect(reset1CAccountPassword('123', 'Abcd1234', 'saki')).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each(['{"error":"private-secret"}', 'false', 'private-secret'])('does not leak upstream bodies %s', async text => {
  fetchMock.mockResolvedValue({ ok: true, text: async () => text });
  await expect(get1CAccountPassword('123', 'saki')).rejects.not.toThrow('private-secret');
});
it('does not leak secret URLs from network exceptions', async () => {
  fetchMock.mockRejectedValue(new Error('fetch failed: WaNewPass=private-secret'));
  await expect(reset1CAccountPassword('123', 'Abcd1234', 'saki')).rejects.not.toThrow('private-secret');
});

it('requires explicit production activation even for reading an existing password', async () => {
  process.env = { ...process.env, NODE_ENV: 'production' };
  delete process.env.ONE_C_UTILITY_ACCESS_ENABLED;
  expect(utilityWritesEnabled()).toBe(false);
  await expect(get1CAccountPassword('123', 'saki')).rejects.toMatchObject({ code: 'UTILITY_ACCESS_DISABLED' });
  await expect(reset1CAccountPassword('123', 'Abcd1234', 'saki')).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each(['http://46.172.223.34', 'http://127.0.0.1', 'https://user:secret@one-c.test', 'https://one-c.test/?secret=value', 'not-a-url'])('rejects unsafe production transport %s before any request', async url => {
  process.env = { ...process.env, NODE_ENV: 'production', ONE_C_UTILITY_ACCESS_ENABLED: 'true' };
  mockBaseUrl = url;
  expect(utilityWritesEnabled()).toBe(false);
  await expect(get1CAccountPassword('123', 'saki')).rejects.toMatchObject({ code: 'ONE_C_TRANSPORT' });
  await expect(reset1CAccountPassword('123', 'Abcd1234', 'saki')).rejects.toThrow();
  await expect(update1CAccountEmail('123', 'a@b.test', 'saki')).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('allows explicitly enabled HTTPS production and local HTTP test fixtures only outside production', async () => {
  process.env = { ...process.env, NODE_ENV: 'production', ONE_C_UTILITY_ACCESS_ENABLED: 'true' };
  expect(utilityWritesEnabled()).toBe(true);
  await reset1CAccountPassword('123', 'Abcd1234', 'saki');
  process.env = { ...process.env, NODE_ENV: 'test' }; mockBaseUrl = 'http://127.0.0.1:12345';
  expect(utilityWritesEnabled()).toBe(true);
  mockBaseUrl = 'http://remote.test';
  expect(utilityWritesEnabled()).toBe(false);
});
