import { NextRequest, NextResponse } from 'next/server';
import { cacheIncr } from '@/lib/cache/redis';
import { UtilityAccessError } from '@/lib/utility-access-policy';

export function utilityOriginAllowed(request: NextRequest) {
  return [request.nextUrl.origin, new URL(process.env.NEXTAUTH_URL || request.url).origin].includes(request.headers.get('origin') || '');
}
export async function limitUtilityAccess(actorId: string, action: string, limit: number) {
  if (await cacheIncr(`utility-access:${action}:${actorId}`, 3600) > limit) throw new UtilityAccessError('Слишком много попыток. Попробуйте позже.', 429);
}
export function utilityErrorResponse(error: unknown) {
  const known = error instanceof UtilityAccessError;
  return NextResponse.json({ error: known ? error.message : 'Не удалось завершить операцию. Повторите проверку результата.', code: known ? error.code : 'UTILITY_ACCESS_ERROR' }, { status: known ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
}
