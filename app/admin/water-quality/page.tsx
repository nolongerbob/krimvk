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

  // Загружаем все районы с городами, годами и документами
  const districts = await prisma.waterQualityDistrict.findMany({
    include: {
      cities: {
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
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container py-8 px-4">
      <WaterQualityClient initialDistricts={JSON.parse(JSON.stringify(districts))} />
    </div>
  );
}

