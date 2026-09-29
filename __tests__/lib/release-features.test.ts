import { accountHomeEnabled, assistantEnabled, noticesEnabled, seasonalEnabled } from '@/lib/release-features';
const env = process.env;
afterEach(() => { process.env = env; });
it('keeps optional integrations off in production unless explicitly enabled', () => {
  process.env = { NODE_ENV: 'production' };
  expect([assistantEnabled(), noticesEnabled(), seasonalEnabled()]).toEqual([false, false, false]);
  process.env.NEXT_PUBLIC_ASSISTANT_ENABLED = 'true';
  expect([assistantEnabled(), noticesEnabled(), seasonalEnabled()]).toEqual([true, false, false]);
});
it.each(['production', 'development', 'test'])('ships the same account layout in %s with explicit rollback', environment => {
  process.env = { NODE_ENV: environment } as NodeJS.ProcessEnv;
  expect(accountHomeEnabled()).toBe(true);
  process.env.NEXT_PUBLIC_ACCOUNT_HOME_ENABLED = 'false';
  expect(accountHomeEnabled()).toBe(false);
});
