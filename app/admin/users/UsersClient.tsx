"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  meters: Array<{
    id: string;
    serialNumber: string;
    type: string;
    lastReading: number | null;
  }>;
}

interface Application {
  id: string;
  status: string;
  service: {
    title: string;
  };
  createdAt: string;
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
}

interface UsersClientProps {
  users: User[];
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

export function UsersClient({ users: initialUsers }: UsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialUsers;
    }

    const query = searchQuery.toLowerCase().trim();
    return initialUsers.filter((user) => {
      // Поиск по имени
      if (user.name?.toLowerCase().includes(query)) return true;
      // Поиск по email
      if (user.email.toLowerCase().includes(query)) return true;
      // Поиск по телефону
      if (user.phone?.toLowerCase().includes(query)) return true;
      // Поиск по адресу
      if (user.address?.toLowerCase().includes(query)) return true;
      // Поиск по номеру лицевого счета
      if (user.userAccounts.some((acc) => acc.accountNumber.includes(query))) return true;
      return false;
    });
  }, [initialUsers, searchQuery]);

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск по имени, email, телефону, адресу или номеру лицевого счета..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Найдено пользователей: {filteredUsers.length}
        </p>
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">
                      {user.name || user.email}
                    </CardTitle>
                    {user.role === "ADMIN" && (
                      <Shield className="h-5 w-5 text-blue-500" />
                    )}
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building className="h-4 w-4" />
                          <span className="truncate">{user.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
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
                        <div className="ml-6 space-y-1 text-xs text-gray-600">
                          {user.userAccounts.slice(0, 3).map((acc) => (
                            <div key={acc.id}>
                              ЛС {acc.accountNumber} - {acc.address}
                            </div>
                          ))}
                          {user.userAccounts.length > 3 && (
                            <div className="text-gray-400">
                              и еще {user.userAccounts.length - 3}...
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <DollarSign
                          className={`h-4 w-4 ${
                            user.totalDebt > 0
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            user.totalDebt > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          Задолженность:{" "}
                          {user.totalDebt > 0
                            ? `${user.totalDebt.toFixed(2)} ₽`
                            : "Нет задолженности"}
                        </span>
                        {user.unpaidBillsCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {user.unpaidBillsCount} неоплаченных
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
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
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Подробнее
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery
                ? "Пользователи не найдены"
                : "Нет пользователей"}
            </p>
          </CardContent>
        </Card>
      )}

      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        />
      )}
    </>
  );
}

