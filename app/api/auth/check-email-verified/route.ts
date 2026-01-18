import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET — проверка, подтверждён ли email у пользователя из cookie pending_verify.
 * Используется на странице «Регистрация успешна»: при подтверждении с другого
 * устройства редиректим на /login?verified=true.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('pending_verify')?.value;
    if (!userId) {
      return NextResponse.json({ verified: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    const verified = !!user?.emailVerified;

    const res = NextResponse.json({ verified });
    if (verified) {
      res.cookies.set('pending_verify', '', { maxAge: 0, path: '/' });
    }
    return res;
  } catch {
    return NextResponse.json({ verified: false });
  }
}
