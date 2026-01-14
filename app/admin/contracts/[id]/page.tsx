import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Copy } from "lucide-react";
import { ContractDetails } from "./ContractDetails";

export const dynamic = 'force-dynamic';

export default async function ContractViewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/admin/contracts");
  }

  let user;
  try {
    user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    );
  } catch (error) {
    console.error("Failed to fetch user:", error);
    redirect("/dashboard");
  }

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let contract: any = null;
  try {
    const rawContract = await withRetry(() =>
      prisma.contract.findUnique({
        where: { id: params.id },
        include: {
          documents: {
            orderBy: { uploadedAt: "desc" },
          },
        },
      })
    );

    if (!rawContract) {
      redirect("/admin/contracts");
    }

    contract = {
      ...rawContract,
      createdAt: rawContract.createdAt.toISOString(),
      updatedAt: rawContract.updatedAt.toISOString(),
      documents: rawContract.documents.map((doc) => ({
        ...doc,
        uploadedAt: doc.uploadedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch contract:", error);
    redirect("/admin/contracts");
  }

  return (
    <div className="container py-6 px-4 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/contracts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-blue-300 hover:bg-blue-50">
            <Link href={`/admin/contracts/${contract.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Link>
          </Button>
        </div>
      </div>

      <ContractDetails contract={contract} />
    </div>
  );
}
