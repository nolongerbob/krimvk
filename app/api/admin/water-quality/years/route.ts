import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// POST - создать год
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

    const body = await request.json();
    const { regionId, year, order } = body;

    if (!regionId || !year) {
      return NextResponse.json(
        { error: "ID региона и год обязательны" },
        { status: 400 }
      );
    }

    const yearRecord = await prisma.waterQualityYear.create({
      data: {
        regionId,
        year: parseInt(year),
        order: order || 0,
      },
      include: {
        documents: true,
      },
    });

    return NextResponse.json(yearRecord);
  } catch (error: any) {
    console.error("Error creating year:", error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Год для этого региона уже существует" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Ошибка при создании года" },
      { status: 500 }
    );
  }
}

