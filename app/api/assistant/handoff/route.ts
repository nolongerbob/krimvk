import { expectedAssistantOrigin } from '@/lib/assistant-origin';
import { assistantEnabled } from '@/lib/release-features';
import { NextRequest, NextResponse } from 'next/server';
import { POST as sendQuestion } from '@/app/api/questions/create/route';
import { parseAssistantMessages } from '@/lib/visitor-assistant';
import { isAssistantTestSupportEnabled } from '@/lib/assistant-test-support';
import { getAppSession } from '@/lib/get-app-session';

export async function POST(request: NextRequest) {
  if (!assistantEnabled()) return NextResponse.json({ error: 'Недоступно' }, { status: 404 });
  const expectedOrigin = expectedAssistantOrigin(request);
  if (request.headers.get('origin') !== expectedOrigin) return NextResponse.json({ error: 'Недопустимый источник' }, { status: 403 });
  if (!(await getAppSession(request))?.user?.id) return NextResponse.json({ error: 'Войдите в личный кабинет, чтобы вызвать оператора.' }, { status: 401 });
  // Explicit opt-in only after wiring a separate test database and test accounts.
  if (!isAssistantTestSupportEnabled()) {
    return NextResponse.json({ error: 'На этом изолированном dev-стенде оператор не подключён. Обращение не создано.' }, { status: 503 });
  }
  try {
    const raw = await request.text();
    if (raw.length > 24000) return NextResponse.json({ error: 'Слишком длинный диалог' }, { status: 413 });
    const messages = parseAssistantMessages(JSON.parse(raw).messages);
    if (!messages?.some(m => m.role === 'user')) return NextResponse.json({ error: 'Сначала опишите вопрос' }, { status: 400 });
    const text = 'Прошу подключить оператора. Ниже история, переданная посетителем из ИИ-помощника (ответы ИИ не проверены):\n\n' + messages.map(m => `${m.role === 'user' ? 'Посетитель' : 'ИИ'}: ${m.content}`).join('\n\n');
    // Existing route handles authentication and derives the owner from session,
    // not from a client-supplied user ID. No schema or permission changes.
    return sendQuestion(new NextRequest(new URL('/api/questions/create', request.url), {
      method: 'POST', headers: request.headers, body: JSON.stringify({ text }),
    }));
  } catch { return NextResponse.json({ error: 'Не удалось передать обращение' }, { status: 400 }); }
}
