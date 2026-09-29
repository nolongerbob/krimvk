import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { isYandexAuthEnabled } from '@/lib/yandex-auth';
import { isEsiaPreviewEnabled } from '@/lib/esia-preparation';
import { isVkAuthEnabled } from '@/lib/vk-auth';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  if (!isEsiaPreviewEnabled()) return NextResponse.json({ error: 'Недоступно' }, { status: 404 });
  const session = await getAppSession(request);
  if (!session?.user?.id) return NextResponse.json({ error: 'Требуется вход' }, { status: 401 });
  const accounts = await prisma.account.findMany({ where: { userId: session.user.id }, select: { provider: true } });
  return NextResponse.json({ services: ['yandex', 'vk', 'ok_ru', 'mail_ru', 'gosuslugi'].map(id => ({
    id, linked: accounts.some(a => a.provider === (['vk', 'ok_ru', 'mail_ru'].includes(id) ? 'vk' : id)),
    available: id === 'yandex' ? isYandexAuthEnabled() : ['vk', 'ok_ru', 'mail_ru'].includes(id) && isVkAuthEnabled(),
  })) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
