import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { tryDecryptPassword1c } from '@/lib/password1c-crypto';
import { get1CUserData } from '@/lib/1c-api';
import { halfYearMonths, type MonthPoint } from '@/lib/half-year-metrics';
import { metricNumber } from '@/lib/quick-action-metrics';
import { mapWithConcurrency } from '@/lib/map-with-concurrency';
import { cacheGetJson, cacheSetJson } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAppSession(request);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { id } = await params;
  const account = await prisma.userAccount.findFirst({ where: { id, userId: session.user.id, isActive: true } });
  if (!account) return NextResponse.json({ error: 'Счёт не найден' }, { status: 404 });
  const password = tryDecryptPassword1c(account.password1c);
  if (!password || !account.region) return NextResponse.json({ error: '1С недоступна' }, { status: 503 });
  const months = halfYearMonths();
  const key = `balance-history:closed:${session.user.id}:${id}:${months[5]}`;
  let points = await cacheGetJson<MonthPoint[]>(key);
  if (!points) {
    points = await mapWithConcurrency(months, 2, async month => {
      const [year, index] = month.split('-').map(Number);
      const from = new Date(year, index - 1, 1, 12);
      const to = new Date(year, index, 0, 12);
      try {
        const data = await get1CUserData(account.accountNumber, password, account.region!, from, to);
        return { month, value: data?.Error || data?.error ? null : metricNumber(data?.CommonDuty ?? data?.commonDuty) };
      } catch { return { month, value: null }; }
    });
    await cacheSetJson(key, points, 300);
  }
  return NextResponse.json({ points }, { headers: { 'Cache-Control': 'private, no-store' } });
}
