import type { NextRequest } from 'next/server';
import { getAppSession } from '@/lib/get-app-session';
import { prisma } from '@/lib/prisma';

export async function hasActiveOperator(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session?.user?.id) return false;
  return !!await prisma.question.findFirst({
    where: { userId: session.user.id, status: { in: ['PENDING', 'IN_PROGRESS'] }, messages: { some: { isFromAdmin: false } } },
    select: { id: true },
  });
}
