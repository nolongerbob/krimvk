import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSession } from '@/lib/get-app-session';
import { requestUtilityPasswordRecovery } from '@/lib/utility-password-recovery';
import { changeUtilityPassword } from '@/lib/utility-password-change';
import { utilityAccountNumber, utilityNewPassword } from '@/lib/utility-access-policy';
import { utilityOriginAllowed, limitUtilityAccess, utilityErrorResponse } from '@/lib/utility-access-http';

export const dynamic = 'force-dynamic';
const common = { accountNumber: utilityAccountNumber, region: z.literal('saki') };
const schema = z.discriminatedUnion('action', [
  z.object({ ...common, action: z.literal('request') }).strict(),
  z.object({ ...common, action: z.literal('confirm'), token: z.string().regex(/^[a-f0-9]{64}$/), requestId: z.string().uuid(), password: utilityNewPassword }).strict(),
  z.object({ ...common, action: z.literal('check'), token: z.string().regex(/^[a-f0-9]{64}$/), requestId: z.string().uuid() }).strict(),
]);
export async function POST(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session?.user?.id) return NextResponse.json({ error: 'Войдите в свой личный кабинет' }, { status: 401 });
  if (!utilityOriginAllowed(request)) return NextResponse.json({ error: 'Недопустимый источник запроса' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Проверьте номер счёта, район и данные восстановления.' }, { status: 400 });
  try {
    const input = parsed.data;
    await limitUtilityAccess(session.user.id, input.action, input.action === 'request' ? 6 : 20);
    if (input.action === 'request') return NextResponse.json({ message: await requestUtilityPasswordRecovery(session.user.id, input.accountNumber, input.region) }, { headers: { 'Cache-Control': 'no-store' } });
    await changeUtilityPassword({ ...input, actorId: session.user.id, checkOnly: input.action === 'check' });
    return NextResponse.json({ success: true, message: 'Пароль лицевого счёта изменён. Используйте новый пароль при добавлении счёта.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return utilityErrorResponse(error); }
}
