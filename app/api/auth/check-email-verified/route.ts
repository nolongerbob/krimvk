import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET — проверка, подтверждён ли email.
 * Проверяет:
 * 1. Cookie pending_verify (устройство регистрации)
 * 2. Текущую сессию (если пользователь авторизован)
 * Возвращает { verified: boolean, userId?: string }.
 */
export async function GET() {
  try {
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
    if (pendingUserId) {
      const user = await prisma.user.findUnique({
        where: { id: pendingUserId },
        select: { emailVerified: true },
      });
      const verified = !!user?.emailVerified;
      const res = NextResponse.json({ verified, userId: verified ? pendingUserId : undefined });
      if (verified) {
        res.cookies.set('pending_verify', '', { maxAge: 0, path: '/' });
      }
      return res;
    }

    return NextResponse.json({ verified: false });
  } catch {
    return NextResponse.json({ verified: false });
  }
}
