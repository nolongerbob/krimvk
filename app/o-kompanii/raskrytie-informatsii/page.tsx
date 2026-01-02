import { prisma } from "@/lib/prisma";
import { DisclosureClient } from "./DisclosureClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDisclosureDocuments() {
  try {
    const documents = await prisma.disclosureDocument.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

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

export default async function DisclosurePage() {
  const documents = await getDisclosureDocuments();

  return <DisclosureClient initialDocuments={documents} />;
}

