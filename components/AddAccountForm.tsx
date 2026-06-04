"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ONE_C_REGION_OPTIONS } from "@/lib/1c-regions";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { cn } from "@/lib/utils";
import { dashboardButtonClass } from "@/components/dashboard/dashboard-styles";

interface AddAccountFormProps {
  onAccountAdded: () => void;
}

export function AddAccountForm({ onAccountAdded }: AddAccountFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        if (result.message) {
          console.log(result.message);
        }
      } else {
        const data = await response.json();
        if (response.status === 401) {
          setError("Неверный номер лицевого счета или пароль. Проверьте правильность данных.");
        } else if (response.status === 500 && data.details) {
          setError(`${data.error}\n${data.details}`);
        } else {
          setError(data.error || "Ошибка при добавлении лицевого счета");
        }
      }
    } catch (err: unknown) {
      console.error("Error adding account:", err);
      setError("Ошибка при добавлении лицевого счета");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={cn(dashboardButtonClass, "h-10 w-full border-slate-200 sm:w-auto")}
      >
        <Plus className="mr-2 h-4 w-4" />
        Добавить лицевой счет
      </Button>
    );
  }

  return (
    <DashboardCard className="mb-6 border-slate-200 bg-slate-50/80">
      <DashboardCardBody className="space-y-4 p-4 sm:p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Добавить лицевой счет</h2>
          <p className="mt-1 text-sm text-slate-500">
            Укажите район, номер лицевого счета и пароль от aqua-crimea.ru
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="rounded-none">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="accountNumber" className="text-sm text-slate-700">
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
              className="mt-1.5 rounded-none"
            />
          </div>

          <div>
            <Label htmlFor="region" className="text-sm text-slate-700">
              Район <span className="text-red-500">*</span>
            </Label>
            <select
              id="region"
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              required
              disabled={isSubmitting}
              className="mt-1.5 flex h-10 w-full rounded-none border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                Выберите район
              </option>
              {ONE_C_REGION_OPTIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="password1c" className="text-sm text-slate-700">
              Пароль для 1С <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password1c"
              type="password"
              value={formData.password1c}
              onChange={(e) =>
                setFormData({ ...formData, password1c: e.target.value })
              }
              placeholder="Пароль личного кабинета 1С"
              required
              disabled={isSubmitting}
              className="mt-1.5 rounded-none"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Пароль с сайта aqua-crimea.ru
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(dashboardButtonClass, "h-10 bg-blue-600 hover:bg-blue-700")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Добавление…
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
              className={cn(dashboardButtonClass, "h-10 border-slate-200")}
            >
              Отмена
            </Button>
          </div>
        </form>
      </DashboardCardBody>
    </DashboardCard>
  );
}
