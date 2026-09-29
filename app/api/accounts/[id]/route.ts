import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/get-app-session';
import { unlinkUserAccount } from '@/lib/unlink-user-account';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAppSession(request);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  if (![new URL(process.env.NEXTAUTH_URL || request.url).origin, request.nextUrl.origin].includes(request.headers.get('origin') || ''))
    return NextResponse.json({ error: 'Недопустимый источник запроса' }, { status: 403 });
  try {
    const removed = await unlinkUserAccount(session.user.id, (await params).id);
    if (!removed) return NextResponse.json({ error: 'Привязка не найдена. Обновите страницу.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Не удалось отвязать счёт. Попробуйте ещё раз.' }, { status: 500 });
  }
}
