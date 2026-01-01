import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export const maxDuration = 60; // Увеличиваем время для больших файлов

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
    const yearId = formData.get("yearId") as string;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
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

    // НЕТ ОГРАНИЧЕНИЯ ПО ВЕСУ - убираем проверку размера файла

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!blobToken) {
      console.error("BLOB_READ_WRITE_TOKEN is not set in environment variables");
      return NextResponse.json(
        { error: "Ошибка сервера: токен для загрузки файлов не настроен." },
        { status: 500 }
      );
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${yearId}_${timestamp}_${originalName}`;
    const blobPath = `water-quality/${fileName}`;

    // Загружаем файл в Vercel Blob Storage
    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type || 'application/octet-stream',
      token: blobToken,
    });

    // Сохраняем информацию о файле в базу данных
    const document = await prisma.waterQualityDocument.create({
      data: {
        yearId,
        fileName: file.name,
        fileUrl: blob.url,
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
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке файла" },
      { status: 500 }
    );
  }
}

