import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma, withRetry } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    );

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const application = await withRetry(() =>
      prisma.application.findUnique({
        where: { id: params.id },
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${params.id}_${timestamp}_${originalName}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "applications");

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const applicationFile = await withRetry(() =>
      prisma.applicationFile.create({
        data: {
          applicationId: params.id,
          fileName: file.name,
          filePath: `/uploads/applications/${fileName}`,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          uploadedBy: session.user.id,
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

