import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';
import { createPostVerifyLoginToken } from '@/lib/post-verify-login-token';

export const dynamic = 'force-dynamic';

/**
 * GET — подтверждён ли email (только cookie pending_verify или сессия, без userId в query).
 * loginToken выдаётся только при pending_verify на устройстве регистрации.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const pendingUserId = cookieStore.get('pending_verify')?.value;

    const session = await getAppSession(request);
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailVerified: true },
      });
      if (user?.emailVerified) {
        return NextResponse.json({ verified: true });
      }
    }

    if (pendingUserId) {
      const user = await prisma.user.findUnique({
        where: { id: pendingUserId },
        select: { emailVerified: true },
      });
      const verified = !!user?.emailVerified;

      if (!verified) {
        return NextResponse.json({ verified: false });
      }

      const res = NextResponse.json({
        verified: true,
        loginToken: createPostVerifyLoginToken(pendingUserId),
      });
      res.cookies.set('pending_verify', '', { maxAge: 0, path: '/' });
      return res;
    }

    return NextResponse.json({ verified: false });
  } catch {
    return NextResponse.json({ verified: false });
  }
}
