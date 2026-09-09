import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { prisma, withRetry } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { validateUserApplicationFile } from "@/lib/security/validate-upload";

export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;
    const { id } = await params;

    const application = await withRetry(() =>
      prisma.application.findUnique({
        where: { id },
      })
    );

    if (!application) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // Проверяем размер файла (макс 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Размер файла не должен превышать 50MB" },
        { status: 400 }
      );
    }

    const typeError = await validateUserApplicationFile(file);
    if (typeError) {
      return NextResponse.json({ error: typeError }, { status: 400 });
    }

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${id}_${timestamp}_${originalName}`;
    const filePath = `applications/${fileName}`;

    // Загружаем файл через абстракцию хранилища
    const result = await storage.upload(file, filePath, {
      contentType: file.type || 'application/octet-stream',
      access: 'private',
    });

    const applicationFile = await withRetry(() =>
      prisma.applicationFile.create({
        data: {
          applicationId: id,
          fileName: file.name,
          filePath: result.url, // Сохраняем URL файла
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          uploadedBy: auth.admin.userId,
        },
      })
    );

    return NextResponse.json({
      success: true,
      file: {
        id: applicationFile.id,
        fileName: applicationFile.fileName,
        filePath: applicationFile.filePath,
        fileSize: applicationFile.fileSize,
        mimeType: applicationFile.mimeType,
        uploadedAt: applicationFile.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке файла" },
      { status: 500 }
    );
  }
}
