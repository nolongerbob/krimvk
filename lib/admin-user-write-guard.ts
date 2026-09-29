import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { rateLimit } from '@/lib/security/http-guard';
import { AdminUserError } from '@/lib/admin-user-management';

export async function authorizeAdminUserWrite(request: NextRequest, operation: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;
  const origins = [request.nextUrl.origin, new URL(process.env.NEXTAUTH_URL || request.url).origin];
  if (!origins.includes(request.headers.get('origin') || '')) return { ok: false as const, response: NextResponse.json({ error: 'Недопустимый источник запроса' }, { status: 403 }) };
  if (!rateLimit(`admin-user-${operation}:${auth.admin.userId}`, 20, 60_000)) return { ok: false as const, response: NextResponse.json({ error: 'Слишком много запросов. Подождите минуту.' }, { status: 429 }) };
  return auth;
}

export function adminUserErrorResponse(error: unknown) {
  return NextResponse.json({ error: error instanceof AdminUserError ? error.message : 'Не удалось выполнить действие. Попробуйте ещё раз.' },
    { status: error instanceof AdminUserError ? error.status : 500 });
}
