import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { adminContainerClass } from "@/components/admin/admin-styles";
import { UsersClient } from "./UsersClient";
import type { Prisma } from "@prisma/client";
import { userFilter, userSearch, classifyBalance } from '@/lib/admin-users-filters';
import { directoryStats, getBalanceSnapshot } from '@/lib/admin-users-index';

export const dynamic = 'force-dynamic';

const USERS_PAGE_SIZE = 25;

function mapUser(user: Awaited<ReturnType<typeof fetchUsers>>[number]) {
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

async function fetchUsers(page: number, where: Prisma.UserWhereInput) {
  return withRetry(() =>
    prisma.user.findMany({
      where,
      select: {
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
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: USERS_PAGE_SIZE,
      skip: Math.max(0, page - 1) * USERS_PAGE_SIZE,
    })
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; filter?: string }>;
}) {
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

  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 200);
  const filter = userFilter(params.filter);
  const search = userSearch(query);
  const directory = await withRetry(() => prisma.user.findMany({ where: search, select: { id: true, role: true } }));
  const snapshot = getBalanceSnapshot();
  const snapshotVersion = snapshot.finishedAt;
  const stats = directoryStats(directory);
  const financial = filter !== 'all' && filter !== 'admins';
  const ids = financial ? directory.filter(u => {
    const balance = snapshot.balances.get(u.id);
    return balance && classifyBalance(balance) === filter;
  }).map(u => u.id) : [];
  const where: Prisma.UserWhereInput = filter === 'all' ? search : {
    AND: [search, filter === 'admins' ? { role: 'ADMIN' } : { id: { in: ids } }],
  };
  const totalUsers = await withRetry(() => prisma.user.count({ where }));
  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PAGE_SIZE));
  const requestedPage = Number(params.page || 1);
  const page = Number.isSafeInteger(requestedPage) ? Math.min(totalPages, Math.max(1, requestedPage)) : 1;
  const rawUsers = await fetchUsers(page, where);
  const users = rawUsers.map(mapUser);

  return (
    <div className={adminContainerClass}>
      <AdminPageHeader
        title="Управление пользователями"
        description="База пользователей (баланс 1С подгружается отдельно для ускорения страницы)"
      />
      <UsersClient
        users={users}
        currentUserId={session.user.id}
        page={page}
        pageSize={USERS_PAGE_SIZE}
        totalUsers={totalUsers}
        query={query}
        filter={filter}
        initialStats={stats}
        snapshotVersion={snapshotVersion}
        key={`${page}:${query}:${filter}:${snapshotVersion}`}
      />
    </div>
  );
}
