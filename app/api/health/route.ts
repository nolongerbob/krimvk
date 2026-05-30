import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function checkDatabase(): Promise<boolean> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 3000)),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const checkDb = process.env.HEALTHCHECK_DB === "1";
  const dbOk = checkDb ? await checkDatabase() : true;

  return NextResponse.json(
    {
      ok: dbOk,
      service: "krimvk",
      timestamp: new Date().toISOString(),
      checks: {
        db: dbOk,
      },
    },
    { status: dbOk ? 200 : 503 }
  );
}
