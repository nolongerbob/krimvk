/** @jest-environment node */
jest.mock('@/lib/prisma', () => ({ prisma: {}, withRetry: (fn: () => unknown) => fn() }));
jest.mock('@/lib/1c-api', () => ({ get1CUserData: jest.fn() }));
jest.mock('@/lib/password1c-crypto', () => ({ tryDecryptPassword1c: () => 'password' }));
import { get1CUserData } from '@/lib/1c-api';
import { loadAdminUserBalance } from '@/lib/admin-user-balance';
const source = { userAccounts: [{ accountNumber: 'test', region: 'test', password1c: 'encrypted' }], bills: [] };
it.each([{}, { CommonDuty: 'invalid' }, { CommonDuty: Infinity }])('does not silently convert invalid 1C data to zero: %p', async response => {
  (get1CUserData as jest.Mock).mockResolvedValue(response);
  await expect(loadAdminUserBalance('user', source)).rejects.toThrow();
});
it('preserves an explicit zero and parses decimal comma balances', async () => {
  (get1CUserData as jest.Mock).mockResolvedValue({ CommonDuty: 0, commonDuty: 500 });
  expect((await loadAdminUserBalance('user', source)).totalDebt).toBe(0);
  (get1CUserData as jest.Mock).mockResolvedValue({ CommonDuty: '-1 234,50' });
  expect((await loadAdminUserBalance('user', source)).totalDebt).toBe(-1234.5);
});
