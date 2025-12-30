import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { get1CUserData } from "@/lib/1c-api";

export const dynamic = 'force-dynamic';

/**
 * GET - получить статистику для дашборда
 * Получает данные из 1С API и локальной БД
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Получаем все лицевые счета пользователя
    const userAccounts = await prisma.userAccount.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    let totalUnpaidBills = 0;
    let totalAmount = 0;
    let totalMetersCount = 0;

    // Функция для парсинга суммы
    const parseAmount = (value: string | number): number => {
      if (typeof value === "number") return value;
      if (!value) return 0;
      const normalized = String(value).replace(/,/g, ".").replace(/\s/g, "");
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Для каждого лицевого счета получаем данные из 1С
    for (const account of userAccounts) {
      if (!account.password1c || !account.region) {
        if (process.env.NODE_ENV === "development") {
          console.log(`Skipping account ${account.accountNumber}: missing password or region`);
        }
        continue; // Пропускаем счета без пароля или региона
      }

      try {
        if (process.env.NODE_ENV === "development") {
          console.log(`Fetching 1C data for account ${account.accountNumber}, region: ${account.region}`);
        }
        
        // Получаем данные из 1С с таймаутом
        const data = await Promise.race([
          get1CUserData(
            account.accountNumber,
            account.password1c,
            account.region
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("1C request timeout")), 10000)
          )
        ]) as any;

        if (process.env.NODE_ENV === "development") {
          console.log(`1C data received for account ${account.accountNumber}:`, {
            hasCommonDuty: !!data?.CommonDuty,
            CommonDuty: data?.CommonDuty,
            hasMeteringDevices: !!data?.MeteringDevices,
            MeteringDevicesCount: data?.MeteringDevices?.length || 0,
            dataKeys: data ? Object.keys(data) : [],
          });
        }

        // Проверяем, что данные получены
        if (!data) {
          if (process.env.NODE_ENV === "development") {
            console.log(`Account ${account.accountNumber}: No data received from 1C`);
          }
          continue;
        }

        // Обрабатываем CommonDuty (долг) - формируем список счетов как на странице счетов
        const commonDuty = parseAmount(data.CommonDuty || data.commonDuty || "0");
        const commonPayment = parseAmount(data.CommonPayment || data.commonPayment || "0");
        const startCommonDuty = parseAmount(data.StartCommonDuty || data.startCommonDuty || "0");
        
        // В 1С отрицательное значение CommonDuty означает долг (к оплате)
        const debtAmount = Math.abs(commonDuty);
        const hasDebt = debtAmount > 0.01; // Есть долг если больше 1 копейки
        
        if (process.env.NODE_ENV === "development") {
          console.log(`Account ${account.accountNumber}: CommonDuty=${commonDuty}, debtAmount=${debtAmount}, hasDebt=${hasDebt}`);
        }

        // Если есть долг, формируем список счетов как на странице счетов
        if (hasDebt) {
          const billsList: any[] = [];
          
          // 1. Долги за предыдущие периоды (StartDutys)
          if (data.StartDutys && Array.isArray(data.StartDutys)) {
            data.StartDutys.forEach((duty: any) => {
              const amount = parseAmount(duty.Duty || duty.duty || "0");
              if (amount > 0) {
                billsList.push({
                  period: duty.Service || "Долг за предыдущий период",
                  amount: amount,
                  status: "OVERDUE",
                });
              }
            });
          }
          
          // 2. Если есть общий долг на начало периода, но нет разбивки по StartDutys
          if (Math.abs(startCommonDuty) > 0.01 && (!data.StartDutys || data.StartDutys.length === 0)) {
            billsList.push({
              period: "Долг на начало периода",
              amount: startCommonDuty,
              status: "OVERDUE",
            });
          }
          
          // 3. Начисления за текущий период (ChargesAndPayments)
          if (data.ChargesAndPayments && Array.isArray(data.ChargesAndPayments)) {
            data.ChargesAndPayments.forEach((charge: any) => {
              const amount = parseAmount(charge.Charge || charge.ChargeFull || charge.charge || "0");
              if (amount > 0) {
                billsList.push({
                  period: "Текущий период",
                  amount: amount,
                  status: "UNPAID",
                });
              }
            });
          }
          
          // 4. Проверяем сумму всех неоплаченных счетов и сравниваем с суммой долга
          const totalUnpaidBillsAmount = billsList
            .filter(bill => bill.status === "UNPAID" || bill.status === "OVERDUE")
            .reduce((sum, bill) => sum + bill.amount, 0);
          
          // Если сумма неоплаченных счетов не совпадает с суммой долга, добавляем корректирующий счет
          const difference = debtAmount - totalUnpaidBillsAmount;
          
          if (difference > 0.01 && hasDebt) {
            billsList.push({
              period: "Прочая задолженность",
              amount: difference,
              status: "OVERDUE",
            });
          }
          
          // 5. Если нет разбивки вообще, но есть задолженность, показываем её
          if (billsList.length === 0 && hasDebt) {
            billsList.push({
              period: "Задолженность",
              amount: debtAmount,
              status: "UNPAID",
            });
          }
          
          // Считаем количество неоплаченных счетов (UNPAID и OVERDUE)
          const unpaidBillsCount = billsList.filter(
            bill => bill.status === "UNPAID" || bill.status === "OVERDUE"
          ).length;
          
          totalUnpaidBills += unpaidBillsCount;
          totalAmount += debtAmount;
          
          if (process.env.NODE_ENV === "development") {
            console.log(`Account ${account.accountNumber}: Found ${unpaidBillsCount} unpaid bills, totalUnpaidBills now=${totalUnpaidBills}, totalAmount now=${totalAmount}`);
          }
        }

        // Подсчитываем счетчики из 1С
        if (data.MeteringDevices && Array.isArray(data.MeteringDevices)) {
          // Фильтруем только счетчики холодной воды
          const coldWaterMeters = data.MeteringDevices.filter(
            (device: any) => {
              try {
                const service = (device.Service || device.ServiceName || device.service || "").toLowerCase();
                const type = (device.Type || device.type || "").toLowerCase();
                const isCold = service.includes("холод") || type.includes("холод");
                return isCold;
              } catch (e) {
                return false;
              }
            }
          );
          totalMetersCount += coldWaterMeters.length;
          if (process.env.NODE_ENV === "development") {
            console.log(`Account ${account.accountNumber}: Found ${coldWaterMeters.length} cold water meters, totalMetersCount now=${totalMetersCount}`);
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log(`Account ${account.accountNumber}: No MeteringDevices found or not an array`);
          }
        }
      } catch (error: any) {
        // Если не удалось получить данные из 1С, пропускаем этот счет
        // Не прерываем выполнение, продолжаем со следующим счетом
        if (process.env.NODE_ENV === "development") {
          console.error(`Error fetching 1C data for account ${account.accountNumber}:`, {
            error: error?.message,
            name: error?.name,
            accountNumber: account.accountNumber,
            region: account.region,
          });
        }
        continue;
      }
    }

    // Если нет счетов в 1С, используем данные из локальной БД как fallback
    if (totalMetersCount === 0) {
      // Получаем все лицевые счета пользователя
      const userAccountIds = userAccounts.map(a => a.id);
      
      // Считаем счетчики, привязанные к этим лицевым счетам
      totalMetersCount = await prisma.waterMeter.count({
        where: {
          accountId: {
            in: userAccountIds,
          },
        },
      });
    }

    // Подсчитываем активные заявки из локальной БД
    const activeApplications = await prisma.application.count({
      where: {
        userId: session.user.id,
        status: {
          in: ["PENDING", "IN_PROGRESS"] as any,
        },
      },
    });

    // Логируем итоговую статистику
    if (process.env.NODE_ENV === "development") {
      console.log("=== Dashboard stats final ===");
      console.log({
        userId: session.user.id,
        accountsCount: userAccounts.length,
        accounts: userAccounts.map(a => ({ 
          id: a.id, 
          number: a.accountNumber, 
          region: a.region, 
          hasPassword: !!a.password1c 
        })),
        unpaidBills: totalUnpaidBills,
        totalAmount,
        metersCount: totalMetersCount,
        activeApplications,
      });
      console.log("=============================");
    }

    // Убеждаемся, что все значения являются числами
    const result = {
      unpaidBills: Number(totalUnpaidBills) || 0,
      totalAmount: Number(totalAmount) || 0,
      metersCount: Number(totalMetersCount) || 0,
      activeApplications: Number(activeApplications) || 0,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    // Логируем ошибку всегда для отладки
    console.error("Error fetching dashboard stats:", {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
      fullError: error,
    });
    return NextResponse.json(
      { 
        error: "Ошибка при загрузке статистики",
        details: process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

