import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - получить все регионы
export async function GET() {
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

    const regions = await prisma.waterQualityRegion.findMany({
      include: {
        years: {
          include: {
            documents: true,
          },
          orderBy: { year: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке регионов" },
      { status: 500 }
    );
  }
}

// POST - создать регион
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
    const { name, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Название региона обязательно" },
        { status: 400 }
      );
    }

    const region = await prisma.waterQualityRegion.create({
      data: {
        name,
        order: order || 0,
      },
    });

    return NextResponse.json(region);
  } catch (error) {
    console.error("Error creating region:", error);
    return NextResponse.json(
      { error: "Ошибка при создании региона" },
      { status: 500 }
    );
  }
}

