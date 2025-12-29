"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddAccountFormProps {
  onAccountAdded: () => void;
}

export function AddAccountForm({ onAccountAdded }: AddAccountFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const regions = [
    { value: "krasn", label: "Красногвардейский район" },
    { value: "saki", label: "Сакский и Симферопольский районы" },
    { value: "pervom", label: "Первомайский район" },
    { value: "nignegorsk", label: "Нижнегорский район" },
    { value: "ruch", label: "Раздольненский район" },
    { value: "sovetskoe", label: "Советский район" },
    { value: "chernomorsk", label: "Черноморский район" },
  ];

  const [formData, setFormData] = useState({
    accountNumber: "",
    password1c: "",
    region: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.region) {
      setError("Пожалуйста, выберите район");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setIsOpen(false);
        setFormData({
          accountNumber: "",
          password1c: "",
          region: "",
        });
        onAccountAdded();
        // Показываем сообщение об успехе, если есть информация о загруженных счетчиках
        if (result.message) {
          // Можно показать toast или другое уведомление
          console.log(result.message);
        }
      } else {
        const data = await response.json();
        // Показываем более понятное сообщение об ошибке
        if (response.status === 401) {
          setError("Неверный номер лицевого счета или пароль. Проверьте правильность данных.");
        } else if (response.status === 500 && data.details) {
          setError(`${data.error}\n${data.details}`);
        } else {
          setError(data.error || "Ошибка при добавлении лицевого счета");
        }
      }
    } catch (error: any) {
      console.error("Error adding account:", error);
      setError("Ошибка при добавлении лицевого счета");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Добавить лицевой счет
      </Button>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Добавить лицевой счет</CardTitle>
        <CardDescription>
          Введите номер лицевого счета для загрузки счетчиков
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="accountNumber">
              Номер лицевого счета <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
              placeholder="Например: 12345"
              required
              disabled={isSubmitting}
              className="text-lg"
            />
          </div>

          <div>
            <Label className="mb-3 block">
              Район <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {regions.map((region) => (
                <button
                  key={region.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, region: region.value })
                  }
                  disabled={isSubmitting}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.region === region.value
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <p className="font-medium text-sm">{region.label}</p>
                </button>
              ))}
            </div>
            {!formData.region && (
              <p className="text-xs text-gray-500 mt-2">
                Выберите район, к которому относится ваш лицевой счет
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password1c">
              Пароль для 1С <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password1c"
              type="password"
              value={formData.password1c}
              onChange={(e) =>
                setFormData({ ...formData, password1c: e.target.value })
              }
              placeholder="Пароль для доступа к личному кабинету 1С"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Пароль, который вы используете для входа в личный кабинет на сайте aqua-crimea.ru
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                "Добавить"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setError(null);
                setFormData({
                  accountNumber: "",
                  password1c: "",
                  region: "",
                });
              }}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

