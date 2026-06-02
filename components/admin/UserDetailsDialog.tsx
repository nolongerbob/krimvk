"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  CreditCard,
  DollarSign,
  FileText,
  Droplet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Receipt,
  Loader2,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationDetails } from "@/components/admin/ApplicationDetails";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { get1cRegionLabel } from "@/lib/1c-regions";

const getRegionName = (regionCode: string | null): string =>
  get1cRegionLabel(regionCode);

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

interface UserDetails {
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

interface UserDetailsDialogProps {
  user: UserDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChange?: (userId: string, newRole: string) => void;
  currentUserId?: string; // ID текущего админа, чтобы не давать менять свою роль
}

const statusConfig = {
  PENDING: {
    label: "Ожидает",
    icon: Clock,
    className: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },
  IN_PROGRESS: {
    label: "В работе",
    icon: AlertCircle,
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  COMPLETED: {
    label: "Завершена",
    icon: CheckCircle,
    className: "text-green-600 bg-green-50 border-green-200",
  },
  CANCELLED: {
    label: "Отменена",
    icon: XCircle,
    className: "text-red-600 bg-red-50 border-red-200",
  },
};

const billStatusConfig = {
  UNPAID: {
    label: "Не оплачен",
    className: "text-red-600 bg-red-50",
  },
  PAID: {
    label: "Оплачен",
    className: "text-green-600 bg-green-50",
  },
  OVERDUE: {
    label: "Просрочен",
    className: "text-orange-600 bg-orange-50",
  },
};

export function UserDetailsDialog({ user, open, onOpenChange, onRoleChange, currentUserId }: UserDetailsDialogProps) {
  const [receiptDateFrom, setReceiptDateFrom] = useState("");
  const [receiptDateTo, setReceiptDateTo] = useState("");
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Устанавливаем период по умолчанию (предыдущий месяц) при открытии диалога
  useEffect(() => {
    if (open && !receiptDateFrom && !receiptDateTo) {
      const today = new Date();
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const firstDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
      const lastDay = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
      setReceiptDateFrom(firstDay.toISOString().split("T")[0]);
      setReceiptDateTo(lastDay.toISOString().split("T")[0]);
    }
  }, [open, receiptDateFrom, receiptDateTo]);

  // Сбрасываем ошибку при закрытии диалога
  useEffect(() => {
    if (!open) {
      setRoleError(null);
    }
  }, [open]);

  const getReceiptUrl = (accountId: string) => {
    const params = new URLSearchParams({ accountId });
    if (receiptDateFrom) params.append("dateFrom", receiptDateFrom);
    if (receiptDateTo) params.append("dateTo", receiptDateTo);
    return `/dashboard/receipts/view?${params.toString()}`;
  };

  // Функция для изменения роли пользователя
  const handleRoleChange = async (newRole: string) => {
    if (newRole === user.role) return;

    setIsChangingRole(true);
    setRoleError(null);

    try {
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          role: newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при изменении роли");
      }

      // Уведомляем родительский компонент об изменении роли
      if (onRoleChange) {
        onRoleChange(user.id, newRole);
      }

      // Показываем сообщение об успехе
      alert(data.message || "Роль успешно изменена");
    } catch (error) {
      console.error("Error changing role:", error);
      setRoleError(error instanceof Error ? error.message : "Ошибка при изменении роли");
    } finally {
      setIsChangingRole(false);
    }
  };

  // Нельзя менять свою роль
  const isSelf = currentUserId === user.id;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6" />
            {user.name || user.email}
          </DialogTitle>
          <DialogDescription>
            Полная информация о пользователе
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Основное</TabsTrigger>
            <TabsTrigger value="accounts">Лицевые счета</TabsTrigger>
            <TabsTrigger value="applications">Заявки</TabsTrigger>
            <TabsTrigger value="bills">Счета и задолженность</TabsTrigger>
          </TabsList>

          {/* Основная информация */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Личные данные
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Телефон</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}
                  {user.address && (
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Адрес</p>
                        <p className="font-medium">{user.address}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Дата регистрации</p>
                      <p className="font-medium">
                        {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">Роль</p>
                      {isSelf ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                            {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
                          </Badge>
                          <span className="text-xs text-gray-400">(это вы)</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Select
                            value={user.role}
                            onValueChange={handleRoleChange}
                            disabled={isChangingRole}
                          >
                            <SelectTrigger className="w-[200px]">
                              {isChangingRole ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Изменение...</span>
                                </div>
                              ) : (
                                <SelectValue placeholder="Выберите роль" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span>Пользователь</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="ADMIN">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4" />
                                  <span>Администратор</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {roleError && (
                            <p className="text-xs text-red-500">{roleError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Лицевых счетов</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.userAccounts.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Заявок</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.applications.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Баланс</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    user.totalDebt > 0.01 
                      ? "text-red-600" 
                      : user.totalDebt < -0.01 
                      ? "text-blue-600" 
                      : "text-green-600"
                  }`}>
                    {user.totalDebt > 0.01 
                      ? `Долг: ${user.totalDebt.toFixed(2)} ₽` 
                      : user.totalDebt < -0.01 
                      ? `Переплата: ${Math.abs(user.totalDebt).toFixed(2)} ₽`
                      : "0 ₽"}
                  </div>
                  {user.unpaidBillsCount > 0 && user.totalDebt > 0.01 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {user.unpaidBillsCount} неоплаченных счетов
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Лицевые счета */}
          <TabsContent value="accounts" className="space-y-4">
            {user.userAccounts.length > 0 ? (
              user.userAccounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Лицевой счет {account.accountNumber}
                      </CardTitle>
                      <Badge variant={account.isActive ? "default" : "secondary"}>
                        {account.isActive ? "Активен" : "Неактивен"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Адрес</p>
                        <p className="font-medium">{account.address}</p>
                      </div>
                      {account.name && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">ФИО абонента</p>
                          <p className="font-medium">{account.name}</p>
                        </div>
                      )}
                      {account.phone && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Телефон</p>
                          <p className="font-medium">{account.phone}</p>
                        </div>
                      )}
                      {account.region && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Район</p>
                          <p className="font-medium">{getRegionName(account.region)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Дата добавления</p>
                        <p className="font-medium">
                          {new Date(account.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>

                    {account.meters.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Счетчики воды ({account.meters.length})</p>
                        <div className="space-y-2">
                          {account.meters.map((meter) => (
                            <div
                              key={meter.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Droplet
                                  className={`h-5 w-5 ${
                                    meter.type === "горячая"
                                      ? "text-red-500"
                                      : "text-blue-500"
                                  }`}
                                />
                                <div>
                                  <p className="font-medium">
                                    {meter.type === "горячая" ? "Горячая" : "Холодная"} вода
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Серийный номер: {meter.serialNumber}
                                  </p>
                                  {meter.address && (
                                    <p className="text-xs text-gray-400">{meter.address}</p>
                                  )}
                                </div>
                              </div>
                              {meter.lastReading !== null && (
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Последнее показание</p>
                                  <p className="font-medium">{meter.lastReading} м³</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Кнопка создания квитанции */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`dateFrom-${account.id}`} className="text-xs">Дата начала</Label>
                            <Input
                              id={`dateFrom-${account.id}`}
                              type="date"
                              value={receiptDateFrom}
                              onChange={(e) => setReceiptDateFrom(e.target.value)}
                              className="mt-1 text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`dateTo-${account.id}`} className="text-xs">Дата окончания</Label>
                            <Input
                              id={`dateTo-${account.id}`}
                              type="date"
                              value={receiptDateTo}
                              onChange={(e) => setReceiptDateTo(e.target.value)}
                              className="mt-1 text-xs"
                            />
                          </div>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          className="w-full gap-2"
                          disabled={!receiptDateFrom || !receiptDateTo}
                        >
                          <Link
                            href={getReceiptUrl(account.id)}
                            target="_blank"
                          >
                            <Receipt className="h-4 w-4" />
                            Создать квитанцию
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">У пользователя нет лицевых счетов</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Заявки */}
          <TabsContent value="applications" className="space-y-4">
            {user.applications.length > 0 ? (
              user.applications.map((application) => {
                const status = statusConfig[application.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                return (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{application.service.title}</CardTitle>
                        <Badge className={status.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-500 mb-1">Категория</p>
                          <p className="font-medium">{application.service.category}</p>
                        </div>
                        {application.address && (
                          <div>
                            <p className="text-gray-500 mb-1">Адрес</p>
                            <p className="font-medium">{application.address}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500 mb-1">Дата создания</p>
                          <p className="font-medium">
                            {new Date(application.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <ApplicationDetails
                          application={{
                            id: application.id,
                            status: application.status,
                            description: application.description,
                            address: application.address,
                            phone: application.phone,
                            createdAt: application.createdAt,
                            user: {
                              name: user.name,
                              email: user.email,
                              phone: user.phone,
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">У пользователя нет заявок</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Счета и задолженность */}
          <TabsContent value="bills" className="space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Баланс абонента
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  user.totalDebt > 0.01 
                    ? "text-red-600" 
                    : user.totalDebt < -0.01 
                    ? "text-blue-600" 
                    : "text-green-600"
                }`}>
                  {user.totalDebt > 0.01 
                    ? `Долг: ${user.totalDebt.toFixed(2)} ₽` 
                    : user.totalDebt < -0.01 
                    ? `Переплата: ${Math.abs(user.totalDebt).toFixed(2)} ₽`
                    : "Баланс: 0 ₽"}
                </div>
                {user.unpaidBillsCount > 0 && user.totalDebt > 0.01 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Неоплаченных счетов: {user.unpaidBillsCount}
                  </p>
                )}
              </CardContent>
            </Card>

            {user.bills.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">История счетов</h3>
                {user.bills.map((bill) => {
                  const billStatus = billStatusConfig[bill.status as keyof typeof billStatusConfig];
                  return (
                    <Card key={bill.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Период: {bill.period}</p>
                            <p className="text-sm text-gray-500">
                              Срок оплаты:{" "}
                              {new Date(bill.dueDate).toLocaleDateString("ru-RU")}
                            </p>
                            {bill.paidAt && (
                              <p className="text-sm text-green-600">
                                Оплачено: {new Date(bill.paidAt).toLocaleDateString("ru-RU")}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{bill.amount.toFixed(2)} ₽</p>
                            <Badge className={billStatus.className}>
                              {billStatus.label}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Нет информации о счетах</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

