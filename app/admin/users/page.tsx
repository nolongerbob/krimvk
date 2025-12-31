import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UsersClient } from "./UsersClient";
import { get1CUserData } from "@/lib/1c-api";

export const dynamic = 'force-dynamic';

// Функция для парсинга суммы
const parseAmount = (value: string | number): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, ".").replace(/\s/g, "");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Функция для расчета задолженности пользователя
async function calculateUserDebt(userId: string): Promise<{ totalDebt: number; unpaidBillsCount: number }> {
  try {
    // Получаем лицевые счета пользователя
    const userAccounts = await withRetry(() =>
      prisma.userAccount.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
      })
    );

    let totalDebt = 0;
    let unpaidBillsCount = 0;

    // Для каждого лицевого счета получаем данные из 1С
    for (const account of userAccounts) {
      try {
        const responseData = await get1CUserData(
          account.accountNumber,
          account.password1c || "",
          account.region || "prog"
        );

        if (responseData) {
          // Получаем задолженность из CommonDuty
          const commonDutyAmount = parseAmount(responseData.CommonDuty || responseData.commonDuty || "0");
          const debtAmount = Math.abs(commonDutyAmount);

          if (debtAmount > 0.01) {
            totalDebt += debtAmount;
            unpaidBillsCount += 1; // Учитываем как минимум один неоплаченный счет
          }
        }
      } catch (error) {
        console.error(`Error fetching 1C data for account ${account.accountNumber}:`, error);
        // Продолжаем обработку других счетов
      }
    }

    // Также считаем неоплаченные счета из локальной БД
    const localBills = await withRetry(() =>
      prisma.bill.findMany({
        where: {
          userId: userId,
          status: {
            in: ["UNPAID", "OVERDUE"],
          },
        },
      })
    );

    const localDebt = localBills.reduce((sum, bill) => sum + bill.amount, 0);
    if (localDebt > totalDebt) {
      totalDebt = localDebt;
    }
    unpaidBillsCount = Math.max(unpaidBillsCount, localBills.length);

    return { totalDebt, unpaidBillsCount };
  } catch (error) {
    console.error("Error calculating user debt:", error);
    return { totalDebt: 0, unpaidBillsCount: 0 };
  }
}

export default async function AdminUsersPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/users");
  }

  const user = await withRetry(() =>
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
  );

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем всех пользователей с полными данными
  const rawUsers = await withRetry(() =>
    prisma.user.findMany({
      include: {
        userAccounts: {
          include: {
            meters: {
              select: {
                id: true,
                serialNumber: true,
                type: true,
                lastReading: true,
                address: true,
              },
            },
          },
        },
        applications: {
          include: {
            service: {
              select: {
                title: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        bills: {
          orderBy: { createdAt: "desc" },
          take: 50, // Ограничиваем количество для производительности
        },
      },
      orderBy: { createdAt: "desc" },
    })
  );

  // Рассчитываем задолженность для каждого пользователя
  const usersWithDebt = await Promise.all(
    rawUsers.map(async (user) => {
      const { totalDebt, unpaidBillsCount } = await calculateUserDebt(user.id);
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        userAccounts: user.userAccounts.map((acc) => ({
          id: acc.id,
          accountNumber: acc.accountNumber,
          address: acc.address,
          name: acc.name,
          phone: acc.phone,
          isActive: acc.isActive,
          region: acc.region,
          createdAt: acc.createdAt.toISOString(),
          meters: acc.meters.map((meter) => ({
            id: meter.id,
            serialNumber: meter.serialNumber,
            type: meter.type,
            lastReading: meter.lastReading,
            address: meter.address,
          })),
        })),
        applications: user.applications.map((app) => ({
          id: app.id,
          status: app.status,
          service: app.service,
          createdAt: app.createdAt.toISOString(),
          address: app.address,
        })),
        bills: user.bills.map((bill) => ({
          id: bill.id,
          amount: bill.amount,
          period: bill.period,
          status: bill.status,
          dueDate: bill.dueDate.toISOString(),
          paidAt: bill.paidAt?.toISOString() || null,
        })),
        totalDebt,
        unpaidBillsCount,
      };
    })
  );

  return (
    <div className="container py-8 px-4 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление пользователями</h1>
          <p className="text-gray-600">База пользователей со всеми данными, лицевыми счетами и задолженностью</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Назад</Link>
        </Button>
      </div>

      <UsersClient users={usersWithDebt} />
    </div>
  );
}






