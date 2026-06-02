import { canAccessPrivateS3Key } from '@/lib/authorize-private-file';
import { isAdminUser } from '@/lib/admin-role';

jest.mock('@/lib/admin-role', () => ({
  isAdminUser: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    applicationFile: { findFirst: jest.fn() },
    message: { findFirst: jest.fn() },
    waterMeter: { findFirst: jest.fn() },
    contractDocument: { findFirst: jest.fn() },
  },
}));

describe('canAccessPrivateS3Key admin bypass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('grants all private keys when JWT ADMIN and DB ADMIN', async () => {
    (isAdminUser as jest.Mock).mockResolvedValue(true);
    await expect(
      canAccessPrivateS3Key('contracts/some/doc.pdf', 'admin-1', 'ADMIN')
    ).resolves.toBe(true);
    expect(isAdminUser).toHaveBeenCalledWith('admin-1');
  });

  it('does not grant admin bypass when JWT ADMIN but demoted in DB', async () => {
    (isAdminUser as jest.Mock).mockResolvedValue(false);
    await expect(
      canAccessPrivateS3Key('contracts/some/doc.pdf', 'user-1', 'ADMIN')
    ).resolves.toBe(false);
  });

  it('skips DB admin check for non-admin JWT', async () => {
    await expect(
      canAccessPrivateS3Key('messages/user-1/x.jpg', 'user-1', 'USER')
    ).resolves.toBe(true);
    expect(isAdminUser).not.toHaveBeenCalled();
  });
});
