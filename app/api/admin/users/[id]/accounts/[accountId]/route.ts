import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { unlinkUserAccount } from '@/lib/unlink-user-account';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; accountId: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  if (![new URL(process.env.NEXTAUTH_URL || request.url).origin, request.nextUrl.origin].includes(request.headers.get('origin') || ''))
    return NextResponse.json({ error: 'Недопустимый источник запроса' }, { status: 403 });
  try {
    const { id, accountId } = await params;
    const removed = await unlinkUserAccount(id, accountId);
    if (!removed) return NextResponse.json({ error: 'Привязка не найдена. Обновите профиль.' }, { status: 404 });
    console.info('[account-unlink]', { actorId: auth.admin.userId, userId: id, accountId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Не удалось отвязать счёт. Попробуйте ещё раз.' }, { status: 500 });
  }
}
