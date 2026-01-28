import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

// Структура сайта и ссылки
const SITE_STRUCTURE = `
СТРУКТУРА САЙТА И ССЫЛКИ (ВСЕГДА УПОМИНАЙ РЕЛЕВАНТНЫЕ ССЫЛКИ):

1. СТАТЬ АБОНЕНТОМ / ПОДКЛЮЧЕНИЕ:
   - Онлайн-форма заявки: https://krimvk.ru/stat-abonentom
   - Там можно заполнить заявление на подключение к водоснабжению онлайн, не посещая офис
   - Также можно скачать бланк заявления для ручного заполнения

2. ЛИЧНЫЙ КАБИНЕТ:
   - Вход: https://krimvk.ru/login
   - Регистрация: https://krimvk.ru/register
   - В личном кабинете можно: передать показания счетчиков, посмотреть историю оплат, скачать квитанции

3. УСЛУГИ:
   - Все услуги: https://krimvk.ru/services
   - Технологическое присоединение, установка счетчиков, ремонт сетей и др.

4. ОПЛАТА:
   - Счета и оплата в личном кабинете: https://krimvk.ru/dashboard/bills
   - Квитанции: https://krimvk.ru/dashboard/receipts
   - Оплата по QR-коду через СБП

5. ПОКАЗАНИЯ СЧЕТЧИКОВ:
   - Передать показания: https://krimvk.ru/dashboard/meters
   - Можно передать онлайн через личный кабинет

6. ВОПРОСЫ И ОБРАЩЕНИЯ:
   - Чат с поддержкой: https://krimvk.ru/dashboard/questions
   - FAQ: https://krimvk.ru/faq

7. ИНФОРМАЦИЯ:
   - Новости: https://krimvk.ru/news
   - Качество воды: https://krimvk.ru/water-quality
   - Контакты: https://krimvk.ru/contact

8. КОНТАКТЫ:
   - Телефон: +7 (978) 080-03-66, +7 (978) 741-57-59
   - Аварийная служба: +7 (978) 701-30-50
   - Адрес: с. Лесновка Сакского района, ул. Механизаторов, 9
   - Режим работы: Пн-Чт 08:00-17:00, Пт 08:00-16:00, обед 12:00-12:48
   - Приём абонентов: 8:15-15:00 (с 1 по 7 число каждого месяца приём не ведётся)
`;

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "API ключ DeepSeek не настроен. Добавьте DEEPSEEK_API_KEY в .env" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { questionId, userMessage, currentDraft } = body;

    if (!userMessage) {
      return NextResponse.json({ error: "Сообщение пользователя обязательно" }, { status: 400 });
    }

    // Загружаем всю информацию для контекста
    const [templates, articles, questionData, services, recentAdminResponses] = await Promise.all([
      prisma.answerTemplate.findMany({
        where: { isActive: true },
        select: { title: true, content: true },
      }),
      prisma.knowledgeBaseArticle.findMany({
        where: { isActive: true },
        select: { title: true, content: true },
      }),
      questionId
        ? prisma.question.findUnique({
            where: { id: questionId },
            include: {
              messages: {
                orderBy: { createdAt: "asc" },
              },
              user: { select: { name: true } },
            },
          })
        : null,
      // Загружаем услуги
      prisma.service.findMany({
        where: { isActive: true },
        select: { title: true, description: true },
      }),
      // Загружаем последние ответы админов для примера стиля
      prisma.message.findMany({
        where: { isFromAdmin: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { text: true },
      }),
    ]);

    // Формируем контекст из базы знаний
    let knowledgeContext = "";
    if (articles.length > 0) {
      knowledgeContext = "БАЗА ЗНАНИЙ (FAQ):\n" + articles.map((a) => `Вопрос: ${a.title}\nОтвет: ${a.content}`).join("\n\n");
    }

    // Формируем контекст из шаблонов
    let templatesContext = "";
    if (templates.length > 0) {
      templatesContext = "ГОТОВЫЕ ШАБЛОНЫ ОТВЕТОВ:\n" + templates.map((t) => `[${t.title}]:\n${t.content}`).join("\n\n");
    }

    // Услуги
    let servicesContext = "";
    if (services.length > 0) {
      servicesContext = "ДОСТУПНЫЕ УСЛУГИ:\n" + services.map((s) => `- ${s.title}: ${s.description}`).join("\n");
    }

    // Примеры предыдущих ответов
    let styleExamples = "";
    if (recentAdminResponses.length > 0) {
      styleExamples = "ПРИМЕРЫ СТИЛЯ ОТВЕТОВ ОПЕРАТОРОВ:\n" + 
        recentAdminResponses.slice(0, 5).map((r) => `"${r.text}"`).join("\n\n");
    }

    // История текущего диалога
    let dialogHistory = "";
    if (questionData?.messages && questionData.messages.length > 0) {
      dialogHistory =
        "ИСТОРИЯ ТЕКУЩЕГО ДИАЛОГА:\n" +
        questionData.messages
          .map((m) => `${m.isFromAdmin ? "Оператор" : "Клиент"}: ${m.text}`)
          .join("\n\n");
    }

    // Режим работы: новый ответ или улучшение черновика
    const isImproveMode = currentDraft && currentDraft.trim().length > 0;

    const systemPrompt = `Ты - профессиональный оператор службы поддержки водоканала "КрымВК" (Крымская Водная Компания).

${isImproveMode ? `
РЕЖИМ: УЛУЧШЕНИЕ ЧЕРНОВИКА
Оператор уже начал писать ответ. Твоя задача - улучшить его черновик:
- Сохрани основную мысль и стиль оператора
- Добавь недостающую информацию
- Добавь релевантные ссылки на сайт
- Сделай ответ более полным и профессиональным
- НЕ меняй смысл кардинально, только улучшай

ЧЕРНОВИК ОПЕРАТОРА:
"${currentDraft}"
` : `
РЕЖИМ: ГЕНЕРАЦИЯ НОВОГО ОТВЕТА
Составь полный профессиональный ответ на вопрос клиента.
`}

ВАЖНЫЕ ПРАВИЛА:
1. ВСЕГДА указывай релевантные ссылки на разделы сайта
2. Если клиент спрашивает о подключении/стать абонентом - ОБЯЗАТЕЛЬНО упомяни онлайн-форму: https://krimvk.ru/stat-abonentom
3. Если речь об оплате - упомяни личный кабинет и возможность оплаты по QR
4. Если речь о показаниях - упомяни что можно передать онлайн в личном кабинете
5. Отвечай на русском языке, вежливо и профессионально
6. Давай конкретные и полезные ответы
7. В конце ставь: "С уважением, служба поддержки КрымВК"

ФОРМАТ ОТВЕТА (СТРОГО СОБЛЮДАЙ):
- НЕ используй markdown разметку (никаких **, ##, [] и т.д.)
- НЕ используй нумерованные списки с точками (1. 2. 3.)
- Пиши простым текстом, как в обычном сообщении в чате
- Ссылки указывай просто как текст: https://krimvk.ru/stat-abonentom
- НЕ дублируй ссылки в формате [текст](ссылка) - просто пиши URL
- Для выделения можно использовать заглавные буквы или тире
- Пиши кратко и по делу, без лишней воды

${SITE_STRUCTURE}

${servicesContext}

${knowledgeContext}

${templatesContext}

${styleExamples}

${dialogHistory}`;

    const userPrompt = isImproveMode
      ? `Улучши черновик ответа оператора на вопрос клиента: "${userMessage}"`
      : `Клиент спрашивает: "${userMessage}"\n\nСоставь полный ответ с релевантными ссылками.`;

    // Вызываем DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("DeepSeek API error:", errorData);
      return NextResponse.json(
        { error: "Ошибка API DeepSeek: " + (errorData.error?.message || response.statusText) },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedResponse = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ response: generatedResponse });
  } catch (error) {
    console.error("Error generating response:", error);
    return NextResponse.json({ error: "Ошибка при генерации ответа" }, { status: 500 });
  }
}
