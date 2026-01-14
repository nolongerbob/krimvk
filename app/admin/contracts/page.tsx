import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
  let contracts = [];
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
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Договоры</h1>
          <p className="text-gray-600">Управление договорами на технологическое присоединение</p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/admin/contracts/create">Создать договор</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Назад</Link>
          </Button>
        </div>
      </div>

      <ContractsClient contracts={contracts} />
    </div>
  );
}
