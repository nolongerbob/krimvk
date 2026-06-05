import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { adminContainerClass, adminPrimaryBtnClass } from "@/components/admin/admin-styles";
import { ContractsClient } from "./ContractsClient";

export default async function AdminContractsPage() {
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

  // Загружаем все договоры
  // Явно указываем тип, чтобы избежать implicit any[]
  let contracts: any[] = [];
  try {
    const rawContracts = await withRetry(() =>
      prisma.contract.findMany({
        orderBy: { createdAt: "desc" },
      })
    );

    contracts = rawContracts.map((contract) => ({
      ...contract,
      createdAt: contract.createdAt instanceof Date ? contract.createdAt.toISOString() : String(contract.createdAt),
      updatedAt: contract.updatedAt instanceof Date ? contract.updatedAt.toISOString() : String(contract.updatedAt),
    }));
  } catch (error) {
    console.error("Failed to fetch contracts:", error);
    contracts = [];
  }

  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Договоры"
        description="Управление договорами на технологическое присоединение"
        actions={
          <Button asChild className={adminPrimaryBtnClass}>
            <Link href="/admin/contracts/create">Создать договор</Link>
          </Button>
        }
      />
      <ContractsClient contracts={contracts} />
    </div>
  );
}
