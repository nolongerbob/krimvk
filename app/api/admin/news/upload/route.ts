import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

// Увеличиваем лимит времени выполнения для больших файлов
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

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

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${originalName}`;
    const filePath = `news/${fileName}`;

    // Загружаем файл через абстракцию хранилища
    const result = await storage.upload(file, filePath, {
      contentType: file.type || 'image/jpeg',
      access: 'public',
    });

    // Возвращаем URL изображения
    return NextResponse.json({ success: true, imageUrl: result.url });
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

