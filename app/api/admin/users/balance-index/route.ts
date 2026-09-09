import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma, withRetry } from '@/lib/prisma';
import { directoryStats, ensureBalanceSnapshot, getBalanceSnapshot } from '@/lib/admin-users-index';
import { userSearch } from '@/lib/admin-users-filters';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  ensureBalanceSnapshot();
  const query = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 200);
  const users = await withRetry(() => prisma.user.findMany({ where: userSearch(query), select: { id: true, role: true } }));
  const snapshot = getBalanceSnapshot();
  // A registration after the snapshot must not leave the UI waiting indefinitely.
  if (!snapshot.running && !snapshot.error && directoryStats(users).pending > 0) ensureBalanceSnapshot(true);
  return NextResponse.json({
    stats: directoryStats(users), running: snapshot.running, error: snapshot.error,
    finishedAt: snapshot.finishedAt,
    balances: Object.fromEntries(users.filter(u => snapshot.balances.has(u.id)).map(u => [u.id, snapshot.balances.get(u.id)])),
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
