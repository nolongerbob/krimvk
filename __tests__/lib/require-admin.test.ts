import { isAdminUser } from '@/lib/admin-role';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('isAdminUser', () => {
  it('returns true for ADMIN role in database', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
    await expect(isAdminUser('user-1')).resolves.toBe(true);
  });

  it('returns false for USER role', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'USER' });
    await expect(isAdminUser('user-2')).resolves.toBe(false);
  });
});
