import { NextRequest, NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api-route';
import { getAppSession } from '@/lib/get-app-session';
import { parseDashboardAccountData } from '@/lib/dashboard-account-data';
import { computeDashboardStats } from '@/lib/dashboard-stats';
import { formatUserAccountsForApi } from '@/lib/format-user-accounts';
import { get1CUserData } from '@/lib/1c-api';
import { tryDecryptPassword1c } from '@/lib/password1c-crypto';
import { prisma } from '@/lib/prisma';
import { cacheGetJson, cacheSetJson } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

const OVERVIEW_CACHE_TTL_SECONDS = 90;

async function getHandler(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const userId = session.user.id;
  const accountId = request.nextUrl.searchParams.get('accountId');
  // Validate membership before serving a cached balance, including after admin unlink.
  // A fingerprint also prevents an in-flight old request repopulating the new cache.
  const membership = await prisma.userAccount.findMany({
    where: { userId, isActive: true }, select: { id: true }, orderBy: { id: 'asc' },
  });
  const cacheKey = `${userId}:${accountId || ''}:${membership.map(account => account.id).join(',')}`;
  const bypassCache = request.nextUrl.searchParams.get('fresh') === '1';
  const redisCacheKey = `dashboard:overview:${cacheKey}`;
  if (!bypassCache) {
    const cached = await cacheGetJson<Record<string, unknown>>(redisCacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
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

  await cacheSetJson(redisCacheKey, payload, OVERVIEW_CACHE_TTL_SECONDS);
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export const GET = withApiRoute(getHandler, 'GET /api/dashboard/overview');
