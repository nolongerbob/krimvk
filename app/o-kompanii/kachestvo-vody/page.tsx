import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, FileText, Calendar, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";

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
      orderBy: { order: "asc" },
    });

    return regions;
  } catch (error) {
    console.error("Error fetching water quality data:", error);
    return [];
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

export default async function KachestvoVodyPage() {
  const regions = await getWaterQualityData();

  return (
    <div className="container py-12 px-4 max-w-6xl">
      {/* Заголовок */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Droplet className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Качество питьевой воды
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Информация о качестве питьевой воды по городам и годам
        </p>
      </div>

      {regions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 text-lg">
              Информация о качестве воды пока не добавлена
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {regions.map((region) => (
            <Card key={region.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-2xl">{region.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {region.years.length === 0 ? (
                  <p className="text-gray-500">Документы для этого региона пока не добавлены</p>
                ) : (
                  <div className="space-y-6">
                    {region.years.map((year) => (
                      <div key={year.id} className="border-l-4 border-l-blue-500 pl-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <h3 className="text-xl font-semibold">{year.year} год</h3>
                        </div>
                        {year.documents.length === 0 ? (
                          <p className="text-gray-500 text-sm">Документы для этого года пока не добавлены</p>
                        ) : (
                          <div className="grid gap-2 mt-3">
                            {year.documents.map((doc) => (
                              <a
                                key={doc.id}
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                              >
                                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
                                    {doc.fileName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatFileSize(doc.fileSize)}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  Скачать
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

