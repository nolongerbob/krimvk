"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, AlertCircle, CreditCard, Calendar, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Account {
  id: string;
  accountNumber: string;
  address: string;
  name: string | null;
}

export default function ReceiptsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchAccounts();
    // Устанавливаем текущий месяц по умолчанию
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setDateFrom(firstDay.toISOString().split("T")[0]);
    setDateTo(lastDay.toISOString().split("T")[0]);
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        if (data.accounts && data.accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при загрузке лицевых счетов");
      }
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      setError(`Ошибка при загрузке лицевых счетов: ${error?.message || "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = (isPeriod: boolean = false) => {
    if (!selectedAccountId) {
      setError("Выберите лицевой счет");
      return;
    }

    const params = new URLSearchParams({
      accountId: selectedAccountId,
    });

    if (isPeriod && dateFrom && dateTo) {
      params.append("dateFrom", dateFrom);
      params.append("dateTo", dateTo);
    }

    // Открываем страницу просмотра квитанции
    window.open(`/dashboard/receipts/view?${params.toString()}`, "_blank");
  };

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center py-12">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Квитанции на оплату</h1>
        <p className="text-gray-600">Скачайте квитанцию для оплаты услуг</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Выбор лицевого счета */}
      {accounts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Лицевые счета
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedAccountId === account.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <p className="font-semibold">ЛС: {account.accountNumber}</p>
                    <p className="text-sm text-gray-600">{account.address}</p>
                    {account.name && (
                      <p className="text-xs text-gray-500 mt-1">{account.name}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Текущая квитанция */}
      {selectedAccountId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Текущая квитанция
            </CardTitle>
            <CardDescription>
              Квитанция за текущий месяц
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => handleViewReceipt(false)}
              className="w-full"
              size="lg"
            >
              <Eye className="h-4 w-4 mr-2" />
              Просмотреть квитанцию
            </Button>
            <Button
              onClick={() => handleViewReceipt(false)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Скачать PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Квитанция за период */}
      {selectedAccountId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Квитанция за период
            </CardTitle>
            <CardDescription>
              Выберите период для генерации квитанции
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">Дата начала</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Дата окончания</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => handleViewReceipt(true)}
                className="w-full"
                size="lg"
                disabled={!dateFrom || !dateTo}
              >
                <Eye className="h-4 w-4 mr-2" />
                Просмотреть квитанцию
              </Button>
              <Button
                onClick={() => handleViewReceipt(true)}
                variant="outline"
                className="w-full"
                size="lg"
                disabled={!dateFrom || !dateTo}
              >
                <Download className="h-4 w-4 mr-2" />
                Скачать PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">У вас нет лицевых счетов</p>
            <p className="text-sm text-gray-400">
              Добавьте лицевой счет в разделе "Передача показаний"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



