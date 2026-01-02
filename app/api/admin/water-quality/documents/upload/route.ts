import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export const maxDuration = 300; // Увеличиваем время для очень больших файлов (5 минут)

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

    // Используем streaming для больших файлов
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

    // НЕТ ОГРАНИЧЕНИЯ ПО ВЕСУ - убираем проверку размера файла

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

