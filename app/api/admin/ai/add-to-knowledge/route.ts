import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { prisma, withRetry } from "@/lib/prisma";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    );

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { questionId, messages } = await request.json();

    if (!questionId || !messages || messages.length === 0) {
      return NextResponse.json({ error: "Недостаточно данных" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API ключ не настроен" }, { status: 500 });
    }

    // Формируем диалог для AI
    const dialogText = messages
      .map((m: { text: string; isFromAdmin: boolean }) =>
        `${m.isFromAdmin ? "ОПЕРАТОР" : "КЛИЕНТ"}: ${m.text}`
      )
      .join("\n\n");

    const systemPrompt = `Ты - ассистент для водоканала "Крымская Водная Компания".
Твоя задача - проанализировать диалог между оператором и клиентом и создать:
1. Статью для базы знаний (вопрос-ответ)
2. Шаблон быстрого ответа для оператора

ПРАВИЛА:
- Статья должна содержать обобщенный вопрос и полезный ответ
- Шаблон должен быть универсальным, без конкретных имен и адресов
- Текст должен быть грамотным и профессиональным
- Не используй Markdown форматирование
- Пиши простым текстом

Верни ответ СТРОГО в формате JSON:
{
  "article": {
    "title": "Короткий заголовок вопроса (до 100 символов)",
    "content": "Полный ответ на вопрос"
  },
  "template": {
    "title": "Название шаблона (до 50 символов)",
    "content": "Текст шаблона ответа"
  }
}

Если диалог не подходит для базы знаний (слишком специфичный, неинформативный), верни:
{
  "article": null,
  "template": null,
  "reason": "Причина отказа"
}`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Проанализируй этот диалог и создай статью для базы знаний и шаблон ответа:\n\n${dialogText}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("DeepSeek API error:", error);
      return NextResponse.json({ error: "Ошибка AI сервиса" }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json({ error: "Пустой ответ от AI" }, { status: 500 });
    }

    // Парсим JSON из ответа
    let parsed;
    try {
      // Пробуем извлечь JSON из ответа
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON not found");
      }
    } catch (e) {
      console.error("Error parsing AI response:", aiResponse);
      return NextResponse.json({ error: "Ошибка обработки ответа AI" }, { status: 500 });
    }

    // Проверяем, есть ли отказ
    if (parsed.reason && !parsed.article && !parsed.template) {
      return NextResponse.json({ error: parsed.reason }, { status: 400 });
    }

    let createdArticle = null;
    let createdTemplate = null;

    // Создаем статью в базе знаний
    if (parsed.article?.title && parsed.article?.content) {
      createdArticle = await withRetry(() =>
        prisma.knowledgeBaseArticle.create({
          data: {
            title: parsed.article.title.substring(0, 255),
            content: parsed.article.content,
            isActive: true,
          },
        })
      );
    }

    // Создаем шаблон ответа
    if (parsed.template?.title && parsed.template?.content) {
      createdTemplate = await withRetry(() =>
        prisma.answerTemplate.create({
          data: {
            title: parsed.template.title.substring(0, 255),
            content: parsed.template.content,
            isActive: true,
          },
        })
      );
    }

    if (!createdArticle && !createdTemplate) {
      return NextResponse.json({ error: "AI не смог создать записи" }, { status: 400 });
    }

    return NextResponse.json({
      article: createdArticle
        ? { id: createdArticle.id, title: createdArticle.title, content: createdArticle.content }
        : null,
      template: createdTemplate
        ? { id: createdTemplate.id, title: createdTemplate.title, content: createdTemplate.content }
        : null,
    });
  } catch (error) {
    console.error("Error adding to knowledge base:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
