import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET — проверка, подтверждён ли email.
 * Проверяет:
 * 1. Текущую сессию (если пользователь авторизован)
 * 2. Cookie pending_verify (устройство регистрации)
 * 3. Query параметр userId (из localStorage на клиенте)
 * Возвращает { verified: boolean, userId?: string }.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdFromQuery = searchParams.get('userId'); // Из localStorage на клиенте
    
    const cookieStore = await cookies();
    const pendingUserId = cookieStore.get('pending_verify')?.value;
    
    // Проверяем сессию (если пользователь уже авторизован)
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailVerified: true },
      });
      if (user?.emailVerified) {
        return NextResponse.json({ verified: true, userId: session.user.id });
      }
    }

    // Проверяем pending_verify cookie (устройство регистрации)
    const userIdToCheck = pendingUserId || userIdFromQuery;
    if (userIdToCheck) {
      const user = await prisma.user.findUnique({
        where: { id: userIdToCheck },
        select: { emailVerified: true },
      });
      const verified = !!user?.emailVerified;
      const res = NextResponse.json({ verified, userId: verified ? userIdToCheck : undefined });
      if (verified && pendingUserId) {
        // Очищаем cookie только если она была установлена
        res.cookies.set('pending_verify', '', { maxAge: 0, path: '/' });
      }
      return res;
    }

    return NextResponse.json({ verified: false });
  } catch {
    return NextResponse.json({ verified: false });
  }
}
