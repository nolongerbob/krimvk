import { prisma, withRetry } from "@/lib/prisma";
import { DisclosureCategoryClient } from "./DisclosureCategoryClient";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const categoryNames: Record<string, { title: string; description: string }> = {
  "uchreditelnye-dokumenty": {
    title: "Учредительные документы",
    description: "Учредительные документы и устав организации"
  },
  "normativnye-dokumenty": {
    title: "Нормативные документы",
    description: "Нормативные документы и регламенты"
  },
  "informaciya-raskrytie": {
    title: "Информация, подлежащая раскрытию",
    description: "Информация, подлежащая обязательному раскрытию в соответствии с законодательством"
  },
  "zashchita-personalnyh-dannyh": {
    title: "Защита персональных данных",
    description: "Политика обработки и защиты персональных данных"
  },
  "antikorrupciya": {
    title: "Антикоррупционная политика",
    description: "Документы по противодействию коррупции"
  },
  "investicionnaya-programma": {
    title: "Инвестиционная программа",
    description: "Инвестиционные программы и планы развития"
  },
};

async function getDisclosureDocuments(category: string) {
  try {
    const documents = await withRetry(() => prisma.disclosureDocument.findMany({
      where: {
        category: category,
        isActive: true,
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    }));

    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching disclosure documents:", error);
    return [];
  }
}

export default async function DisclosureCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = params.category;
  
  if (!categoryNames[category]) {
    notFound();
  }

  const documents = await getDisclosureDocuments(category);
  const categoryInfo = categoryNames[category];

  return (
    <DisclosureCategoryClient
      category={category}
      categoryInfo={categoryInfo}
      initialDocuments={documents}
    />
  );
}


