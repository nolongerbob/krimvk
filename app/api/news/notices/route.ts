import { noticesEnabled } from '@/lib/release-features';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { activeNoticeWhere } from '@/lib/site-notices';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!noticesEnabled()) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  const serverNow = new Date();
  try {
    const notice = await prisma.siteNotice.findFirst({
      where: activeNoticeWhere(serverNow), orderBy: [{ startsAt: 'desc' }, { id: 'asc' }],
      select: { id: true, text: true, buttonLabel: true, newsId: true, endsAt: true, updatedAt: true },
    });
    return NextResponse.json({ notice, serverNow }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ notice: null, serverNow }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
