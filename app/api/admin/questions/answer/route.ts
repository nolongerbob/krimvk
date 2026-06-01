import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response

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

