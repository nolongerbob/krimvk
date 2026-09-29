import { expectedAssistantOrigin } from '@/lib/assistant-origin';
import { assistantEnabled } from '@/lib/release-features';
import { NextRequest, NextResponse } from 'next/server';
import { parseAssistantMessages, VISITOR_ASSISTANT_PROMPT } from '@/lib/visitor-assistant';
import { publicAssistantKnowledge } from '@/lib/visitor-assistant-knowledge';
import { isAssistantTestSupportEnabled } from '@/lib/assistant-test-support';
import { hasActiveOperator } from '@/lib/assistant-operator-session';
import { getAppSession } from '@/lib/get-app-session';
import { reserveAssistantBudget } from '@/lib/assistant-budget';

// DEV-only, bounded process-wide spend limit, independent of spoofable IP headers.
let minute = 0, requests = 0, day = 0, daily = 0, busy = 0;
export async function POST(request: NextRequest) {
  if (!assistantEnabled()) return NextResponse.json({ error: 'Недоступно' }, { status: 404 });
  const expectedOrigin = expectedAssistantOrigin(request);
  if (request.headers.get('origin') !== expectedOrigin) return NextResponse.json({ error: 'Недопустимый источник' }, { status: 403 });
  const session = await getAppSession(request);
  if (!session?.user?.id) return NextResponse.json({ error: 'Войдите в личный кабинет, чтобы пользоваться Капелькой.' }, { status: 401 });
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return NextResponse.json({ error: 'На этом dev-стенде DeepSeek пока не подключён. Сообщение не отправлено модели.' }, { status: 503 });
  try {
    if (isAssistantTestSupportEnabled() && await hasActiveOperator(request)) return NextResponse.json({ error: 'Диалог ведёт оператор. ИИ будет доступен после завершения обращения.', operatorActive: true }, { status: 409 });
    const raw = await request.text();
    if (raw.length > 24000) return NextResponse.json({ error: 'Слишком длинный диалог' }, { status: 413 });
    const messages = parseAssistantMessages(JSON.parse(raw).messages);
    if (!messages || messages.at(-1)?.role !== 'user') return NextResponse.json({ error: 'Некорректный диалог' }, { status: 400 });
    if (process.env.NODE_ENV === 'production') {
      if (!isAssistantTestSupportEnabled()) return NextResponse.json({ error: 'Помощник пока недоступен. Обратитесь в поддержку.' }, { status: 503 });
      try {
        if (!await reserveAssistantBudget(session.user.id)) return NextResponse.json({ error: 'Достигнут лимит ИИ. Вы можете позвать оператора.' }, { status: 429 });
      } catch { return NextResponse.json({ error: 'ИИ временно недоступен. Вы можете позвать оператора.' }, { status: 503 }); }
    }
    const now = Date.now();
    if (Math.floor(now/60000) !== minute) { minute = Math.floor(now/60000); requests = 0; }
    if (Math.floor(now/86400000) !== day) { day = Math.floor(now/86400000); daily = 0; }
    if (requests >= 20 || daily >= 200 || busy >= 2) return NextResponse.json({ error: 'Помощник занят. Попробуйте чуть позже.' }, { status: 429 });
    requests++; daily++; busy++;
    try {
      const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: [
          VISITOR_ASSISTANT_PROMPT,
          'Дополнительные разрешённые ссылки: /forgot-password — восстановить пароль нового кабинета; /dashboard/settings — настройки кабинета.',
          publicAssistantKnowledge(),
          isAssistantTestSupportEnabled()
            ? 'В этой тестовой среде можно запросить передачу истории оператору кнопкой; потребуется авторизация.'
            : 'СЕЙЧАС ЭТО ИЗОЛИРОВАННЫЙ DEV: передача оператору в виджете не подключена. Раздел /dashboard/questions и вход на этом стенде также не подключены к базе. Это уточнение важнее общих сценариев выше: для связи с человеком здесь давай только [Контакты](/contact), кратко пояснив, что оператор на тестовом стенде недоступен. Не предлагай неработающую кнопку или переписку в кабинете как решение. Не утверждай, что обращение создано.',
        ].join('\n\n') }, ...messages], temperature: .3, max_tokens: 600 }),
      });
      if (!upstream.ok) throw new Error('upstream');
      const data = await upstream.json();
      const answer = data.choices?.[0]?.message?.content;
      if (isAssistantTestSupportEnabled() && await hasActiveOperator(request)) return NextResponse.json({ error: 'Диалог передан оператору.', operatorActive: true }, { status: 409 });
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('empty');
      return NextResponse.json({ answer: answer.trim().slice(0, 2000) }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json({ error: 'ИИ сейчас не ответил. Попробуйте позже или обратитесь к оператору.' }, { status: 502 });
    } finally { busy--; }
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }
}
