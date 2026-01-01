import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WaterQualityClient } from "./WaterQualityClient";

export const dynamic = 'force-dynamic';

export default async function AdminWaterQualityPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/water-quality");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем все регионы с годами и документами
  const regions = await prisma.waterQualityRegion.findMany({
    include: {
      years: {
        include: {
          documents: {
            orderBy: { uploadedAt: "desc" },
          },
        },
        orderBy: { year: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container py-8 px-4">
      <WaterQualityClient initialRegions={JSON.parse(JSON.stringify(regions))} />
    </div>
  );
}

