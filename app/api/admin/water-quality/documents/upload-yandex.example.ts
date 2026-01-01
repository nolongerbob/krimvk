/**
 * ПРИМЕР: Миграция с Vercel Blob на Yandex Object Storage
 * 
 * Замените содержимое app/api/admin/water-quality/documents/upload/route.ts
 * на этот код после настройки Yandex Cloud
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { uploadFile, isStorageConfigured } from "@/lib/storage";

export const maxDuration = 300;

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

    // Проверяем, настроено ли хранилище
    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: "Хранилище файлов не настроено. Проверьте переменные окружения YANDEX_STORAGE_*" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const yearId = formData.get("yearId") as string;
    
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Файл не найден или пуст" }, { status: 400 });
    }

    if (!yearId) {
      return NextResponse.json(
        { error: "ID года обязателен" },
        { status: 400 }
      );
    }

    // Проверяем, что год существует
    const year = await prisma.waterQualityYear.findUnique({
      where: { id: yearId },
    });

    if (!year) {
      return NextResponse.json(
        { error: "Год не найден" },
        { status: 404 }
      );
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${yearId}_${timestamp}_${originalName}`;
    const storagePath = `water-quality/${fileName}`;

    // Загружаем файл в Yandex Object Storage
    const { url } = await uploadFile(file, storagePath, file.type || 'application/octet-stream');

    // Сохраняем информацию о файле в базу данных
    const document = await prisma.waterQualityDocument.create({
      data: {
        yearId,
        fileName: file.name,
        fileUrl: url, // URL из Yandex Object Storage
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при загрузке файла" },
      { status: 500 }
    );
  }
}

