import { mkdir, open } from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

async function reserve(directory: string, slots: number) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  for (let i = 0; i < slots; i++) {
    try { const file = await open(path.join(directory, String(i)), 'wx', 0o600); await file.close(); return true; }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; }
  }
  return false;
}
// Single VPS, shared by releases/processes. Reservations survive crashes; attempts are not refunded.
export async function reserveAssistantBudget(userId: string, now = Date.now()) {
  const root = process.env.ASSISTANT_BUDGET_DIR;
  if (!root || !path.isAbsolute(root)) throw new Error('Assistant budget storage is not configured');
  const day = String(Math.floor(now / 86400000));
  const minute = String(Math.floor(now / 60000));
  const user = createHash('sha256').update(userId).digest('hex');
  if (!await reserve(path.join(root, day, 'users', user), 40)) return false;
  if (!await reserve(path.join(root, day, 'minutes', minute), 20)) return false;
  return reserve(path.join(root, day, 'total'), 200);
}
