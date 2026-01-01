import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { put } from "@vercel/blob";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // Проверяем размер файла (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 10MB" },
        { status: 400 }
      );
    }

    // Проверяем тип файла
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Недопустимый тип файла. Разрешены: PDF, DOC, DOCX, JPG, PNG" },
        { status: 400 }
      );
    }

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
    const fileName = `user_${session.user.id}_${timestamp}_${originalName}`;
    const blobPath = `applications/user/${fileName}`;

    // Загружаем файл в Vercel Blob Storage
    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type || 'application/octet-stream',
      token: blobToken,
    });

    return NextResponse.json({
      success: true,
      url: blob.url, // Возвращаем URL из Blob Storage
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
      console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке файла" },
      { status: 500 }
    );
  }
}


