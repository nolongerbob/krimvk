"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Receipt, Droplet, CreditCard, AlertCircle, FileText } from "lucide-react";
import Link from "next/link";

export default function DirectAccountPage() {
  const [accountNumber, setAccountNumber] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState("prog");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAccountData(null);
    setIsConnected(false);

    try {
      // Проверяем подключение, получая базовые данные из 1С
      const response = await fetch(
        `/api/admin/direct-account/connect?accountNumber=${encodeURIComponent(accountNumber)}&password=${encodeURIComponent(password)}&region=${encodeURIComponent(region)}`
      );

      if (response.ok) {
        const data = await response.json();
        setAccountData(data.data);
        setIsConnected(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Ошибка при подключении к лицевому счету");
      }
    } catch (error: any) {
      console.error("Error connecting to account:", error);
      setError(`Ошибка подключения: ${error?.message || "Неизвестная ошибка"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAccountNumber("");
    setPassword("");
    setRegion("prog");
    setAccountData(null);
    setIsConnected(false);
    setError(null);
  };

  const openReceipt = () => {
    // Открываем квитанцию в новом окне с параметрами лицевого счета
    const params = new URLSearchParams({
      direct: "true",
      accountNumber,
      password,
      region,
    });
    window.open(`/admin/direct-account/receipt?${params.toString()}`, "_blank");
  };

  const openMeters = () => {
    // Открываем передачу показаний в новом окне
    const params = new URLSearchParams({
      direct: "true",
      accountNumber,
      password,
      region,
    });
    window.open(`/admin/direct-account/meters?${params.toString()}`, "_blank");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Работа с лицевым счетом</h1>
        <p className="text-gray-600">
          Введите данные лицевого счета для доступа к информации и управлению
        </p>
      </div>

      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Подключение к лицевому счету
            </CardTitle>
            <CardDescription>
              Введите номер лицевого счета и пароль для доступа к данным 1С
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Номер лицевого счета</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Введите номер л/с"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль от л/с"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Регион</Label>
                <Select value={region} onValueChange={setRegion} disabled={loading}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Выберите регион" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prog">Программный доступ (prog)</SelectItem>
                    <SelectItem value="saki">Саки</SelectItem>
                    <SelectItem value="evpatoria">Евпатория</SelectItem>
                    <SelectItem value="chernomor">Черноморское</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Подключиться
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Информация о подключенном счете */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-green-600" />
                  Подключено к л/с: {accountNumber}
                </span>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Отключиться
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-gray-600">Адрес</p>
                  <p className="font-medium">{accountData?.Address || accountData?.address || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Абонент</p>
                  <p className="font-medium">{accountData?.LSName || accountData?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Текущая задолженность</p>
                  <p className={`font-medium text-lg ${
                    parseFloat(accountData?.CommonDuty || accountData?.commonDuty || "0") > 0
                      ? "text-red-600"
                      : parseFloat(accountData?.CommonDuty || accountData?.commonDuty || "0") < 0
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}>
                    {parseFloat(accountData?.CommonDuty || accountData?.commonDuty || "0").toFixed(2)} ₽
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Действия */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={openReceipt}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Квитанция</h3>
                    <p className="text-sm text-gray-600">Просмотр и печать квитанции с полными данными</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={openMeters}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Droplet className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Передача показаний</h3>
                    <p className="text-sm text-gray-600">Передать показания счетчиков воды</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
