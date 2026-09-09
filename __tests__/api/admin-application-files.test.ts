/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server';
import { POST as upload } from '@/app/api/admin/applications/[id]/upload/route';
import { POST as complete } from '@/app/api/admin/applications/complete/route';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/require-admin';
import { storage } from '@/lib/storage';

jest.mock('@/lib/require-admin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/lib/prisma', () => ({ prisma: {
  application: { findUnique: jest.fn(), update: jest.fn() },
  applicationFile: { create: jest.fn() },
}, withRetry: (fn: () => unknown) => fn() }));
jest.mock('@/lib/storage', () => ({ storage: { upload: jest.fn() } }));
jest.mock('@/lib/security/validate-upload', () => ({ validateUserApplicationFile: jest.fn().mockResolvedValue(null) }));

describe('admin application uploads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ ok: true, admin: { userId: 'admin-1' } });
    (prisma.application.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', description: '' });
    (prisma.application.update as jest.Mock).mockResolvedValue({ id: 'a1', status: 'COMPLETED' });
    (storage.upload as jest.Mock).mockResolvedValue({ url: 'applications/a1.pdf' });
    (prisma.applicationFile.create as jest.Mock).mockResolvedValue({ id: 'file-1' });
  });
  function request() {
    const body = new FormData();
    body.append('applicationId', 'a1');
    body.append('file', new Blob(['%PDF test'], { type: 'application/pdf' }), 'test.pdf');
    body.append('files', new Blob(['%PDF test'], { type: 'application/pdf' }), 'test.pdf');
    return new NextRequest('https://example.test/api', { method: 'POST', body });
  }
  it('uses authenticated admin ID when uploading with async route params', async () => {
    const response = await upload(request(), { params: Promise.resolve({ id: 'a1' }) });
    expect(response.status).toBe(200);
    expect(prisma.applicationFile.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ uploadedBy: 'admin-1', applicationId: 'a1' }) }));
  });
  it('uses authenticated admin ID when completing with an attachment', async () => {
    const response = await complete(request());
    expect(response.status).toBe(200);
    expect(prisma.applicationFile.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ uploadedBy: 'admin-1' }) }));
    expect(prisma.application.update).toHaveBeenCalled();
  });
  it('rejects unauthorized uploads without touching storage', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 403 }) });
    expect((await upload(request(), { params: Promise.resolve({ id: 'a1' }) })).status).toBe(403);
    expect(storage.upload).not.toHaveBeenCalled();
  });
});
