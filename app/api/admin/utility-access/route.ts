import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';
import { changeUtilityPassword } from '@/lib/utility-password-change';
import { syncUtilityAccountEmail } from '@/lib/utility-account-email';
import { utilityWritesEnabled } from '@/lib/1c-account-access';
import { utilityAccountNumber, utilityNewPassword, UtilityAccessError } from '@/lib/utility-access-policy';
import { utilityOriginAllowed, limitUtilityAccess, utilityErrorResponse } from '@/lib/utility-access-http';

export const dynamic = 'force-dynamic';
const common = { questionId: z.string().min(1).max(100), accountNumber: utilityAccountNumber, region: z.literal('saki') };
const inputSchema = z.discriminatedUnion('action', [
  z.object({ ...common, action: z.literal('generate'), requestId: z.string().uuid() }).strict(),
  z.object({ ...common, action: z.literal('check'), requestId: z.string().uuid() }).strict(),
  z.object({ ...common, action: z.literal('set'), requestId: z.string().uuid(), password: utilityNewPassword }).strict(),
  z.object({ ...common, action: z.literal('sync-email') }).strict(),
]);
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ writesEnabled: utilityWritesEnabled() }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  if (!utilityOriginAllowed(request)) return NextResponse.json({ error: 'Недопустимый источник запроса' }, { status: 403 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Некорректные данные' }, { status: 400 });
  try {
    await limitUtilityAccess(auth.admin.userId, 'admin', 60);
    const input = parsed.data;
    if (input.action === 'sync-email') {
      const actor = await prisma.user.findUnique({ where: { id: auth.admin.userId }, select: { role: true } });
      if (actor?.role !== 'ADMIN') throw new UtilityAccessError('Доступ запрещён', 403);
      const question = await prisma.question.findUnique({ where: { id: input.questionId }, select: { userId: true } });
      if (!question) throw new UtilityAccessError('Диалог не найден', 404);
      const proof = await prisma.utilityPasswordChange.findFirst({ where: { accountKey: `saki:${input.accountNumber}`, userId: question.userId, status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, select: { id: true } });
      const status = await syncUtilityAccountEmail(question.userId, input.accountNumber, 'saki', proof?.id);
      if (status !== 'synced') throw new UtilityAccessError('Сначала пользователь должен подтвердить почту личного кабинета.', 409);
      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const result = await changeUtilityPassword({ ...input, actorId: auth.admin.userId, checkOnly: input.action === 'check', password: input.action === 'set' ? input.password : undefined });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return utilityErrorResponse(error); }
}
