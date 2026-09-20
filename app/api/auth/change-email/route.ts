import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@/lib/get-app-session';
import { requestEmailChange, confirmEmailChange, EmailChangeError } from '@/lib/email-change';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const input = z.union([
  z.object({ action: z.literal('confirm'), token: z.string().regex(/^[a-f0-9]{64}$/) }),
  z.object({ action: z.literal('request').optional(), newEmail: z.string().trim().toLowerCase().email().max(254) }),
]);

export async function POST(request: NextRequest) {
  const session = await getAppSession(request);
  if (!session?.user?.id) return NextResponse.json({ error: 'Войдите в свой личный кабинет' }, { status: 401 });
  const body = input.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Проверьте email или ссылку подтверждения' }, { status: 400 });
  try {
    if (body.data.action === 'confirm') {
      await confirmEmailChange(session.user.id, body.data.token);
      return NextResponse.json({ message: 'Email изменён. Для входа используйте новый адрес.' });
    }
    await requestEmailChange(session.user.id, body.data.newEmail);
    return NextResponse.json({ message: 'Письмо отправлено на новый адрес. До подтверждения действует прежний email.' });
  } catch (error) {
    if (error instanceof EmailChangeError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Не удалось изменить email. Попробуйте позже.' }, { status: 503 });
  }
}
