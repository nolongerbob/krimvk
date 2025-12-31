import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

// Увеличиваем лимит времени выполнения для больших файлов
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Файл должен быть изображением" },
        { status: 400 }
      );
    }

    // Проверяем размер файла (макс 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 20MB" },
        { status: 400 }
      );
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      console.error("BLOB_READ_WRITE_TOKEN is not set in environment variables");
      return NextResponse.json(
        { error: "Ошибка конфигурации сервера: токен хранилища не найден" },
        { status: 500 }
      );
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${originalName}`;
    const blobPath = `news/${fileName}`;

    // Загружаем файл в Vercel Blob Storage
    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type || 'image/jpeg',
      token: blobToken,
    });

    // Возвращаем URL изображения из Blob Storage
    return NextResponse.json({ success: true, imageUrl: blob.url });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error uploading image:", error);
    }
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    return NextResponse.json(
      { 
        error: "Ошибка при загрузке изображения",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

