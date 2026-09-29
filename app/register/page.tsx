"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AuthSplitLayout } from "@/components/auth/AuthBrandPanel";
import { authButtonClass, authFieldClass } from "@/components/auth/auth-styles";
import { GosuslugiEntry } from '@/components/auth/GosuslugiEntry';

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
  const [draftLoading, setDraftLoading] = useState(true);
  const [social, setSocial] = useState<string | null>(null);
  const [draftFailed, setDraftFailed] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/social-registration', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (response.status === 204) {
        if (new URLSearchParams(window.location.search).has('social')) throw new Error('Подтверждение истекло. Начните вход через сервис заново.');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось получить данные сервиса');
      if (controller.signal.aborted) return;
      setSocial(data.provider);
      setEmailExists(data.emailExists === true);
      setFormData(current => ({ ...current, name: data.name || '', email: data.email || '', phone: data.phone || '' }));
    }).catch(e => { if (!controller.signal.aborted) { setError(e.message); setDraftFailed(true); } })
      .finally(() => { if (!controller.signal.aborted) setDraftLoading(false); });
    return () => controller.abort();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftLoading || draftFailed) return;
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(social ? '/api/auth/social-registration' : '/api/auth/register', {
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
      if (data.code === 'EMAIL_EXISTS') setEmailExists(true);

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
          {social && <p className="border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">{social === 'yandex' ? 'Яндекс' : 'VK ID'} подтверждён. Проверьте и при необходимости измените данные. После регистрации сервис будет привязан автоматически. Email потребуется подтвердить отдельно.</p>}
          {emailExists && <div role="status" className="border border-amber-200 bg-amber-50 p-3 text-sm text-slate-800">
            <p>Пользователь с этой почтой уже зарегистрирован. Чтобы привязать сервис к нему, сначала войдите в существующий кабинет.</p>
            <Link href="/login?callbackUrl=%2Fdashboard%2Fsettings" className="mt-2 inline-block font-medium text-blue-700 underline">Войти и привязать в настройках</Link>
          </div>}
          {draftLoading && <p role="status" className="text-sm text-slate-500">Проверяем данные регистрации…</p>}
          {draftFailed && <Link href="/login" className="block text-sm text-blue-700 underline">Начать вход через сервис заново</Link>}
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
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setEmailExists(false); }}
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
            disabled={isLoading || draftLoading || draftFailed}
          >
            {isLoading ? "Регистрация..." : "Зарегистрироваться"}
          </Button>
        </form>
        {!social && !draftLoading && <GosuslugiEntry />}

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
