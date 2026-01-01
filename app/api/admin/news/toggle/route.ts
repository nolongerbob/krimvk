import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

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
    const id = formData.get("id") as string;
    const published = formData.get("published") === "true";

    if (!id) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    await prisma.news.update({
      where: { id },
      data: {
        published,
        publishedAt: published ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling news:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении новости" },
      { status: 500 }
    );
  }
}







