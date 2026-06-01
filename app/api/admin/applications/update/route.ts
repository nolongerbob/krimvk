import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response

    const formData = await request.formData();
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;

    if (!id || !status) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    // Обновляем статус заявки
    const application = await prisma.application.update({
      where: { id },
      data: { status: status as any },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении заявки" },
      { status: 500 }
    );
  }
}







