import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdminUserWrite, adminUserErrorResponse } from '@/lib/admin-user-write-guard';
import { linkAdminUserAccount } from '@/lib/admin-link-user-account';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminUserWrite(request, 'link-account');
  if (!auth.ok) return auth.response;
  try {
    const input = await request.json().catch(() => null);
    const { id } = await params;
    const result = await linkAdminUserAccount(auth.admin.userId, id, input);
    return NextResponse.json({ success: true, ...result }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return adminUserErrorResponse(error); }
}
