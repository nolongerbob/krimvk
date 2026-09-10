import type { Prisma } from '@prisma/client';

// Shared safe projection for the directory and the chat profile. No credentials.
export const adminUserSelect = {
        id: true, email: true, name: true, phone: true, address: true,
        role: true, createdAt: true,
        _count: { select: { applications: true } },
        userAccounts: {
          select: {
            id: true, accountNumber: true, address: true, name: true,
            phone: true, isActive: true, region: true, createdAt: true,
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
          select: {
            id: true,
            status: true,
            description: true,
            address: true,
            phone: true,
            createdAt: true,
            service: {
              select: {
                title: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        bills: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      } satisfies Prisma.UserSelect;

export function mapAdminUser(user: Prisma.UserGetPayload<{ select: typeof adminUserSelect }>) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    address: user.address,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    applicationsCount: user._count.applications,
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
      description: app.description,
      service: app.service,
      createdAt: app.createdAt.toISOString(),
      address: app.address,
      phone: app.phone,
    })),
    bills: user.bills.map((bill) => ({
      id: bill.id,
      amount: bill.amount,
      period: bill.period,
      status: bill.status,
      dueDate: bill.dueDate.toISOString(),
      paidAt: bill.paidAt?.toISOString() || null,
    })),
    totalDebt: 0,
    unpaidBillsCount: 0,
    balanceLoading: true,
  };
}
