import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdminUser } from '@/lib/admin-role';
import { prisma } from '@/lib/prisma';

export { isAdminUser } from '@/lib/admin-role';

export type AdminAuth = {
  userId: string;
  email: string | null;
};

type AdminApiResult =
  | { ok: true; admin: AdminAuth }
  | { ok: false; response: NextResponse };

/**
 * Проверка ADMIN по записи в БД (не только JWT/session.role).
 */
export async function requireAdmin(): Promise<AdminApiResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Не авторизован' }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  if (user?.role !== 'ADMIN') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    admin: { userId: session.user.id, email: user.email },
  };
}

/**
 * Для server components в /admin: редирект, если не админ.
 */
export async function requireAdminPage(loginCallbackPath = '/admin'): Promise<AdminAuth> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(loginCallbackPath)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return { userId: session.user.id, email: user.email };
}
