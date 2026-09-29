import { readFile, mkdir, writeFile, rename } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export type RuntimeSettings = { mascotEnabled: boolean; autumnEnabled: boolean };
export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = { mascotEnabled: false, autumnEnabled: false };
function filePath() {
  const file = process.env.SITE_RUNTIME_SETTINGS_FILE;
  if (!file || !path.isAbsolute(file)) throw new Error('Runtime settings storage is not configured');
  return file;
}
export function parseRuntimeSettings(value: unknown): RuntimeSettings {
  if (!value || typeof value !== 'object') throw new Error('Invalid settings');
  const { mascotEnabled, autumnEnabled } = value as RuntimeSettings;
  if (typeof mascotEnabled !== 'boolean' || typeof autumnEnabled !== 'boolean') throw new Error('Invalid settings');
  return { mascotEnabled, autumnEnabled };
}
export async function readRuntimeSettings(): Promise<RuntimeSettings> {
  try { return parseRuntimeSettings(JSON.parse(await readFile(filePath(), 'utf8'))); }
  catch { return { ...DEFAULT_RUNTIME_SETTINGS }; }
}
export async function saveRuntimeSettings(value: unknown) {
  const settings = parseRuntimeSettings(value);
  const file = filePath();
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(settings), { mode: 0o600, flag: 'wx' });
  await rename(temporary, file);
  return settings;
}
