"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { AddAccountForm } from "@/components/AddAccountForm";

export default function BecomeSubscriberPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadAccounts();
    }
  }, [status, router]);

  const loadAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Стать абонентом</h1>
        <p className="text-lg text-gray-600">
          Добавьте лицевой счет для доступа к услугам водоканала
        </p>
      </div>

      {accounts.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ваши лицевые счета</CardTitle>
            <CardDescription>
              У вас уже добавлено {accounts.length} лицев{accounts.length === 1 ? "ой" : accounts.length < 5 ? "ых" : "ых"} счет{accounts.length === 1 ? "" : accounts.length < 5 ? "а" : "ов"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        Лицевой счет: {account.accountNumber}
                      </p>
                      {account.address && (
                        <p className="text-sm text-gray-600 mt-1">
                          {account.address}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                    >
                      Перейти в кабинет
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              У вас пока нет лицевых счетов
            </CardTitle>
            <CardDescription>
              Добавьте лицевой счет, чтобы получить доступ к услугам
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Добавить лицевой счет</CardTitle>
          <CardDescription>
            Введите данные лицевого счета для подключения к услугам водоканала
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddAccountForm onAccountAdded={loadAccounts} />
        </CardContent>
      </Card>
    </div>
  );
}

