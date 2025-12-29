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

    // Проверяем, что пользователь - администратор
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { questionId, text, imageUrl } = await request.json();

    // Проверяем, что есть либо текст, либо изображение
    const hasText = typeof text === "string" && text.trim().length > 0;
    const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;
    
    if (!hasText && !hasImage) {
      return NextResponse.json({ error: "Сообщение не может быть пустым" }, { status: 400 });
    }

    // Создаем сообщение от админа
    const message = await prisma.message.create({
      data: {
        questionId,
        text: hasText ? (text as string).trim() : "",
        imageUrl: hasImage ? (imageUrl as string) : null,
        isFromAdmin: true,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ 
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
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

