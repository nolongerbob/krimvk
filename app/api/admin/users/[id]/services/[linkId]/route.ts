import { NextRequest, NextResponse } from 'next/server';
import { unlinkAdminUserService } from '@/lib/admin-user-management';
import { authorizeAdminUserWrite, adminUserErrorResponse } from '@/lib/admin-user-write-guard';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; linkId: string }> }) {
  const auth = await authorizeAdminUserWrite(request, 'unlink-service');
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json().catch(() => null);
    if (typeof body?.confirmation !== 'string' || body.confirmation.length > 100)
      return NextResponse.json({ error: 'Подтвердите отвязку выбранного сервиса' }, { status: 400 });
    const { id, linkId } = await params;
    await unlinkAdminUserService(auth.admin.userId, id, linkId, body.confirmation);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return adminUserErrorResponse(error); }
}
