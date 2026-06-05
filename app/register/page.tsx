"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AuthSplitLayout } from "@/components/auth/AuthBrandPanel";
import { authButtonClass, authFieldClass } from "@/components/auth/auth-styles";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.registered === false) {
        setError(
          data.message ||
            "Аккаунт с этим email уже зарегистрирован. Войдите или восстановите пароль."
        );
        setIsLoading(false);
        return;
      }

      if (response.ok && data.registered) {
        // Полный переход: cookies сессии и pending_verify выставляет API регистрации
        window.location.href = "/verify-email?waiting=true";
        return;
      }

      setError(data.error || "Ошибка регистрации");
      setIsLoading(false);
    } catch {
      setError("Произошла ошибка. Попробуйте позже.");
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="w-full max-w-lg animate-fade-in">
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Регистрация
          </h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Создайте аккаунт для доступа к услугам водоканала
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              ФИО
            </Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={authFieldClass}
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={authFieldClass}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Телефон
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={authFieldClass}
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={authFieldClass}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Подтвердите пароль
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              className={authFieldClass}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            className={cn(authButtonClass, "bg-blue-600 hover:bg-blue-700")}
            disabled={isLoading}
          >
            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm lg:text-left">
          <span className="text-slate-600">Уже есть аккаунт? </span>
          <Link href="/login" className="text-blue-600 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}
