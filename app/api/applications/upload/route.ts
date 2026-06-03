import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@/lib/get-app-session";
import { storage } from "@/lib/storage";
import { validateUserApplicationFile } from "@/lib/security/validate-upload";
import { validateImageUpload } from "@/lib/security/validate-image-upload";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getAppSession(request);

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

    const typeError = await validateUserApplicationFile(file);
    if (typeError) {
      return NextResponse.json({ error: typeError }, { status: 400 });
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `user_${session.user.id}_${timestamp}_${originalName}`;
    const filePath = `applications/user/${fileName}`;

    // Загружаем файл через абстракцию хранилища
    const result = await storage.upload(file, filePath, {
      contentType: file.type || 'application/octet-stream',
      access: 'private',
    });

    return NextResponse.json({
      success: true,
      url: result.url, // Возвращаем URL файла
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


