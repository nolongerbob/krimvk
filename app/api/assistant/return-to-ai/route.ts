import { expectedAssistantOrigin } from '@/lib/assistant-origin';
import { assistantEnabled } from '@/lib/release-features';
import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { isAssistantTestSupportEnabled } from '@/lib/assistant-test-support';

export async function POST(request: NextRequest) {
  if (!assistantEnabled()) return NextResponse.json({ error: 'Недоступно' }, { status: 404 });
  const origin = expectedAssistantOrigin(request);
  if (request.headers.get('origin') !== origin) return NextResponse.json({ error: 'Недопустимый источник' }, { status: 403 });
  const session = await getAppSession(request);
  if (!session?.user?.id) return NextResponse.json({ error: 'Войдите в личный кабинет' }, { status: 401 });
  if (!isAssistantTestSupportEnabled()) return NextResponse.json({ error: 'Поддержка не подключена' }, { status: 503 });
  try {
    const { questionId } = await request.json();
    if (typeof questionId !== 'string' || questionId.length > 100 || !questionId) return NextResponse.json({ error: 'Некорректный диалог' }, { status: 400 });
    const question = await prisma.$transaction(async tx => {
      // Same per-user lock as message creation: switching modes cannot split a send.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${session.user.id} FOR UPDATE`;
      const owned = await tx.question.findFirst({ where: { id: questionId, userId: session.user.id } });
      if (!owned) return null;
      const changed = await tx.question.updateMany({ where: { id: questionId, userId: session.user.id, status: { in: ['PENDING', 'IN_PROGRESS'] } }, data: { status: 'COMPLETED' } });
      if (changed.count) await tx.message.create({ data: { questionId, text: 'Пользователь завершил ожидание оператора и вернулся к ИИ-помощнику.', isFromAdmin: false } });
      return tx.question.findFirst({ where: { id: questionId, userId: session.user.id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    });
    if (!question) return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 });
    return NextResponse.json({ question }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Не удалось вернуться к ИИ. Попробуйте ещё раз.' }, { status: 500 }); }
}
