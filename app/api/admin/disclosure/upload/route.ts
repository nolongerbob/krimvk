import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export const maxDuration = 300; // 5 минут для больших файлов

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
    const title = formData.get("title") as string;
    
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Файл не найден или пуст" }, { status: 400 });
    }

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Название документа обязательно" },
        { status: 400 }
      );
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${originalName}`;
    const filePath = `disclosure/${fileName}`;

    // Загружаем файл через абстракцию хранилища
    const result = await storage.upload(file, filePath, {
      contentType: file.type || 'application/octet-stream',
      access: 'public',
    });

    // Сохраняем информацию о документе в базу данных
    const document = await prisma.disclosureDocument.create({
      data: {
        title: title.trim(),
        fileName: file.name,
        fileUrl: result.url,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        order: 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        order: document.order,
        isActive: document.isActive,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error uploading disclosure document:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при загрузке файла" },
      { status: 500 }
    );
  }
}

