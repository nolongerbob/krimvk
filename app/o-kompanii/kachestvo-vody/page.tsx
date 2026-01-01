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
    const districts = await prisma.waterQualityDistrict.findMany({
      where: {
        isActive: true,
      },
      include: {
        cities: {
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
        },
      },
      orderBy: { name: "asc" },
    });

    // Сериализуем данные для передачи в клиентский компонент
    return districts.map((district) => ({
      id: district.id,
      name: district.name,
      cities: district.cities.map((city) => ({
        id: city.id,
        name: city.name,
        years: city.years.map((year) => ({
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
      })),
    }));
  } catch (error) {
    console.error("Error fetching water quality data:", error);
    return [];
  }
}

export default async function KachestvoVodyPage() {
  const districts = await getWaterQualityData();

  return <KachestvoVodyClient districts={districts} />;
}

