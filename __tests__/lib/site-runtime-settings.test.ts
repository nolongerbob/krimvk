/** @jest-environment node */
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { readRuntimeSettings, saveRuntimeSettings, parseRuntimeSettings } from '@/lib/site-runtime-settings';
import { reserveAssistantBudget } from '@/lib/assistant-budget';
let dir: string;
const env = process.env;
beforeEach(async () => { dir = await mkdtemp(path.join(tmpdir(), 'krimvk-settings-test-')); process.env = { ...env, SITE_RUNTIME_SETTINGS_FILE: path.join(dir, 'settings.json'), ASSISTANT_BUDGET_DIR: path.join(dir, 'budget') }; });
afterEach(async () => { process.env = env; await rm(dir, { recursive: true, force: true }); });
it('defaults off, saves both settings and fails closed for corrupt storage', async () => {
  expect(await readRuntimeSettings()).toEqual({ mascotEnabled: false, autumnEnabled: false });
  await saveRuntimeSettings({ mascotEnabled: true, autumnEnabled: false });
  expect(await readRuntimeSettings()).toEqual({ mascotEnabled: true, autumnEnabled: false });
  await writeFile(process.env.SITE_RUNTIME_SETTINGS_FILE!, '{}');
  expect(await readRuntimeSettings()).toEqual({ mascotEnabled: false, autumnEnabled: false });
  expect(() => parseRuntimeSettings({ mascotEnabled: 'true', autumnEnabled: true })).toThrow();
});
it('reserves at most twenty requests per minute across concurrent callers', async () => {
  const results = await Promise.all(Array.from({ length: 24 }, (_, i) => reserveAssistantBudget(`user-${i}`, 100000)));
  expect(results.filter(Boolean)).toHaveLength(20);
  expect(await reserveAssistantBudget('next', 100000)).toBe(false);
  expect(await reserveAssistantBudget('next', 160000)).toBe(true);
});
it('requires explicit absolute budget storage', async () => {
  delete process.env.ASSISTANT_BUDGET_DIR;
  await expect(reserveAssistantBudget('u')).rejects.toThrow();
});
