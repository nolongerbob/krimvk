import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const id = formData.get("id") as string;

    if (!id) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    await prisma.news.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting news:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении новости" },
      { status: 500 }
    );
  }
}







