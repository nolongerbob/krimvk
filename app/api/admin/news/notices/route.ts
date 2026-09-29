import { noticesEnabled } from '@/lib/release-features';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { parseNotice } from '@/lib/site-notices';
export const dynamic = 'force-dynamic';
const hidden = () => NextResponse.json({ error: 'Не найдено' }, { status: 404 });
export async function GET() {
  if (!noticesEnabled()) return hidden();
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const [notices, news] = await Promise.all([
      prisma.siteNotice.findMany({ orderBy: [{ startsAt: 'desc' }, { id: 'asc' }], include: { news: { select: { title: true, published: true } } } }),
      prisma.news.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, title: true, published: true } }),
    ]);
    return NextResponse.json({ notices, news }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Не удалось загрузить уведомления' }, { status: 503 }); }
}
export async function POST(request: NextRequest) {
  if (!noticesEnabled()) return hidden();
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  let input;
  try { input = parseNotice(await request.json()); }
  catch { return NextResponse.json({ error: 'Проверьте текст, новость и даты: окончание должно быть позже начала (МСК).' }, { status: 400 }); }
  try {
    const { id, ...data } = input;
    const news = await prisma.news.findUnique({ where: { id: data.newsId }, select: { published: true } });
    if (!news || (data.enabled && !news.published)) return NextResponse.json({ error: 'Для показа выберите опубликованную новость.' }, { status: 400 });
    if (id && !await prisma.siteNotice.findUnique({ where: { id }, select: { id: true } })) return hidden();
    const notice = id ? await prisma.siteNotice.update({ where: { id }, data }) : await prisma.siteNotice.create({ data });
    return NextResponse.json({ notice });
  } catch { return NextResponse.json({ error: 'Не удалось сохранить уведомление. Обновите список и попробуйте ещё раз.' }, { status: 503 }); }
}
