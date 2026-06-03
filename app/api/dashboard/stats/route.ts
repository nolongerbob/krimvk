import { NextRequest, NextResponse } from 'next/server';
import { withApiRoute } from '@/lib/api-route';
import { getAppSession } from '@/lib/get-app-session';
import { computeDashboardStats } from '@/lib/dashboard-stats';

export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const result = await computeDashboardStats(session.user.id);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}

export const GET = withApiRoute(getHandler, 'GET /api/dashboard/stats');
