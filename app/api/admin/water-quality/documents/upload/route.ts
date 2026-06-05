import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import {
  validateWaterQualityFile,
  WATER_QUALITY_MAX_BYTES,
} from "@/lib/security/validate-upload";

export const maxDuration = 300; // Увеличиваем время для очень больших файлов (5 минут)

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (e) {
      console.error("formData parse failed:", e);
      return NextResponse.json(
        {
          error:
            "Не удалось принять файл (слишком большой или обрезан сервером). Проверьте nginx client_max_body_size и пересоберите приложение после обновления next.config.js.",
        },
        { status: 413 }
      );
    }
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
      include: {
        city: {
          include: {
            district: true,
          },
        },
      },
    });

    if (!year) {
      return NextResponse.json(
        { error: "Год не найден" },
        { status: 404 }
      );
    }

    if (file.size > WATER_QUALITY_MAX_BYTES) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 200MB" },
        { status: 400 }
      );
    }

    const typeError = await validateWaterQualityFile(file);
    if (typeError) {
      return NextResponse.json({ error: typeError }, { status: 400 });
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${yearId}_${timestamp}_${originalName}`;
    const filePath = `water-quality/${fileName}`;

    // Загружаем файл через абстракцию хранилища
    const result = await storage.upload(file, filePath, {
      contentType: file.type || 'application/octet-stream',
      access: 'public',
    });

    // Сохраняем информацию о файле в базу данных
    const document = await prisma.waterQualityDocument.create({
      data: {
        yearId,
        fileName: file.name,
        fileUrl: result.url,
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
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { error: error?.message || "Ошибка при загрузке файла" },
      { status: 500 }
    );
  }
}

