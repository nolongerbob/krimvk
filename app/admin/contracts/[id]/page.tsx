import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit } from "lucide-react";
import { ContractDetails } from "./ContractDetails";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { adminContainerClass, adminOutlineBtnClass } from "@/components/admin/admin-styles";

export const dynamic = "force-dynamic";

export default async function ContractViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        where: { id },
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
    <div className={adminContainerClass}>
      <AdminPageHeader
        title={`Договор № ${contract.contractNumber}`}
        description="Просмотр договора на технологическое присоединение"
        backHref="/admin/contracts"
        backLabel="Назад к списку"
        actions={
          <Button asChild variant="outline" className={adminOutlineBtnClass}>
            <Link href={`/admin/contracts/${contract.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </Link>
          </Button>
        }
      />

      <ContractDetails contract={contract} />
    </div>
  );
}
