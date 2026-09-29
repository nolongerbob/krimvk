import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma, withRetry } from '@/lib/prisma';
import { adminUserSelect, mapAdminUser } from '@/lib/admin-user-details';
import { deleteAdminUser, updateAdminUserProfile } from '@/lib/admin-user-management';
import { authorizeAdminUserWrite, adminUserErrorResponse } from '@/lib/admin-user-write-guard';

export const dynamic = 'force-dynamic';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const user = await withRetry(() => prisma.user.findUnique({ where: { id }, select: adminUserSelect }));
    if (!user) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    return NextResponse.json({ user: mapAdminUser(user) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Не удалось загрузить профиль' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminUserWrite(request, 'update');
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const user = await updateAdminUserProfile(auth.admin.userId, id, await request.json().catch(() => null));
    return NextResponse.json({ success: true, user }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return adminUserErrorResponse(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminUserWrite(request, 'delete');
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json().catch(() => null);
    if (typeof body?.confirmation !== 'string' || body.confirmation.length > 320)
      return NextResponse.json({ error: 'Введите почту удаляемого пользователя' }, { status: 400 });
    const { id } = await params;
    await deleteAdminUser(auth.admin.userId, id, body.confirmation);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return adminUserErrorResponse(error); }
}
