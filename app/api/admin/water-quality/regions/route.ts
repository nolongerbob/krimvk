import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - получить все города
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

    const cities = await prisma.waterQualityCity.findMany({
      include: {
        district: { select: { id: true, name: true } },
        years: {
          include: {
            documents: true,
          },
          orderBy: { year: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке городов" },
      { status: 500 }
    );
  }
}

// POST - создать город
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
    const { name, districtId, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Название города обязательно" },
        { status: 400 }
      );
    }

    if (!districtId) {
      return NextResponse.json(
        { error: "ID района обязателен" },
        { status: 400 }
      );
    }

    const city = await prisma.waterQualityCity.create({
      data: {
        name,
        districtId,
        order: order || 0,
      },
      include: {
        district: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(city);
  } catch (error) {
    console.error("Error creating city:", error);
    return NextResponse.json(
      { error: "Ошибка при создании города" },
      { status: 500 }
    );
  }
}

