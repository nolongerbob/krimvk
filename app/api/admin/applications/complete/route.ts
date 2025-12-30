import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Увеличиваем время выполнения до 60 секунд для больших файлов

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Проверяем, что пользователь - администратор
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const formData = await request.formData();
    const applicationId = formData.get("applicationId") as string;
    const comment = formData.get("comment") as string | null;
    const files = formData.getAll("files") as File[];

    if (!applicationId) {
      return NextResponse.json({ error: "Не указан ID заявки" }, { status: 400 });
    }

    // Проверяем, что заявка существует
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    // Создаем директорию для файлов, если её нет
    const uploadsDir = join(process.cwd(), "public", "uploads", "applications", applicationId);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Проверяем общий размер всех файлов (макс. 50 МБ)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 50 * 1024 * 1024; // 50 МБ
    if (totalSize > maxTotalSize) {
      return NextResponse.json(
        { error: `Общий размер всех файлов (${(totalSize / 1024 / 1024).toFixed(2)} МБ) превышает максимальный лимит 50 МБ` },
        { status: 400 }
      );
    }

    // Сохраняем файлы
    const savedFiles = [];
    try {
      for (const file of files) {
        if (file.size === 0) continue;

        // Проверяем размер файла (макс. 10 МБ)
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: `Файл ${file.name} слишком большой (${(file.size / 1024 / 1024).toFixed(2)} МБ, макс. 10 МБ)` },
            { status: 400 }
          );
        }

        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const timestamp = Date.now();
          const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = join(uploadsDir, fileName);
          const publicPath = `/uploads/applications/${applicationId}/${fileName}`;

          // Сохраняем файл на диск
          await writeFile(filePath, buffer);

          // Сохраняем информацию о файле в базу данных
          const applicationFile = await prisma.applicationFile.create({
            data: {
              applicationId: applicationId,
              fileName: file.name,
              filePath: publicPath,
              fileSize: file.size,
              mimeType: file.type || "application/octet-stream",
              uploadedBy: session.user.id,
            },
          });

          savedFiles.push(applicationFile);
        } catch (fileError: any) {
          console.error(`Error processing file ${file.name}:`, fileError);
          // Если ошибка при сохранении одного файла, продолжаем с остальными
          // но возвращаем ошибку, если это критично
          throw new Error(`Ошибка при сохранении файла ${file.name}: ${fileError.message || fileError}`);
        }
      }
    } catch (fileError: any) {
      console.error("Error saving files:", fileError);
      return NextResponse.json(
        { error: fileError.message || "Ошибка при сохранении файлов" },
        { status: 500 }
      );
    }

    // Обновляем статус заявки
    let updatedApplication;
    try {
      updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: { 
          status: "COMPLETED",
          // Если есть комментарий, можно сохранить его в description или создать отдельное поле
          // Пока сохраняем в description, добавив к существующим данным
          description: comment 
            ? (application.description 
                ? `${application.description}\n\nКомментарий при завершении: ${comment}`
                : `Комментарий при завершении: ${comment}`)
            : application.description,
        },
      });
    } catch (updateError: any) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: `Ошибка при обновлении заявки: ${updateError.message || updateError}` },
        { status: 500 }
      );
    }

    // Возвращаем только сериализуемые данные
    return NextResponse.json({ 
      success: true, 
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        description: updatedApplication.description,
      },
      files: savedFiles.map(f => ({
        id: f.id,
        fileName: f.fileName,
        filePath: f.filePath,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
      })),
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("Error completing application:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error details:", {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    return NextResponse.json(
      { error: error?.message || "Ошибка при завершении заявки" },
      { status: 500 }
    );
  }
}

