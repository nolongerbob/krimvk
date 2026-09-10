import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma, withRetry } from '@/lib/prisma';
import { adminUserSelect, mapAdminUser } from '@/lib/admin-user-details';

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
