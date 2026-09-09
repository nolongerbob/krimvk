import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { loadAdminUserBalance } from '@/lib/admin-user-balance';
export const dynamic = 'force-dynamic';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json(await loadAdminUserBalance((await params).id));
  } catch {
    return NextResponse.json({ error: 'Не удалось получить полный баланс' }, { status: 503 });
  }
}
