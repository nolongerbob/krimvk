"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { adminFieldClass, adminOutlineBtnClass, adminSectionLabelClass } from "@/components/admin/admin-styles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  Shield,
  Search,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building,
  DollarSign,
  Eye,
} from "lucide-react";
import { UserDetailsDialog } from "@/components/admin/UserDetailsDialog";
import Link from "next/link";

interface UserAccount {
  id: string;
  accountNumber: string;
  address: string;
  name: string | null;
  phone: string | null;
  isActive: boolean;
  region: string | null;
  createdAt: string;
  meters: Array<{
    id: string;
    serialNumber: string;
    type: string;
    lastReading: number | null;
    address: string;
  }>;
}

interface Application {
  id: string;
  status: string;
  description: string | null;
  service: {
    title: string;
    category: string;
  };
  createdAt: string;
  address: string | null;
  phone: string | null;
}

interface Bill {
  id: string;
  amount: number;
  period: string;
  status: string;
  dueDate: string;
  paidAt: string | null;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  createdAt: string;
  userAccounts: UserAccount[];
  applications: Application[];
  bills: Bill[];
  totalDebt: number;
  unpaidBillsCount: number;
  balanceLoading?: boolean;
  balanceError?: boolean;
}

interface UsersClientProps {
  users: User[];
  currentUserId?: string;
  page?: number;
  pageSize?: number;
  totalUsers: number;
  query: string;
}

const statusConfig = {
  PENDING: {
    label: "Ожидает",
    icon: AlertCircle,
    className: "text-yellow-600 bg-yellow-50",
  },
  IN_PROGRESS: {
    label: "В работе",
    icon: AlertCircle,
    className: "text-blue-600 bg-blue-50",
  },
  COMPLETED: {
    label: "Завершена",
    icon: CheckCircle,
    className: "text-green-600 bg-green-50",
  },
  CANCELLED: {
    label: "Отменена",
    icon: XCircle,
    className: "text-red-600 bg-red-50",
  },
};

type DebtFilter = "all" | "debtors" | "overpaid" | "no-debt" | "admins";

export function UsersClient({
  users: initialUsers,
  currentUserId,
  page = 1,
  pageSize = 25,
  totalUsers,
  query,
}: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [debtFilter, setDebtFilter] = useState<DebtFilter>("all");

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let nextIndex = 0;
    let nextRequestAt = 0;

    const loadBalances = async () => {
      while (nextIndex < initialUsers.length) {
        const user = initialUsers[nextIndex++];
        if (cancelled) return;
        try {
          // Respect the admin API limit (60 requests/minute) even for fast replies.
          const requestAt = Math.max(Date.now(), nextRequestAt);
          nextRequestAt = requestAt + 1100;
          await new Promise((resolve) => setTimeout(resolve, requestAt - Date.now()));
          if (cancelled) return;
          const response = await fetch(`/api/admin/users/${user.id}/balance`, { signal: controller.signal });
          if (!response.ok) throw new Error("Balance unavailable");
          const data = (await response.json()) as {
            totalDebt: number;
            unpaidBillsCount: number;
          };
          if (!Number.isFinite(data.totalDebt) || !Number.isFinite(data.unpaidBillsCount)) throw new Error("Invalid balance");
          if (cancelled) return;
          setUsers((prev) =>
            prev.map((u) =>
              u.id === user.id
                ? {
                    ...u,
                    totalDebt: data.totalDebt,
                    unpaidBillsCount: data.unpaidBillsCount,
                    balanceLoading: false,
                    balanceError: false,
                  }
                : u
            )
          );
        } catch {
          if (!cancelled) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === user.id ? { ...u, balanceLoading: false, balanceError: true } : u
              )
            );
          }
        }
      }
    };

    void loadBalances();
    void loadBalances();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [initialUsers]);

  // Обработчик изменения роли
  const handleRoleChange = (userId: string, newRole: string) => {
    // Обновляем список пользователей
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId ? { ...u, role: newRole } : u
      )
    );
    // Обновляем выбранного пользователя если он открыт
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
  };

  // Фильтрация пользователей по поисковому запросу и фильтру должников
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Фильтр по балансу (положительный = долг, отрицательный = переплата) и по ролям
    if (debtFilter === "debtors") {
      filtered = filtered.filter((user) => !user.balanceLoading && !user.balanceError && user.totalDebt > 0.01);
    } else if (debtFilter === "overpaid") {
      filtered = filtered.filter((user) => !user.balanceLoading && !user.balanceError && user.totalDebt < -0.01);
    } else if (debtFilter === "no-debt") {
      filtered = filtered.filter((user) => !user.balanceLoading && !user.balanceError && Math.abs(user.totalDebt) <= 0.01);
    } else if (debtFilter === "admins") {
      filtered = filtered.filter((user) => user.role === "ADMIN");
    }

    return filtered;
  }, [users, debtFilter]);

  // Статистика для фильтров
  const stats = useMemo(() => {
    const total = users.length;
    const loaded = users.filter((u) => !u.balanceLoading && !u.balanceError);
    const debtors = loaded.filter((u) => u.totalDebt > 0.01).length;
    const overpaid = loaded.filter((u) => u.totalDebt < -0.01).length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const noDebt = loaded.length - debtors - overpaid;
    return { total, debtors, overpaid, noDebt, admins };
  }, [users]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const pageHref = (value: number) => `/admin/users?${new URLSearchParams({ page: String(value), ...(query ? { q: query } : {}) })}`;
  const pagination = (
    <nav aria-label="Страницы пользователей" className="my-4 flex flex-wrap items-center justify-center gap-3">
      {page > 1 && <Button asChild variant="outline"><Link prefetch={false} href={pageHref(page - 1)}>← Назад</Link></Button>}
      <span className="text-sm text-slate-600">Страница {page} из {totalPages} · по {pageSize} пользователей</span>
      {page < totalPages && <Button asChild variant="outline"><Link prefetch={false} href={pageHref(page + 1)}>Далее →</Link></Button>}
    </nav>
  );

  return (
    <>
      <div className="mb-6 space-y-4">
        {/* Фильтры по балансу */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={adminSectionLabelClass}>На текущей странице</span>
          <Button
            variant={debtFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setDebtFilter("all")}
          >
            Все ({stats.total})
          </Button>
          <Button
            variant={debtFilter === "debtors" ? "default" : "outline"}
            size="sm"
            onClick={() => setDebtFilter("debtors")}
            className={debtFilter === "debtors" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Должники ({stats.debtors})
          </Button>
          <Button
            variant={debtFilter === "overpaid" ? "default" : "outline"}
            size="sm"
            onClick={() => setDebtFilter("overpaid")}
            className={debtFilter === "overpaid" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Переплата ({stats.overpaid})
          </Button>
          <Button
            variant={debtFilter === "no-debt" ? "default" : "outline"}
            size="sm"
            onClick={() => setDebtFilter("no-debt")}
            className={debtFilter === "no-debt" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Без долгов ({stats.noDebt})
          </Button>
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <Button
            variant={debtFilter === "admins" ? "default" : "outline"}
            size="sm"
            onClick={() => setDebtFilter("admins")}
            className={debtFilter === "admins" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <Shield className="h-4 w-4 mr-1" />
            Администраторы ({stats.admins})
          </Button>
        </div>

        {/* Поиск */}
        <form action="/admin/users" method="get" className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            name="q"
            maxLength={200}
            placeholder="Поиск по имени, email, телефону, адресу или номеру лицевого счета..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("pl-10", adminFieldClass)}
          />
        </div>
        <Button type="submit">Найти</Button>
        {query && <Button asChild variant="outline"><Link href="/admin/users" prefetch={false}>Сбросить</Link></Button>}
        </form>
        <p className="text-sm text-slate-500">
          Найдено в базе: {totalUsers}. Показано на странице: {filteredUsers.length}.
          {debtFilter !== "all" && (
            <span className="ml-2">
              ({debtFilter === "debtors" 
                ? "должников" 
                : debtFilter === "overpaid" 
                ? "с переплатой" 
                : debtFilter === "admins"
                ? "администраторов"
                : "без долгов"})
            </span>
          )}
        </p>
      </div>

      {pagination}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <DashboardCard key={user.id}>
            <DashboardCardBody>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-slate-900">
                      {user.name || user.email}
                    </h3>
                    {user.role === "ADMIN" && (
                      <Shield className="h-5 w-5 text-blue-500" />
                    )}
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                      className="rounded-none"
                    >
                      {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Building className="h-4 w-4" />
                          <span className="truncate">{user.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Регистрация:{" "}
                          {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">
                          Лицевых счетов: {user.userAccounts.length}
                        </span>
                      </div>
                      {user.userAccounts.length > 0 && (
                        <div className="ml-6 space-y-1 text-xs text-slate-600">
                          {user.userAccounts.slice(0, 3).map((acc) => (
                            <div key={acc.id}>
                              ЛС {acc.accountNumber} - {acc.address}
                            </div>
                          ))}
                          {user.userAccounts.length > 3 && (
                            <div className="text-slate-400">
                              и еще {user.userAccounts.length - 3}...
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <DollarSign
                          className={`h-4 w-4 ${
                            user.totalDebt > 0.01
                              ? "text-red-500"
                              : user.totalDebt < -0.01
                              ? "text-blue-500"
                              : "text-green-500"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            user.balanceLoading
                              ? "text-slate-500"
                              : user.totalDebt > 0.01
                              ? "text-red-600"
                              : user.totalDebt < -0.01
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        >
                          {user.balanceLoading
                            ? "Баланс: загрузка…"
                            : user.balanceError
                            ? "Баланс недоступен"
                            : user.totalDebt > 0.01
                            ? `Долг: ${user.totalDebt.toFixed(2)} ₽`
                            : user.totalDebt < -0.01
                            ? `Переплата: ${Math.abs(user.totalDebt).toFixed(2)} ₽`
                            : "Баланс: 0 ₽"}
                        </span>
                        {user.unpaidBillsCount > 0 && user.totalDebt > 0.01 && (
                          <Badge variant="destructive" className="ml-2">
                            {user.unpaidBillsCount} неоплаченных
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-600">
                          Заявок: {user.applications.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <Button
                    onClick={() => setSelectedUser(user)}
                    variant="outline"
                    size="sm"
                    className={cn("gap-2", adminOutlineBtnClass)}
                  >
                    <Eye className="h-4 w-4" />
                    Подробнее
                  </Button>
                </div>
              </div>
            </DashboardCardBody>
          </DashboardCard>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <DashboardCard className="border-dashed bg-slate-50/80">
          <DashboardCardBody className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">
              {searchQuery
                ? "Пользователи не найдены"
                : "Нет пользователей"}
            </p>
          </DashboardCardBody>
        </DashboardCard>
      )}

      {pagination}

      {selectedUser && (
        <UserDetailsDialog
          user={users.find((u) => u.id === selectedUser.id) ?? selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          onRoleChange={handleRoleChange}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
