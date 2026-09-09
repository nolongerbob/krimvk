import { canAccessPrivateS3Key } from '@/lib/authorize-private-file';
import { isAdminUser } from '@/lib/admin-role';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/admin-role', () => ({
  isAdminUser: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    applicationFile: { findFirst: jest.fn() },
    message: { findFirst: jest.fn() },
    waterMeter: { findFirst: jest.fn() },
    contractDocument: { findFirst: jest.fn() },
    application: { findFirst: jest.fn() },
  },
}));

describe('canAccessPrivateS3Key admin bypass', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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

  it('allows the contract owner without a linked application', async () => {
    (prisma.contractDocument.findFirst as jest.Mock).mockResolvedValue({ contract: { userId: 'owner', applicationId: null } });
    await expect(canAccessPrivateS3Key('contracts/a/doc.pdf', 'owner', 'USER')).resolves.toBe(true);
    expect(prisma.application.findFirst).not.toHaveBeenCalled();
  });

  it('checks the owner of the linked application by its ID', async () => {
    (prisma.contractDocument.findFirst as jest.Mock).mockResolvedValue({ contract: { userId: null, applicationId: 'application-1' } });
    (prisma.application.findFirst as jest.Mock).mockResolvedValue({ id: 'application-1' });
    await expect(canAccessPrivateS3Key('contracts/a/doc.pdf', 'owner', 'USER')).resolves.toBe(true);
    expect(prisma.application.findFirst).toHaveBeenCalledWith({ where: { id: 'application-1', userId: 'owner' }, select: { id: true } });
  });

  it('denies another user access to contract documents', async () => {
    (prisma.contractDocument.findFirst as jest.Mock).mockResolvedValue({ contract: { userId: 'owner', applicationId: 'application-1' } });
    (prisma.application.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(canAccessPrivateS3Key('contracts/a/doc.pdf', 'stranger', 'USER')).resolves.toBe(false);
  });
});
