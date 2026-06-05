"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { DashboardCard, DashboardCardBody } from "@/components/dashboard/DashboardCard";
import { siteFieldClass, sitePrimaryBtnClass, siteOutlineBtnClass } from "@/components/site/site-styles";
import { SitePageShell } from "@/components/site/SitePageShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Токен восстановления пароля не предоставлен');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setMessage("Пароль должен содержать минимум 6 символов");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || "Пароль успешно изменен");
        
        // Редиректим на страницу входа через 3 секунды
        setTimeout(() => {
          router.push("/login?passwordReset=true");
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || "Ошибка при сбросе пароля");
      }
    } catch (err) {
      setStatus('error');
      setMessage("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SitePageShell className="flex min-h-[calc(100vh-8rem)] items-center justify-center" containerClassName="flex justify-center">
      <DashboardCard className="w-full max-w-md">
        <DashboardCardBody className="text-center">
          <div className="mb-4 flex justify-center">
            {status === 'form' && (
              <Lock className="h-12 w-12 text-blue-600" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">
            {status === 'form' && 'Сброс пароля'}
            {status === 'success' && 'Пароль изменен'}
            {status === 'error' && 'Ошибка'}
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            {status === 'form' && 'Введите новый пароль для вашего аккаунта'}
            {status === 'success' && 'Ваш пароль успешно изменен'}
            {status === 'error' && 'Не удалось сбросить пароль'}
          </p>
          {status === 'success' ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-none p-4">
                <p className="text-sm text-green-800">{message}</p>
              </div>
              <p className="text-sm text-slate-600 text-center">
                Вы будете перенаправлены на страницу входа...
              </p>
              <Button
                onClick={() => router.push("/login?passwordReset=true")}
                className={`w-full ${sitePrimaryBtnClass}`}
              >
                Перейти к входу
              </Button>
            </div>
          ) : status === 'error' ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-none p-4">
                <p className="text-sm text-red-800">{message}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/forgot-password")}
                  variant="outline"
                  className={`flex-1 ${siteOutlineBtnClass}`}
                >
                  Запросить новое письмо
                </Button>
                <Button
                  onClick={() => router.push("/login")}
                  className={`flex-1 ${sitePrimaryBtnClass}`}
                >
                  Вернуться к входу
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-none">
                  {message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Новый пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    disabled={isLoading}
                    className={`pr-10 ${siteFieldClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль"
                    disabled={isLoading}
                    className={`pr-10 ${siteFieldClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className={`w-full ${sitePrimaryBtnClass}`} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Изменение пароля...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Изменить пароль
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-primary hover:underline"
                >
                  Вернуться к входу
                </Link>
              </div>
            </form>
          )}
        </DashboardCardBody>
      </DashboardCard>
    </SitePageShell>
  );
}
