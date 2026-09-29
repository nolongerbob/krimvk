/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/admin/site-settings/route';
import { requireAdmin } from '@/lib/require-admin';
import { saveRuntimeSettings, readRuntimeSettings } from '@/lib/site-runtime-settings';
jest.mock('@/lib/require-admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/site-runtime-settings', () => ({ ...jest.requireActual('@/lib/site-runtime-settings'), saveRuntimeSettings: jest.fn(), readRuntimeSettings: jest.fn() }));
const request = (value: unknown, origin = 'https://krimvk.ru') => new NextRequest('https://krimvk.ru/api/admin/site-settings', { method: 'POST', headers: { origin, host: 'krimvk.ru' }, body: JSON.stringify(value) });
beforeEach(() => { jest.clearAllMocks(); (requireAdmin as jest.Mock).mockResolvedValue({ ok: true }); });
it('rejects non-admins before accessing storage', async () => {
  (requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 403 }) });
  expect((await GET()).status).toBe(403);
  expect((await POST(request({}))).status).toBe(403);
  expect(readRuntimeSettings).not.toHaveBeenCalled(); expect(saveRuntimeSettings).not.toHaveBeenCalled();
});
it('rejects other origins and invalid settings', async () => {
  expect((await POST(request({}, 'https://other.test'))).status).toBe(403);
  expect((await POST(request({ mascotEnabled: 'yes', autumnEnabled: false }))).status).toBe(400);
  expect(saveRuntimeSettings).not.toHaveBeenCalled();
});
it('saves validated global switches and reports storage failure', async () => {
  const settings = { mascotEnabled: false, autumnEnabled: true };
  (saveRuntimeSettings as jest.Mock).mockResolvedValue(settings);
  expect((await POST(request(settings))).status).toBe(200);
  expect(saveRuntimeSettings).toHaveBeenCalledWith(settings);
  (saveRuntimeSettings as jest.Mock).mockRejectedValue(new Error('private path'));
  const response = await POST(request(settings));
  expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain('private path');
});
