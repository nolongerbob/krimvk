import { prisma } from "@/lib/prisma";
import { KachestvoVodyClient } from "./KachestvoVodyClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface WaterQualityDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface WaterQualityYear {
  id: string;
  year: number;
  documents: WaterQualityDocument[];
}

interface WaterQualityRegion {
  id: string;
  name: string;
  years: WaterQualityYear[];
}

async function getWaterQualityData() {
  try {
    const regions = await prisma.waterQualityRegion.findMany({
      where: {
        isActive: true,
      },
      include: {
        years: {
          where: {
            isActive: true,
          },
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

    // Сериализуем данные для передачи в клиентский компонент
    return regions.map((region) => ({
      id: region.id,
      name: region.name,
      years: region.years.map((year) => ({
        id: year.id,
        year: year.year,
        documents: year.documents.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          uploadedAt: doc.uploadedAt.toISOString(),
        })),
      })),
    }));
  } catch (error) {
    console.error("Error fetching water quality data:", error);
    return [];
  }
}

export default async function KachestvoVodyPage() {
  const regions = await getWaterQualityData();

  return <KachestvoVodyClient regions={regions} />;
}

