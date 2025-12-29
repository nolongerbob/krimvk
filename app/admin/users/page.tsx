import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, Phone, Calendar, Shield } from "lucide-react";
import Link from "next/link";

export default async function AdminUsersPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/users");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Загружаем всех пользователей
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          applications: true,
          bills: true,
          meters: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление пользователями</h1>
          <p className="text-gray-600">Список всех пользователей системы</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Назад</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{user.name || user.email}</CardTitle>
                    {user.role === "ADMIN" && (
                      <Shield className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Регистрация: {new Date(user.createdAt).toLocaleDateString("ru-RU")}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span>Заявок: {user._count.applications}</span>
                      <span>Счетов: {user._count.bills}</span>
                      <span>Счетчиков: {user._count.meters}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === "ADMIN" 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Нет пользователей</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}





