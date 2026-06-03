import { NextRequest, NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api-route';
import { getAppSession } from '@/lib/get-app-session';
import { parseDashboardAccountData } from '@/lib/dashboard-account-data';
import { computeDashboardStats } from '@/lib/dashboard-stats';
import { formatUserAccountsForApi } from '@/lib/format-user-accounts';
import { get1CUserData } from '@/lib/1c-api';
import { tryDecryptPassword1c } from '@/lib/password1c-crypto';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 90_000;
const overviewCache = new Map<
  string,
  { at: number; payload: Record<string, unknown> }
>();

async function getHandler(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userId = session.user.id;
  const accountId = request.nextUrl.searchParams.get('accountId');
  const cacheKey = `${userId}:${accountId || ''}`;
  const bypassCache = request.nextUrl.searchParams.get('fresh') === '1';
  const cached = overviewCache.get(cacheKey);
  if (
    !bypassCache &&
    cached &&
    Date.now() - cached.at < CACHE_TTL_MS
  ) {
    return NextResponse.json(cached.payload, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  }

  const [user, accountsRaw, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    }),
    prisma.userAccount.findMany({
      where: { userId, isActive: true },
      include: {
        meters: {
          include: {
            readings: { orderBy: { readingDate: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    computeDashboardStats(userId),
  ]);

  if (!user) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
  }

  const accounts = formatUserAccountsForApi(accountsRaw);
  const selectedId =
    accountId && accounts.some((a) => a.id === accountId)
      ? accountId
      : accounts[0]?.id ?? null;

  let accountData = null;
  if (selectedId) {
    const account = accountsRaw.find((a) => a.id === selectedId);
    const password1c = account ? tryDecryptPassword1c(account.password1c) : null;
    if (account && password1c && account.region) {
      try {
        const data = (await Promise.race([
          get1CUserData(account.accountNumber, password1c, account.region),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('1C request timeout')), 10000)
          ),
        ])) as Record<string, unknown>;
        accountData = parseDashboardAccountData(data, {
          accountNumber: account.accountNumber,
          address: account.address || '',
          name: account.name,
        });
      } catch {
        accountData = null;
      }
    }
  }

  const payload = {
    profile: {
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      name: user.name,
    },
    stats,
    accounts,
    selectedAccountId: selectedId,
    accountData,
  };

  overviewCache.set(cacheKey, { at: Date.now(), payload });
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'private, max-age=60' },
  });
}

export const GET = withApiRoute(getHandler, 'GET /api/dashboard/overview');
