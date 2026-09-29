import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { getAdminUserSettings } from '@/lib/admin-user-management';
import { adminUserErrorResponse } from '@/lib/admin-user-write-guard';

export const dynamic = 'force-dynamic';
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    return NextResponse.json({ settings: await getAdminUserSettings(auth.admin.userId, id) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return adminUserErrorResponse(error); }
}
