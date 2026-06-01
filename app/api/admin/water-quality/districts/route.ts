import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { requireAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - получить все районы
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const districts = await prisma.waterQualityDistrict.findMany({
      include: {
        cities: {
          include: {
            years: {
              include: {
                documents: true,
              },
              orderBy: { year: "desc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(districts);
  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке районов" },
      { status: 500 }
    );
  }
}

// POST - создать район
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { name, order } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Название района обязательно" },
        { status: 400 }
      );
    }

    const district = await prisma.waterQualityDistrict.create({
      data: {
        name,
        order: order || 0,
      },
    });

    return NextResponse.json(district);
  } catch (error) {
    console.error("Error creating district:", error);
    return NextResponse.json(
      { error: "Ошибка при создании района" },
      { status: 500 }
    );
  }
}

