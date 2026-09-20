/** @jest-environment node */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/1c/meters/route';
import { GET as adminGET } from '@/app/api/admin/direct-account/meters/route';
import { get1CUserData } from '@/lib/1c-api';
jest.mock('@/lib/get-app-session', () => ({ getAppSession: async () => ({ user: { id: 'user' } }) }));
jest.mock('@/lib/prisma', () => ({ prisma: { userAccount: { findFirst: async () => ({ accountNumber: 'test', password1c: 'test', region: 'test' }) } } }));
jest.mock('@/lib/password1c-crypto', () => ({ decryptPassword1c: () => 'test' }));
jest.mock('@/lib/1c-api', () => ({ get1CUserData: jest.fn() }));
jest.mock('@/lib/require-admin', () => ({ requireAdmin: async () => ({ ok: true, admin: {} }) }));
jest.mock('@/lib/direct-account-route', () => ({ directAccountCredentialsFromToken: () => ({ ok: true, credentials: { accountNumber: 'test', password: 'test', region: 'test' } }) }));

it.each([GET, adminGET])('returns full readings, zero and null from the meter API', async handler => {
  (get1CUserData as jest.Mock).mockResolvedValue({ MeteringDevices: [
    { NumberOfDevice: 'a', LastReading: '1\u00a0234,50' },
    { NumberOfDevice: 'b', LastReading: 0 },
    { NumberOfDevice: 'c', LastReading: 'not a reading' },
  ] });
  const response = await handler(new NextRequest('https://example.test/api/1c/meters?accountId=test&token=test'));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.meters.map((m: { lastReading: number | null }) => m.lastReading)).toEqual([1234.5, 0, null]);
});
