import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { text, imageUrl } = await request.json();

    // Проверяем, что есть либо текст, либо изображение
    const hasText = typeof text === "string" && text.trim().length > 0;
    const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;
    
    if (!hasText && !hasImage) {
      return NextResponse.json({ error: "Сообщение не может быть пустым" }, { status: 400 });
    }

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Находим или создаем диалог для пользователя
    let question = await prisma.question.findFirst({
      where: { userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!question) {
      question = await prisma.question.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    // Проверяем, это первое сообщение или диалог был завершен
    const isFirstMessage = question.messages.length === 0;
    const wasCompleted = question.status === "COMPLETED";

    // Если диалог был завершен, меняем статус на "ожидает ответа" перед созданием сообщения
    if (wasCompleted) {
      await prisma.question.update({
        where: { id: question.id },
        data: { status: "PENDING" },
      });
      // Обновляем локальную переменную, сохраняя messages
      question = { 
        ...question, 
        status: "PENDING" as const,
        messages: question.messages // Сохраняем существующие сообщения
      };
    }

    // Создаем сообщение пользователя
    const message = await prisma.message.create({
      data: {
        questionId: question.id,
        text: hasText ? (text as string).trim() : "",
        imageUrl: hasImage ? (imageUrl as string) : null,
        isFromAdmin: false,
      },
    });

    // Если это первое сообщение или диалог был завершен, отправляем автоматическое сообщение
    if (isFirstMessage || wasCompleted) {
      await prisma.message.create({
        data: {
          questionId: question.id,
          text: "Спасибо за обращение! Наш оператор скоро ответит на ваш вопрос. Пожалуйста, опишите проблему детально, чтобы мы могли помочь вам максимально эффективно.",
          isFromAdmin: true,
          authorId: null, // Системное сообщение
        },
      });
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json(
      { 
        error: "Ошибка при отправке сообщения",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

