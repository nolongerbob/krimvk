import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DisclosureClient } from "./DisclosureClient";

export const dynamic = 'force-dynamic';

export default async function AdminDisclosurePage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/disclosure");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем все документы
  const documents = await prisma.disclosureDocument.findMany({
    orderBy: [
      { order: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="container py-8 px-4">
      <DisclosureClient initialDocuments={JSON.parse(JSON.stringify(documents))} />
    </div>
  );
}

